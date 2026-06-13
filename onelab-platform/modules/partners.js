// ═══════════════════════════════════════════════════
// Module: Partner Database — Full CRUD + Maps Import
// Tabel: partners
// ═══════════════════════════════════════════════════

const PARTNER_CATEGORIES = [
  'Apotek','Klinik Pratama','Dokter Praktik','Dokter Spesialis',
  'Puskesmas','Rumah Sakit','Perusahaan SME','Komunitas',
  'Sekolah / Kampus','Gym & Sport Club','Lainnya'
];

const PARTNER_STATUSES = [
  'Prospect','Dihubungi','Meeting','Proposal Dikirim','MOU','Aktif','Tidak Berminat'
];

const STATUS_PIPELINE = [
  { key:'Prospect',          color:'#F59E0B', bg:'#FFF8E1' },
  { key:'Dihubungi',         color:'#0EA5E9', bg:'#E0F2FE' },
  { key:'Meeting',           color:'#8B5CF6', bg:'#F3E5F5' },
  { key:'Proposal Dikirim',  color:'#F97316', bg:'#FFF3E0' },
  { key:'MOU',               color:'#06B6D4', bg:'#E0F7FA' },
  { key:'Aktif',             color:'#22C55E', bg:'#E8F5E9' },
  { key:'Tidak Berminat',    color:'#EF4444', bg:'#FFEBEE' },
];

let PS = { // partner state
  all:[], filtered:[], page:1, perPage:25,
  search:'', filterCat:'', filterStatus:'', view:'table'
};

// ─────────────────────────────────────────────────────
// RENDER PAGE
// ─────────────────────────────────────────────────────
async function renderPartners() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>Partner Database</h1>
        <p>Hitlist & progress semua mitra OneLab — klinik, apotek, komunitas, perusahaan</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="togglePView()" id="btn-view">📋 Pipeline View</button>
        <button class="btn btn-ghost btn-sm" onclick="exportPartnerCSV()">📥 Export CSV</button>
        <button class="btn btn-teal" onclick="openPartnerForm()">+ Tambah Partner</button>
      </div>
    </div>

    <!-- Pipeline progress bar -->
    <div class="card" style="padding:14px 18px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--gray);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">Progress Pipeline</div>
      <div style="display:flex;gap:4px;height:28px;border-radius:8px;overflow:hidden" id="pipeline-bar">
        <div class="loading-row" style="padding:0"><div class="spinner"></div></div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px" id="pipeline-legend"></div>
    </div>

    <!-- Table view -->
    <div id="partners-table-view">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="p-search" placeholder="🔍 Cari nama, PIC, alamat, telepon..."
            oninput="pSearch(this.value)">
          <select class="table-filter" id="p-cat" onchange="pFilter()">
            <option value="">Semua Kategori</option>
            ${PARTNER_CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}
          </select>
          <select class="table-filter" id="p-status" onchange="pFilter()">
            <option value="">Semua Status</option>
            ${PARTNER_STATUSES.map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
          <span id="p-count" style="font-size:12px;color:var(--gray);white-space:nowrap"></span>
        </div>
        <div id="partner-table-body">
          <div class="loading-row"><div class="spinner"></div> Memuat data...</div>
        </div>
      </div>
      <div id="partner-pgn"></div>
    </div>

    <!-- Pipeline view (hidden by default) -->
    <div id="partners-pipeline-view" style="display:none">
      <div id="pipeline-board" style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px"></div>
    </div>`;

  await loadPartners();
}

// ─────────────────────────────────────────────────────
// LOAD & FILTER
// ─────────────────────────────────────────────────────
async function loadPartners() {
  try {
    const data = await sbGet('partners','select=*&order=created_at.desc');
    PS.all  = Array.isArray(data) ? data : [];
    PS.page = 1;
    applyPFilter();
    renderPipelineBar();
    document.getElementById('badge-partners').textContent = PS.all.length;
  } catch(e) {
    document.getElementById('partner-table-body').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function pSearch(v){ PS.search=v.toLowerCase(); PS.page=1; applyPFilter(); }
function pFilter(){
  PS.filterCat    = document.getElementById('p-cat')?.value    || '';
  PS.filterStatus = document.getElementById('p-status')?.value || '';
  PS.page=1; applyPFilter();
}

function applyPFilter(){
  PS.filtered = PS.all.filter(p=>{
    const q = PS.search;
    const mQ = !q || ['partner_name','pic_name','address','phone','partner_code','notes']
                      .some(k=>(p[k]||'').toLowerCase().includes(q));
    const mC = !PS.filterCat    || p.category === PS.filterCat;
    const mS = !PS.filterStatus || p.status   === PS.filterStatus;
    return mQ && mC && mS;
  });
  if(PS.view==='table') renderPTable();
  else renderPipeline();
}

// ─────────────────────────────────────────────────────
// PIPELINE BAR
// ─────────────────────────────────────────────────────
function renderPipelineBar(){
  const total = PS.all.length || 1;
  const counts = {};
  STATUS_PIPELINE.forEach(s=>counts[s.key]=0);
  PS.all.forEach(p=>{ if(counts[p.status]!==undefined) counts[p.status]++; });

  document.getElementById('pipeline-bar').innerHTML =
    STATUS_PIPELINE.map(s=>{
      const pct = Math.round(counts[s.key]/total*100);
      return pct>0 ? `<div style="flex:${counts[s.key]};background:${s.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;min-width:${pct<8?'0':'40px'}" title="${s.key}: ${counts[s.key]}">${pct>8?counts[s.key]:''}</div>` : '';
    }).join('');

  document.getElementById('pipeline-legend').innerHTML =
    STATUS_PIPELINE.map(s=>`
      <div style="display:flex;align-items:center;gap:5px;cursor:pointer" onclick="filterByStatus('${s.key}')">
        <div style="width:10px;height:10px;border-radius:2px;background:${s.color}"></div>
        <span style="font-size:11px;color:var(--gray)">${s.key} <strong style="color:var(--text)">${counts[s.key]}</strong></span>
      </div>`).join('');
}

function filterByStatus(status){
  PS.filterStatus = status;
  document.getElementById('p-status') && (document.getElementById('p-status').value=status);
  PS.page=1; applyPFilter();
}

// ─────────────────────────────────────────────────────
// TABLE VIEW
// ─────────────────────────────────────────────────────
function renderPTable(){
  const {filtered,page,perPage} = PS;
  document.getElementById('p-count').textContent = `${filtered.length} dari ${PS.all.length}`;

  if(!filtered.length){
    document.getElementById('partner-table-body').innerHTML = `
      <div class="empty-state">
        <div class="ico">🤝</div>
        <h3>${PS.all.length?'Tidak ada hasil':'Belum ada partner'}</h3>
        <p>${PS.all.length?'Coba ubah filter.':'Klik "+ Tambah Partner" atau import dari Maps.'}</p>
      </div>`;
    document.getElementById('partner-pgn').innerHTML=''; return;
  }

  const start = (page-1)*perPage;
  const rows  = filtered.slice(start, start+perPage);

  document.getElementById('partner-table-body').innerHTML = `
    <table>
      <thead><tr>
        <th>#</th><th>Kode</th><th>Nama Partner</th><th>Kategori</th>
        <th>PIC</th><th>Telepon</th><th>Status</th><th>Rating</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${rows.map((p,i)=>{
          const wn = (p.phone||'').replace(/\D/g,'');
          const wu = wn ? `https://wa.me/${wn.startsWith('0')?'62'+wn.slice(1):wn}` : '';
          const mu = p.latitude&&p.longitude ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}` : '';
          const sp = STATUS_PIPELINE.find(s=>s.key===p.status)||{color:'#94A3B8',bg:'#F1F5F9'};
          return `<tr>
            <td style="color:#bbb;font-size:11px">${start+i+1}</td>
            <td style="font-size:11px;color:var(--gray);font-family:monospace">${p.partner_code||'—'}</td>
            <td>
              <div class="td-name">${p.partner_name||'—'}</div>
              <div class="td-sub">${p.address||''}</div>
            </td>
            <td><span class="badge ${catBadge(p.category)}">${catIcon(p.category)} ${p.category||'—'}</span></td>
            <td>${p.pic_name||'—'}</td>
            <td class="td-phone">${p.phone||'—'}</td>
            <td>
              <span class="badge" style="background:${sp.bg};color:${sp.color}">${p.status||'Prospect'}</span>
            </td>
            <td>${p.rating ? `⭐ ${p.rating} <span style="color:#bbb;font-size:11px">(${p.total_reviews||0})</span>` : '—'}</td>
            <td>
              <div class="act-row">
                ${wu?`<button class="act-btn wa" onclick="window.open('${wu}','_blank')" title="WhatsApp">💬</button>`:''}
                ${mu?`<button class="act-btn maps" onclick="window.open('${mu}','_blank')" title="Lihat Maps">🗺</button>`:''}
                <button class="act-btn edit" onclick="openPartnerForm(${p.id})" title="Edit">✏️</button>
                <button class="act-btn del" onclick="deletePartner(${p.id},'${(p.partner_name||'').replace(/'/g,"\\'")}')">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  const pages = Math.ceil(filtered.length/perPage);
  document.getElementById('partner-pgn').innerHTML = pages>1
    ? `<div class="pagination">${Array.from({length:pages},(_,i)=>
        `<button class="pg-btn${i+1===page?' active':''}" onclick="goPP(${i+1})">${i+1}</button>`
      ).join('')}</div>`
    : '';
}

function goPP(p){ PS.page=p; renderPTable(); window.scrollTo(0,200); }

// ─────────────────────────────────────────────────────
// PIPELINE KANBAN VIEW
// ─────────────────────────────────────────────────────
function renderPipeline(){
  const board = document.getElementById('pipeline-board');
  if(!board) return;
  board.innerHTML = STATUS_PIPELINE.map(s=>{
    const cards = PS.filtered.filter(p=>p.status===s.key);
    return `
      <div style="min-width:220px;flex:1">
        <div style="padding:10px 12px;border-radius:8px 8px 0 0;background:${s.color};color:#fff;font-size:12px;font-weight:700;display:flex;justify-content:space-between">
          <span>${s.key}</span><span>${cards.length}</span>
        </div>
        <div style="background:#fff;border-radius:0 0 8px 8px;padding:8px;min-height:120px;box-shadow:var(--shadow)">
          ${cards.length ? cards.map(p=>`
            <div style="background:${s.bg};border-radius:6px;padding:10px 12px;margin-bottom:6px;cursor:pointer" onclick="openPartnerForm(${p.id})">
              <div style="font-size:12px;font-weight:700;color:var(--navy)">${p.partner_name||'—'}</div>
              <div style="font-size:11px;color:var(--gray);margin-top:2px">${catIcon(p.category)} ${p.category||''}</div>
              ${p.pic_name?`<div style="font-size:11px;color:var(--gray)">👤 ${p.pic_name}</div>`:''}
              ${p.phone?`<div style="font-size:11px;color:var(--teal)">${p.phone}</div>`:''}
            </div>`).join('')
          : `<div style="text-align:center;padding:20px;color:#ccc;font-size:12px">Kosong</div>`}
        </div>
      </div>`;
  }).join('');
}

function togglePView(){
  const btn = document.getElementById('btn-view');
  if(PS.view==='table'){
    PS.view='pipeline';
    document.getElementById('partners-table-view').style.display='none';
    document.getElementById('partners-pipeline-view').style.display='block';
    btn.textContent='📊 Table View';
    renderPipeline();
  } else {
    PS.view='table';
    document.getElementById('partners-table-view').style.display='block';
    document.getElementById('partners-pipeline-view').style.display='none';
    btn.textContent='📋 Pipeline View';
    renderPTable();
  }
}

// ─────────────────────────────────────────────────────
// FORM ADD / EDIT
// ─────────────────────────────────────────────────────
async function openPartnerForm(id=null){
  let p = {};
  if(id){
    const d = await sbGet('partners',`select=*&id=eq.${id}`);
    p = d[0]||{};
  }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Partner':'➕ Tambah Partner Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Kode Partner</label>
        <input type="text" id="f-code" placeholder="APT-001 (otomatis jika kosong)" value="${p.partner_code||''}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="f-status">
          ${PARTNER_STATUSES.map(s=>`<option value="${s}"${(p.status||'Prospect')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Partner *</label>
        <input type="text" id="f-name" placeholder="Apotek Sehat, Klinik Dr. Budi..." value="${p.partner_name||''}" required>
      </div>
      <div class="form-group">
        <label>Kategori *</label>
        <select id="f-cat">
          <option value="">-- Pilih --</option>
          ${PARTNER_CATEGORIES.map(c=>`<option value="${c}"${p.category===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Nama PIC</label>
        <input type="text" id="f-pic" placeholder="Nama penanggung jawab" value="${p.pic_name||''}">
      </div>
      <div class="form-group">
        <label>No. Telepon / WA</label>
        <input type="text" id="f-phone" placeholder="08xxxxxxxxxx" value="${p.phone||''}">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="f-email" placeholder="email@domain.com" value="${p.email||''}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat</label>
        <input type="text" id="f-address" placeholder="Jl. ..." value="${p.address||''}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Catatan</label>
        <textarea id="f-notes" placeholder="Hasil kunjungan, poin penting, follow-up berikutnya...">${p.notes||''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="savePartner(${id||'null'})">
        ${id?'💾 Simpan Perubahan':'➕ Tambah Partner'}
      </button>
    </div>`);
}

async function savePartner(id){
  const name = document.getElementById('f-name').value.trim();
  const cat  = document.getElementById('f-cat').value;
  if(!name){ toast('Nama partner wajib diisi','err'); return; }
  if(!cat){  toast('Kategori wajib dipilih','err');   return; }

  const payload = {
    partner_code: document.getElementById('f-code').value.trim() || autoCode(cat),
    partner_name: name,
    category:     cat,
    pic_name:     document.getElementById('f-pic').value.trim(),
    phone:        document.getElementById('f-phone').value.trim(),
    email:        document.getElementById('f-email').value.trim(),
    address:      document.getElementById('f-address').value.trim(),
    status:       document.getElementById('f-status').value,
    notes:        document.getElementById('f-notes').value.trim(),
    updated_at:   new Date().toISOString(),
  };

  try {
    if(id){
      await sbPatch('partners', id, payload);
      toast('✅ Partner diupdate','ok');
    } else {
      await sbPost('partners', payload);
      toast('✅ Partner ditambahkan','ok');
    }
    closeModalForce();
    await loadPartners();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

async function deletePartner(id, name){
  if(!confirm(`Hapus "${name}"?\nTindakan ini permanen.`)) return;
  try {
    await sbDelete('partners', id);
    toast(`🗑 "${name}" dihapus`,'info');
    await loadPartners();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

// ─────────────────────────────────────────────────────
// MAPS IMPORT — import data dari Google Maps langsung ke Supabase
// ─────────────────────────────────────────────────────
async function importFromMaps(records){
  // records: array dari Maps tool {name, address, phone, category, rating, reviews, lat, lng}
  if(!records||!records.length){ toast('Tidak ada data untuk diimport','warn'); return; }
  let added=0, skipped=0;
  for(const r of records){
    try {
      // Cek duplikat berdasarkan partner_name + address
      const existing = await sbGet('partners',
        `select=id&partner_name=eq.${encodeURIComponent(r.name)}&address=eq.${encodeURIComponent(r.address)}`);
      if(existing && existing.length > 0){ skipped++; continue; }

      const catMapped = mapCategory(r.category||'');
      await sbPost('partners',{
        partner_code: autoCode(catMapped),
        partner_name: r.name||'',
        category:     catMapped,
        phone:        r.phone||'',
        address:      r.address||'',
        latitude:     String(r.lat||''),
        longitude:    String(r.lng||''),
        rating:       r.rating||null,
        total_reviews:r.reviews||0,
        status:       'Prospect',
        notes:        `Import dari Google Maps ${new Date().toLocaleDateString('id-ID')}`,
      });
      added++;
    } catch(e){ skipped++; }
  }
  toast(`✅ ${added} partner diimport, ${skipped} dilewati`,'ok');
  await loadPartners();
}

// ─────────────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────────────
function exportPartnerCSV(){
  const data = PS.filtered.length ? PS.filtered : PS.all;
  if(!data.length){ toast('Tidak ada data','warn'); return; }
  const h=['No','Kode','Nama','Kategori','PIC','Telepon','Email','Alamat','Status','Rating','Ulasan','Catatan','Dibuat'];
  const rows=data.map((p,i)=>[
    i+1,p.partner_code||'',p.partner_name||'',p.category||'',p.pic_name||'',
    p.phone||'',p.email||'',p.address||'',p.status||'',p.rating||'',
    p.total_reviews||'',p.notes||'',p.created_at||''
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`));
  const csv=[h,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=`OneLab_Partners_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.csv`;
  a.click(); toast('📥 CSV diunduh','ok');
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function autoCode(cat){
  const prefix = {
    'Apotek':'APT','Klinik Pratama':'KLN','Dokter Praktik':'DKT',
    'Dokter Spesialis':'DSP','Puskesmas':'PKM','Rumah Sakit':'RSK',
    'Perusahaan SME':'PRS','Komunitas':'KOM','Sekolah / Kampus':'SKL',
    'Gym & Sport Club':'GYM','Lainnya':'LNY'
  };
  const pre = prefix[cat]||'PTN';
  return `${pre}-${Date.now().toString().slice(-5)}`;
}

function mapCategory(q){
  if(!q) return 'Lainnya';
  q=q.toLowerCase();
  if(q.includes('apotek')||q.includes('farmasi')) return 'Apotek';
  if(q.includes('klinik'))    return 'Klinik Pratama';
  if(q.includes('dokter')&&q.includes('spesialis')) return 'Dokter Spesialis';
  if(q.includes('dokter'))    return 'Dokter Praktik';
  if(q.includes('puskesmas')) return 'Puskesmas';
  if(q.includes('rumah sakit')||q.includes('hospital')) return 'Rumah Sakit';
  if(q.includes('gym')||q.includes('fitness')) return 'Gym & Sport Club';
  if(q.includes('sekolah')||q.includes('kampus')) return 'Sekolah / Kampus';
  return 'Lainnya';
}

function catBadge(cat){
  const m={'Apotek':'badge-gold','Klinik Pratama':'badge-teal','Dokter Praktik':'badge-navy',
    'Dokter Spesialis':'badge-navy','Puskesmas':'badge-teal','Rumah Sakit':'badge-navy',
    'Perusahaan SME':'badge-purple','Komunitas':'badge-green',
    'Sekolah / Kampus':'badge-green','Gym & Sport Club':'badge-green'};
  return m[cat]||'badge-gray';
}
