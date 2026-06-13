// ═══════════════════════════════════════════
// MODULE: Leads Management + OKR & Target Sales
// ═══════════════════════════════════════════

const LEAD_STATUSES = ['Baru','Dihubungi','Qualified','Proposal','Negosiasi','Won','Lost'];
const LEAD_SOURCES  = ['Referral','Google Maps','Walk In','Media Sosial','Website','Event','Cold Call','Lainnya'];
const LEAD_STATUS_COLORS = {
  'Baru':'#94A3B8','Dihubungi':'#0EA5E9','Qualified':'#8B5CF6',
  'Proposal':'#F97316','Negosiasi':'#F59E0B','Won':'#22C55E','Lost':'#EF4444'
};

let leadsAll = [], leadsFilter = {q:'',status:'',source:''};

async function renderLeads() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Leads Management</h1>
        <p>Kelola prospek, follow-up, dan konversi ke partner aktif</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="navigate('okr')">📈 OKR & Target</button>
        <button class="btn btn-teal" onclick="openLeadForm()">+ Tambah Lead</button>
      </div>
    </div>

    <!-- Funnel Stats -->
    <div id="leads-funnel" style="display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px"></div>

    <!-- Filters -->
    <div class="table-wrap">
      <div class="table-toolbar">
        <input class="table-search" id="ld-q" placeholder="🔍 Cari nama, perusahaan, kontak..."
          oninput="leadsFilter.q=this.value.toLowerCase();applyLeadsFilter()" style="flex:1">
        <select class="table-filter" onchange="leadsFilter.status=this.value;applyLeadsFilter()">
          <option value="">Semua Status</option>
          ${LEAD_STATUSES.map(s=>`<option>${s}</option>`).join('')}
        </select>
        <select class="table-filter" onchange="leadsFilter.source=this.value;applyLeadsFilter()">
          <option value="">Semua Sumber</option>
          ${LEAD_SOURCES.map(s=>`<option>${s}</option>`).join('')}
        </select>
      </div>
      <div id="leads-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>`;

  await loadLeads();
}

async function loadLeads() {
  try {
    const data = await sbGet('leads','select=*&order=created_at.desc');
    leadsAll = Array.isArray(data) ? data : [];
    renderLeadsFunnel();
    applyLeadsFilter();
  } catch(e) {
    document.getElementById('leads-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderLeadsFunnel() {
  const el = document.getElementById('leads-funnel');
  if (!el) return;
  el.innerHTML = LEAD_STATUSES.map(s => {
    const count = leadsAll.filter(l=>l.status===s).length;
    const col   = LEAD_STATUS_COLORS[s];
    return `
      <div style="flex:1;min-width:80px;background:#fff;border-radius:10px;padding:10px 12px;
        border:1.5px solid ${col}30;cursor:pointer;text-align:center"
        onclick="leadsFilter.status='${s}';document.querySelectorAll('.table-filter')[0].value='${s}';applyLeadsFilter()">
        <div style="font-size:20px;font-weight:800;color:${col}">${count}</div>
        <div style="font-size:10px;color:var(--gray);margin-top:2px">${s}</div>
      </div>`;
  }).join('');
}

function applyLeadsFilter() {
  const {q,status,source} = leadsFilter;
  const filtered = leadsAll.filter(l =>
    (!q || ['contact_name','company','phone','email'].some(k=>(l[k]||'').toLowerCase().includes(q))) &&
    (!status || l.status===status) &&
    (!source || l.source===source)
  );
  renderLeadsTable(filtered);
}

function renderLeadsTable(data) {
  const el = document.getElementById('leads-tbody');
  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🎯</div>
      <h3>${leadsAll.length?'Tidak ada hasil':'Belum ada leads'}</h3>
      <p>Tambah lead baru atau import dari Maps Prospecting.</p></div>`; return;
  }
  el.innerHTML = `<table>
    <thead><tr>
      <th>Nama / Perusahaan</th><th>Kontak</th><th>Sumber</th>
      <th>Status</th><th>Nilai Estimasi</th><th>Follow Up</th>
      <th>Assigned</th><th>Aksi</th>
    </tr></thead>
    <tbody>${data.map(l => {
      const col = LEAD_STATUS_COLORS[l.status]||'#94A3B8';
      const overdue = l.followup_date && new Date(l.followup_date) < new Date();
      return `<tr>
        <td>
          <div style="font-weight:600;color:var(--navy)">${l.contact_name||'—'}</div>
          <div style="font-size:11px;color:var(--gray)">${l.company||''}</div>
        </td>
        <td>
          <div style="font-size:12px">${l.phone||'—'}</div>
          <div style="font-size:11px;color:var(--gray)">${l.email||''}</div>
        </td>
        <td><span class="badge badge-gray" style="font-size:10px">${l.source||'—'}</span></td>
        <td>
          <select style="border:none;background:${col}20;color:${col};font-size:11px;font-weight:700;
            border-radius:8px;padding:3px 8px;cursor:pointer"
            onchange="updateLeadStatus(${l.id},this.value)">
            ${LEAD_STATUSES.map(s=>`<option value="${s}"${l.status===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px;font-weight:600;color:var(--navy)">
          ${l.estimated_value ? formatCurrency(l.estimated_value) : '—'}
        </td>
        <td>
          <div style="font-size:12px;color:${overdue?'#EF4444':'var(--text)'}">
            ${l.followup_date ? formatDateShort(l.followup_date) : '—'}
            ${overdue ? '⚠️' : ''}
          </div>
          <div style="font-size:11px;color:var(--gray)">${l.followup_note||''}</div>
        </td>
        <td style="font-size:11px;color:var(--gray)">${l.assigned_name||'—'}</td>
        <td><div class="act-row">
          <button class="act-btn edit" onclick="openLeadForm(${l.id})">✏️</button>
          ${l.status==='Won'?`<button class="act-btn" onclick="convertLeadToPartner(${l.id})" title="Convert ke Partner" style="color:#22C55E">🔄</button>`:''}
          <button class="act-btn del" onclick="deleteLead(${l.id})">🗑</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

async function openLeadForm(id=null) {
  let l = {};
  if (id) { const d = await sbGet('leads',`select=*&id=eq.${id}`); l=d[0]||{}; }
  const user = getUserName();
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Lead':'➕ Tambah Lead'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nama Kontak *</label>
        <input type="text" id="lf-name" value="${l.contact_name||''}" placeholder="Nama PIC">
      </div>
      <div class="form-group">
        <label>Perusahaan / Instansi</label>
        <input type="text" id="lf-company" value="${l.company||''}" placeholder="PT. ABC">
      </div>
      <div class="form-group">
        <label>No. HP / WA</label>
        <input type="text" id="lf-phone" value="${l.phone||''}" placeholder="08xx">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="lf-email" value="${l.email||''}" placeholder="email@...">
      </div>
      <div class="form-group">
        <label>Sumber Lead</label>
        <select id="lf-source">
          ${LEAD_SOURCES.map(s=>`<option${l.source===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="lf-status">
          ${LEAD_STATUSES.map(s=>`<option${(l.status||'Baru')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Nilai Estimasi (Rp)</label>
        <input type="number" id="lf-value" value="${l.estimated_value||''}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Assigned To</label>
        <input type="text" id="lf-assigned" value="${l.assigned_name||user}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Kebutuhan / Catatan</label>
        <textarea id="lf-notes" rows="2" placeholder="Kebutuhan utama, pain point...">${l.notes||''}</textarea>
      </div>
      <div class="form-group">
        <label>Jadwal Follow Up</label>
        <input type="date" id="lf-followup" value="${l.followup_date||''}">
      </div>
      <div class="form-group">
        <label>Catatan Follow Up</label>
        <input type="text" id="lf-followup-note" value="${l.followup_note||''}" placeholder="Topik yang akan dibahas...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveLead(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveLead(id) {
  const name = document.getElementById('lf-name').value.trim();
  if (!name) { toast('Nama kontak wajib diisi','err'); return; }
  const payload = {
    contact_name: name,
    company: document.getElementById('lf-company').value.trim(),
    phone: document.getElementById('lf-phone').value.trim(),
    email: document.getElementById('lf-email').value.trim(),
    source: document.getElementById('lf-source').value,
    status: document.getElementById('lf-status').value,
    estimated_value: parseFloat(document.getElementById('lf-value').value)||0,
    assigned_name: document.getElementById('lf-assigned').value.trim(),
    notes: document.getElementById('lf-notes').value.trim(),
    followup_date: document.getElementById('lf-followup').value||null,
    followup_note: document.getElementById('lf-followup-note').value.trim(),
    updated_at: new Date().toISOString(),
  };
  try {
    if (id) { await sbPatch('leads',id,payload); toast('✅ Lead diupdate','ok'); }
    else { await sbPost('leads',payload); toast('✅ Lead ditambahkan','ok'); }
    closeModalForce(); await loadLeads();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function updateLeadStatus(id, status) {
  try {
    await sbPatch('leads',id,{status,updated_at:new Date().toISOString()});
    await loadLeads();
    toast(`✅ Status → ${status}`,'ok');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function convertLeadToPartner(id) {
  const l = leadsAll.find(x=>x.id===id); if(!l) return;
  if (!confirm(`Convert "${l.contact_name}" ke Partner Database?`)) return;
  try {
    await sbPost('partners',{
      partner_name: l.company||l.contact_name,
      category: 'Lainnya', status:'Prospect',
      pic_name: l.contact_name, phone: l.phone, email: l.email,
      assigned_name: l.assigned_name||getUserName(),
      notes: `Converted dari Leads. ${l.notes||''}`,
      source: 'Leads', updated_at: new Date().toISOString(),
    });
    await sbPatch('leads',id,{status:'Won',converted_to_partner:true,updated_at:new Date().toISOString()});
    toast('✅ Lead berhasil dikonvert ke Partner!','ok');
    await loadLeads();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteLead(id) {
  if (!confirm('Hapus lead ini?')) return;
  try { await sbDelete('leads',id); toast('🗑 Lead dihapus','info'); await loadLeads(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ══════════════════════════════════════════
// OKR & Target Sales
// ══════════════════════════════════════════
let okrAll = [];

async function renderOKR() {
  const now = new Date();
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>OKR & Target Sales</h1>
        <p>Objective, Key Results, dan tracking realisasi tim sales</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="navigate('leads')">🎯 Leads</button>
        <button class="btn btn-teal" onclick="openOKRForm()">+ Tambah OKR</button>
      </div>
    </div>

    <!-- Period selector -->
    <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
      <select id="okr-period" class="table-filter" style="min-width:160px" onchange="loadOKR()">
        ${[...Array(4)].map((_,i)=>{
          const q = Math.ceil((now.getMonth()+1)/3) - i;
          const yr = q < 1 ? now.getFullYear()-1 : now.getFullYear();
          const qr = q < 1 ? 4+q : q;
          return `<option value="${yr}-Q${qr}">Q${qr} ${yr}</option>`;
        }).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="loadOKR()">🔄 Refresh</button>
    </div>

    <div id="okr-list"><div class="loading-row"><div class="spinner"></div></div></div>`;

  await loadOKR();
}

async function loadOKR() {
  const period = document.getElementById('okr-period')?.value || '';
  try {
    const data = await sbGet('okr_targets',`select=*&order=created_at.desc${period?`&period=eq.${period}`:''}`);
    okrAll = Array.isArray(data) ? data : [];
    renderOKRList();
  } catch(e) {
    document.getElementById('okr-list').innerHTML =
      `<div class="status-box status-err">❌ ${e.message}</div>`;
  }
}

function renderOKRList() {
  const el = document.getElementById('okr-list');
  if (!okrAll.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">📈</div>
      <h3>Belum ada OKR</h3>
      <p>Tambah Objective dan Key Results untuk periode ini.</p></div>`; return;
  }
  el.innerHTML = okrAll.map(o => {
    const pct = o.target > 0 ? Math.min(100, Math.round((o.actual/o.target)*100)) : 0;
    const barColor = pct >= 100 ? '#22C55E' : pct >= 70 ? '#F59E0B' : '#EF4444';
    return `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--navy)">${o.objective}</div>
            <div style="font-size:11px;color:var(--gray)">${o.period} · ${o.assigned_name||'Tim'} · ${o.metric_type}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="act-btn edit" onclick="openOKRForm(${o.id})">✏️</button>
            <button class="act-btn del" onclick="deleteOKR(${o.id})">🗑</button>
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:var(--navy)">${o.target?.toLocaleString('id-ID')||0}</div>
            <div style="font-size:10px;color:var(--gray)">Target</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:${barColor}">${o.actual?.toLocaleString('id-ID')||0}</div>
            <div style="font-size:10px;color:var(--gray)">Realisasi</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:18px;font-weight:800;color:${barColor}">${pct}%</div>
            <div style="font-size:10px;color:var(--gray)">Pencapaian</div>
          </div>
        </div>
        <div style="background:var(--lgray);border-radius:99px;height:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor};border-radius:99px;transition:width .4s"></div>
        </div>
        ${o.notes?`<div style="font-size:11px;color:var(--gray);margin-top:8px">${o.notes}</div>`:''}
        <div style="margin-top:10px">
          <button class="btn btn-outline btn-sm" onclick="updateOKRActual(${o.id},${o.actual||0},${o.target||0})">
            ✏️ Update Realisasi
          </button>
        </div>
      </div>`;
  }).join('');
}

async function openOKRForm(id=null) {
  let o = {};
  if (id) { const d = await sbGet('okr_targets',`select=*&id=eq.${id}`); o=d[0]||{}; }
  const now = new Date();
  const q = Math.ceil((now.getMonth()+1)/3);
  const defaultPeriod = `${now.getFullYear()}-Q${q}`;

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit OKR':'➕ Tambah OKR'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Objective *</label>
      <input type="text" id="of-obj" value="${o.objective||''}"
        placeholder="Contoh: Tambah 20 partner aktif baru Q3 2026">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Periode</label>
        <select id="of-period">
          ${['2026-Q1','2026-Q2','2026-Q3','2026-Q4','2027-Q1'].map(p=>
            `<option${(o.period||defaultPeriod)===p?' selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tipe Metrik</label>
        <select id="of-metric">
          ${['Partner Baru','Revenue (Rp)','Leads','MCU Peserta','Voucher Redeem','Surat Keluar','Meeting'].map(m=>
            `<option${o.metric_type===m?' selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Target</label>
        <input type="number" id="of-target" value="${o.target||''}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Realisasi Saat Ini</label>
        <input type="number" id="of-actual" value="${o.actual||0}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Assigned To</label>
        <input type="text" id="of-assigned" value="${o.assigned_name||getUserName()}">
      </div>
    </div>
    <div class="form-group">
      <label>Catatan / Strategi</label>
      <textarea id="of-notes" rows="2" placeholder="Rencana pencapaian target...">${o.notes||''}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveOKR(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveOKR(id) {
  const obj = document.getElementById('of-obj').value.trim();
  if (!obj) { toast('Objective wajib diisi','err'); return; }
  const payload = {
    objective: obj,
    period: document.getElementById('of-period').value,
    metric_type: document.getElementById('of-metric').value,
    target: parseFloat(document.getElementById('of-target').value)||0,
    actual: parseFloat(document.getElementById('of-actual').value)||0,
    assigned_name: document.getElementById('of-assigned').value.trim(),
    notes: document.getElementById('of-notes').value.trim(),
    updated_at: new Date().toISOString(),
  };
  try {
    if (id) { await sbPatch('okr_targets',id,payload); toast('✅ OKR diupdate','ok'); }
    else { await sbPost('okr_targets',payload); toast('✅ OKR ditambahkan','ok'); }
    closeModalForce(); await loadOKR();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function updateOKRActual(id, current, target) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">✏️ Update Realisasi</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Realisasi Terkini</label>
      <input type="number" id="okr-actual-val" value="${current}" style="font-size:20px;font-weight:700;text-align:center">
      <div style="font-size:12px;color:var(--gray);margin-top:4px">Target: ${target?.toLocaleString('id-ID')}</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveOKRActual(${id})">✅ Update</button>
    </div>`);
}

async function saveOKRActual(id) {
  const actual = parseFloat(document.getElementById('okr-actual-val').value)||0;
  try {
    await sbPatch('okr_targets',id,{actual,updated_at:new Date().toISOString()});
    toast('✅ Realisasi diupdate','ok'); closeModalForce(); await loadOKR();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteOKR(id) {
  if (!confirm('Hapus OKR ini?')) return;
  try { await sbDelete('okr_targets',id); toast('🗑 OKR dihapus','info'); await loadOKR(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}
