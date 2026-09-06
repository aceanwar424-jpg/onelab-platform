// Read-only characterization: reproduces current defects on synthetic fixtures.
// OBSERVED means a defect was reproduced, not that the product passed acceptance.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {PGlite}=require('../desktop-app/node_modules/@electric-sql/pglite');
const root='ava-platform/modules/lab/';
const findings=[];
const observe=(id,result)=>findings.push({id,result});
function context(file, extra={}) {
  const c={window:{},console,document:{getElementById:()=>({innerHTML:'',style:{}})},...extra};
  vm.createContext(c);vm.runInContext(fs.readFileSync(root+file,'utf8'),c);return c;
}
async function main(){
  const out={innerHTML:''};const tat=context('tat.js',{document:{getElementById:()=>out}});
  vm.runInContext('tatData={n_total:0,n_tuntas:0,total_median:0,tahap:[]};tatGambar()',tat);
  assert(out.innerHTML.includes('45 mnt'));observe('LIS-01','TAT: zero/empty real response produces a 45-minute median and hardcoded gauge counts.');
  const qc=context('qcEngine.js');
  const invalid=qc.evaluateWestgardRules('not-a-number',100,1,[]);
  assert.equal(invalid.status,'PASS');observe('LIS-05a','QC engine returns PASS for nonnumeric measurement.');
  const qcUi=context('qc.js');
  const runs=Array.from({length:10},()=>({measured:100.5,target:100,sd:1,z_score:0.5}));
  const ui=qcUi.westgardEvaluate(runs),engine=qc.evaluateWestgardRules(100.5,100,1,Array(9).fill(100.5));
  assert.equal(ui.label,'PERINGATAN');assert.equal(engine.status,'REJECT');
  observe('LIS-05b','10x produces WARNING in the operational QC evaluator and REJECT in qcEngine.');
  const wl=context('worklist.js',{labSamples:[],labResults:[
    {admission_id:1,product_id:1,product_name:'Panel sintetis',status:'Approved',result_value:'1'},
    {admission_id:1,product_id:1,product_name:'Panel sintetis',status:'Draft',result_value:null}]});
  const patients=wl.getWorklistPatientsData();
  assert.equal(patients[0].tests[0].status,'Approve');observe('LIS-03a','A panel containing an empty Draft and one Approved analyte is displayed as Approve.');
  wl.labSamples=[{id:10,admission_id:2,product_name:'Tes A, Tes B',barcode:'SYNTHETIC',status:'Pending'}];
  wl.labResults=[{admission_id:2,product_id:11,product_name:'Tes A',status:'Draft'},
    {admission_id:2,product_id:12,product_name:'Tes B',status:'Draft'}];
  assert.equal(wl.getWorklistPatientsData()[0].tests.length,3);
  observe('LIS-03b','A multi-test tube plus its two result products creates three worklist entries, including a composite phantom test.');
  const messages=[],events=[];
  const val=context('validation.js',{labResults:[{id:1,admission_id:1,product_id:1,status:'Draft',result_value:'1'}],
    isCriticalResult:()=>false,labUser:()=> 'SYNTHETIC',sbPatch:async()=>{throw new Error('Synthetic persistence failure');},
    toast:t=>messages.push(t),loadLabResults:async()=>{}});
  for(const name of ['renderValidationTab','renderApprovalTab','renderLabKPI','renderCriticalBanner']) val[name]=()=>{};
  await val.validateAllResults();assert(messages.some(s=>s.includes('1 hasil tervalidasi')));
  observe('LIS-04a','Batch validation reports one validated result even when every write fails.');
  val.labResults[0].status='Validated';val.window.EventBus={publish:async(...args)=>events.push(args)};
  const savedConsole=val.console;val.console={error:()=>{},warn:()=>{}};
  await val.approvePatientResults(1);val.console=savedConsole;
  assert.equal(events.length,1);observe('LIS-04b','Release event emitted despite zero successful approval writes.');
  const archive=context('sampleArchiving.js');assert.equal(archive.findArchivedSpecimen('DOES-NOT-EXIST').found,true);
  observe('LIS-12','Exported archive helper reports a default freezer location for an unknown barcode; no main UI caller found.');
  const parser=context('analyzerInterfacing.js');assert.equal(parser.parseAstmResultFrame('').success,true);
  observe('LIS-13','Simulator parser accepts an empty frame and fabricates an accession; not the production connector parser.');
  const av=context('autoverify.js');
  const check=av.autoverifyCheck({result_numeric:5,normal_min:4,normal_max:6},{is_active:true,require_in_range:true});
  assert.equal(check.pass,false);observe('LIS-06a','Autoverify frontend ignores normal_min/normal_max and expects ref_low/ref_high.');
  const sql=fs.readFileSync('ava-platform/sql_arsip/04_roadmap_fase/supabase_fase5_lis.sql','utf8');
  const fn=sql.match(/CREATE OR REPLACE FUNCTION public\.mark_autoverified\([\s\S]*?END \$\$;/)[0];
  const db=new PGlite();
  await db.exec(`CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid $$;
    CREATE TABLE lab_results(id bigint,patient_name text,product_name text,result_value text,status text,is_critical boolean,autoverified_at timestamptz,autoverify_note text);
    CREATE FUNCTION write_audit(text,text,text,text,text,jsonb,jsonb) RETURNS void LANGUAGE sql AS $$ SELECT $$;
    INSERT INTO lab_results VALUES(1,'SYNTHETIC','SYNTHETIC','999','Released',true,null,null);`);
  await db.exec(fn);await db.query('SELECT mark_autoverified(1,$1)',['Synthetic note']);
  assert.equal((await db.query('SELECT status FROM lab_results WHERE id=1')).rows[0].status,'Validated');
  observe('LIS-06b','Archived SQL RPC reclassifies a critical Released result as Validated without evaluating QC/rule/status/tenant. Deployment not verified.');
  await db.close();
  fs.mkdirSync('docs/audit-evidence',{recursive:true});
  fs.writeFileSync('docs/audit-evidence/lis-deep-findings.json',JSON.stringify({scope:'Synthetic local characterization; no production access',findings},null,2)+'\n');
  findings.forEach(f=>console.log('OBSERVED '+f.id+': '+f.result));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
