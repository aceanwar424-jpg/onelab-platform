-- OWNED_BY: ava. Apply to an isolated database first. No legacy tenant backfill.
-- HIS owns prices/payments. LIS submits product IDs and clinical context only.
BEGIN;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS lis_billing_pending boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.lis_his_commands (
  request_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  admission_id bigint NOT NULL REFERENCES public.admissions(id),
  actor_id uuid NOT NULL,
  body jsonb NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lis_his_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lis_his_commands FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.lis_his_actor(p_billing boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_tenant uuid; v_role text;
BEGIN
  SELECT tenant_id, lower(role) INTO v_tenant,v_role FROM public.user_profiles WHERE id=auth.uid();
  IF v_tenant IS NULL OR v_role IS NULL THEN RAISE EXCEPTION 'Sesi pengguna/tenant tidak tersedia'; END IF;
  IF v_role NOT IN ('super_admin','superadmin','admin','registration','registrasi','admin_faskes','cashier','finance_staff',
      'lab_analyst','lab_supervisor','analis','lab','doctor_sppk','sp_pk') THEN
    RAISE EXCEPTION 'Tidak berwenang mengakses order LIS–HIS';
  END IF;
  IF p_billing AND v_role NOT IN ('super_admin','superadmin','admin','registration','registrasi','admin_faskes','cashier','finance_staff') THEN
    RAISE EXCEPTION 'Penetapan tagihan hanya untuk petugas HIS';
  END IF;
  RETURN v_tenant;
END $$;

-- Fill tenant only for NEW HIS admissions. Legacy rows require a verified mapping.
CREATE OR REPLACE FUNCTION public.admission_assign_actor_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.user_profiles WHERE id=auth.uid();
  IF v_tenant IS NOT NULL THEN
    IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id<>v_tenant THEN RAISE EXCEPTION 'Tenant tidak sesuai sesi'; END IF;
    NEW.tenant_id:=v_tenant;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS admission_actor_tenant ON public.admissions;
CREATE TRIGGER admission_actor_tenant BEFORE INSERT ON public.admissions
FOR EACH ROW EXECUTE FUNCTION public.admission_assign_actor_tenant();

CREATE OR REPLACE FUNCTION public.lis_his_catalog()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_tenant uuid:=public.lis_his_actor(); v_catalog jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nama_tes',nama_tes,'kode_internal',kode_internal,
    'kategori',kategori,'sampel_type',sampel_type,'is_panel',is_panel) ORDER BY kategori,nama_tes),'[]')
  INTO v_catalog FROM public.products WHERE tenant_id=v_tenant AND brand_code='LAB' AND is_active;
  RETURN v_catalog;
END $$;

CREATE OR REPLACE FUNCTION public.lis_his_load_visit(p_visit text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.admissions; v_tenant uuid:=public.lis_his_actor(); v_ids jsonb;
BEGIN
  SELECT * INTO a FROM public.admissions WHERE visit_number=btrim(p_visit) AND tenant_id=v_tenant;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kunjungan tidak ditemukan dalam tenant aktif'; END IF;
  SELECT coalesce(jsonb_agg(p.id),'[]') INTO v_ids
  FROM jsonb_array_elements(coalesce(nullif(a.services,''),'[]')::jsonb) s
  JOIN public.products p ON p.id=(s->>'product_id')::bigint
  WHERE p.tenant_id=v_tenant AND p.brand_code='LAB';
  RETURN jsonb_build_object('id',a.id,'visit_number',a.visit_number,'patient_name',a.patient_name,
    'mr_number',a.mr_number,'patient_gender',a.patient_gender,'patient_age',a.patient_age,
    'services_snapshot',a.services,'product_ids',v_ids,'billing_pending',a.lis_billing_pending);
END $$;

CREATE OR REPLACE FUNCTION public.lis_his_submit_order(p_request_id uuid,p_body jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_tenant uuid:=public.lis_his_actor(); a public.admissions; c public.lis_his_commands;
  v_ids bigint[]; v_old jsonb; v_new jsonb:='[]'; s jsonb; p public.products;
  v_response jsonb; v_id bigint; v_removed bigint[]; v_names text;
BEGIN
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'ID permintaan wajib'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT * INTO c FROM public.lis_his_commands WHERE request_id=p_request_id;
  IF FOUND THEN
    IF c.tenant_id<>v_tenant OR c.actor_id<>auth.uid() OR c.body<>p_body THEN RAISE EXCEPTION 'ID permintaan telah digunakan'; END IF;
    RETURN c.response;
  END IF;
  SELECT array_agg(DISTINCT value::bigint) INTO v_ids FROM jsonb_array_elements_text(p_body->'product_ids');
  IF coalesce(cardinality(v_ids),0)=0 OR cardinality(v_ids)>200 THEN RAISE EXCEPTION 'Pilih 1–200 layanan'; END IF;
  IF (SELECT count(*) FROM public.products WHERE id=ANY(v_ids) AND tenant_id=v_tenant AND brand_code='LAB' AND is_active)<>cardinality(v_ids) THEN
    RAISE EXCEPTION 'Layanan tidak aktif atau tidak tersedia pada katalog tenant';
  END IF;
  IF nullif(p_body->>'admission_id','') IS NOT NULL THEN
    SELECT * INTO a FROM public.admissions WHERE id=(p_body->>'admission_id')::bigint AND tenant_id=v_tenant FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Kunjungan tidak ditemukan dalam tenant aktif'; END IF;
    IF a.status IN ('Cancelled','Canceled','Done','Selesai') THEN RAISE EXCEPTION 'Kunjungan sudah ditutup. Hubungi petugas HIS'; END IF;
    IF a.services IS DISTINCT FROM (p_body->>'services_snapshot') THEN RAISE EXCEPTION 'Layanan sudah berubah. Muat ulang kunjungan HIS'; END IF;
  ELSE
    IF length(btrim(coalesce(p_body->>'patient_name','')))=0 THEN RAISE EXCEPTION 'Nama pasien wajib'; END IF;
    INSERT INTO public.admissions(tenant_id,visit_number,patient_name,patient_age,patient_gender,mr_number,
      patient_id_number,doctor_referral,visit_type,status,payment_status,services,registered_by)
    VALUES(v_tenant,'LIS-'||p_request_id::text,btrim(p_body->>'patient_name'),nullif(p_body->>'patient_age','')::int,
      p_body->>'patient_gender',nullif(p_body->>'mr_number',''),nullif(p_body->>'patient_id_number',''),
      p_body->>'doctor_referral','Walk-in','Registered','Unpaid','[]',auth.uid()::text) RETURNING * INTO a;
    UPDATE public.admissions SET visit_number='LIS-'||to_char(current_date,'YYYYMMDD')||'-'||a.id::text
      WHERE id=a.id RETURNING * INTO a;
  END IF;
  v_old:=coalesce(nullif(a.services,''),'[]')::jsonb;
  -- Preserve HIS non-lab services and all prices/discounts of retained services.
  FOR s IN SELECT value FROM jsonb_array_elements(v_old) LOOP
    IF EXISTS(SELECT 1 FROM public.products WHERE id=(s->>'product_id')::bigint AND tenant_id=v_tenant AND brand_code='LAB') THEN
      IF (s->>'product_id')::bigint=ANY(v_ids) THEN v_new:=v_new||jsonb_build_array(s); END IF;
    ELSE v_new:=v_new||jsonb_build_array(s); END IF;
  END LOOP;
  FOR p IN SELECT * FROM public.products WHERE id=ANY(v_ids) ORDER BY id LOOP
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_new) x WHERE x->>'product_id'=p.id::text) THEN
      v_new:=v_new||jsonb_build_array(jsonb_build_object('product_id',p.id,'name',p.nama_tes,
        'priority',coalesce(p_body->>'priority','ROUTINE'),'unit_price',NULL,'discount_pct',0,'discount_idr',0,'source','LIS'));
    END IF;
  END LOOP;
  IF a.payment_status IS DISTINCT FROM 'Unpaid' AND v_new IS DISTINCT FROM v_old THEN
    RAISE EXCEPTION 'Tagihan sudah diproses. Ajukan perubahan melalui petugas HIS';
  END IF;
  -- Never change clinical result records from a billing synchronization API.
  -- Removing a registered examination requires the clinical cancellation workflow.
  SELECT array_agg((x->>'product_id')::bigint) INTO v_removed FROM jsonb_array_elements(v_old) x
  WHERE EXISTS(SELECT 1 FROM public.products WHERE id=(x->>'product_id')::bigint AND tenant_id=v_tenant AND brand_code='LAB')
    AND NOT ((x->>'product_id')::bigint=ANY(v_ids));
  IF EXISTS(SELECT 1 FROM public.lab_results WHERE admission_id=a.id AND product_id=ANY(v_removed) AND status<>'Cancelled') THEN
    RAISE EXCEPTION 'Pemeriksaan sudah masuk proses lab. Batalkan melalui alur klinis sebelum mengubah layanan';
  END IF;
  PERFORM set_config('app.lis_his_sync','on',true);
  UPDATE public.admissions SET services=v_new::text,lis_billing_pending=(a.lis_billing_pending OR v_new IS DISTINCT FROM v_old),updated_at=now() WHERE id=a.id;
  PERFORM set_config('app.lis_his_sync','off',true);
  v_response:=jsonb_build_object('ok',true,'admission_id',a.id,'visit_number',a.visit_number,
    'services_snapshot',v_new::text,'billing_status',CASE WHEN a.lis_billing_pending OR v_new IS DISTINCT FROM v_old THEN 'pending_his' ELSE 'unchanged' END,'request_id',p_request_id);
  INSERT INTO public.lis_his_commands(request_id,tenant_id,admission_id,actor_id,body,response)
    VALUES(p_request_id,v_tenant,a.id,auth.uid(),p_body,v_response);
  RETURN v_response;
END $$;

-- HIS finalizes the pending service snapshot in one transaction. Optimistic
-- concurrency prevents a stale HIS form from overwriting a later LIS amendment.
CREATE OR REPLACE FUNCTION public.his_finalize_lis_services(p_admission_id bigint,p_snapshot text,p_bill jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.admissions; v_tenant uuid:=public.lis_his_actor(true); v_services jsonb; v_ids jsonb; v_expected jsonb;
  v_gross numeric; v_after_line numeric; v_scheme numeric; v_voucher numeric; v_key text;
BEGIN
  SELECT * INTO a FROM public.admissions WHERE id=p_admission_id AND tenant_id=v_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kunjungan tidak ditemukan'; END IF;
  IF NOT a.lis_billing_pending THEN RAISE EXCEPTION 'Tidak ada perubahan LIS yang menunggu rekonsiliasi'; END IF;
  IF a.services IS DISTINCT FROM p_snapshot THEN RAISE EXCEPTION 'Layanan berubah. Muat ulang admisi sebelum menetapkan tagihan'; END IF;
  IF a.payment_status IS DISTINCT FROM 'Unpaid' THEN RAISE EXCEPTION 'Tagihan sudah diproses'; END IF;
  v_services:=(p_bill->>'services')::jsonb;
  SELECT jsonb_agg(x->>'product_id' ORDER BY x->>'product_id') INTO v_ids FROM jsonb_array_elements(v_services) x;
  SELECT jsonb_agg(x->>'product_id' ORDER BY x->>'product_id') INTO v_expected FROM jsonb_array_elements(p_snapshot::jsonb) x;
  IF v_ids IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Simpan rekonsiliasi LIS sebelum mengubah layanan lain di HIS'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_services) x WHERE x->>'unit_price' IS NULL OR (x->>'unit_price')::numeric<0
    OR coalesce((x->>'discount_pct')::numeric,0) NOT BETWEEN 0 AND 100 OR coalesce((x->>'discount_idr')::numeric,0)<0) THEN
    RAISE EXCEPTION 'Tarif HIS belum lengkap';
  END IF;
  FOREACH v_key IN ARRAY ARRAY['gross_amount','total_amount','line_discount','scheme_discount','voucher_discount','discount_amount','net_amount'] LOOP
    IF p_bill->>v_key IS NULL OR (p_bill->>v_key)::numeric<0 OR (p_bill->>v_key)::numeric::text IN ('NaN','Infinity','-Infinity') THEN
      RAISE EXCEPTION 'Rincian tagihan tidak lengkap atau tidak valid';
    END IF;
  END LOOP;
  SELECT sum((x->>'unit_price')::numeric),sum(greatest(0,(x->>'unit_price')::numeric *
    (1-coalesce((x->>'discount_pct')::numeric,0)/100)-coalesce((x->>'discount_idr')::numeric,0)))
  INTO v_gross,v_after_line FROM jsonb_array_elements(v_services) x;
  v_scheme:=(p_bill->>'scheme_discount')::numeric; v_voucher:=(p_bill->>'voucher_discount')::numeric;
  IF v_scheme+v_voucher>round(v_after_line)
    OR (p_bill->>'gross_amount')::numeric<>round(v_gross)
    OR (p_bill->>'total_amount')::numeric<>round(v_gross)
    OR abs((p_bill->>'line_discount')::numeric-round(v_gross-v_after_line))>1
    OR abs((p_bill->>'discount_amount')::numeric-((p_bill->>'line_discount')::numeric+v_scheme+v_voucher))>1
    OR abs((p_bill->>'net_amount')::numeric-round(v_after_line-v_scheme-v_voucher))>1 THEN
    RAISE EXCEPTION 'Perhitungan tagihan HIS tidak konsisten';
  END IF;
  PERFORM set_config('app.lis_his_sync','on',true);
  UPDATE public.admissions SET services=v_services::text,
    gross_amount=(p_bill->>'gross_amount')::numeric,total_amount=(p_bill->>'total_amount')::numeric,
    line_discount=(p_bill->>'line_discount')::numeric,scheme_discount=(p_bill->>'scheme_discount')::numeric,
    voucher_discount=(p_bill->>'voucher_discount')::numeric,discount_amount=(p_bill->>'discount_amount')::numeric,
    net_amount=(p_bill->>'net_amount')::numeric,lis_billing_pending=false,updated_at=now()
  WHERE id=a.id;
  PERFORM set_config('app.lis_his_sync','off',true);
  INSERT INTO public.lis_his_commands(request_id,tenant_id,admission_id,actor_id,body,response)
  VALUES(gen_random_uuid(),v_tenant,a.id,auth.uid(),jsonb_build_object('action','his_finalize','before',p_snapshot,'bill',p_bill),'{"ok":true}');
  RETURN jsonb_build_object('ok',true);
END $$;
CREATE OR REPLACE FUNCTION public.lis_his_prepare_samples(p_request_id uuid,p_tubes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.lis_his_commands; a public.admissions; v_tenant uuid:=public.lis_his_actor();
  t jsonb; p public.products; i record; v_sample bigint; v_names text; v_ids bigint[];
  v_all bigint[]; v_expected bigint[]; v_labels jsonb:='[]'; v_barcode text; v_count int;
BEGIN
  SELECT * INTO c FROM public.lis_his_commands WHERE request_id=p_request_id AND tenant_id=v_tenant AND actor_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Permintaan order tidak ditemukan'; END IF;
  SELECT * INTO a FROM public.admissions WHERE id=c.admission_id AND tenant_id=v_tenant FOR UPDATE;
  SELECT array_agg(value::bigint ORDER BY value::bigint) INTO v_expected FROM jsonb_array_elements_text(c.body->'product_ids');
  SELECT array_agg((s->>'product_id')::bigint ORDER BY (s->>'product_id')::bigint) INTO v_all
  FROM jsonb_array_elements(coalesce(nullif(a.services,''),'[]')::jsonb) s
  JOIN public.products p0 ON p0.id=(s->>'product_id')::bigint AND p0.tenant_id=v_tenant AND p0.brand_code='LAB';
  IF v_all IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Layanan telah berubah. Muat ulang sebelum menyiapkan sampel'; END IF;
  IF c.response->>'samples_prepared'='true' THEN RETURN c.response; END IF;
  SELECT array_agg(x.value::bigint ORDER BY x.value::bigint) INTO v_all
  FROM jsonb_array_elements(p_tubes) z CROSS JOIN LATERAL jsonb_array_elements_text(z->'product_ids') x;
  IF v_all IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Pembagian sampel tidak sesuai layanan'; END IF;
  FOR t IN SELECT value FROM jsonb_array_elements(p_tubes) LOOP
    SELECT array_agg(p0.id),string_agg(p0.nama_tes,', ' ORDER BY p0.id) INTO v_ids,v_names
    FROM public.products p0 WHERE p0.tenant_id=v_tenant AND p0.id IN (SELECT value::bigint FROM jsonb_array_elements_text(t->'product_ids'))
    AND NOT EXISTS(SELECT 1 FROM public.lab_results r WHERE r.admission_id=a.id AND r.product_id=p0.id AND r.status<>'Cancelled');
    IF coalesce(cardinality(v_ids),0)=0 THEN CONTINUE; END IF;
    INSERT INTO public.lab_samples(barcode,admission_id,visit_number,patient_name,product_name,sampel_type,status,notes)
    VALUES(NULL,a.id,a.visit_number,a.patient_name,v_names,t->>'name','Pending',c.body->>'notes') RETURNING id INTO v_sample;
    v_barcode:='L'||to_char(current_date,'YYMMDD')||'-'||v_sample::text;
    UPDATE public.lab_samples SET barcode=v_barcode WHERE id=v_sample;
    -- No fabricated collection/receipt timestamps: phlebotomy records actual events.
    FOR p IN SELECT * FROM public.products WHERE id=ANY(v_ids) LOOP
      v_count:=0;
      FOR i IN SELECT * FROM public.product_items WHERE product_id=p.id AND is_active LOOP
        INSERT INTO public.lab_results(admission_id,sample_id,visit_number,patient_name,product_id,product_name,
          product_item_id,item_code,item_name,unit,loinc_code,host_code,status)
        VALUES(a.id,v_sample,a.visit_number,a.patient_name,p.id,p.nama_tes,i.id,i.code,i.name_id,i.uom,
          to_jsonb(i)->>'loinc_code',to_jsonb(i)->>'host_code','Draft');
        v_count:=v_count+1;
      END LOOP;
      IF v_count=0 THEN
        INSERT INTO public.lab_results(admission_id,sample_id,visit_number,patient_name,product_id,product_name,status)
        VALUES(a.id,v_sample,a.visit_number,a.patient_name,p.id,p.nama_tes,'Draft');
      END IF;
    END LOOP;
    v_labels:=v_labels||jsonb_build_array(jsonb_build_object('barcode',v_barcode,'patient_name',a.patient_name,
      'product_name',v_names,'visit_number',a.visit_number,'sample_type',t->>'name','mr_number',a.mr_number));
  END LOOP;
  UPDATE public.lis_his_commands SET response=response||jsonb_build_object('samples_prepared',true,'labels',v_labels)
  WHERE request_id=p_request_id RETURNING response INTO c.response;
  RETURN c.response;
END $$;

CREATE OR REPLACE FUNCTION public.his_guard_pending_lis_bill()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF OLD.lis_billing_pending AND coalesce(current_setting('app.lis_his_sync',true),'off')<>'on' AND (
      NEW.services IS DISTINCT FROM OLD.services OR NEW.net_amount IS DISTINCT FROM OLD.net_amount
      OR NEW.total_amount IS DISTINCT FROM OLD.total_amount OR NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
      OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount OR NEW.line_discount IS DISTINCT FROM OLD.line_discount
      OR NEW.scheme_discount IS DISTINCT FROM OLD.scheme_discount OR NEW.voucher_discount IS DISTINCT FROM OLD.voucher_discount
      OR NEW.payment_status IS DISTINCT FROM OLD.payment_status OR NOT NEW.lis_billing_pending) THEN
    RAISE EXCEPTION 'Ada perubahan layanan LIS. Muat ulang admisi dan rekonsiliasi sebelum memproses tagihan';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS his_pending_lis_bill ON public.admissions;
CREATE TRIGGER his_pending_lis_bill BEFORE UPDATE ON public.admissions FOR EACH ROW EXECUTE FUNCTION public.his_guard_pending_lis_bill();

REVOKE ALL ON FUNCTION public.lis_his_prepare_samples(uuid,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.lis_his_prepare_samples(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.lis_his_catalog() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.lis_his_catalog() TO authenticated;
REVOKE ALL ON FUNCTION public.lis_his_actor(boolean) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lis_his_load_visit(text) FROM public,anon;
REVOKE ALL ON FUNCTION public.lis_his_submit_order(uuid,jsonb) FROM public,anon;
REVOKE ALL ON FUNCTION public.his_finalize_lis_services(bigint,text,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.lis_his_load_visit(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lis_his_submit_order(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.his_finalize_lis_services(bigint,text,jsonb) TO authenticated;
COMMIT;
