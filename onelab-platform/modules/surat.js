// ═══════════════════════════════════════════
// MODULE: Surat Keluar v2
// - Upload DOCX template
// - Replace variabel via docxtemplater
// - Download DOCX terisi
// - Arsip & log
// ═══════════════════════════════════════════

const LETTER_TYPES = [
  { key:'SP',  label:'Surat Penawaran' },
  { key:'SPK', label:'Surat Permohonan Kerjasama' },
  { key:'SPN', label:'Surat Pemberitahuan' },
  { key:'MOU', label:'MOU / Perjanjian' },
  { key:'SI',  label:'Surat Izin' },
  { key:'SK',  label:'Surat Keterangan' },
  { key:'SL',  label:'Surat Lainnya' },
];

const ORG = {
  name:  'OneLab Diagnostics by Plebo',
  addr:  'Bintaro Jaya, Jl. Elang Raya No.15, Pd. Pucung, Kec. Pd. Aren, Kota Tangerang Selatan',
  phone: '(021) xxxx-xxxx',
  email: 'info@onelab.id',
};

// Variabel yang bisa dipakai di template DOCX
const TEMPLATE_VARS = [
  { key:'NO_SURAT',       label:'Nomor Surat',         example:'001/SP/OL/VI/2026' },
  { key:'TANGGAL',        label:'Tanggal Surat',        example:'13 Juni 2026' },
  { key:'PERIHAL',        label:'Perihal / Judul',      example:'Penawaran Kerjasama' },
  { key:'NAMA_TUJUAN',    label:'Nama Perusahaan',      example:'PT. Contoh Maju' },
  { key:'ALAMAT_TUJUAN',  label:'Alamat Tujuan',        example:'Jl. Contoh No.1' },
  { key:'PIC_TUJUAN',     label:'Nama PIC / Jabatan',   example:'Bapak/Ibu HRD Manager' },
  { key:'ORG_NAMA',       label:'Nama Organisasi',      example:ORG.name },
  { key:'ORG_ALAMAT',     label:'Alamat Organisasi',    example:ORG.addr },
  { key:'PENANDATANGAN',  label:'Nama Penandatangan',   example:'dr. Ahmad, SpPK' },
  { key:'JABATAN',        label:'Jabatan Penandatangan',example:'Direktur' },
  { key:'BULAN_TAHUN',    label:'Bulan & Tahun',        example:'Juni 2026' },
  { key:'TAHUN',          label:'Tahun',                example:'2026' },
];

async function renderSurat() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Surat Keluar</h1>
        <p>Generate surat dari template DOCX — penomoran otomatis, arsip terpusat</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" onclick="openSuratForm()">+ Buat Surat</button>
      </div>
    </div>

    <div class="tabs" id="surat-tabs">
      <button class="tab-btn active" onclick="switchSuratTab('list',this)">📋 Arsip Surat</button>
      <button class="tab-btn" onclick="switchSuratTab('templates',this)">📄 Template Surat</button>
      <button class="tab-btn" onclick="switchSuratTab('panduan',this)">❓ Panduan</button>
    </div>

    <!-- List -->
    <div id="tab-list">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="sl-q" placeholder="🔍 Cari nomor, tujuan, perihal..."
            oninput="filterSurat()" style="flex:1">
          <select class="table-filter" id="sl-type" onchange="filterSurat()">
            <option value="">Semua Tipe</option>
            ${LETTER_TYPES.map(t=>`<option value="${t.key}">${t.label}</option>`).join('')}
          </select>
          <select class="table-filter" id="sl-status" onchange="filterSurat()">
            <option value="">Semua Status</option>
            <option>Draft</option><option>Sent</option><option>Archived</option>
          </select>
        </div>
        <div id="surat-tbody">
          <div class="loading-row"><div class="spinner"></div></div>
        </div>
      </div>
    </div>

    <!-- Templates -->
    <div id="tab-templates" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:14px;font-weight:700;color:var(--navy)">Template Surat Tersimpan</div>
        <button class="btn btn-teal btn-sm" onclick="openUploadTemplateForm()">
          ⬆ Upload Template DOCX
        </button>
      </div>
      <div id="templates-grid"
        style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Panduan -->
    <div id="tab-panduan" style="display:none">
      <div class="card" style="max-width:700px">
        <div class="card-title" style="margin-bottom:16px">📖 Cara Membuat Template Surat DOCX</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text)">
          <p style="margin-bottom:12px">
            Buat template surat di <strong>Microsoft Word</strong> atau <strong>Google Docs</strong>
            dengan desain bebas — logo, header, footer, tanda tangan, semua bisa diatur.
          </p>
          <p style="margin-bottom:8px;font-weight:700;color:var(--navy)">
            Gunakan placeholder berikut di dalam template:
          </p>
          <div style="background:var(--lgray);border-radius:8px;padding:14px;margin-bottom:14px">
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              <thead>
                <tr style="background:var(--navy);color:#fff">
                  <th style="padding:8px 10px;text-align:left;border-radius:4px 0 0 0">Placeholder</th>
                  <th style="padding:8px 10px;text-align:left">Keterangan</th>
                  <th style="padding:8px 10px;text-align:left;border-radius:0 4px 0 0">Contoh</th>
                </tr>
              </thead>
              <tbody>
                ${TEMPLATE_VARS.map((v,i)=>`
                  <tr style="background:${i%2===0?'#fff':'#F8FAFC'}">
                    <td style="padding:7px 10px;font-family:monospace;color:var(--teal);font-weight:700">
                      {{${v.key}}}
                    </td>
                    <td style="padding:7px 10px;color:var(--gray)">${v.label}</td>
                    <td style="padding:7px 10px;color:var(--text)">${v.example}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div style="background:#FFF8E1;border-radius:8px;padding:12px 14px;font-size:12px;color:#5D4037">
            <strong>Contoh penggunaan di Word:</strong><br>
            "Kepada Yth. <strong>{{PIC_TUJUAN}}</strong><br>
            <strong>{{NAMA_TUJUAN}}</strong><br>
            <strong>{{ALAMAT_TUJUAN}}</strong>"<br><br>
            Setelah generate, teks ini akan otomatis terisi dengan data yang Anda input.
          </div>
          <div style="margin-top:14px;padding:12px 14px;background:#E3F2FD;border-radius:8px;font-size:12px;color:#0D47A1">
            <strong>💡 Tips:</strong> Simpan template dalam format <strong>.docx</strong> (bukan .doc).
            Setelah upload, template bisa digunakan berkali-kali — tinggal ganti tujuan dan tanggal.
          </div>
        </div>
      </div>
    </div>`;

  await loadSuratList();
}

// ── Load List ─────────────────────────────────────
let suratAll = [];

async function loadSuratList() {
  try {
    const data = await sbGet('outgoing_letters','select=*&order=created_at.desc');
    suratAll = Array.isArray(data) ? data : [];
    renderSuratTable(suratAll);
  } catch(e) {
    document.getElementById('surat-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function filterSurat() {
  const q      = (document.getElementById('sl-q')?.value||'').toLowerCase();
  const type   = document.getElementById('sl-type')?.value||'';
  const status = document.getElementById('sl-status')?.value||'';
  const filtered = suratAll.filter(s=>
    (!q || (s.doc_number||'').toLowerCase().includes(q) ||
           (s.to_name||'').toLowerCase().includes(q) ||
           (s.title||'').toLowerCase().includes(q)) &&
    (!type   || s.letter_type === type) &&
    (!status || s.status === status)
  );
  renderSuratTable(filtered);
}

function renderSuratTable(data) {
  const el = document.getElementById('surat-tbody');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="ico">📄</div>
        <h3>${suratAll.length?'Tidak ada hasil':'Belum ada surat'}</h3>
        <p>Klik "+ Buat Surat" untuk membuat surat pertama.</p>
      </div>`; return;
  }
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>No. Dokumen</th><th>Perihal</th><th>Tujuan</th>
        <th>Tipe</th><th>Tanggal</th><th>Dibuat Oleh</th><th>Status</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${data.map(s=>{
          const stBadge = s.status==='Sent'?'badge-green':s.status==='Archived'?'badge-gray':'badge-gold';
          const tLabel  = LETTER_TYPES.find(t=>t.key===s.letter_type)?.label || s.letter_type || '—';
          return `<tr>
            <td style="font-family:monospace;font-size:12px;font-weight:700;color:var(--navy)">
              ${s.doc_number||'DRAFT'}
            </td>
            <td><div class="td-name">${s.title||'—'}</div></td>
            <td>
              <div style="font-size:13px">${s.to_name||'—'}</div>
              <div class="td-sub">${s.to_pic||''}</div>
            </td>
            <td><span class="badge badge-navy" style="font-size:10px">${tLabel}</span></td>
            <td style="font-size:12px;color:var(--gray)">${formatDateShort(s.letter_date)}</td>
            <td style="font-size:11px;color:var(--gray)">${s.created_by_name||'—'}</td>
            <td><span class="badge ${stBadge}">${s.status||'Draft'}</span></td>
            <td>
              <div class="act-row">
                <button class="act-btn" onclick="regenerateSurat(${s.id})" title="Download DOCX">📥</button>
                <button class="act-btn edit" onclick="openSuratForm(${s.id})" title="Edit">✏️</button>
                <button class="act-btn" onclick="updateSuratStatus(${s.id},'Sent')"
                  title="Tandai Terkirim" style="color:#22C55E">✓</button>
                <button class="act-btn del" onclick="deleteSurat(${s.id})">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function switchSuratTab(tab, btn) {
  document.querySelectorAll('#surat-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['list','templates','panduan'].forEach(t=>{
    const el = document.getElementById(`tab-${t}`);
    if(el) el.style.display = t===tab?'block':'none';
  });
  if(tab==='templates') loadLetterTemplates();
}

// ── Auto Nomor ────────────────────────────────────
async function generateDocNumber(typeCode) {
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth()+1;
  const moR = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][mo];
  try {
    const ex = await sbGet('letter_sequences',
      `select=*&year=eq.${yr}&month=eq.${mo}&type_code=eq.${typeCode}`);
    let seq = 1;
    if(ex && ex.length > 0){
      seq = (ex[0].last_seq||0) + 1;
      await sbPatch('letter_sequences', ex[0].id, { last_seq: seq });
    } else {
      await sbPost('letter_sequences', { year:yr, month:mo, type_code:typeCode, last_seq:1 });
    }
    return `${String(seq).padStart(3,'0')}/${typeCode}/OL/${moR}/${yr}`;
  } catch(e) {
    return `${Date.now().toString().slice(-4)}/${typeCode}/OL/${moR}/${yr}`;
  }
}

// ── Form Buat / Edit ──────────────────────────────
async function openSuratForm(id=null) {
  let s = {};
  if(id){
    const d = await sbGet('outgoing_letters',`select=*&id=eq.${id}`);
    s = d[0]||{};
  }

  // Load templates
  let tmplOpts = '<option value="">-- Pilih Template DOCX --</option>';
  try {
    const tmpls = await sbGet('marketing_templates',
      'select=id,title,file_url,file_name,content&type=eq.surat&order=title');
    tmplOpts += (tmpls||[]).map(t=>
      `<option value="${t.id}"
        data-url="${t.file_url||''}"
        data-name="${t.file_name||''}"
        data-content="${encodeURIComponent(t.content||'')}">
        ${t.title}
       </option>`).join('');
  } catch(e){}

  // Load partners
  let partnerOpts = '<option value="">-- Pilih dari database partner --</option>';
  try {
    const pts = await sbGet('partners',
      'select=id,partner_name,address,pic_name&order=partner_name&limit=200');
    partnerOpts += (pts||[]).map(p=>
      `<option value="${p.id}"
        data-name="${p.partner_name||''}"
        data-addr="${p.address||''}"
        data-pic="${p.pic_name||''}">
        ${p.partner_name}
       </option>`).join('');
  } catch(e){}

  const today = new Date().toISOString().split('T')[0];
  const user  = getUserName ? getUserName() : 'User';

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Surat':'📄 Buat Surat Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Tipe Surat *</label>
        <select id="sf-type">
          ${LETTER_TYPES.map(t=>`<option value="${t.key}"${s.letter_type===t.key?' selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal Surat</label>
        <input type="date" id="sf-date" value="${s.letter_date||today}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>No. Surat</label>
        <input type="text" id="sf-docnumber" value="${s.doc_number||'Otomatis saat disimpan'}" disabled
          style="background:var(--bg2);color:var(--text3);font-style:${s.doc_number?'normal':'italic'}">
      </div>
      <div class="form-group">
        <label>Lampiran</label>
        <input type="text" id="sf-lampiran" value="${s.lampiran||''}" placeholder="1 (satu) berkas / -">
      </div>
    </div>

    <div class="form-group">
      <label>Perihal / Judul *</label>
      <input type="text" id="sf-title" value="${s.title||''}"
        placeholder="Penawaran Kerjasama Layanan Kesehatan Korporat">
    </div>

    <div class="form-group">
      <label>Pilih dari Partner Database</label>
      <select id="sf-partner" onchange="fillSuratPartner(this)">
        ${partnerOpts}
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Nama Perusahaan / Instansi *</label>
        <input type="text" id="sf-to-name" value="${s.to_name||''}"
          placeholder="PT. Contoh Perusahaan">
      </div>
      <div class="form-group">
        <label>Kepada Yth. (PIC)</label>
        <input type="text" id="sf-to-pic" value="${s.to_pic||''}"
          placeholder="Bapak/Ibu HRD Manager">
      </div>
    </div>

    <div class="form-group">
      <label>Alamat Tujuan</label>
      <input type="text" id="sf-to-addr" value="${s.to_address||''}" placeholder="Jl. ...">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Penandatangan (Atas Nama)</label>
        <input type="text" id="sf-signer" value="${s.signer||user}"
          placeholder="Nama yang tanda tangan surat">
      </div>
      <div class="form-group">
        <label>Jabatan Penandatangan</label>
        <input type="text" id="sf-signer-jabatan" value="${s.signer_jabatan||'Head of Operations'}"
          placeholder="Head of Operations">
      </div>
    </div>

    <!-- Template DOCX -->
    <div style="border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:10px">
        📄 Template DOCX
      </div>
      <div class="form-group" style="margin-bottom:10px">
        <label>Pilih Template yang Sudah Diupload</label>
        <select id="sf-template" onchange="onSelectSuratTemplate(this)">
          ${tmplOpts}
        </select>
      </div>
      <div id="sf-template-info" style="display:none;padding:10px;background:var(--mint);border-radius:8px;font-size:12px;color:#085041;margin-bottom:10px"></div>

      <div style="font-size:12px;color:var(--gray);margin-bottom:8px">— atau upload template baru —</div>
      ${renderUploadArea('sf-file','sf-file-preview',
        ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/msword'])}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-outline" onclick="previewSuratHTML()" title="Preview generik — bukan render dari file DOCX yang diupload">👁 Preview HTML (Generik)</button>
      <button class="btn btn-teal" id="sf-save-btn" onclick="saveSurat(${id||'null'})">
        ${id?'💾 Simpan':'📄 Buat & Download'}
      </button>
    </div>`);
}

function fillSuratPartner(sel) {
  const opt = sel.options[sel.selectedIndex];
  if(!opt.value) return;
  document.getElementById('sf-to-name').value = opt.dataset.name||'';
  document.getElementById('sf-to-addr').value = opt.dataset.addr||'';
  document.getElementById('sf-to-pic').value  = opt.dataset.pic
    ? `Bapak/Ibu ${opt.dataset.pic}` : '';
}

function onSelectSuratTemplate(sel) {
  const opt  = sel.options[sel.selectedIndex];
  const info = document.getElementById('sf-template-info');
  if(!opt.value){ info.style.display='none'; return; }
  info.style.display = 'block';
  info.innerHTML = `✅ Template dipilih: <strong>${opt.textContent.trim()}</strong><br>
    File: <strong>${opt.dataset.name||'—'}</strong>`;
}

// ── Save Surat ────────────────────────────────────
async function saveSurat(id) {
  const title  = document.getElementById('sf-title').value.trim();
  const toName = document.getElementById('sf-to-name').value.trim();
  if(!title)  { toast('Perihal wajib diisi','err'); return; }
  if(!toName) { toast('Nama tujuan wajib diisi','err'); return; }

  const btn  = document.getElementById('sf-save-btn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Menyimpan...'; }

  const user      = getUserName ? getUserName() : 'User';
  const typeCode  = document.getElementById('sf-type').value;
  const docNumber = id
    ? (await sbGet('outgoing_letters',`select=doc_number&id=eq.${id}`))[0]?.doc_number
    : await generateDocNumber(typeCode);

  // Upload template baru jika ada
  let fileUrl  = '';
  let fileName = '';
  const tmplSel = document.getElementById('sf-template');
  const tmplOpt = tmplSel?.options[tmplSel.selectedIndex];

  if(tmplOpt?.value) {
    fileUrl  = tmplOpt.dataset.url  || '';
    fileName = tmplOpt.dataset.name || '';
  }

  const newFile = document.getElementById('sf-file')?.files?.[0];
  if(newFile) {
    try {
      const up = await uploadFile(newFile, 'templates', 'surat');
      fileUrl  = up.url;
      fileName = up.name;
    } catch(e) {
      toast('❌ Gagal upload template: '+e.message,'err');
      if(btn){ btn.disabled=false; btn.textContent=id?'💾 Simpan':'📄 Buat & Download'; }
      return;
    }
  }

  // Warn explicitly if no template selected — avoids silent fallback to generic HTML
  if (!fileUrl && !id) {
    const proceed = confirm(
      'Belum ada template DOCX yang dipilih atau diupload.\n\n' +
      'Surat akan dibuat dengan PREVIEW HTML generik (bukan dari file template Anda).\n\n' +
      'Lanjutkan tanpa template DOCX?'
    );
    if (!proceed) {
      if(btn){ btn.disabled=false; btn.textContent='📄 Buat & Download'; }
      return;
    }
  }

  const payload = {
    doc_number:      docNumber,
    title,
    letter_type:     typeCode,
    letter_date:     document.getElementById('sf-date').value,
    lampiran:        document.getElementById('sf-lampiran').value.trim(),
    to_name:         toName,
    to_pic:          document.getElementById('sf-to-pic').value.trim(),
    to_address:      document.getElementById('sf-to-addr').value.trim(),
    signer:          document.getElementById('sf-signer').value.trim()||user,
    signer_jabatan:  document.getElementById('sf-signer-jabatan').value.trim()||'Head of Operations',
    file_url:        fileUrl,
    file_name:       fileName,
    status:          'Draft',
    created_by_name: user,
    updated_at:      new Date().toISOString(),
  };

  try {
    let savedId = id;
    if(id) {
      await sbPatch('outgoing_letters', id, payload);
      toast('✅ Surat diupdate','ok');
    } else {
      const res = await sbPost('outgoing_letters', payload);
      savedId = res[0]?.id;
      toast('✅ Surat dibuat: '+docNumber,'ok');
      await logActivity('create','outgoing_letters', savedId,
        `Surat baru: ${docNumber} — ${title}`, title);
    }
    closeModalForce();
    await loadSuratList();

    // Generate DOCX
    if(fileUrl) {
      setTimeout(() => generateDocx(savedId, payload, fileUrl), 400);
    } else {
      // Fallback HTML print
      setTimeout(() => previewSuratHTMLDirect(payload), 400);
    }
  } catch(e) {
    toast('❌ '+e.message,'err');
    if(btn){ btn.disabled=false; btn.textContent=id?'💾 Simpan':'📄 Buat & Download'; }
  }
}

// ── Generate DOCX dari template ───────────────────
async function generateDocx(id, data, templateUrl) {
  try {
    toast('⏳ Memuat library DOCX...','info',4000);
    // Load library docxtemplater + pizzip
    await loadDocxLibraries();

    if (!window.PizZip || !window.docxtemplater) {
      throw new Error('Library DOCX gagal dimuat (kemungkinan CDN diblokir/offline).');
    }

    toast('⏳ Memproses template DOCX...','info',5000);

    // Fetch template file
    const res = await fetch(templateUrl);
    if (!res.ok) {
      throw new Error(`File template tidak bisa diakses (HTTP ${res.status}). Cek apakah bucket "templates" sudah di-set Public di Supabase Storage.`);
    }
    const blob = await res.arrayBuffer();

    const PizZip = window.PizZip;
    const Docxtemplater = window.docxtemplater;

    const zip = new PizZip(blob);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    // Build variables
    const dateStr = data.letter_date
      ? new Date(data.letter_date).toLocaleDateString('id-ID',
          {day:'numeric',month:'long',year:'numeric'})
      : new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});

    const now  = new Date();
    const moR  = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'][now.getMonth()];

    doc.render({
      NO_SURAT:      data.doc_number   || '',
      TANGGAL:       dateStr,
      LAMPIRAN:      data.lampiran     || '-',
      PERIHAL:       data.title        || '',
      NAMA_TUJUAN:   data.to_name      || '',
      ALAMAT_TUJUAN: data.to_address   || '',
      PIC_TUJUAN:    data.to_pic       || 'Bapak/Ibu Pimpinan',
      ORG_NAMA:      ORG.name,
      ORG_ALAMAT:    ORG.addr,
      PENANDATANGAN: data.signer || data.created_by_name || 'Pimpinan',
      JABATAN:       data.signer_jabatan || data.jabatan || 'Head of Operations',
      BULAN_TAHUN:   `${moR} ${now.getFullYear()}`,
      TAHUN:         String(now.getFullYear()),
    });

    const output = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Download
    const fname = `${data.doc_number||'Surat'}_${data.to_name||''}.docx`
      .replace(/[\/\\:*?"<>|]/g,'_');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(output);
    a.download = fname;
    a.click();
    toast('✅ DOCX berhasil didownload!','ok');

  } catch(e) {
    console.error('[generateDocx] Failed:', e);
    let hint = e.message;
    if (e.message?.includes('Multi error') || e.properties?.errors) {
      // Docxtemplater template syntax error — usually wrong {{VARIABEL}} naming
      hint = 'Template DOCX punya placeholder tidak valid. Pastikan pakai format {{NO_SURAT}}, {{TANGGAL}}, {{PERIHAL}}, dst (lihat panduan placeholder di form template).';
    }
    toast('❌ Gagal generate DOCX: '+hint,'err',8000);
    if (confirm('Gagal generate dari template DOCX.\n\nError: ' + hint + '\n\nTampilkan preview HTML sebagai gantinya?')) {
      previewSuratHTMLDirect(data);
    }
  }
}

async function regenerateSurat(id) {
  toast('⏳ Memproses dokumen...','info',2000);
  try {
    const d = await sbGet('outgoing_letters',`select=*&id=eq.${id}`);
    const s = d[0];
    if (!s) { toast('❌ Surat tidak ditemukan (mungkin sudah dihapus)','err'); return; }
    if (s.file_url) {
      await generateDocx(id, s, s.file_url);
    } else {
      toast('⚠️ Surat ini tidak punya file template DOCX terlampir — menampilkan preview HTML generik.','warn',5000);
      previewSuratHTMLDirect(s);
    }
  } catch(e) {
    console.error('[regenerateSurat] Failed:', e);
    toast('❌ Gagal memuat surat: '+e.message,'err',6000);
  }
}

// ── Load docxtemplater libraries ──────────────────
function loadDocxLibraries() {
  return new Promise((resolve, reject) => {
    if(window.PizZip && window.docxtemplater){ resolve(); return; }

    // Safety net: if CDN scripts never fire onload/onerror (e.g. silently
    // blocked by network policy), don't hang forever — fail visibly instead.
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout memuat library DOCX (CDN tidak merespons dalam 10 detik). Cek koneksi internet atau apakah cdnjs.cloudflare.com diblokir oleh firewall/network settings.'));
    }, 10000);

    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pizzip/3.1.4/pizzip.min.js';
    s1.onerror = () => { clearTimeout(timeoutId); reject(new Error('Gagal memuat PizZip dari CDN (cdnjs.cloudflare.com). Cek koneksi internet atau apakah domain ini diblokir.')); };
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.37.12/docxtemplater.js';
      s2.onerror = () => { clearTimeout(timeoutId); reject(new Error('Gagal memuat Docxtemplater dari CDN (cdnjs.cloudflare.com). Cek koneksi internet atau apakah domain ini diblokir.')); };
      s2.onload = () => { clearTimeout(timeoutId); resolve(); };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  });
}

// ── Fallback: Preview HTML ────────────────────────
function previewSuratHTML() {
  const data = {
    doc_number:  'PREVIEW',
    title:       document.getElementById('sf-title')?.value||'',
    letter_type: document.getElementById('sf-type')?.value||'',
    letter_date: document.getElementById('sf-date')?.value||'',
    to_name:     document.getElementById('sf-to-name')?.value||'',
    to_pic:      document.getElementById('sf-to-pic')?.value||'',
    to_address:  document.getElementById('sf-to-addr')?.value||'',
    created_by_name: getUserName?getUserName():'User',
  };
  previewSuratHTMLDirect(data);
}

function previewSuratHTMLDirect(s) {
  const tLabel  = LETTER_TYPES.find(t=>t.key===s.letter_type)?.label||s.letter_type||'';
  const dateStr = s.letter_date
    ? new Date(s.letter_date).toLocaleDateString('id-ID',
        {day:'numeric',month:'long',year:'numeric'}) : '';
  const moR     = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember']
                   [new Date().getMonth()];

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${s.doc_number}</title>
    <style>
      @page{size:A4;margin:2.5cm 2.5cm 2.5cm 3cm}
      *{box-sizing:border-box}
      body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;line-height:1.6;margin:0;padding:20px}
      .header{border-bottom:3px double #0A2342;padding-bottom:10px;margin-bottom:20px;display:flex;gap:14px;align-items:center}
      .logo{width:52px;height:52px;background:#0A2342;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;font-family:Arial;flex-shrink:0}
      .org-name{font-size:14pt;font-weight:bold;color:#0A2342}
      .org-sub{font-size:9pt;color:#555;margin-top:2px}
      .info{margin-bottom:20px}
      .info table td{padding:2px 0;vertical-align:top}
      .info td:first-child{width:150px;color:#333}
      .salut{margin:20px 0 8px}
      .sig{margin-top:50px}
      .sig-line{border-top:1px solid #000;display:inline-block;min-width:180px;padding-top:4px;margin-top:60px}
      @media print{.no-print{display:none}}
    </style></head><body>
    <button class="no-print" onclick="window.print()"
      style="position:fixed;top:16px;right:16px;padding:10px 20px;background:#0A2342;
      color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;z-index:999">
      🖨 Print / Save PDF
    </button>
    <div class="header">
      <div class="logo">OL</div>
      <div>
        <div class="org-name">${ORG.name}</div>
        <div class="org-sub">${ORG.addr}</div>
        <div class="org-sub">Tel: ${ORG.phone} | ${ORG.email}</div>
      </div>
    </div>
    <div class="info"><table>
      <tr><td>Nomor</td><td>: ${s.doc_number||'—'}</td></tr>
      <tr><td>Lampiran</td><td>: ${s.lampiran||'-'}</td></tr>
      <tr><td>Perihal</td><td>: ${s.title||'—'}</td></tr>
      <tr><td>Tanggal</td><td>: ${dateStr}</td></tr>
      <tr><td>Jenis</td><td>: ${tLabel}</td></tr>
    </table></div>
    <p>Kepada Yth.<br>
    <strong>${s.to_pic||'Bapak/Ibu Pimpinan'}</strong><br>
    <strong>${s.to_name||'—'}</strong><br>
    ${s.to_address||''}<br>di Tempat</p>
    <div class="salut"><p>Dengan hormat,</p></div>
    <p>Sehubungan dengan hal tersebut di atas, kami dari <strong>${ORG.name}</strong>
    dengan ini mengajukan penawaran kerjasama layanan kesehatan preventif.</p>
    <p>Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
    <div class="sig">
      <p>Tangerang Selatan, ${dateStr}</p>
      <p>Hormat kami,<br><strong>${ORG.name}</strong></p>
      <div class="sig-line">${s.signer||s.created_by_name||'Pimpinan'}<br>
      <span style="font-size:10pt;font-weight:normal">${s.signer_jabatan||'Head of Operations'}</span></div>
    </div>
    </body></html>`);
  w.document.close();
}

// ── Templates ─────────────────────────────────────
async function loadLetterTemplates() {
  const el = document.getElementById('templates-grid');
  if(!el) return;
  try {
    const data = await sbGet('marketing_templates',
      'select=*&type=eq.surat&order=created_at.desc');
    if(!data?.length){
      el.innerHTML=`
        <div class="empty-state" style="grid-column:1/-1">
          <div class="ico">📄</div>
          <h3>Belum ada template surat</h3>
          <p>Klik "⬆ Upload Template DOCX" untuk mulai.<br>
          Lihat tab <strong>Panduan</strong> untuk cara membuat template.</p>
        </div>`; return;
    }
    el.innerHTML = data.map(t=>`
      <div class="card">
        <div style="font-size:16px;margin-bottom:8px">📝</div>
        <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:4px">${t.title}</div>
        <div style="font-size:11px;color:var(--gray);margin-bottom:10px">
          ${t.file_name||'—'} · ${timeAgo(t.created_at)}
        </div>
        ${t.file_url?`
          <a href="${t.file_url}" target="_blank" download
            class="btn btn-teal btn-sm" style="text-decoration:none;display:block;text-align:center;margin-bottom:6px">
            ⬇️ Download Template
          </a>`:'' }
        <div class="btn-row">
          <button class="btn btn-ghost btn-sm" onclick="openMktForm(${t.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMkt(${t.id},'${(t.title||'').replace(/'/g,"\\'")}')">🗑</button>
        </div>
      </div>`).join('');
  } catch(e){ el.innerHTML=`<div class="status-box status-err">❌ ${e.message}</div>`; }
}

function openUploadTemplateForm() {
  // Pakai form marketing dengan tipe surat
  openMktForm(null, 'surat');
}

async function updateSuratStatus(id, status) {
  try {
    await sbPatch('outgoing_letters', id, {status, updated_at:new Date().toISOString()});
    toast(`✅ Status → ${status}`,'ok');
    await loadSuratList();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

async function deleteSurat(id) {
  if(!confirm('Hapus surat dari arsip?')) return;
  try {
    await sbDelete('outgoing_letters', id);
    toast('🗑 Surat dihapus','info');
    await loadSuratList();
  } catch(e){ toast('❌ '+e.message,'err'); }
}
