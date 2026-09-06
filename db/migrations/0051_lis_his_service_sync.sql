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
    IF a.services IS DISTINCT FROM (p_body->>'services_snapshot') THEN RAISE EXCEPTION 'Layanan sudah berubah. Muat ulang kunjungan HIS'; END IF;
    IF a.payment_status IS DISTINCT FROM 'Unpaid' THEN RAISE EXCEPTION 'Tagihan sudah diproses. Ajukan perubahan melalui petugas HIS'; END IF;
  ELSE
    IF length(btrim(coalesce(p_body->>'patient_name','')))=0 THEN RAISE EXCEPTION 'Nama pasien wajib'; END IF;
    INSERT INTO public.admissions(tenant_id,visit_number,patient_name,patient_age,patient_gender,mr_number,
      patient_id_number,doctor_referral,visit_type,status,payment_status,services,registered_by)
    VALUES(v_tenant,'LIS-'||p_request_id::text,btrim(p_body->>'patient_name'),nullif(p_body->>'patient_age','')::int,
      p_body->>'patient_gender',nullif(p_body->>'mr_number',''),nullif(p_body->>'patient_id_number',''),
      p_body->>'doctor_referral','Walk-in','Registered','Unpaid','[]',auth.uid()::text) RETURNING * INTO a;
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
  -- Never change clinical result records from a billing synchronization API.
  -- Removing a registered examination requires the clinical cancellation workflow.
  SELECT array_agg((x->>'product_id')::bigint) INTO v_removed FROM jsonb_array_elements(v_old) x
  WHERE EXISTS(SELECT 1 FROM public.products WHERE id=(x->>'product_id')::bigint AND tenant_id=v_tenant AND brand_code='LAB')
    AND NOT ((x->>'product_id')::bigint=ANY(v_ids));
  IF EXISTS(SELECT 1 FROM public.lab_results WHERE admission_id=a.id AND product_id=ANY(v_removed) AND status<>'Cancelled') THEN
    RAISE EXCEPTION 'Pemeriksaan sudah masuk proses lab. Batalkan melalui alur klinis sebelum mengubah layanan';
  END IF;
  UPDATE public.admissions SET services=v_new::text,lis_billing_pending=true,updated_at=now() WHERE id=a.id;
  v_response:=jsonb_build_object('ok',true,'admission_id',a.id,'visit_number',a.visit_number,
    'services_snapshot',v_new::text,'billing_status','pending_his','request_id',p_request_id);
  INSERT INTO public.lis_his_commands(request_id,tenant_id,admission_id,actor_id,body,response)
    VALUES(p_request_id,v_tenant,a.id,auth.uid(),p_body,v_response);
  RETURN v_response;
END $$;

-- HIS finalizes the pending service snapshot in one transaction. Optimistic
-- concurrency prevents a stale HIS form from overwriting a later LIS amendment.
CREATE OR REPLACE FUNCTION public.his_finalize_lis_services(p_admission_id bigint,p_snapshot text,p_bill jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.admissions; v_tenant uuid:=public.lis_his_actor(true); v_services jsonb; v_ids jsonb; v_expected jsonb;
BEGIN
  SELECT * INTO a FROM public.admissions WHERE id=p_admission_id AND tenant_id=v_tenant FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kunjungan tidak ditemukan'; END IF;
  IF a.services IS DISTINCT FROM p_snapshot THEN RAISE EXCEPTION 'Layanan berubah. Muat ulang admisi sebelum menetapkan tagihan'; END IF;
  IF a.payment_status IS DISTINCT FROM 'Unpaid' THEN RAISE EXCEPTION 'Tagihan sudah diproses'; END IF;
  v_services:=(p_bill->>'services')::jsonb;
  SELECT jsonb_agg(x->>'product_id' ORDER BY x->>'product_id') INTO v_ids FROM jsonb_array_elements(v_services) x;
  SELECT jsonb_agg(x->>'product_id' ORDER BY x->>'product_id') INTO v_expected FROM jsonb_array_elements(p_snapshot::jsonb) x;
  IF v_ids IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Simpan rekonsiliasi LIS sebelum mengubah layanan lain di HIS'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_services) x WHERE x->>'unit_price' IS NULL OR (x->>'unit_price')::numeric<0) THEN
    RAISE EXCEPTION 'Tarif HIS belum lengkap';
  END IF;
  IF (p_bill->>'net_amount')::numeric<0 THEN RAISE EXCEPTION 'Tagihan tidak boleh negatif'; END IF;
  UPDATE public.admissions SET services=v_services::text,
    gross_amount=(p_bill->>'gross_amount')::numeric,total_amount=(p_bill->>'total_amount')::numeric,
    line_discount=(p_bill->>'line_discount')::numeric,scheme_discount=(p_bill->>'scheme_discount')::numeric,
    voucher_discount=(p_bill->>'voucher_discount')::numeric,discount_amount=(p_bill->>'discount_amount')::numeric,
    net_amount=(p_bill->>'net_amount')::numeric,lis_billing_pending=false,updated_at=now()
  WHERE id=a.id;
  INSERT INTO public.lis_his_commands(request_id,tenant_id,admission_id,actor_id,body,response)
  VALUES(gen_random_uuid(),v_tenant,a.id,auth.uid(),jsonb_build_object('action','his_finalize','before',p_snapshot,'bill',p_bill),'{"ok":true}');
  RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.lis_his_actor(boolean) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION public.lis_his_load_visit(text) FROM public,anon;
REVOKE ALL ON FUNCTION public.lis_his_submit_order(uuid,jsonb) FROM public,anon;
REVOKE ALL ON FUNCTION public.his_finalize_lis_services(bigint,text,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.lis_his_load_visit(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lis_his_submit_order(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.his_finalize_lis_services(bigint,text,jsonb) TO authenticated;
COMMIT;
