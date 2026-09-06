from pathlib import Path
p=Path('ava-platform/modules/lab/qcEngine.js');s=p.read_text(encoding='utf-8');a=s.index('function evaluateWestgardRules');b=s.index('/**',a+1)
s=s[:a]+'''// One evaluator; chronology is oldest to newest. R-4s requires explicit same-run levels.
function evaluateWestgardZ(zScores, sameRunZ=[]) {
  if(!zScores.length || [...zScores,...sameRunZ].some(v=>typeof v!=='number'||!Number.isFinite(v)))
    return {status:'INVALID',triggeredRule:null,recommendation:'Data QC tidak valid; tinjau input.'};
  const z=zScores.at(-1),same=(n,t)=>zScores.length>=n &&
    (zScores.slice(-n).every(v=>v>t)||zScores.slice(-n).every(v=>v < -t));
  let rule=null,status='PASS';
  if(Math.abs(z)>3) rule='1-3s';
  else if(same(2,2)) rule='2-2s';
  else if(sameRunZ.length>=2 && Math.max(...sameRunZ)>2 && Math.min(...sameRunZ)<-2 && Math.max(...sameRunZ)-Math.min(...sameRunZ)>4) rule='R-4s';
  else if(same(10,0)) rule='10x';
  if(rule) status='REJECT';
  else if(same(4,1)){rule='4-1s';status='WARNING';}
  else if(Math.abs(z)>2){rule='1-2s';status='WARNING';}
  return {status,triggeredRule:rule,zScore:z,ruleVersion:'ava-qc-1.1',
    recommendation:status==='PASS'?'Tidak ada pelanggaran aturan terpilih. Tinjau kelengkapan QC sesuai SOP.':
      status==='REJECT'?'Pelanggaran '+rule+'. Tahan dan tinjau QC sesuai SOP.':'Peringatan '+rule+'. Tinjau QC sesuai SOP.'};
}
function evaluateWestgardRules(val,targetMean,sd,previousValues=[],sameRunValues=[]) {
  const values=[val,targetMean,sd,...previousValues,...sameRunValues];
  if(values.some(v=>v==null||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))) || Number(sd)<=0)
    return {status:'INVALID',message:'Nilai, target dan SD harus berupa angka; SD harus positif'};
  return {...evaluateWestgardZ([...previousValues,val].map(v=>(Number(v)-Number(targetMean))/Number(sd)),
    sameRunValues.map(v=>(Number(v)-Number(targetMean))/Number(sd))),val,targetMean,sd};
}

'''+s[b:]
s=s.replace('    evaluateWestgardRules,','    evaluateWestgardZ,\n    evaluateWestgardRules,')
s=s.replace('Perbedaan antara 2 nilai QC berturut-turut melebihi 4 SD.','Rentang dua level dalam run yang sama melebihi 4 SD.')
p.write_text(s,encoding='utf-8')
p=Path('ava-platform/modules/lab/qc.js');s=p.read_text(encoding='utf-8');a=s.index('function westgardEvaluate');b=s.index('// Grafik kendali',a)
s=s[:a]+'''function westgardEvaluate(runs) {
  if(!runs.length) return {label:'BELUM ADA DATA',color:'#64748b',rule:null,detail:'Belum ada data QC'};
  const current=runs[0];
  const sameSeries=runs.filter(r=>r.qc_level===current.qc_level && r.lot_id===current.lot_id && r.target===current.target && r.sd===current.sd);
  const z=r=>r.z_score!=null?Number(r.z_score):
    (r.measured!=null && r.target!=null && Number(r.sd)>0?(Number(r.measured)-Number(r.target))/Number(r.sd):NaN);
  const sameRun=current.run_id?runs.filter(r=>r.run_id===current.run_id).map(z):[];
  const ev=evaluateWestgardZ(sameSeries.slice().reverse().map(z),sameRun);
  const labels={PASS:'TERKENDALI',WARNING:'PERINGATAN',REJECT:'TOLAK',INVALID:'DATA TIDAK VALID'};
  return {label:labels[ev.status],color:ev.status==='PASS'?'#15803d':ev.status==='WARNING'?'#b45309':'#b91c1c',rule:ev.triggeredRule,detail:ev.recommendation};
}

'''+s[b:];p.write_text(s,encoding='utf-8')
