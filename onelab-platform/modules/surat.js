// ═══════════════════════════════════════════════════
// Module: Surat Keluar — Auto Nomor, PDF, Arsip
// ═══════════════════════════════════════════════════

const LETTER_TYPES = [
  { key:'SP',   label:'Surat Penawaran' },
  { key:'SPK',  label:'Surat Permohonan Kerjasama' },
  { key:'SPN',  label:'Surat Pemberitahuan' },
  { key:'MOU',  label:'MOU / Perjanjian' },
  { key:'SI',   label:'Surat Izin' },
  { key:'SK',   label:'Surat Keterangan' },
  { key:'SL',   label:'Surat Lainnya' },
];

const ORG_NAME  = 'OneLab Diagnostics by Plebo';
const ORG_ADDR  = 'Bintaro Jaya, Jl. Elang Raya No.15, Pd. Pucung, Kec. Pd. Aren, Kota Tangerang Selatan, Banten 15224';
const ORG_PHONE = '(021) xxxx-xxxx';
const ORG_EMAIL = 'info@onelab.id';

async function renderSurat(){
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Surat Keluar</h1><p>Buat surat dengan penomoran otomatis, generate PDF, dan arsip terpusat</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" onclick="openSuratForm()">+ Buat Surat</button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchSuratTab('list',this)">📋 Daftar Surat</button>
      <button class="tab-btn" onclick="switchSuratTab('templates',this)">📄 Template Surat</button>
    </div>

    <div id="surat-list-tab">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="sl-search" placeholder="🔍 Cari nomor, tujuan, judul..."
            oninput="filterSurat(this.value)">
          <select class="table-filter" id="sl-type" onchange="filterSurat()">
            <option value="">Semua Tipe</option>
            ${LETTER_TYPES.map(t=>`<option value="${t.key}">${t.label}</option>`).join('')}
          </select>
          <select class="table-filter" id="sl-status" onchange="filterSurat()">
            <option value="">Semua Status</option>
            <option>Draft</option><option>Sent</option><option>Archived</option>
          </select>
        </div>
        <div id="surat-table"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>

    <div id="surat-templates-tab" style="display:none">
      <div class="page-header" style="margin-bottom:14px">
        <div style="font-size:14px;font-weight:700;color:var(--navy)">Template Surat Tersimpan</div>
        <button class="btn btn-outline btn-sm" onclick="openLetterTemplateForm()">+ Upload Template</button>
      </div>
      <div id="letter-templates-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>`;

  await loadSuratList();
}

let suratAll = [];

async function loadSuratList(){
  try {
    const data = await sbGet('outgoing_letters','select=*&order=created_at.desc');
    suratAll = Array.isArray(data) ? data : [];
    renderSuratTable(suratAll);
  } catch(e){
    document.getElementById('surat-table').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function filterSurat(q){
  const search = (document.getElementById('sl-search')?.value||'').toLowerCase();
  const type   = document.getElementById('sl-type')?.value||'';
  const status = document.getElementById('sl-status')?.value||'';
  const filtered = suratAll.filter(s=>
    (!search || (s.doc_number||'').toLowerCase().includes(search) ||
                (s.to_name||'').toLowerCase().includes(search) ||
                (s.title||'').toLowerCase().includes(search)) &&
    (!type   || s.letter_type === type) &&
    (!status || s.status === status)
  );
  renderSuratTable(filtered);
}

function renderSuratTable(data){
  if(!data.length){
    document.getElementById('surat-table').innerHTML = `
      <div class="empty-state">
        <div class="ico">📄</div>
        <h3>${suratAll.length?'Tidak ada hasil':'Belum ada surat'}</h3>
        <p>Klik "+ Buat Surat" untuk membuat surat pertama.</p>
      </div>`;
    return;
  }
  document.getElementById('surat-table').innerHTML = `
    <table>
      <thead><tr>
        <th>No. Dokumen</th><th>Judul</th><th>Tujuan</th>
        <th>Tipe</th><th>Tanggal</th><th>Dibuat Oleh</th><th>Status</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${data.map(s=>{
          const stBadge = s.status==='Sent'?'badge-green':s.status==='Archived'?'badge-gray':'badge-gold';
          return `<tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600;color:var(--navy)">${s.doc_number||'—'}</td>
            <td><div class="td-name">${s.title||'—'}</div></td>
            <td><div style="font-size:13px">${s.to_name||'—'}</div><div class="td-sub">${s.to_pic||''}</div></td>
            <td><span class="badge badge-navy" style="font-size:10px">${s.letter_type||'—'}</span></td>
            <td style="font-size:12px;color:var(--gray)">${s.letter_date ? new Date(s.letter_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '—'}</td>
            <td style="font-size:12px;color:var(--gray)">${s.created_by_name||'—'}</td>
            <td><span class="badge ${stBadge}">${s.status||'Draft'}</span></td>
            <td>
              <div class="act-row">
                <button class="act-btn" onclick="previewSurat(${s.id})" title="Preview & PDF">📄</button>
                <button class="act-btn edit" onclick="openSuratForm(${s.id})" title="Edit">✏️</button>
                <button class="act-btn" onclick="updateSuratStatus(${s.id},'Sent')" title="Tandai Terkirim" style="color:#22C55E">✓</button>
                <button class="act-btn del" onclick="deleteSurat(${s.id})">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function switchSuratTab(tab, btn){
  document.querySelectorAll('.tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('surat-list-tab').style.display      = tab==='list'      ?'block':'none';
  document.getElementById('surat-templates-tab').style.display = tab==='templates' ?'block':'none';
  if(tab==='templates') loadLetterTemplates();
}

// ── Auto Nomor ────────────────────────────────────
async function generateDocNumber(typeCode){
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth()+1;
  const moRoman = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][mo];

  try {
    // Get or create sequence
    const existing = await sbGet('letter_sequences',
      `select=*&year=eq.${yr}&month=eq.${mo}&type_code=eq.${typeCode}`);

    let seq = 1;
    if(existing && existing.length > 0){
      seq = (existing[0].last_seq||0) + 1;
      await sbPatch('letter_sequences', existing[0].id, { last_seq: seq });
    } else {
      await sbPost('letter_sequences', { year:yr, month:mo, type_code:typeCode, last_seq:1 });
    }

    return `${String(seq).padStart(3,'0')}/${typeCode}/OL/${moRoman}/${yr}`;
  } catch(e){
    // Fallback if table doesn't exist
    const ts = Date.now().toString().slice(-4);
    return `${ts}/${typeCode}/OL/${moRoman}/${yr}`;
  }
}

// ── Form Buat / Edit Surat ────────────────────────
async function openSuratForm(id=null){
  let s = {};
  if(id){
    const data = await sbGet('outgoing_letters',`select=*&id=eq.${id}`);
    s = data[0]||{};
  }

  // Load partner list for autocomplete
  let partnerOpts = '<option value="">-- Pilih Partner (opsional) --</option>';
  try {
    const pts = await sbGet('partners','select=id,partner_name,address,pic_name&order=partner_name');
    partnerOpts += (pts||[]).map(p=>`<option value="${p.id}" data-name="${p.partner_name||''}" data-addr="${p.address||''}" data-pic="${p.pic_name||''}">${p.partner_name}</option>`).join('');
  } catch(e){}

  // Load letter templates
  let templateOpts = '<option value="">-- Pilih Template (opsional) --</option>';
  try {
    const tmpl = await sbGet('marketing_templates','select=id,title,content&type=eq.surat');
    templateOpts += (tmpl||[]).map(t=>`<option value="${t.id}" data-content="${encodeURIComponent(t.content||'')}">${t.title}</option>`).join('');
  } catch(e){}

  const today = new Date().toISOString().split('T')[0];
  const defaultContent = s.content || getDefaultLetterContent();

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Surat':'📄 Buat Surat Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipe Surat *</label>
        <select id="sf-type" onchange="updateDocPreview()">
          ${LETTER_TYPES.map(t=>`<option value="${t.key}"${s.letter_type===t.key?' selected':''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal Surat</label>
        <input type="date" id="sf-date" value="${s.letter_date||today}">
      </div>
    </div>
    <div class="form-group">
      <label>No. Dokumen (otomatis)</label>
      <div style="display:flex;gap:8px">
        <input type="text" id="sf-docnum" value="${s.doc_number||''}"
          placeholder="Auto-generate saat simpan" style="flex:1;background:var(--lgray)" readonly>
        <button class="btn btn-ghost btn-sm" onclick="previewDocNum()">Preview No.</button>
      </div>
    </div>
    <div class="form-group">
      <label>Judul / Perihal *</label>
      <input type="text" id="sf-title" value="${s.title||''}"
        placeholder="Penawaran Kerjasama Layanan Kesehatan Korporat">
    </div>
    <div class="form-group">
      <label>Tujuan (dari partner atau manual)</label>
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
      <input type="text" id="sf-to-addr" value="${s.to_address||''}"
        placeholder="Jl. ...">
    </div>
    <div class="form-group">
      <label>Gunakan Template</label>
      <select id="sf-template" onchange="applyLetterTemplate(this)">
        ${templateOpts}
      </select>
    </div>
    <div class="form-group">
      <label>Isi Surat *</label>
      <textarea id="sf-content" rows="12" style="font-family:serif">${defaultContent}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-outline" onclick="previewSuratDraft()">👁 Preview PDF</button>
      <button class="btn btn-teal" onclick="saveSurat(${id||'null'})">
        ${id?'💾 Simpan':'📄 Buat & Simpan'}
      </button>
    </div>`,
  );
}

function fillSuratPartner(sel){
  const opt = sel.options[sel.selectedIndex];
  if(!opt.value) return;
  document.getElementById('sf-to-name').value  = opt.dataset.name||'';
  document.getElementById('sf-to-addr').value  = opt.dataset.addr||'';
  document.getElementById('sf-to-pic').value   = opt.dataset.pic  ? `Bapak/Ibu ${opt.dataset.pic}` : '';
}

function applyLetterTemplate(sel){
  const opt = sel.options[sel.selectedIndex];
  if(!opt.value) return;
  const content = decodeURIComponent(opt.dataset.content||'');
  if(content) document.getElementById('sf-content').value = content;
}

async function previewDocNum(){
  const type = document.getElementById('sf-type').value;
  const num  = await generateDocNumber(type);
  document.getElementById('sf-docnum').value = num;
}

function getDefaultLetterContent(){
  return `Dengan hormat,

Sehubungan dengan hal tersebut di atas, kami dari OneLab Diagnostics by Plebo dengan ini mengajukan penawaran kerjasama layanan kesehatan preventif untuk karyawan perusahaan Bapak/Ibu.

OneLab Diagnostics merupakan laboratorium klinik preventif yang berfokus pada deteksi dini penyakit metabolik dan kanker, dengan pengalaman melayani lebih dari 20.000 karyawan dari berbagai perusahaan besar di Indonesia.

Layanan yang kami tawarkan meliputi:
1. Medical Check-Up (MCU) Karyawan
2. Skrining Metabolik (Diabetes, Kolesterol, Hipertensi)
3. Deteksi Dini Kanker (FOB, Pap Smear, HPV, Gene Solution)
4. Program Gut Health
5. Employee Health Day
6. Digital Health Platform (Plebo App)

Kami berharap dapat melakukan presentasi dan diskusi lebih lanjut mengenai penawaran ini. Atas perhatian dan kesempatan yang diberikan, kami ucapkan terima kasih.

Hormat kami,
OneLab Diagnostics by Plebo`;
}

async function saveSurat(id){
  const title   = document.getElementById('sf-title').value.trim();
  const toName  = document.getElementById('sf-to-name').value.trim();
  const content = document.getElementById('sf-content').value.trim();
  if(!title||!toName){ toast('Judul dan nama tujuan wajib diisi','err'); return; }

  const typeCode = document.getElementById('sf-type').value;
  let docNum = document.getElementById('sf-docnum').value.trim();
  if(!docNum || !id) docNum = await generateDocNumber(typeCode);

  const payload = {
    doc_number:    docNum,
    title,
    letter_type:   typeCode,
    letter_date:   document.getElementById('sf-date').value,
    to_name:       toName,
    to_pic:        document.getElementById('sf-to-pic').value.trim(),
    to_address:    document.getElementById('sf-to-addr').value.trim(),
    content,
    status:        'Draft',
    created_by_name: getUserName ? getUserName() : 'User',
    updated_at:    new Date().toISOString(),
  };

  try {
    let savedId = id;
    if(id){ await sbPatch('outgoing_letters',id,payload); toast('✅ Surat diupdate','ok'); }
    else {
      const res = await sbPost('outgoing_letters',payload);
      savedId = res[0]?.id;
      toast('✅ Surat dibuat: '+docNum,'ok');
    }
    closeModalForce();
    await loadSuratList();
    // Auto preview PDF
    if(savedId) setTimeout(()=>previewSurat(savedId), 300);
  } catch(e){ toast('❌ '+e.message,'err'); }
}

// ── Preview & PDF ────────────────────────────────
async function previewSurat(id){
  const data = await sbGet('outgoing_letters',`select=*&id=eq.${id}`);
  const s = data[0]; if(!s) return;
  printLetterPDF(s);
}

function previewSuratDraft(){
  const s = {
    doc_number:   document.getElementById('sf-docnum')?.value||'DRAFT',
    title:        document.getElementById('sf-title')?.value||'',
    letter_type:  document.getElementById('sf-type')?.value||'',
    letter_date:  document.getElementById('sf-date')?.value||new Date().toISOString().split('T')[0],
    to_name:      document.getElementById('sf-to-name')?.value||'',
    to_pic:       document.getElementById('sf-to-pic')?.value||'',
    to_address:   document.getElementById('sf-to-addr')?.value||'',
    content:      document.getElementById('sf-content')?.value||'',
    created_by_name: getUserName ? getUserName() : 'User',
  };
  printLetterPDF(s);
}

function printLetterPDF(s){
  const tLabel = LETTER_TYPES.find(t=>t.key===s.letter_type)?.label || s.letter_type;
  const dateStr = s.letter_date ? new Date(s.letter_date).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '';
  const content = (s.content||'').split('\n').map(l=>`<p style="margin:0 0 8px">${l||'&nbsp;'}</p>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${s.doc_number} — ${s.title}</title>
    <style>
      @page{size:A4;margin:2.5cm 2.5cm 2.5cm 3cm}
      body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;line-height:1.5}
      .header{border-bottom:3px solid #0A2342;padding-bottom:12px;margin-bottom:20px;display:flex;align-items:center;gap:16px}
      .org-logo{width:48px;height:48px;background:#0A2342;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;font-family:sans-serif}
      .org-name{font-size:14pt;font-weight:bold;color:#0A2342}
      .org-addr{font-size:9pt;color:#555;margin-top:2px}
      .doc-info{margin-bottom:20px}
      .doc-info table{border-collapse:collapse}
      .doc-info td{padding:2px 0;vertical-align:top}
      .doc-info td:first-child{width:140px;color:#444}
      .salutation{margin:20px 0 8px}
      .signature{margin-top:48px}
      .sig-name{font-weight:bold;border-top:1px solid #000;display:inline-block;min-width:180px;padding-top:4px;margin-top:60px}
      @media print{button{display:none}}
    </style></head><body>
    <button onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:10px 20px;background:#0A2342;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;z-index:999">🖨 Print / Save PDF</button>
    <div class="header">
      <div class="org-logo">OL</div>
      <div>
        <div class="org-name">${ORG_NAME}</div>
        <div class="org-addr">${ORG_ADDR}</div>
        <div class="org-addr">Tel: ${ORG_PHONE} | Email: ${ORG_EMAIL}</div>
      </div>
    </div>
    <div class="doc-info">
      <table>
        <tr><td>Nomor</td><td>: ${s.doc_number}</td></tr>
        <tr><td>Perihal</td><td>: ${s.title}</td></tr>
        <tr><td>Tanggal</td><td>: ${dateStr}</td></tr>
        <tr><td>Jenis</td><td>: ${tLabel}</td></tr>
      </table>
    </div>
    <div>
      <p>Kepada Yth.</p>
      <p>${s.to_pic||'Bapak/Ibu Pimpinan'}</p>
      <p><strong>${s.to_name}</strong></p>
      ${s.to_address?`<p>${s.to_address}</p>`:''}
      <p>di Tempat</p>
    </div>
    <div class="salutation"><p>Dengan hormat,</p></div>
    <div>${content}</div>
    <div class="signature">
      <p>Tangerang Selatan, ${dateStr}</p>
      <p>Hormat kami,</p>
      <p><strong>${ORG_NAME}</strong></p>
      <div class="sig-name">${s.created_by_name||'________________'}</div>
    </div>
    </body></html>`;

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(html);
  w.document.close();
}

async function updateSuratStatus(id, status){
  try {
    await sbPatch('outgoing_letters',id,{status, updated_at:new Date().toISOString()});
    toast(`✅ Status diubah ke ${status}`,'ok');
    await loadSuratList();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

async function deleteSurat(id){
  if(!confirm('Hapus surat ini dari arsip?')) return;
  try {
    await sbDelete('outgoing_letters',id);
    toast('🗑 Surat dihapus','info');
    await loadSuratList();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

// ── Letter Templates ─────────────────────────────
async function loadLetterTemplates(){
  try {
    const data = await sbGet('marketing_templates','select=*&type=eq.surat&order=title');
    const grid = document.getElementById('letter-templates-grid');
    if(!grid) return;
    if(!data || !data.length){
      grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="ico">✉️</div><h3>Belum ada template surat</h3><p>Klik "+ Upload Template" untuk menambah.</p></div>`;
      return;
    }
    grid.innerHTML = data.map(t=>`
      <div class="card">
        <div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:6px">✉️ ${t.title}</div>
        <div style="font-size:11px;color:var(--gray);margin-bottom:10px">${(t.content||'').substring(0,80)}...</div>
        <div class="btn-row">
          <button class="btn btn-teal btn-sm" onclick="useLetterTemplate(${t.id})">Gunakan</button>
          <button class="btn btn-ghost btn-sm" onclick="openMktForm(${t.id})">✏️ Edit</button>
        </div>
      </div>`).join('');
  } catch(e){}
}

function openLetterTemplateForm(){
  openModal(`
    <div class="modal-header">
      <div class="modal-title">✉️ Upload Template Surat</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Nama Template *</label>
      <input type="text" id="lt-title" placeholder="Template Penawaran Apotek">
    </div>
    <div class="form-group">
      <label>Isi Template (gunakan placeholder: [NAMA_TUJUAN], [TANGGAL], [PERIHAL])</label>
      <textarea id="lt-content" rows="12" placeholder="Ketik atau paste template surat di sini...">${getDefaultLetterContent()}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveLetterTemplate()">💾 Simpan Template</button>
    </div>`);
}

async function saveLetterTemplate(){
  const title   = document.getElementById('lt-title').value.trim();
  const content = document.getElementById('lt-content').value.trim();
  if(!title||!content){ toast('Wajib diisi','err'); return; }
  try {
    await sbPost('marketing_templates',{ title, content, type:'surat', is_active:true });
    toast('✅ Template tersimpan','ok');
    closeModalForce();
    loadLetterTemplates();
  } catch(e){ toast('❌ '+e.message,'err'); }
}

function useLetterTemplate(id){
  switchSuratTab('list', document.querySelector('.tabs .tab-btn'));
  setTimeout(()=>openSuratForm(), 200);
}
