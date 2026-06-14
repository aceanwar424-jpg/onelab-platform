// ═══════════════════════════════════════════
// MODULE: Partner Database v3
// - Full CRUD + Pipeline + Deals
// - User tracking setiap aksi
// - Deals modal pakai overlay terpisah (bukan modal utama)
// ═══════════════════════════════════════════

const PARTNER_CATEGORIES = [
  'Apotek','Klinik Pratama','Klinik Utama','Dokter Praktik',
  'Dokter Spesialis','Klinik Gigi','Klinik Mata','Puskesmas',
  'Rumah Sakit','Lab Klinik','Perusahaan SME','Komunitas',
  'Sekolah / Kampus','Gym & Sport Club','Lainnya'
];
const PARTNER_STATUSES = [
  'Prospect','Dihubungi','Meeting','Proposal Dikirim','MOU','Aktif','Tidak Berminat'
];
const STATUS_COLORS = {
  'Prospect':'#F59E0B','Dihubungi':'#0EA5E9','Meeting':'#8B5CF6',
  'Proposal Dikirim':'#F97316','MOU':'#06B6D4','Aktif':'#22C55E',
  'Tidak Berminat':'#EF4444'
};

let PS = {
  all:[], filtered:[], page:1, perPage:25,
  search:'', filterCat:'', filterStatus:'', view:'table'
};

// ── Render Page ───────────────────────────────────
async function renderPartners(params={}) {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>🤝 Partner Database</h1>
        <p>Hitlist, pipeline progress, dan output kerjasama semua mitra OneLab</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" id="btn-view-toggle" onclick="togglePView()">📊 Kanban</button>
        <button class="btn btn-ghost btn-sm" onclick="exportPartnerCSV()">📥 Export</button>
        <button class="btn btn-teal" onclick="openPartnerForm()">+ Tambah Partner</button>
      </div>
    </div>

    <!-- Pipeline bar thick -->
    <div class="card" style="padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="card-title">📊 Sales Pipeline</div>
        <div id="pipeline-total" style="font-size:12px;color:var(--text3)"></div>
      </div>
      <div id="pipeline-bar" style="display:flex;gap:2px;height:28px;border-radius:var(--r);overflow:hidden;margin-bottom:10px"></div>
      <div id="pipeline-legend" style="display:flex;gap:14px;flex-wrap:wrap"></div>
    </div>

    <div id="pv-table">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="ps-q" placeholder="Cari nama, PIC, alamat, kode..."
            oninput="psSearch(this.value)">
          <select class="table-filter" id="ps-cat" onchange="psFilter()">
            <option value="">Semua Kategori</option>
            ${PARTNER_CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select>
          <select class="table-filter" id="ps-status" onchange="psFilter()">
            <option value="">Semua Status</option>
            ${PARTNER_STATUSES.map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
          <span id="ps-count" style="font-size:12px;color:var(--text3);white-space:nowrap;margin-left:auto"></span>
        </div>
        <div id="partner-tbody"></div>
      </div>
      <div id="partner-pgn"></div>
    </div>

    <div id="pv-kanban" style="display:none">
      <div id="kanban-board" style="display:flex;gap:12px;overflow-x:auto;padding-bottom:12px"></div>
    </div>`;

  PS.all = []; PS.filtered = []; PS.page = 1;
  await loadPartners();
  if (params.highlight) highlightPartner(params.highlight);
}


async function loadPartners() {
  try {
    const data = await sbGet('partners','select=*&order=created_at.desc');
    PS.all = Array.isArray(data) ? data : [];
    PS.page = 1;
    applyPSFilter();
    renderPipelineBar();
    document.getElementById('badge-partners').textContent = PS.all.length;
  } catch(e) {
    document.getElementById('partner-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function psSearch(v) { PS.search=v.toLowerCase(); PS.page=1; applyPSFilter(); }
function psFilter() {
  PS.filterCat    = document.getElementById('ps-cat')?.value||'';
  PS.filterStatus = document.getElementById('ps-status')?.value||'';
  PS.page=1; applyPSFilter();
}
function applyPSFilter() {
  PS.filtered = PS.all.filter(p=>{
    const q=PS.search;
    const mQ=!q||['partner_name','pic_name','address','phone','partner_code','notes']
      .some(k=>(p[k]||'').toLowerCase().includes(q));
    const mC=!PS.filterCat    || p.category===PS.filterCat;
    const mS=!PS.filterStatus || p.status===PS.filterStatus;
    return mQ&&mC&&mS;
  });
  if(PS.view==='table') renderPTable(); else renderKanban();
}

// ── Pipeline Bar ──────────────────────────────────
function renderPipelineBar() {
  const bar      = document.getElementById('pipeline-bar');
  const legend   = document.getElementById('pipeline-legend');
  const total_el = document.getElementById('pipeline-total');
  if (!bar) return;

  const counts = {};
  Object.keys(STATUS_COLORS).forEach(s => counts[s] = 0);
  PS.all.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
  const total = Math.max(PS.all.length, 1);
  if (total_el) total_el.textContent = PS.all.length + ' total partner';

  // Pipeline segments — clickable filter
  bar.innerHTML = Object.entries(STATUS_COLORS)
    .filter(([s]) => counts[s] > 0)
    .map(([s, c]) => `
      <div style="flex:${counts[s]};background:${c};display:flex;align-items:center;
        justify-content:center;font-size:11px;font-weight:700;color:#fff;
        cursor:pointer;min-width:4px;transition:flex .4s"
        onclick="document.getElementById('ps-status').value='${s}';psFilter()"
        title="${s}: ${counts[s]}">
        <span style="overflow:hidden;white-space:nowrap;padding:0 4px">
          ${(counts[s]/total)>0.08 ? counts[s] : ''}
        </span>
      </div>`)
    .join('');

  // Legend
  legend.innerHTML = Object.entries(STATUS_COLORS)
    .map(([s, c]) => `
      <div style="display:flex;align-items:center;gap:5px;cursor:pointer"
        onclick="document.getElementById('ps-status').value='${s}';psFilter()">
        <div style="width:10px;height:10px;border-radius:2px;background:${c}"></div>
        <span style="font-size:11.5px;color:var(--text3)">
          ${s} <strong style="color:var(--text)">${counts[s]}</strong>
        </span>
      </div>`)
    .join('');
}


