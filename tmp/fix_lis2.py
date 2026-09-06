from pathlib import Path
import re,json
root=Path('ava-platform/modules/lab')
def edit(name,fn):
 p=root/name;p.write_text(fn(p.read_text(encoding='utf-8')),encoding='utf-8')
def val(s):
 a=s.index('async function validatePatientResults');b=s.index('// ── Cetak hasil',a)
 s=s[:a]+'''let _lisTransitionBusy=false;
async function lisTransitionBatch(action, admissionId=null) {
  if(_lisTransitionBusy) return;
  const from=action==='validate'?'Draft':'Validated';
  const rows=labResults.filter(r=>r.status===from && (admissionId==null || r.admission_id==admissionId)
    && r.result_value!=null && String(r.result_value).trim()!=='');
  if(!rows.length){toast('Tidak ada hasil untuk diproses','warn');return;}
  _lisTransitionBusy=true;
  let ok=0,failed=0;
  try {
    const groups=new Map();
    for(const r of rows){const list=groups.get(r.admission_id)||[];list.push(r);groups.set(r.admission_id,list);}
    for(const [id,group] of groups){
      try {
        const result=await sbRpc('lis_transition_results',{p_action:action,p_rows:group.map(r=>({id:r.id,updated_at:r.updated_at??null}))});
        if(!result?.ok || result.count!==group.length) throw new Error('Konfirmasi transaksi tidak sesuai');
        ok+=result.count;
      } catch(e) { failed+=group.length; toast('Kunjungan '+id+': '+e.message,'err'); }
    }
    toast(`${ok} hasil ${action==='validate'?'tervalidasi':'diotorisasi dan dirilis'}${failed?' · '+failed+' belum tersimpan':''}`,failed?'warn':'ok');
    await loadLabResults();
    renderValidationTab();renderApprovalTab();renderLabKPI();renderCriticalBanner();
  } finally {_lisTransitionBusy=false;}
}
async function validatePatientResults(admId){return lisTransitionBatch('validate',admId);}
async function validateAllResults(){return lisTransitionBatch('validate');}
async function approvePatientResults(admId){return lisTransitionBatch('release',admId);}
async function approveAllResults(){return lisTransitionBatch('release');}

'''+s[b:]
 return s.replace('PKI','Identitas otorisator').replace('Semua hasil sudah divalidasi','Tidak ada hasil menunggu verifikasi pada data yang dimuat')
edit('validation.js',val)
def idx(s):
 a=s.index("    await sbPost('critical_value_notifications',",s.index('async function saveCriticalNotification'));b=s.index("    if (typeof logActivity",a)
 s=s[:a]+'''    const ack=await sbRpc('lis_record_critical',{p_result_id:id,p_body:{
      notified_to:to,notified_role:document.getElementById('cv-role').value,
      method:document.getElementById('cv-method').value,notified_at:notifiedAt,
      readback,attempt_status:status,response:document.getElementById('cv-response').value.trim()||null,
      notes:document.getElementById('cv-notes').value.trim()||null
    }});
    if(!ack?.ok) throw new Error('Pelaporan belum dikonfirmasi server');

'''+s[b:]
 s+='''
// Riwayat selalu diselesaikan server melalui identitas kunjungan/tenant.
async function labHistory(admissionId,productId,itemId=null,excludeId=null){
  if(!admissionId || !productId) return [];
  const rows=await sbRpc('lis_result_history',{p_admission_id:Number(admissionId),p_product_id:Number(productId),p_item_id:itemId?Number(itemId):null,p_exclude_id:excludeId?Number(excludeId):null});
  if(!Array.isArray(rows)) throw new Error('Riwayat tidak tersedia');
  return rows;
}
'''
 return s
edit('index.js',idx)
def result(s):
 s=re.sub(r"const prev=await sbGet\('lab_results',\s*`select=result_value,unit,created_at&patient_name=eq\.[\s\S]*?\)\.catch\(\(\)=>\[\]\);", "const prev=await labHistory(r.admission_id,r.product_id,r.product_item_id,r.id);",s,count=1)
 s=re.sub(r"const prev=await sbGet\('lab_results',\s*`select=result_value,result_numeric,unit,created_at&patient_name=eq\.[\s\S]*?`\);", "const current=labResults.find(r=>r.id==excludeId);\n    const admissionId=current?.admission_id || document.getElementById('rf-adm')?.value;\n    const prev=await labHistory(admissionId,productId,current?.product_item_id,excludeId);",s,count=1)
 return s.replace('// ── Sysmex 2D WBC Scattergram Simulation Renderer ─────────────────────────','')
edit('results.js',result)
def report(s):
 s=s.replace("const key=(r.patient_name||'Unknown')+'|'+(r.visit_number||'');","const key=r.admission_id || r.visit_number || ('result:'+r.id);")
 s=s.replace("${r.product_item_id||'null'})", "${r.product_item_id||'null'},${r.admission_id||'null'})")
 s=s.replace('itemId=null){','itemId=null,admissionId=null){',1)
 a=s.index('    let q=',s.index('async function showTrend'));b=s.index('  } catch(e)',a)
 s=s[:a]+"    data=(await labHistory(admissionId,productId,itemId)).reverse();\n"+s[b:]
 s=s.replace("const results = sampleRows || labResults.filter(r=>r.patient_name===patientName&&isReleased(r)&&(!visitNumber||r.visit_number===visitNumber));", "if(!sampleRows && !visitNumber){toast('Pilih kunjungan sebelum mencetak','warn');return;}\n  const results = sampleRows || labResults.filter(r=>isReleased(r)&&r.visit_number===visitNumber);\n  const isDraft=!!sampleRows || results.some(r=>!isReleased(r));")
 s=s.replace("  const first=results[0]||{};","  const first=results[0]||{};\n  patientName=first.patient_name || patientName;",1)
 s=s.replace("  w.document.write('<!DOCTYPE", "  if(!w){toast('Izinkan jendela cetak pada browser','warn');return;}\n  w.document.write('<!DOCTYPE",1)
 a=s.index('  // Pre-load the QR image');b=s.index('  // Demografik',a);s=s[:a]+s[b:]
 s=s.replace('<img src="${qrUrl}" style="width:70px;height:70px;object-fit:contain" alt="QR Signature">',"<span>${isDraft?'DRAF — belum merupakan laporan final':'Otorisasi tercatat dalam sistem'}</span>")
 s=s.replace("${cfg.sign3_name || first.approved_by || '—'}","${isDraft?'—':(first.approved_by || '—')}")
 s=s.replace('HASIL PEMERIKSAAN LABORATORIUM</div>',"${isDraft?'DRAF / PRATINJAU — ':''}HASIL PEMERIKSAAN LABORATORIUM</div>")
 return s
edit('report.js',report)
def critical(s):
 a=s.index('async function cvLapor(');b=s.index('function checkCriticalValue',a)
 s=s[:a]+'''async function cvLapor(id){
  const row=cvData?.find?.(r=>r.id==id);
  if(!row?.result_id){toast('Buka hasil pemeriksaan untuk mencatat pelaporan dan read-back.','warn');navigate('lab-result');return;}
  await loadLabResults();
  ackCritical(row.result_id);
}
async function cvReadBack(id){return cvLapor(id);}

'''+s[b:]
 a=s.index('function recordCriticalValueLog');b=s.index('\n}',a)+2
 s=s[:a]+"function recordCriticalValueLog(){return {success:false,error:'Gunakan transaksi pelaporan nilai kritis'};}"+s[b:]
 return s
edit('criticalValue.js',critical)
p=Path('config/menu.json');s=p.read_text(encoding='utf-8')
for a,b in {'Tinjauan Dokter Sp.PK':'Verifikasi Teknis','Expert clinical impression & otorisasi medis Sp.PK':'Peninjauan hasil oleh analis sebelum otorisasi dokter','Validasi & Rilis Hasil':'Otorisasi & Rilis','Tanda tangan kriptografis QR & rilis hasil resmi':'Otorisasi dokter dan rilis hasil dengan jejak transaksi','Verifikasi Lot Reagen':'Lot Kontrol','Evaluasi bias lot-to-lot & uji paralel kontrol':'Pencatatan dan evaluasi lot bahan kontrol QC','Waktu Layanan (TAT)':'Kinerja & TAT'}.items(): s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
