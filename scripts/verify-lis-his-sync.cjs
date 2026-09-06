// Synthetic fixtures only. PGLITE_PATH can point to an isolated test dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { PGlite } = require(process.env.PGLITE_PATH || path.resolve('desktop-app/node_modules/@electric-sql/pglite'));
const T1 = '11111111-1111-4111-8111-111111111111', T2 = '22222222-2222-4222-8222-222222222222';
const U1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', U2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function main() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
    CREATE TABLE user_profiles(id uuid PRIMARY KEY,tenant_id uuid,role text);
    CREATE TABLE admissions(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,visit_number text UNIQUE,tenant_id uuid,
      patient_name text,patient_age int,patient_gender text,mr_number text,patient_id_number text,doctor_referral text,
      visit_type text,status text,payment_status text,services text,registered_by text,updated_at timestamptz,
      gross_amount numeric DEFAULT 0,total_amount numeric DEFAULT 0,line_discount numeric DEFAULT 0,
      scheme_discount numeric DEFAULT 0,voucher_discount numeric DEFAULT 0,discount_amount numeric DEFAULT 0,net_amount numeric DEFAULT 0);
    CREATE TABLE products(id bigint PRIMARY KEY,tenant_id uuid,brand_code text,is_active boolean,nama_tes text,
      harga_normal numeric,kode_internal text,kategori text,sampel_type text,is_panel boolean);
    CREATE TABLE product_items(id bigint PRIMARY KEY,product_id bigint,code text,name_id text,uom text,is_active boolean);
    CREATE TABLE lab_samples(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,barcode text UNIQUE,admission_id bigint,
      visit_number text,patient_name text,product_name text,sampel_type text,status text,notes text,collected_at timestamptz,received_at timestamptz);
    CREATE TABLE lab_results(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,admission_id bigint,sample_id bigint,
      visit_number text,patient_name text,product_id bigint,product_name text,product_item_id bigint,item_code text,item_name text,unit text,loinc_code text,host_code text,status text);
    INSERT INTO user_profiles VALUES ('${U1}','${T1}','lab_analyst'),('${U2}','${T2}','lab_analyst');
    INSERT INTO products VALUES (1,'${T1}','LAB',true,'Tes Sintetis A',100,'A','Kimia','Serum',false),
      (2,'${T1}','LAB',true,'Tes Sintetis B',200,'B','Kimia','Serum',true),
      (3,'${T1}','LAB',false,'Tes Nonaktif',500,'C','Kimia','Serum',false),
      (4,'${T1}','HEALTH',true,'Layanan HIS',300,'D','Klinik','',false),
      (5,'${T2}','LAB',true,'Tes Tenant Lain',400,'E','Kimia','Serum',false);
    INSERT INTO product_items VALUES(21,2,'B1','Analit sintetis B1','u',true),(22,2,'B2','Analit sintetis B2','u',true);
    SELECT set_config('test.uid','${U1}',false);
  `);
  await db.exec(fs.readFileSync('db/migrations/0051_lis_his_service_sync.sql','utf8'));
  const rpc = async (name, args) => (await db.query(`SELECT ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) AS value`, args)).rows[0].value;
  const reject = async (fn, pattern) => assert.rejects(fn, pattern);
  const catalog = await rpc('lis_his_catalog', []);
  assert.deepEqual(catalog.map(p=>p.id),[1,2]);
  assert(!JSON.stringify(catalog).includes('harga'));
  const body = { patient_name:'PASIEN UJI SINTETIS', patient_age:30,patient_gender:'M',product_ids:[1],notes:'Data uji',priority:'ROUTINE',admission_id:null,services_snapshot:null };
  const key = crypto.randomUUID();
  const first = await rpc('lis_his_submit_order',[key,body]);
  const replay = await rpc('lis_his_submit_order',[key,body]);
  assert.deepEqual(first,replay);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM admissions')).rows[0].n,1);
  assert.equal(JSON.parse(first.services_snapshot)[0].unit_price,null);
  await reject(()=>rpc('lis_his_submit_order',[key,{...body,product_ids:[2]}]),/ID permintaan/);
  await reject(()=>rpc('lis_his_submit_order',[crypto.randomUUID(),{...body,product_ids:[3]}]),/tidak aktif/);
  await reject(()=>rpc('lis_his_submit_order',[crypto.randomUUID(),{...body,product_ids:[5]}]),/tidak aktif/);
  const tubes=[{name:'Serum sintetis',product_ids:[1]}];
  await reject(()=>rpc('lis_his_prepare_samples',[key,[{name:'Serum',product_ids:[2]}]]),/tidak sesuai/);
  const samples=await rpc('lis_his_prepare_samples',[key,tubes]);
  assert.equal(samples.labels.length,1);
  await rpc('lis_his_prepare_samples',[key,tubes]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM lab_samples')).rows[0].n,1);
  assert.equal((await db.query('SELECT collected_at FROM lab_samples')).rows[0].collected_at,null);
  const amendment={...body,admission_id:first.admission_id,services_snapshot:first.services_snapshot,product_ids:[1,2]};
  const key2=crypto.randomUUID(); const added=await rpc('lis_his_submit_order',[key2,amendment]);
  await reject(()=>rpc('lis_his_submit_order',[crypto.randomUUID(),amendment]),/sudah berubah/);
  const addedSamples=await rpc('lis_his_prepare_samples',[key2,[{name:'Serum',product_ids:[1,2]}]]);
  assert.equal(addedSamples.labels.length,1);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM lab_results')).rows[0].n,3,'Panel expanded to two analytes');
  await reject(()=>rpc('lis_his_submit_order',[crypto.randomUUID(),{...amendment,services_snapshot:added.services_snapshot,product_ids:[2]}]),/alur klinis/);
  await reject(()=>db.exec(`UPDATE admissions SET payment_status='Paid' WHERE id=${first.admission_id}`),/rekonsiliasi/);
  await reject(()=>db.exec(`UPDATE admissions SET services='[]' WHERE id=${first.admission_id}`),/rekonsiliasi/);
  const lines=JSON.parse(added.services_snapshot).map(s=>({...s,unit_price:s.product_id===1?100:200}));
  const bill={services:JSON.stringify(lines),gross_amount:300,total_amount:300,line_discount:0,scheme_discount:0,voucher_discount:0,discount_amount:0,net_amount:300};
  await reject(()=>rpc('his_finalize_lis_services',[first.admission_id,added.services_snapshot,bill]),/petugas HIS/);
  await db.exec(`UPDATE user_profiles SET role='registration' WHERE id='${U1}'`);
  await reject(()=>rpc('his_finalize_lis_services',[first.admission_id,added.services_snapshot,{...bill,net_amount:10}]),/tidak konsisten/);
  await reject(()=>rpc('his_finalize_lis_services',[first.admission_id,added.services_snapshot,{...bill,net_amount:null}]),/tidak lengkap/);
  await rpc('his_finalize_lis_services',[first.admission_id,added.services_snapshot,bill]);
  const a=(await db.query('SELECT * FROM admissions')).rows[0];
  assert.equal(a.lis_billing_pending,false); assert.equal(Number(a.net_amount),300);
  await db.exec(`UPDATE admissions SET payment_status='Paid' WHERE id=${a.id}`);
  const paidReceipt=await rpc('lis_his_submit_order',[crypto.randomUUID(),{...amendment,services_snapshot:a.services}]);
  assert.equal(paidReceipt.billing_status,'unchanged','Receiving an unchanged paid HIS order must not reopen billing');
  await reject(()=>rpc('lis_his_submit_order',[crypto.randomUUID(),{...amendment,services_snapshot:a.services,product_ids:[1]}]),/sudah diproses/);
  // A pre-analytical amendment preserves unrelated HIS lines and retained tariffs.
  await db.exec(`INSERT INTO admissions(tenant_id,visit_number,patient_name,status,payment_status,services)
    VALUES('${T1}','SYNTHETIC-HIS-2','PASIEN UJI 2','Registered','Unpaid',
    '[{"product_id":4,"name":"Layanan HIS","unit_price":300},{"product_id":1,"name":"Tes A","unit_price":75,"discount_pct":10}]')`);
  const linked=await rpc('lis_his_load_visit',['SYNTHETIC-HIS-2']);
  const merged=await rpc('lis_his_submit_order',[crypto.randomUUID(),{...body,admission_id:linked.id,services_snapshot:linked.services_snapshot,product_ids:[1,2]}]);
  const mergedLines=JSON.parse(merged.services_snapshot);
  assert.equal(mergedLines.find(x=>x.product_id===4).unit_price,300);
  assert.equal(mergedLines.find(x=>x.product_id===1).unit_price,75);
  assert.equal(mergedLines.find(x=>x.product_id===1).discount_pct,10);
  const removed=await rpc('lis_his_submit_order',[crypto.randomUUID(),{...body,admission_id:linked.id,services_snapshot:merged.services_snapshot,product_ids:[2]}]);
  assert.deepEqual(JSON.parse(removed.services_snapshot).map(x=>x.product_id),[4,2]);
  await db.exec(`SELECT set_config('test.uid','${U2}',false)`);
  await reject(()=>rpc('lis_his_load_visit',[a.visit_number]),/tenant aktif/);
  await reject(()=>rpc('lis_his_submit_order',[key,body]),/ID permintaan/);
  await db.exec(`SELECT set_config('test.uid','',false)`);
  await reject(()=>rpc('lis_his_catalog',[]),/Sesi pengguna/);
  assert.equal((await db.query("SELECT has_function_privilege('anon','lis_his_submit_order(uuid,jsonb)','EXECUTE') AS allowed")).rows[0].allowed,false);
  await db.close();
  console.log('PASS PostgreSQL: tenant/RBAC, real catalog, create/retry, additions, sample retry, panel expansion, clinical cancellation guard, stale forms, pending payment guard, HIS pricing.');

  const nodes=new Map();
  const el=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',style:{},disabled:false});return nodes.get(id);};
  const calls=[];let fail=true;let prints=0;
  const ctx={console,crypto,window:{},document:{getElementById:el},toast:()=>{},navigate:()=>{},
    printLabBarcodes:()=>prints++, sbRpc:async(name,args)=>{
      calls.push({name,args:structuredClone(args)});
      if(name==='lis_his_submit_order'){if(fail){fail=false;throw new Error('Synthetic network timeout');}return {ok:true};}
      return {samples_prepared:true,labels:[{barcode:'SYNTHETIC'}]};
    }};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync('ava-platform/modules/lab/admission.js','utf8'),ctx);
  el('adm-patient-name').value='PASIEN UJI SINTETIS';el('adm-age').value='30';el('adm-gender').value='L';
  vm.runInContext("_lisOrderSelectedTests=[{id:1,nama_tes:'Tes A',sampel_type:'Serum',kategori:'Kimia',harga_dasar:999}];",ctx);
  await ctx.submitFullPageLisOrder(); await ctx.submitFullPageLisOrder();
  assert.equal(calls[0].name,'lis_his_submit_order');assert.deepEqual(calls[0].args,calls[1].args);
  assert(!/harga|price|amount/.test(JSON.stringify(calls[0].args)));assert.equal(prints,1);
  for(const f of ['ava-platform/modules/his/admission.js','ava-platform/modules/lab/helpdesk.js','ava-platform/modules/lab/tat.js','ava-platform/js/core/router.js']) new vm.Script(fs.readFileSync(f,'utf8'));
  const source=fs.readFileSync('ava-platform/modules/lab/admission.js','utf8');
  assert(!/SYSMEX HCLAB|adm-total-price|totalPrice|>Tarif<|Rp \$/.test(source));
  console.log('PASS frontend: identical retry payload, no financial fields from LIS, API acknowledgment before barcode, syntax and no admission prices/workstation branding.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
