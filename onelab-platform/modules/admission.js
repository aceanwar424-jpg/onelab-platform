// ═══════════════════════════════════════════
// MODULE: Admission — Registrasi Pasien
// Flow: Walk-in / Booking / Project MCU
// ═══════════════════════════════════════════

let admAll = [], admFilter = { status:'', type:'', search:'' };

const ADM_STATUS = {
  'Registered':  {color:'#0EA5E9', icon:'📋'},
  'Anamnesa':    {color:'#8B5CF6', icon:'🩺'},
  'Lab':         {color:'#F59E0B', icon:'🧪'},
  'Radiology':   {color:'#F97316', icon:'🫁'},
  'Done':        {color:'#22C55E', icon:'✅'},
  'Cancelled':   {color:'#EF4444', icon:'❌'},
};

async function renderAdmission() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Admission</h1>
        <p>Registrasi pasien — Walk-in, Booking, Rujukan, Project MCU</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="renderAdmissionReport()">📊 Laporan</button>
        <button class="btn btn-teal" onclick="openAdmissionForm()">+ Registrasi Pasien</button>
      </div>
    </div>

    <!-- KPI -->
    <div id="adm-kpi" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:16px">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>

    <!-- Status Filter -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="adm-status-tabs">
      <button class="btn btn-teal btn-sm" onclick="setAdmFilter('','',this)">Semua</button>
      ${Object.entries(ADM_STATUS).map(([s,v])=>
        `<button class="btn btn-ghost btn-sm" onclick="setAdmFilter('status','${s}',this)">${v.icon} ${s}</button>`
      ).join('')}
    </div>

    <!-- Search + Date -->
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <input class="table-search" id="adm-q" placeholder="🔍 Cari nama pasien, no. kunjungan..."
        oninput="admFilter.search=this.value;applyAdmFilter()" style="flex:1">
      <select class="table-filter" id="adm-type" onchange="admFilter.type=this.value;applyAdmFilter()">
        <option value="">Semua Tipe</option>
        <option>Walk-in</option><option>Booking</option>
        <option>Rujukan</option><option>Project MCU</option>
      </select>
      <input type="date" class="table-filter" id="adm-date" onchange="applyAdmFilter()"
        value="${new Date().toISOString().split('T')[0]}">
    </div>

    <div id="adm-list">
      <div class="loading-row"><div class="spinner"></div></div>
    </div>`;

  await loadAdmissions();
}

async function loadAdmissions() {
  try {
    const date = document.getElementById('adm-date')?.value || new Date().toISOString().split('T')[0];
    const data = await sbGet('admissions',
      `select=*&visit_date=eq.${date}&order=created_at.desc`);
    admAll = Array.isArray(data) ? data : [];
    renderAdmKPI();
    applyAdmFilter();
  } catch(e) {
    document.getElementById('adm-list').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderAdmKPI() {
  const el = document.getElementById('adm-kpi'); if (!el) return;
  const done    = admAll.filter(a=>a.status==='Done').length;
  const active  = admAll.filter(a=>!['Done','Cancelled'].includes(a.status)).length;
  const revenue = admAll.filter(a=>a.payment_status==='Paid').reduce((s,a)=>s+(a.net_amount||0),0);
  el.innerHTML = [
    {icon:'📋', val:admAll.length,        label:'Total Hari Ini',  color:'#0A2342'},
    {icon:'🔵', val:active,               label:'Sedang Dilayani', color:'#0EA5E9'},
    {icon:'✅', val:done,                 label:'Selesai',         color:'#22C55E'},
    {icon:'❌', val:admAll.filter(a=>a.status==='Cancelled').length, label:'Batal', color:'#EF4444'},
    {icon:'💰', val:formatCurrency(revenue), label:'Revenue Hari Ini', color:'#8B5CF6'},
    {icon:'🏥', val:admAll.filter(a=>a.visit_type==='Project MCU').length, label:'MCU Project', color:'#F59E0B'},
  ].map(k=>`
    <div style="background:#fff;border-radius:10px;padding:10px 12px;border:1px solid var(--border);border-left:4px solid ${k.color}">
      <div style="font-size:18px">${k.icon}</div>
      <div style="font-size:16px;font-weight:800;color:${k.color}">${k.val}</div>
      <div style="font-size:10px;color:var(--text3)">${k.label}</div>
    </div>`).join('');
}

function setAdmFilter(key, val, btn) {
  document.querySelectorAll('#adm-status-tabs button').forEach(b=>b.className='btn btn-ghost btn-sm');
  btn.className = 'btn btn-teal btn-sm';
  if (key==='status') admFilter.status = val;
  applyAdmFilter();
}

function applyAdmFilter() {
  const q  = admFilter.search.toLowerCase();
  const st = admFilter.status;
  const tp = admFilter.type;
  const f  = admAll.filter(a=>
    (!q  || (a.patient_name||'').toLowerCase().includes(q) ||
             (a.visit_number||'').toLowerCase().includes(q)) &&
    (!st || a.status===st) &&
    (!tp || a.visit_type===tp)
  );
  renderAdmList(f);
}

function renderAdmList(data) {
  const el = document.getElementById('adm-list');
  if (!data.length) {
    el.innerHTML=`<div class="empty-state"><div class="ico">📋</div>
      <h3>${admAll.length?'Tidak ada hasil':'Belum ada kunjungan hari ini'}</h3>
      <button class="btn btn-teal" style="margin-top:12px" onclick="openAdmissionForm()">+ Registrasi Pasien</button>
    </div>`; return;
  }

  el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
    ${data.map(a=>{
      const st = ADM_STATUS[a.status]||ADM_STATUS['Registered'];
      return `
      <div class="card" style="padding:12px 16px;border-left:4px solid ${st.color}">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <!-- Visit Number -->
          <div style="font-size:11px;font-family:monospace;color:var(--text3);min-width:120px">
            ${a.visit_number||'—'}
          </div>
          <!-- Patient -->
          <div style="flex:1;min-width:150px">
            <div style="font-weight:700;color:var(--text)">${a.patient_name||'—'}</div>
            <div style="font-size:11px;color:var(--text3)">
              ${a.patient_gender||''} ${a.patient_age?'· '+a.patient_age+' thn':''} 
              ${a.patient_phone?'· '+a.patient_phone:''}
            </div>
          </div>
          <!-- Package/Service -->
          <div style="min-width:140px">
            <div style="font-size:12px;font-weight:600;color:var(--text)">${a.package_name||'Layanan Individual'}</div>
            <div style="font-size:11px;color:var(--text3)">${a.visit_type||'Walk-in'}</div>
          </div>
          <!-- Status -->
          <div>
            <span style="background:${st.color}20;color:${st.color};padding:3px 10px;
              border-radius:10px;font-size:11px;font-weight:700">${st.icon} ${a.status}</span>
          </div>
          <!-- Amount -->
          <div style="text-align:right;min-width:100px">
            <div style="font-size:13px;font-weight:700;color:var(--text)">${formatCurrency(a.net_amount||0)}</div>
            <div style="font-size:10px;color:${a.payment_status==='Paid'?'#22C55E':'#F59E0B'}">
              ${a.payment_status||'Unpaid'}
            </div>
          </div>
          <!-- Actions -->
          <div class="act-row" style="flex-shrink:0">
            ${a.status==='Registered'?`<button class="btn btn-teal btn-xs" onclick="updateAdmStatus(${a.id},'Anamnesa')">→ Anamnesa</button>`:''}
            ${a.status==='Anamnesa'?`<button class="btn btn-teal btn-xs" onclick="updateAdmStatus(${a.id},'Lab')">→ Lab</button>`:''}
            ${a.status==='Lab'?`<button class="btn btn-teal btn-xs" onclick="updateAdmStatus(${a.id},'Done')">→ Selesai</button>`:''}
            <button class="act-btn edit" onclick="openAdmissionForm(${a.id})">✏️</button>
            ${a.payment_status!=='Paid'?`<button class="act-btn" style="color:#22C55E;font-size:11px" onclick="markAdmPaid(${a.id})">Bayar</button>`:''}
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

async function updateAdmStatus(id, status) {
  try {
    await sbPatch('admissions',id,{status,updated_at:new Date().toISOString()});
    toast(`✅ Status → ${status}`,'ok');
    await loadAdmissions();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function markAdmPaid(id) {
  try {
    await sbPatch('admissions',id,{payment_status:'Paid',updated_at:new Date().toISOString()});
    toast('✅ Pembayaran dicatat','ok');
    await loadAdmissions();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function openAdmissionForm(id=null) {
  let a={};
  if (id) { const d=await sbGet('admissions',`select=*&id=eq.${id}`); a=d[0]||{}; }

  // Load packages
  let pkgOpts='<option value="">-- Pilih Paket (opsional) --</option>';
  try {
    const pkgs=await sbGet('packages','select=id,nama_paket,harga_normal,kode_paket&is_active=eq.true&order=nama_paket');
    pkgOpts+=(pkgs||[]).map(p=>`<option value="${p.id}" data-price="${p.harga_normal||0}" data-name="${p.nama_paket}"
      ${a.package_id==p.id?'selected':''}>${p.kode_paket} — ${p.nama_paket} (${formatCurrency(p.harga_normal||0)})</option>`).join('');
  } catch(e){}

  // Load corporates
  let corpOpts='<option value="">-- Umum (bukan korporat) --</option>';
  try {
    const corps=await sbGet('corporates','select=id,corporate_name,discount_type,discount_value&status=eq.Aktif&order=corporate_name');
    corpOpts+=(corps||[]).map(c=>`<option value="${c.id}" data-disc-type="${c.discount_type||'none'}" data-disc-val="${c.discount_value||0}"
      ${a.corporate_id==c.id?'selected':''}>${c.corporate_name}</option>`).join('');
  } catch(e){}

  // Load projects for MCU
  let projOpts='<option value="">-- Tidak terkait project --</option>';
  try {
    const projs=await sbGet('projects','select=id,project_name,project_code&status=eq.Active&order=created_at.desc&limit=50');
    projOpts+=(projs||[]).map(p=>`<option value="${p.id}" ${a.project_id==p.id?'selected':''}>${p.project_code} — ${p.project_name}</option>`).join('');
  } catch(e){}

  const today=new Date().toISOString().split('T')[0];
  const visitNum=id?a.visit_number:`VISIT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-3)}`;
  const user=getUserName?getUserName():'User';

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Admission':'📋 Registrasi Pasien Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <!-- Visit Info -->
    <div style="background:var(--lgray);border-radius:8px;padding:10px 14px;margin-bottom:14px">
      <div class="form-row">
        <div class="form-group">
          <label>No. Kunjungan</label>
          <input type="text" id="af-visit" value="${visitNum}" readonly style="background:#fff;font-family:monospace">
        </div>
        <div class="form-group">
          <label>Tipe Kunjungan</label>
          <select id="af-type" onchange="toggleProjectField(this.value)">
            ${['Walk-in','Booking','Rujukan','Project MCU'].map(t=>
              `<option${(a.visit_type||'Walk-in')===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tanggal</label>
          <input type="date" id="af-date" value="${a.visit_date||today}">
        </div>
      </div>
      <div id="af-project-row" style="${a.visit_type==='Project MCU'?'':'display:none'}">
        <div class="form-group">
          <label>Project MCU</label>
          <select id="af-project">${projOpts}</select>
        </div>
      </div>
    </div>

    <!-- Patient Info -->
    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Data Pasien</div>
    <div class="form-row">
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Lengkap *</label>
        <input type="text" id="af-name" value="${a.patient_name||''}" placeholder="Nama sesuai KTP">
      </div>
      <div class="form-group">
        <label>Jenis Kelamin</label>
        <select id="af-gender">
          <option value="M" ${(a.patient_gender||'M')==='M'?'selected':''}>Laki-laki</option>
          <option value="F" ${a.patient_gender==='F'?'selected':''}>Perempuan</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tanggal Lahir</label>
        <input type="date" id="af-dob" value="${a.patient_dob||''}" onchange="calcAge()">
      </div>
      <div class="form-group">
        <label>Usia</label>
        <input type="number" id="af-age" value="${a.patient_age||''}" placeholder="tahun">
      </div>
      <div class="form-group">
        <label>No. HP</label>
        <input type="text" id="af-phone" value="${a.patient_phone||''}" placeholder="08xxxxxxxxxx">
      </div>
      <div class="form-group">
        <label>Tipe ID</label>
        <select id="af-idtype">
          ${['KTP','SIM','Paspor','BPJS','Lainnya'].map(t=>`<option${(a.patient_id_type||'KTP')===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>No. ID</label>
        <input type="text" id="af-idnum" value="${a.patient_id_number||''}" placeholder="Nomor identitas">
      </div>
    </div>

    <!-- Service -->
    <div style="border-top:1px solid var(--border);padding-top:12px;margin:8px 0">
      <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Layanan & Billing</div>
      <div class="form-row">
        <div class="form-group" style="grid-column:1/-1">
          <label>Paket Pemeriksaan</label>
          <select id="af-package" onchange="calcAdmTotal()">
            ${pkgOpts}
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Corporate / Korporat</label>
          <select id="af-corp" onchange="calcAdmTotal()">
            ${corpOpts}
          </select>
        </div>
        <div class="form-group">
          <label>Subtotal (Rp)</label>
          <input type="number" id="af-sub" value="${a.total_amount||0}" oninput="calcAdmTotal()">
        </div>
        <div class="form-group">
          <label>Diskon (Rp)</label>
          <input type="number" id="af-disc" value="${a.discount_amount||0}" oninput="calcAdmTotal()">
        </div>
        <div class="form-group">
          <label>Total Netto (Rp)</label>
          <input type="number" id="af-net" value="${a.net_amount||0}" readonly
            style="background:var(--lgray);font-weight:700;color:var(--teal)">
        </div>
        <div class="form-group">
          <label>Status Pembayaran</label>
          <select id="af-paystatus">
            ${['Unpaid','DP','Paid','Billed'].map(s=>
              `<option${(a.payment_status||'Unpaid')===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveAdmission(${id||'null'})">
        ${id?'💾 Update':'📋 Registrasi'}
      </button>
    </div>`);
}

function toggleProjectField(type) {
  const el = document.getElementById('af-project-row');
  if (el) el.style.display = type==='Project MCU' ? '' : 'none';
}

function calcAge() {
  const dob = document.getElementById('af-dob')?.value;
  if (!dob) return;
  const age = Math.floor((new Date()-new Date(dob))/(365.25*86400000));
  const el  = document.getElementById('af-age');
  if (el) el.value = age;
}

function calcAdmTotal() {
  const pkgSel   = document.getElementById('af-package');
  const corpSel  = document.getElementById('af-corp');
  let sub        = parseFloat(document.getElementById('af-sub')?.value)||0;

  // Auto-fill price from package
  if (pkgSel?.value) {
    const opt    = pkgSel.options[pkgSel.selectedIndex];
    const price  = parseFloat(opt?.dataset.price||0);
    if (!sub) {
      sub = price;
      const subEl = document.getElementById('af-sub');
      if (subEl) subEl.value = price;
    }
  }

  // Auto-calc discount from corporate
  let disc = parseFloat(document.getElementById('af-disc')?.value)||0;
  if (corpSel?.value) {
    const opt     = corpSel.options[corpSel.selectedIndex];
    const dtype   = opt?.dataset.discType||'none';
    const dval    = parseFloat(opt?.dataset.discVal||0);
    if (dtype==='percent') disc = Math.round(sub*dval/100);
    else if (dtype==='fixed') disc = dval;
    const discEl  = document.getElementById('af-disc');
    if (discEl) discEl.value = disc;
  }

  const net = sub - disc;
  const netEl = document.getElementById('af-net');
  if (netEl) netEl.value = net;
}

async function saveAdmission(id) {
  const name = document.getElementById('af-name').value.trim();
  if (!name) { toast('Nama pasien wajib diisi','err'); return; }

  const pkgSel = document.getElementById('af-package');
  const pkgName = pkgSel?.value ? pkgSel.options[pkgSel.selectedIndex]?.dataset.name||'' : '';
  const user = getUserName?getUserName():'User';

  const payload={
    visit_number:      document.getElementById('af-visit').value,
    visit_type:        document.getElementById('af-type').value,
    visit_date:        document.getElementById('af-date').value,
    project_id:        parseInt(document.getElementById('af-project')?.value)||null,
    patient_name:      name,
    patient_gender:    document.getElementById('af-gender').value,
    patient_dob:       document.getElementById('af-dob').value||null,
    patient_age:       parseInt(document.getElementById('af-age').value)||null,
    patient_phone:     document.getElementById('af-phone').value.trim()||null,
    patient_id_type:   document.getElementById('af-idtype').value,
    patient_id_number: document.getElementById('af-idnum').value.trim()||null,
    package_id:        parseInt(pkgSel?.value)||null,
    package_name:      pkgName||null,
    corporate_id:      parseInt(document.getElementById('af-corp').value)||null,
    total_amount:      parseFloat(document.getElementById('af-sub').value)||0,
    discount_amount:   parseFloat(document.getElementById('af-disc').value)||0,
    net_amount:        parseFloat(document.getElementById('af-net').value)||0,
    payment_status:    document.getElementById('af-paystatus').value,
    status:            id ? undefined : 'Registered',
    registered_by:     user,
    updated_at:        new Date().toISOString(),
  };
  if (id) delete payload.status;

  try {
    if (id) { await sbPatch('admissions',id,payload); toast('✅ Data diupdate','ok'); }
    else    { await sbPost('admissions',payload);    toast('✅ Pasien terdaftar','ok'); }
    closeModalForce();
    await loadAdmissions();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function renderAdmissionReport() {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">📊 Laporan Admission</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      ${[
        {l:'Total Kunjungan', v:admAll.length},
        {l:'Selesai', v:admAll.filter(a=>a.status==='Done').length},
        {l:'Walk-in', v:admAll.filter(a=>a.visit_type==='Walk-in').length},
        {l:'Project MCU', v:admAll.filter(a=>a.visit_type==='Project MCU').length},
        {l:'Revenue', v:formatCurrency(admAll.filter(a=>a.payment_status==='Paid').reduce((s,a)=>s+(a.net_amount||0),0))},
        {l:'Unpaid', v:formatCurrency(admAll.filter(a=>a.payment_status==='Unpaid').reduce((s,a)=>s+(a.net_amount||0),0))},
      ].map(k=>`<div style="background:var(--lgray);border-radius:8px;padding:12px">
        <div style="font-size:16px;font-weight:800;color:var(--text)">${k.v}</div>
        <div style="font-size:11px;color:var(--text3)">${k.l}</div>
      </div>`).join('')}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button></div>`);
}
