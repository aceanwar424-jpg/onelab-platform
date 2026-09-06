from pathlib import Path
import re
root=Path('ava-platform/modules/lab')
def edit(name, fn):
 p=root/name; s=p.read_text(encoding='utf-8'); p.write_text(fn(s),encoding='utf-8')
def tat(s):
 s=s.replace('Management Dashboard &amp; Monitoring TAT (AVA Lab)','Kinerja &amp; Waktu Penyelesaian').replace('ISO 15189 SLA','Ringkasan Periode').replace('Pemantauan *Turnaround Time* dari pengambilan sampel hingga rilis hasil dan pemantauan beban kerja analizer real-time.','Durasi pemeriksaan berdasarkan data yang tercatat pada periode terpilih.')
 for n in [7,30,90]: s=re.sub(r'<option value="'+str(n)+r'"(?: selected)?>',f'<option value="{n}" ${{tatRentang==={n}?\'selected\':\'\'}}>',s)
 s=s.replace("const nTotal = Number((tatData && tatData.n_total) || 48);","const nTotal = Number(tatData?.n_total ?? 0);").replace("const nTuntas = Number((tatData && tatData.n_tuntas) || 42);","const nTuntas = Number(tatData?.n_tuntas ?? 0);").replace('const nPending = nTotal - nTuntas;','const nPending = Math.max(0, nTotal - nTuntas);')
 a=s.index('  // 8 SYSMEX'); b=s.index('  const maks',a)
 s=s[:a]+'''  const gauges = [
    {label:'Sampel tercatat',count:nTotal,color:'#0284c7',max:Math.max(1,nTotal)},
    {label:'Selesai',count:nTuntas,color:'#059669',max:Math.max(1,nTotal)},
    {label:'Belum selesai',count:nPending,color:'#b45309',max:Math.max(1,nTotal)}
  ];
  const tahap = (tatData?.tahap || []).filter(t => t.median != null);

'''+s[b:]
 s=s.replace('📊 Real-Time Workstation Status (Ringkasan Operasional)','Ringkasan sampel dalam periode terpilih').replace('TAT Median (SLA Target &lt; 60m)','TAT Median').replace('tatData?.total_median || 45','tatData?.total_median').replace('tatData?.total_p90 || 75','tatData?.total_p90').replace('Sampel Tuntas Tepat Waktu','Sampel Selesai').replace('Math.round((nTuntas/nTotal)*100)','nTotal ? Math.round((nTuntas/nTotal)*100) : 0').replace("lambat.nama || 'Analitik'","lambat.nama || 'Belum tersedia'").replace('Batang terpanjang menunjukkan stasiun kerja yang mengalami antrean sampel.','Durasi median terpanjang membantu meninjau tahap pemeriksaan; tidak menyatakan penyebab keterlambatan.')
 a=s.index('  const rows =',s.index('function tatPerJenis'));b=s.index('  return `',a)
 s=s[:a]+"  const rows = tatData?.per_jenis || [];\n  if (!rows.length) return '<div class=\"card\" style=\"padding:16px\">Belum ada distribusi spesimen pada periode ini.</div>';\n\n"+s[b:]
 s=s.replace('${tatData._galat}',"${tatEsc(tatData._galat)}")
 for x in ['t.nama','r.jenis',"r.barcode || '—'","r.pemeriksaan || '—'","r.jenis || '—'"]: s=s.replace('${'+x+'}','${tatEsc('+x+')}')
 return "const tatEsc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\n"+s
edit('tat.js',tat)
def work(s):
 s=s.replace('s.admission_id || s.visit_number || s.patient_name',"s.admission_id || s.visit_number || ('sample:'+s.id)").replace('r.admission_id || r.visit_number || r.patient_name',"r.admission_id || r.visit_number || ('result:'+r.id)")
 s=s.replace('    const pid = s.product_id || s.product_name;',"    if (!s.product_id && (labResults || []).some(r => String(r.sample_id) === String(s.id) || (r.admission_id && r.admission_id == s.admission_id))) return;\n    const pid = s.product_id || ('sample:'+s.id);")
 s=s.replace('      const results = t.results || [];',"      const results = (t.results || []).filter(r => !['Cancelled','Canceled'].includes(r.status));\n      const sample = (labSamples || []).find(s => String(s.id) === String(t.sample_id));\n      if (sample) { t.barcode = sample.barcode; t.sampel_type = sample.sampel_type; t.sample_status = sample.status; }")
 s=s.replace("results.some(r => r.status === 'Approved' || r.status === 'Released')","results.length && results.every(r => r.status === 'Approved' || r.status === 'Released')").replace("results.some(r => r.status === 'Validated')","results.length && results.every(r => ['Validated','Approved','Released'].includes(r.status))").replace("results.some(r => r.result_value || r.status === 'Draft')","results.some(r => r.result_value != null && String(r.result_value).trim() !== '')")
 return s
edit('worklist.js',work)
def results(s):
 a=s.index('    <!-- SYSMEX SCATTERGRAM');b=s.index('    <!-- CATATAN & PRESETS',a)
 s=s[:a]+s[b:];a=s.index('  // Draw Sysmex');b=s.index('  try {',a);s=s[:a]+s[b:]
 a=s.index('function drawSysmexScattergram');s=s[:a]+re.sub(r'function drawSysmexScattergram[\s\S]*?window.drawSysmexHistogram = drawSysmexHistogram;','',s[a:])
 return s
edit('results.js',results)
def helper(s):
 a=s.index('  const entry = _mockArchiveStore[barcode] || {');b=s.index('  return {',a)
 return s[:a]+"  const entry = _mockArchiveStore[barcode];\n  if (!entry) return { found:false, entry:null, location_summary:null };\n"+s[b:]
edit('sampleArchiving.js',helper)
edit('analyzerInterfacing.js',lambda s:s.replace("frame.trim().split('\\n')","String(frame).trim().split(/\\r\\n|\\r|\\n/)").replace("success: true,\n    accession_no: accession_no || 'L260830-0001'","success: !!accession_no && results.length > 0,\n    accession_no"))
def av(s):
 s=s.replace("  if (!rule || !rule.is_active)","  if (r.status !== 'Draft') return {pass:false,why:'hanya hasil draft dapat diperiksa'};\n  if (!rule || !rule.is_active)")
 s=s.replace('r.ref_low','(r.normal_min ?? r.ref_low)').replace('r.ref_high','(r.normal_max ?? r.ref_high)').replace('parseFloat(r.result_value)','Number(r.result_value)').replace('if (isNaN(v))','if (r.result_value === \'\' || !Number.isFinite(Number(v)))')
 a=s.index('async function runAutoverify()'); b=s.index('\n}',a)+2
 s=s[:a]+"async function runAutoverify() {\n  toast('Autoverifikasi ditahan sampai kebijakan dan penjagaan server selesai divalidasi. Gunakan Verifikasi Teknis.', 'warn');\n}"+s[b:]
 s=s.replace('hasil memenuhi syarat','kandidat untuk tinjauan teknis').replace('${eligible.length ? `<button', '${false ? `<button').replace('Autoverifikasi belum tersedia — jalankan <code>supabase_fase5_lis.sql</code>.','Autoverifikasi belum tersedia. Gunakan Verifikasi Teknis.')
 return s
edit('autoverify.js',av)
def idx(s):
 a=s.index('async function loadLabSamples()');b=s.index('\n}',s.index('async function loadLabResults()',a))+2
 s=s[:a]+'''async function labLoadAll(table) {
  const rows=[];
  for(let offset=0;;offset+=500) {
    const page=await sbGet(table,`select=*&order=id.desc&limit=500&offset=${offset}`);
    if(!Array.isArray(page)) throw new Error('Respons data laboratorium tidak valid');
    rows.push(...page);
    if(page.length<500) return rows;
  }
}
async function loadLabSamples(){
  try { labSamples=await labLoadAll('lab_samples'); }
  catch(e){ toast('Sampel gagal dimuat. Muat ulang sebelum melanjutkan.','err'); throw e; }
}
async function loadLabResults(){
  try { labResults=await labLoadAll('lab_results'); }
  catch(e){ toast('Hasil gagal dimuat. Muat ulang sebelum melanjutkan.','err'); throw e; }
}'''+s[b:]
 s=s.replace("if(!confirm('Read-back belum dicentang. ISO 15189 mensyaratkan penerima mengulang kembali nilainya. Tetap simpan?')) return;","toast('Catat read-back sebelum menandai pelaporan berhasil.','warn'); return;")
 return s
edit('index.js',idx)
def checkin(s):
 for name in ['openWalkinLabModal','submitWalkinLabOrder']:
  pattern=r'((?:async )?function '+name+r'\([^)]*\)\s*\{)'
  s=re.sub(pattern,lambda m:m[1]+"\n  navigate('lis-admission'); return; // Semua order memakai kontrak layanan HIS–LIS.\n",s,count=1)
 return s
edit('checkin.js',checkin)
def val(s):
 s=s.replace('    <div style="display:grid;grid-template-columns:240px 1fr 260px;', '    <style>.lis-review-grid{display:grid;grid-template-columns:220px minmax(0,1fr) 240px}@media(max-width:1100px){.lis-review-grid{grid-template-columns:190px minmax(0,1fr)}.lis-review-grid>div:last-child{grid-column:1/-1}}@media(max-width:760px){.lis-review-grid{grid-template-columns:minmax(0,1fr)}} </style>\n    <div class="lis-review-grid" style="')
 s=s.replace("mode==='approve' ? ['Validated','Approved','Released']","mode==='approve' ? ['Approved','Released']")
 return s
edit('validation.js',val)
