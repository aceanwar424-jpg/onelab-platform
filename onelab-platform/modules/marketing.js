// ═══════════════════════════════════════════════════
// Module: Marketing Kit — Template & Flyer Manager
// ═══════════════════════════════════════════════════

const MKT_TYPES = [
  { key:'wa_message',  label:'💬 Pesan WA',       icon:'💬' },
  { key:'proposal',    label:'📋 Proposal Mitra',  icon:'📋' },
  { key:'flyer',       label:'📄 Flyer / Brosur',  icon:'📄' },
  { key:'email',       label:'📧 Email',           icon:'📧' },
  { key:'script',      label:'🎤 Skrip Talk',      icon:'🎤' },
  { key:'surat',       label:'✉️ Template Surat',   icon:'✉️' },
];

const MKT_CHANNELS = [
  'Semua Channel','Komunitas & Warga','Dokter & Klinik',
  'Apotek','Perusahaan SME','Gym & Sport','Sekolah / Kampus'
];

async function renderMarketing(){
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Marketing Kit</h1><p>Template WA, proposal, flyer, skrip — semua tersimpan & siap pakai</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" onclick="openMktForm()">+ Tambah Template</button>
      </div>
    </div>

    <div class="tabs" id="mkt-type-tabs">
      <button class="tab-btn active" onclick="filterMktType('all',this)" data-type="all">Semua</button>
      ${MKT_TYPES.map(t=>`
        <button class="tab-btn" onclick="filterMktType('${t.key}',this)" data-type="${t.key}">${t.label}</button>
      `).join('')}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <input class="table-search" id="mkt-search" placeholder="🔍 Cari template..."
        oninput="filterMktSearch(this.value)" style="flex:1;min-width:180px">
      <select class="table-filter" id="mkt-channel" onchange="filterMktChannel(this.value)">
        ${MKT_CHANNELS.map(c=>`<option>${c}</option>`).join('')}
      </select>
    </div>

    <div id="mkt-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>`;

  await loadMarketingTemplates();
}

let mktAllTemplates = [];

async function loadMarketingTemplates(){
  try {
    const data = await sbGet('marketing_templates','select=*&order=created_at.desc');
    mktAllTemplates = Array.isArray(data) ? data : [];
    renderMktGrid(mktAllTemplates);
  } catch(e){
    document.getElementById('mkt-grid').innerHTML =
      `<div class="status-box status-err" style="grid-column:1/-1">❌ ${e.message}</div>`;
  }
}

let mktActiveType = 'all', mktActiveChannel = 'Semua Channel', mktSearch = '';

function filterMktType(type, btn){
  mktActiveType = type;
  document.querySelectorAll('#mkt-type-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  applyMktFilter();
}
function filterMktChannel(ch){ mktActiveChannel=ch; applyMktFilter(); }
function filterMktSearch(q){ mktSearch=q.toLowerCase(); applyMktFilter(); }

function applyMktFilter(){
  let data = mktAllTemplates;
  if(mktActiveType !== 'all') data = data.filter(t=>t.type===mktActiveType);
  if(mktActiveChannel !== 'Semua Channel') data = data.filter(t=>t.channel===mktActiveChannel);
  if(mktSearch) data = data.filter(t=>
    (t.title||'').toLowerCase().includes(mktSearch) ||
    (t.content||'').toLowerCase().includes(mktSearch));
  renderMktGrid(data);
}

function renderMktGrid(templates){
  if(!templates.length){
    document.getElementById('mkt-grid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="ico">📣</div>
        <h3>${mktAllTemplates.length ? 'Tidak ada hasil' : 'Belum ada template'}</h3>
        <p>Klik "+ Tambah Template" untuk mulai membangun marketing kit.</p>
      </div>`;
    return;
  }

  document.getElementById('mkt-grid').innerHTML = templates.map(t => {
    const typeInfo = MKT_TYPES.find(x=>x.key===t.type)||{icon:'📄',label:t.type};
    const preview = (t.content||'').substring(0,120).replace(/\n/g,' ');
    return `
      <div class="card" style="cursor:default;transition:box-shadow .15s" onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,.12)'" onmouseout="this.style.boxShadow=''">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:36px;height:36px;border-radius:8px;background:var(--mint);display:flex;align-items:center;justify-content:center;font-size:18px">${typeInfo.icon}</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--navy)">${t.title||'Tanpa Judul'}</div>
              <div style="display:flex;gap:5px;margin-top:3px">
                <span class="badge badge-teal" style="font-size:10px">${typeInfo.label}</span>
                ${t.channel ? `<span class="badge badge-gray" style="font-size:10px">${t.channel}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="act-btn edit" onclick="openMktForm(${t.id})" title="Edit">✏️</button>
            <button class="act-btn del" onclick="deleteMkt(${t.id},'${(t.title||'').replace(/'/g,"\\'")}')">🗑</button>
          </div>
        </div>
        <div style="font-size:12px;color:var(--gray);line-height:1.6;background:var(--lgray);padding:10px;border-radius:6px;max-height:80px;overflow:hidden">
          ${preview || '<em>Tidak ada konten</em>'}${(t.content||'').length>120?'...':''}
        </div>
        <div style="display:flex;gap:6px;margin-top:10px">
          <button class="btn btn-teal btn-sm" style="flex:1" onclick="previewMkt(${t.id})">👁 Lihat</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="copyMktContent(${t.id})">📋 Salin</button>
          ${t.type==='wa_message' ? `<button class="btn btn-ghost btn-sm" onclick="shareMktWA(${t.id})" title="Buka WA">💬</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Preview Modal ────────────────────────────────
function previewMkt(id){
  const t = mktAllTemplates.find(x=>x.id===id);
  if(!t) return;
  const typeInfo = MKT_TYPES.find(x=>x.key===t.type)||{icon:'📄'};
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${typeInfo.icon} ${t.title}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px">
      <span class="badge badge-teal">${typeInfo.icon} ${t.type}</span>
      ${t.channel ? `<span class="badge badge-gray">${t.channel}</span>` : ''}
    </div>
    <div style="background:${t.type==='wa_message'?'#E7F8EE':'var(--lgray)'};
      border-radius:${t.type==='wa_message'?'4px 14px 14px 14px':'8px'};
      padding:16px;font-size:14px;line-height:1.8;white-space:pre-wrap;
      font-family:${t.type==='wa_message'?'inherit':'inherit'};
      max-height:60vh;overflow-y:auto">
${t.content||''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
      <button class="btn btn-outline" onclick="copyMktContent(${id});closeModalForce()">📋 Salin</button>
      ${t.type==='wa_message'?`<button class="btn btn-teal" onclick="shareMktWA(${id})">💬 Buka WA</button>`:''}
    </div>`);
}

function copyMktContent(id){
  const t = mktAllTemplates.find(x=>x.id===id);
  if(!t) return;
  navigator.clipboard.writeText(t.content||'').then(()=>toast('📋 Tersalin!','ok'))
    .catch(()=>toast('Gagal salin','err'));
}

function shareMktWA(id){
  const t = mktAllTemplates.find(x=>x.id===id);
  if(!t) return;
  window.open('https://wa.me/?text='+encodeURIComponent(t.content||''),'_blank');
}

// ── Add / Edit Form ──────────────────────────────
async function openMktForm(id=null){
  let t = {};
  if(id){
    const data = await sbGet('marketing_templates',`select=*&id=eq.${id}`);
    t = data[0]||{};
  }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Template':'➕ Tambah Template'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Judul Template *</label>
      <input type="text" id="mf-title" value="${t.title||''}" placeholder="Pesan WA Pembuka Komunitas, dll">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipe</label>
        <select id="mf-type">
          ${MKT_TYPES.map(x=>`<option value="${x.key}"${t.type===x.key?' selected':''}>${x.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Channel Target</label>
        <select id="mf-channel">
          ${MKT_CHANNELS.slice(1).map(c=>`<option${t.channel===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Konten Template *</label>
      <textarea id="mf-content" rows="10" placeholder="Tulis template di sini. Gunakan [NAMA], [TANGGAL], [PRODUK] sebagai placeholder yang bisa diganti.">${t.content||''}</textarea>
    </div>
    <div class="form-group">
      <label>Tags (pisah koma)</label>
      <input type="text" id="mf-tags" value="${t.tags||''}" placeholder="komunitas, edukasi, diabetes">
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveMkt(${id||'null'})">
        ${id?'💾 Simpan':'➕ Tambah'}
      </button>
    </div>`);
}

async function saveMkt(id){
  const title   = document.getElementById('mf-title').value.trim();
  const content = document.getElementById('mf-content').value.trim();
  if(!title||!content){ toast('Judul dan konten wajib diisi','err'); return; }

  const payload = {
    title, content,
    type:    document.getElementById('mf-type').value,
    channel: document.getElementById('mf-channel').value,
    tags:    document.getElementById('mf-tags').value.trim(),
    updated_at: new Date().toISOString(),
  };

  try {
    if(id){ await sbPatch('marketing_templates',id,payload); toast('✅ Template diupdate','ok'); }
    else  { await sbPost('marketing_templates',payload);     toast('✅ Template ditambahkan','ok'); }
    closeModalForce();
    await loadMarketingTemplates();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

async function deleteMkt(id, title){
  if(!confirm(`Hapus template "${title}"?`)) return;
  try {
    await sbDelete('marketing_templates',id);
    toast('🗑 Template dihapus','info');
    await loadMarketingTemplates();
  } catch(e){ toast('❌ '+e.message,'err'); }
}
