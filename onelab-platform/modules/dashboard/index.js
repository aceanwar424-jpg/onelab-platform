// ═══════════════════════════════════════════
// MODULE: Dashboard — Executive View
// ═══════════════════════════════════════════

async function renderDashboard() {
  document.getElementById('main-content').innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:13px;color:var(--gray)">Selamat datang,</div>
      <div style="font-size:24px;font-weight:800;color:var(--navy)">${getUserName()} 👋</div>
      <div style="font-size:13px;color:var(--gray);margin-top:2px">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>

    <!-- KPI Row -->
    <div id="dash-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
      ${[1,2,3,4,5,6].map(()=>`<div class="stat-card" style="min-height:90px"><div class="spinner"></div></div>`).join('')}
    </div>

    <!-- Pipeline + Recent -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📊 Pipeline Partner</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('partners')">Kelola →</button>
        </div>
        <div id="dash-pipeline"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚡ Aktivitas Terbaru</div>
        </div>
        <div id="dash-activity"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>

    <!-- Deals + Category -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🤝 Kerjasama Aktif</div>
          <span id="dash-deal-count" class="badge badge-teal"></span>
        </div>
        <div id="dash-deals"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Distribusi Kategori</div>
        </div>
        <div id="dash-cats"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">⚡ Quick Actions</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-teal btn-sm" onclick="openPartnerForm()">➕ Tambah Partner</button>
        <button class="btn btn-outline btn-sm" onclick="navigate('maps')">🗺 Cari Mitra via Maps</button>
        <button class="btn btn-outline btn-sm" onclick="navigate('voucher');setTimeout(openCampaignForm,300)">🎟 Buat Campaign Voucher</button>
        <button class="btn btn-outline btn-sm" onclick="navigate('surat');setTimeout(openSuratForm,300)">📄 Buat Surat</button>
        <button class="btn btn-outline btn-sm" onclick="navigate('marketing')">📣 Marketing Kit</button>
      </div>
    </div>`;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [partners, deals, activity] = await Promise.all([
      sbGet('partners','select=*').catch(()=>[]),
      sbGet('partner_deals','select=*,partners(partner_name)&status=eq.Active').catch(()=>[]),
      sbGet('activity_logs','select=*&order=created_at.desc&limit=8').catch(()=>[]),
    ]);

    const P = Array.isArray(partners)?partners:[];
    const D = Array.isArray(deals)?deals:[];
    const A = Array.isArray(activity)?activity:[];

    // KPIs
    const aktif   = P.filter(p=>['Aktif','MOU'].includes(p.status)).length;
    const prospect= P.filter(p=>p.status==='Prospect'||!p.status).length;
    const meeting = P.filter(p=>p.status==='Meeting').length;
    const totalDealVal = D.reduce((s,d)=>s+(d.value||0),0);
    const withPhone= P.filter(p=>p.phone).length;

    document.getElementById('dash-kpis').innerHTML = [
      {ico:'🤝', lbl:'Total Partner',    val:P.length,                  bg:'#E0F2F1', col:'#00897B', click:'partners'},
      {ico:'✅', lbl:'Mitra Aktif',      val:aktif,                     bg:'#E8F5E9', col:'#22C55E', click:'partners'},
      {ico:'🎯', lbl:'Prospect',         val:prospect,                  bg:'#FFF8E1', col:'#F59E0B', click:'partners'},
      {ico:'📅', lbl:'Meeting/Proposal', val:meeting + P.filter(p=>p.status==='Proposal Dikirim').length, bg:'#F3E5F5',col:'#8B5CF6',click:'partners'},
      {ico:'🤝', lbl:'Kerjasama Aktif',  val:D.length,                  bg:'#E0F7FA', col:'#06B6D4', click:'partners'},
      {ico:'💰', lbl:'Nilai Kerjasama',  val:formatCurrency(totalDealVal), bg:'#FFF3E0',col:'#F97316',click:'partners',isStr:true},
    ].map(k=>`
      <div class="stat-card" style="cursor:pointer" onclick="navigate('${k.click}')">
        <div class="stat-icon" style="background:${k.bg}"><span style="font-size:20px">${k.ico}</span></div>
        <div>
          <div style="font-size:${k.isStr?'14':'22'}px;font-weight:800;color:${k.col};line-height:1.1">${k.val}</div>
          <div class="stat-lbl">${k.lbl}</div>
        </div>
      </div>`).join('');

    document.getElementById('badge-partners').textContent = P.length;

    // Pipeline bar
    const STATUSES = ['Prospect','Dihubungi','Meeting','Proposal Dikirim','MOU','Aktif','Tidak Berminat'];
    const COLORS   = ['#F59E0B','#0EA5E9','#8B5CF6','#F97316','#06B6D4','#22C55E','#EF4444'];
    const counts = {}; STATUSES.forEach(s=>counts[s]=0);
    P.forEach(p=>{if(counts[p.status]!==undefined)counts[p.status]++;});
    const total = P.length || 1;

    document.getElementById('dash-pipeline').innerHTML = `
      <div style="display:flex;gap:3px;height:32px;border-radius:8px;overflow:hidden;margin-bottom:12px">
        ${STATUSES.map((s,i)=>counts[s]>0?`
          <div style="flex:${counts[s]};background:${COLORS[i]};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;cursor:pointer;min-width:${Math.round(counts[s]/total*100)<6?'0':'30px'}"
            onclick="navigate('partners')" title="${s}: ${counts[s]}">
            ${Math.round(counts[s]/total*100)>=6?counts[s]:''}
          </div>`:''
        ).join('')}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${STATUSES.map((s,i)=>`
          <div style="display:flex;align-items:center;gap:5px;cursor:pointer" onclick="navigate('partners')">
            <div style="width:10px;height:10px;border-radius:2px;background:${COLORS[i]}"></div>
            <span style="font-size:11px;color:var(--gray)">${s} <strong style="color:var(--text)">${counts[s]}</strong></span>
          </div>`).join('')}
      </div>`;

    // Activity log
    document.getElementById('dash-activity').innerHTML = A.length
      ? A.map(a=>`
          <div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start">
            <div style="width:28px;height:28px;border-radius:6px;background:var(--lgray);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">
              ${a.action==='create'?'➕':a.action==='update'?'✏️':a.action==='delete'?'🗑':a.action==='import'?'⬆':'📝'}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.record_name||a.description||'—'}</div>
              <div style="font-size:11px;color:var(--gray)">${a.description||''} · ${timeAgo(a.created_at)}</div>
            </div>
          </div>`).join('')
      : '<div style="text-align:center;padding:20px;color:var(--gray);font-size:13px">Belum ada aktivitas</div>';

    // Active deals
    document.getElementById('dash-deal-count').textContent = D.length;
    document.getElementById('dash-deals').innerHTML = D.length
      ? D.slice(0,5).map(d=>{
          const dt = DEAL_TYPES?.find(t=>t.key===d.deal_type)||{color:'#94A3B8'};
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="width:8px;height:36px;border-radius:2px;background:${dt.color};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.deal_name}</div>
                <div style="font-size:11px;color:var(--gray)">${d.partners?.partner_name||''} · ${d.deal_type}</div>
              </div>
              ${d.value?`<div style="font-size:12px;font-weight:700;color:var(--teal);flex-shrink:0">${formatCurrency(d.value)}</div>`:''}
            </div>`;
        }).join('')+
        (D.length>5?`<div style="text-align:center;padding:8px;font-size:12px;color:var(--gray)">${D.length-5} kerjasama lainnya...</div>`:'')
      : '<div style="text-align:center;padding:20px;color:var(--gray);font-size:13px">Belum ada kerjasama aktif</div>';

    // Category distribution
    const cats={};
    P.forEach(p=>{const c=p.category||'Lainnya';cats[c]=(cats[c]||0)+1;});
    const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,7);
    const maxV=sorted[0]?.[1]||1;
    document.getElementById('dash-cats').innerHTML = sorted.length
      ? sorted.map(([cat,count])=>`
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="font-weight:600;color:var(--navy)">${catIcon(cat)} ${cat}</span>
              <span style="color:var(--gray)">${count} (${Math.round(count/P.length*100)}%)</span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="width:${Math.round(count/maxV*100)}%;height:100%;background:var(--teal);border-radius:3px"></div>
            </div>
          </div>`).join('')
      : '<p style="color:var(--gray);font-size:13px">Belum ada data</p>';

  } catch(e) {
    document.getElementById('dash-kpis').innerHTML =
      `<div style="grid-column:1/-1"><div class="status-box status-err">❌ ${e.message}</div></div>`;
  }
}

// Reference DEAL_TYPES from deals.js
const DEAL_TYPES_REF = [
  {key:'MCU',color:'#0EA5E9'},{key:'Wellness',color:'#22C55E'},{key:'Branding',color:'#8B5CF6'},
  {key:'OfficeCare',color:'#F97316'},{key:'HomeCare',color:'#EF4444'},{key:'Personal',color:'#EC4899'},
  {key:'LabDiagnostic',color:'#14B8A6'},{key:'Screening',color:'#F59E0B'},{key:'HealthDay',color:'#6366F1'},
  {key:'Lainnya',color:'#94A3B8'},
];
const DEAL_TYPES = DEAL_TYPES_REF;
