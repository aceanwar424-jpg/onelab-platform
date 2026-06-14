// ═══════════════════════════════════════════
// MODULE: Marketing Kit v2
// - Field dinamis per tipe konten
// - Upload file JPG/PDF/DOC
// - Supabase Storage
// ═══════════════════════════════════════════

const MKT_TYPES = [
  { key:'wa_message',  label:'💬 Pesan WA',
    fields:['content'],
    hint:'Template pesan WhatsApp. Gunakan *teks* untuk bold.',
    contentLabel:'Isi Pesan WA',
    contentPlaceholder:'Halo [NAMA],\n\nBerikut informasi dari OneLab...',
    hasFile: false },

  { key:'script',      label:'🎤 Skrip Health Talk',
    fields:['content'],
    hint:'Skrip untuk dibacakan dokter/perawat saat health talk komunitas.',
    contentLabel:'Isi Skrip',
    contentPlaceholder:'Pembukaan (3 menit):\n"Bapak/Ibu selamat pagi..."',
    hasFile: false },

  { key:'email',       label:'📧 Email',
    fields:['subject','content'],
    hint:'Template email formal. Bisa pakai placeholder [NAMA], [PERUSAHAAN].',
    contentLabel:'Isi Email',
    contentPlaceholder:'Dengan hormat,\n\n...',
    hasFile: false },

  { key:'proposal',    label:'📋 Proposal Mitra',
    fields:['content','file'],
    hint:'Proposal kerjasama. Bisa upload file DOC/PDF sebagai template visual.',
    contentLabel:'Isi Proposal (teks)',
    contentPlaceholder:'Dengan hormat,\n\nKami dari OneLab Diagnostics...',
    hasFile: true,
    fileLabel: 'Upload Proposal (DOC/PDF)',
    fileBucket: 'templates',
    fileFolder: 'proposals',
    fileAccepts: ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },

  { key:'flyer',       label:'📄 Flyer / Brosur',
    fields:['content','file'],
    hint:'Upload desain flyer dalam format JPG/PNG/PDF.',
    contentLabel:'Deskripsi / Caption',
    contentPlaceholder:'Flyer untuk event health talk bulan Mei...',
    hasFile: true,
    fileLabel: 'Upload Flyer (JPG/PNG/PDF)',
    fileBucket: 'templates',
    fileFolder: 'flyers',
    fileAccepts: ['image/jpeg','image/png','image/webp','application/pdf'] },

  { key:'surat',       label:'✉️ Template Surat',
    fields:['content','file'],
    hint:'Upload template surat dalam format DOC/DOCX agar mudah atur logo & layout. Gunakan {{VARIABEL}} sebagai placeholder.',
    contentLabel:'Isi Surat (teks fallback)',
    contentPlaceholder:'Dengan hormat,\n\n{{ISI_SURAT}}',
    hasFile: true,
    fileLabel: 'Upload Template Surat (DOC/DOCX)',
    fileBucket: 'templates',
    fileFolder: 'surat',
    fileAccepts: ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'] },

  { key:'mou_template',label:'📜 Template MOU',
    fields:['content','file'],
    hint:'Upload template MOU dalam format DOC/DOCX.',
    contentLabel:'Ringkasan / Catatan MOU',
    contentPlaceholder:'Template MOU untuk kerjasama MCU korporat...',
    hasFile: true,
    fileLabel: 'Upload Template MOU (DOC/DOCX)',
    fileBucket: 'templates',
    fileFolder: 'mou',
    fileAccepts: ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'] },
];

const MKT_CHANNELS = [
  'Semua Channel','Komunitas & Warga','Dokter & Klinik',
  'Apotek','Perusahaan SME','Gym & Sport','Sekolah / Kampus','Internal'
];

let mktAll = [];
let mktActiveType = 'all';
let mktSearch = '';

async function renderMarketing() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Marketing Kit</h1><p>Template, proposal, skrip, voucher — semua tersimpan & siap pakai</p></div>
      <div class="btn-row" id="mkt-header-btns">
        <button class="btn btn-teal" onclick="openMktForm()">+ Tambah Template</button>
      </div>
    </div>

    <!-- Main section tabs -->
    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border)">
      <button id="mkt-section-template" class="tab-btn active"
        onclick="switchMktSection('template')">📣 Template & Konten</button>
      <button id="mkt-section-voucher" class="tab-btn"
        onclick="switchMktSection('voucher')">🎟 Voucher Builder</button>
    </div>

    <!-- Template section -->
    <div id="mkt-section-template-content">
      <div class="tabs" id="mkt-tabs" style="overflow-x:auto;white-space:nowrap">
        <button class="tab-btn active" onclick="filterMkt('all',this)">Semua</button>
        ${MKT_TYPES.map(t=>`
          <button class="tab-btn" onclick="filterMkt('${t.key}',this)">${t.label}</button>`).join('')}
      </div>

    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <input class="table-search" id="mkt-q" placeholder="🔍 Cari template..."
        oninput="mktSearch=this.value.toLowerCase();renderMktGrid(applyMktFilter())" style="flex:1;min-width:180px">
      <select class="table-filter" id="mkt-ch" onchange="renderMktGrid(applyMktFilter())">
        ${MKT_CHANNELS.map(c=>`<option>${c}</option>`).join('')}
      </select>
    </div>

    <div id="mkt-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>
    </div>

    <!-- Voucher section (hidden by default) -->
    <div id="mkt-section-voucher-content" style="display:none"></div>
  `;

  await loadMktTemplates();
}

async function loadMktTemplates() {
  try {
    const data = await sbGet('marketing_templates','select=*&order=created_at.desc');
    mktAll = Array.isArray(data) ? data : [];
    renderMktGrid(mktAll);
  } catch(e) {
    document.getElementById('mkt-grid').innerHTML =
      `<div class="status-box status-err" style="grid-column:1/-1">❌ ${e.message}</div>`;
  }
}

function applyMktFilter() {
  const ch = document.getElementById('mkt-ch')?.value || '';
  return mktAll.filter(t =>
    (mktActiveType === 'all' || t.type === mktActiveType) &&
    (ch === 'Semua Channel' || !ch || t.channel === ch) &&
    (!mktSearch || (t.title||'').toLowerCase().includes(mktSearch) ||
                   (t.content||'').toLowerCase().includes(mktSearch))
  );
}

function filterMkt(type, btn) {
  mktActiveType = type;
  document.querySelectorAll('#mkt-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderMktGrid(applyMktFilter());
}

function renderMktGrid(templates) {
  const grid = document.getElementById('mkt-grid');
  if (!grid) return;

  if (!templates.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="ico">📣</div>
        <h3>${mktAll.length ? 'Tidak ada hasil' : 'Belum ada template'}</h3>
        <p>Klik "+ Tambah Template" untuk mulai.</p>
      </div>`;
    return;
  }

  grid.innerHTML = templates.map(t => {
    const typeInfo = MKT_TYPES.find(x => x.key === t.type) || {label: t.type, hasFile: false};
    const preview  = (t.content||'').substring(0,100).replace(/\n/g,' ');
    const isImage  = t.file_type && t.file_type.startsWith('image/');

    return `
      <div class="card" style="transition:box-shadow .15s;display:flex;flex-direction:column;gap:10px"
        onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,.12)'"
        onmouseout="this.style.boxShadow=''">

        <!-- File preview -->
        ${t.file_url ? (isImage
          ? `<img src="${t.file_url}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;background:var(--lgray)">`
          : `<div style="height:80px;background:var(--lgray);border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px">
              <span style="font-size:32px">${t.file_type?.includes('pdf')?'📄':'📝'}</span>
              <div><div style="font-size:12px;font-weight:600;color:var(--navy)">${t.file_name||'File template'}</div>
              <a href="${t.file_url}" target="_blank" style="font-size:11px;color:var(--teal)">Buka file ↗</a></div>
            </div>`)
          : ''}

        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px">${t.title}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <span class="badge badge-teal" style="font-size:10px">${typeInfo.label}</span>
              ${t.channel ? `<span class="badge badge-gray" style="font-size:10px">${t.channel}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="act-btn edit" onclick="openMktForm(${t.id})">✏️</button>
            <button class="act-btn del" onclick="deleteMkt(${t.id},'${(t.title||'').replace(/'/g,"\\'")}')">🗑</button>
          </div>
        </div>

        ${preview ? `<div style="font-size:12px;color:var(--gray);line-height:1.5;background:var(--lgray);padding:8px;border-radius:6px;max-height:60px;overflow:hidden">${preview}${(t.content||'').length>100?'...':''}</div>` : ''}

        <div style="display:flex;gap:6px;margin-top:auto">
          <button class="btn btn-teal btn-sm" style="flex:1" onclick="previewMkt(${t.id})">👁 Lihat</button>
          <button class="btn btn-outline btn-sm" onclick="copyMktContent(${t.id})">📋 Salin</button>
          ${t.type==='wa_message'||t.type==='email' ? `<button class="btn btn-ghost btn-sm" onclick="shareMktWA(${t.id})">💬</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ── Preview ───────────────────────────────────────
function previewMkt(id) {
  const t = mktAll.find(x=>x.id===id); if(!t) return;
  const typeInfo = MKT_TYPES.find(x=>x.key===t.type)||{label:t.type};
  const isImage  = t.file_type && t.file_type.startsWith('image/');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${typeInfo.label} — ${t.title}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    ${t.file_url ? `
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:6px">File Template</div>
        ${isImage
          ? `<img src="${t.file_url}" style="width:100%;border-radius:8px;max-height:300px;object-fit:contain;background:var(--lgray)">`
          : `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--lgray);border-radius:8px">
              <span style="font-size:28px">${t.file_type?.includes('pdf')?'📄':'📝'}</span>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--navy)">${t.file_name||'File template'}</div>
                <a href="${t.file_url}" target="_blank" class="btn btn-teal btn-sm" style="margin-top:4px;text-decoration:none;display:inline-block">⬇️ Download / Buka</a>
              </div>
            </div>`}
      </div>` : ''}
    ${t.content ? `
      <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:6px">Konten</div>
      <div style="background:${t.type==='wa_message'?'#E7F8EE':'var(--lgray)'};border-radius:8px;padding:14px;
        font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:50vh;overflow-y:auto">
${t.content}
      </div>` : ''}
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
      ${t.content ? `<button class="btn btn-outline" onclick="copyMktContent(${id});closeModalForce()">📋 Salin</button>` : ''}
      ${t.type==='wa_message' ? `<button class="btn btn-teal" onclick="shareMktWA(${id})">💬 Buka WA</button>` : ''}
    </div>`);
}

function copyMktContent(id) {
  const t = mktAll.find(x=>x.id===id);
  if(!t || !t.content) { toast('Tidak ada konten teks','warn'); return; }
  navigator.clipboard.writeText(t.content).then(()=>toast('📋 Tersalin!','ok')).catch(()=>toast('Gagal','err'));
}

function shareMktWA(id) {
  const t = mktAll.find(x=>x.id===id);
  if(!t) return;
  window.open('https://wa.me/?text='+encodeURIComponent(t.content||''),'_blank');
}

// ── Form Add / Edit ───────────────────────────────
async function openMktForm(id=null, defaultType=null) {
  let t = {};
  if (id) {
    const data = await sbGet('marketing_templates',`select=*&id=eq.${id}`);
    t = data[0] || {};
  }

  const currentType = t.type || defaultType || 'wa_message';
  const typeInfo = MKT_TYPES.find(x=>x.key===currentType) || MKT_TYPES[0];

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Template':'➕ Tambah Template'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-group">
      <label>Tipe Konten *</label>
      <select id="mf-type" onchange="updateMktFormFields()">
        ${MKT_TYPES.map(x=>`<option value="${x.key}"${currentType===x.key?' selected':''}>${x.label}</option>`).join('')}
      </select>
      <div id="mf-type-hint" style="font-size:12px;color:var(--gray);margin-top:4px">${typeInfo.hint}</div>
    </div>

    <div class="form-group">
      <label>Judul Template *</label>
      <input type="text" id="mf-title" value="${t.title||''}"
        placeholder="Nama template yang mudah diingat">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Channel Target</label>
        <select id="mf-channel">
          ${MKT_CHANNELS.slice(1).map(c=>`<option${t.channel===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tags (pisah koma)</label>
        <input type="text" id="mf-tags" value="${t.tags||''}" placeholder="komunitas, edukasi, dm">
      </div>
    </div>

    <!-- Subject (email only) -->
    <div class="form-group" id="mf-subject-group" style="display:${currentType==='email'?'flex':'none'};flex-direction:column;gap:5px">
      <label>Subject Email</label>
      <input type="text" id="mf-subject" value="${t.subject||''}" placeholder="Penawaran Kerjasama OneLab Diagnostics">
    </div>

    <!-- Content -->
    <div class="form-group" id="mf-content-group">
      <label id="mf-content-label">${typeInfo.contentLabel}</label>
      <textarea id="mf-content" rows="8"
        placeholder="${typeInfo.contentPlaceholder}">${t.content||''}</textarea>
      <div style="font-size:11px;color:var(--gray);margin-top:3px">
        Placeholder: <code>[NAMA]</code> <code>[TANGGAL]</code> <code>[PERUSAHAAN]</code> <code>[PRODUK]</code>
      </div>
    </div>

    <!-- File upload -->
    <div id="mf-file-group" style="display:${typeInfo.hasFile?'block':'none'}">
      <div class="form-group">
        <label id="mf-file-label">${typeInfo.fileLabel||'Upload File'}</label>
        ${renderUploadArea('mf-file', 'mf-file-preview',
          typeInfo.fileAccepts||['image/jpeg','image/png','application/pdf'])}
        ${t.file_url ? renderExistingFile(t.file_url, t.file_name, t.file_type) : ''}
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" id="mf-save-btn" onclick="saveMkt(${id||'null'})">
        ${id?'💾 Simpan':'➕ Tambah'}
      </button>
    </div>`);
}

function updateMktFormFields() {
  const type = document.getElementById('mf-type')?.value;
  const typeInfo = MKT_TYPES.find(x=>x.key===type)||MKT_TYPES[0];

  document.getElementById('mf-type-hint').textContent = typeInfo.hint;
  document.getElementById('mf-content-label').textContent = typeInfo.contentLabel;
  document.getElementById('mf-content').placeholder = typeInfo.contentPlaceholder;
  document.getElementById('mf-subject-group').style.display = type==='email'?'flex':'none';
  document.getElementById('mf-file-group').style.display = typeInfo.hasFile?'block':'none';

  if (typeInfo.hasFile) {
    const label = document.getElementById('mf-file-label');
    if (label) label.textContent = typeInfo.fileLabel||'Upload File';
  }
}

async function saveMkt(id) {
  const title   = document.getElementById('mf-title').value.trim();
  const type    = document.getElementById('mf-type').value;
  const content = document.getElementById('mf-content').value.trim();
  if (!title) { toast('Judul wajib diisi','err'); return; }

  const btn = document.getElementById('mf-save-btn');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Menyimpan...'; }

  const typeInfo = MKT_TYPES.find(x=>x.key===type)||{};
  let fileData = null;

  // Upload file jika ada
  if (typeInfo.hasFile) {
    try {
      const fileInput = document.getElementById('mf-file');
      if (fileInput?.files?.[0]) {
        fileData = await uploadFile(
          fileInput.files[0],
          typeInfo.fileBucket || BUCKETS.templates,
          typeInfo.fileFolder || 'misc'
        );
      }
    } catch(e) {
      toast('❌ Gagal upload file: '+e.message,'err');
      if (btn) { btn.disabled=false; btn.textContent=id?'💾 Simpan':'➕ Tambah'; }
      return;
    }
  }

  const payload = {
    title,
    type,
    channel:    document.getElementById('mf-channel').value,
    content:    content || null,
    tags:       document.getElementById('mf-tags').value.trim(),
    updated_at: new Date().toISOString(),
    created_by_name: getUserName ? getUserName() : 'User',
    ...(fileData ? {
      file_url:  fileData.url,
      file_name: fileData.name,
      file_type: fileData.type,
    } : {})
  };

  try {
    if (id) {
      await sbPatch('marketing_templates', id, payload);
      toast('✅ Template diupdate','ok');
    } else {
      await sbPost('marketing_templates', payload);
      toast('✅ Template ditambahkan','ok');
    }
    closeModalForce();
    await loadMktTemplates();
  } catch(e) {
    toast('❌ '+e.message,'err');
    if (btn) { btn.disabled=false; btn.textContent=id?'💾 Simpan':'➕ Tambah'; }
  }
}

async function deleteMkt(id, title) {
  if (!confirm(`Hapus template "${title}"?`)) return;
  try {
    await sbDelete('marketing_templates', id);
    toast('🗑 Template dihapus','info');
    await loadMktTemplates();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
