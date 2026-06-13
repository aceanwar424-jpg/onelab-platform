// ═══════════════════════════════════════════════════
// Module: Dashboard
// ═══════════════════════════════════════════════════

async function renderDashboard(){
  document.getElementById('main-content').innerHTML=`
    <div class="page-header">
      <div><h1>Dashboard</h1><p>Ringkasan performa OneLab Growth Platform</p></div>
      <div class="btn-row">
        <button class="btn btn-teal btn-sm" onclick="navigate('partners')">+ Tambah Partner</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('maps')">🗺 Cari Mitra Baru</button>
      </div>
    </div>

    <div class="stat-grid" id="dash-stats">
      ${[1,2,3,4,5,6].map(()=>`<div class="stat-card"><div class="spinner"></div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Partner Terbaru</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('partners')">Lihat Semua →</button>
        </div>
        <div id="dash-recent"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Distribusi Kategori</div></div>
        <div id="dash-cats"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>`;

  try {
    const partners = await sbGet('partners','select=*&order=created_at.desc');
    if(!Array.isArray(partners)) throw new Error('Gagal ambil data');

    const total  = partners.length;
    const aktif  = partners.filter(p=>['Aktif','MOU'].includes(p.status)).length;
    const pros   = partners.filter(p=>p.status==='Prospect'||!p.status).length;
    const apotek = partners.filter(p=>(p.category||'').includes('Apotek')).length;
    const klinik = partners.filter(p=>(p.category||'').match(/Klinik|Dokter|Puskesmas|Rumah Sakit/)).length;
    const withPh = partners.filter(p=>p.phone).length;

    const stats=[
      {ico:'🤝',lbl:'Total Partner',  num:total,  bg:'#E0F2F1',color:'#00897B'},
      {ico:'✅',lbl:'Mitra Aktif',    num:aktif,  bg:'#E8F5E9',color:'#2E7D32'},
      {ico:'🎯',lbl:'Prospect',       num:pros,   bg:'#FFF8E1',color:'#F57F17'},
      {ico:'💊',lbl:'Apotek',         num:apotek, bg:'#FFF3E0',color:'#E65100'},
      {ico:'🏥',lbl:'Klinik & Dokter',num:klinik, bg:'#E8EAF6',color:'#283593'},
      {ico:'📞',lbl:'Ada Kontak',     num:withPh, bg:'#F3E5F5',color:'#6A1B9A'},
    ];

    document.getElementById('dash-stats').innerHTML=stats.map(s=>`
      <div class="stat-card" style="cursor:pointer" onclick="navigate('partners')">
        <div class="stat-icon" style="background:${s.bg}"><span style="font-size:22px">${s.ico}</span></div>
        <div class="stat-info">
          <div class="stat-num" style="color:${s.color}">${s.num}</div>
          <div class="stat-lbl">${s.lbl}</div>
        </div>
      </div>`).join('');

    document.getElementById('badge-partners').textContent=total;

    document.getElementById('dash-recent').innerHTML=partners.slice(0,6).map(p=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        <div style="width:34px;height:34px;border-radius:8px;background:var(--mint);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${catIcon(p.category)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.partner_name||'—'}</div>
          <div style="font-size:11px;color:var(--gray)">${p.category||'—'} · ${p.address||''}</div>
        </div>
        <span class="badge" style="background:${spColor(p.status).bg};color:${spColor(p.status).color}">${p.status||'Prospect'}</span>
      </div>`).join('')||'<div class="empty-state"><div class="ico">🤝</div><h3>Belum ada partner</h3></div>';

    const cats={};
    partners.forEach(p=>{ const c=p.category||'Lainnya'; cats[c]=(cats[c]||0)+1; });
    const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,7);
    const maxV=sorted[0]?.[1]||1;
    document.getElementById('dash-cats').innerHTML=sorted.map(([cat,count])=>`
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="font-weight:600;color:var(--navy)">${catIcon(cat)} ${cat}</span>
          <span style="color:var(--gray)">${count}</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
          <div style="width:${Math.round(count/maxV*100)}%;height:100%;background:var(--teal);border-radius:3px"></div>
        </div>
      </div>`).join('')||'<p style="color:var(--gray);font-size:13px">Belum ada data</p>';

  } catch(e){
    document.getElementById('dash-stats').innerHTML=
      `<div style="grid-column:1/-1"><div class="status-box status-err">❌ ${e.message}</div></div>`;
  }
}

function spColor(status){
  const map={
    'Aktif':{color:'#22C55E',bg:'#E8F5E9'},'MOU':{color:'#06B6D4',bg:'#E0F7FA'},
    'Prospect':{color:'#F59E0B',bg:'#FFF8E1'},'Dihubungi':{color:'#0EA5E9',bg:'#E0F2FE'},
    'Meeting':{color:'#8B5CF6',bg:'#F3E5F5'},'Proposal Dikirim':{color:'#F97316',bg:'#FFF3E0'},
    'Tidak Berminat':{color:'#EF4444',bg:'#FFEBEE'},
  };
  return map[status]||{color:'#94A3B8',bg:'#F1F5F9'};
}
