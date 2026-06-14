// ═══════════════════════════════════════════
// MODULE: HRD & SDM v2 — Complete
// ═══════════════════════════════════════════

const HRD_DIVISIONS = [
  'Laboratory','Sales & Marketing','Operasional','Finance','HRD','IT','Management','Lainnya'
];
const LEAVE_TYPES = ['Cuti Tahunan','Cuti Sakit','Cuti Melahirkan','Izin','Cuti Khusus','Tanpa Keterangan'];

let empAll = [], leaveAll = [];

async function renderHRD() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>HRD &amp; SDM</h1>
        <p>Data karyawan, absensi, cuti, dan penggajian OneLab Diagnostics</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="openPayrollModal()">💵 Payroll</button>
        <button class="btn btn-teal" onclick="openEmpForm()">+ Tambah Karyawan</button>
      </div>
    </div>

    <!-- KPI -->
    <div id="hrd-kpi" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>

    <div class="tabs" id="hrd-tabs">
      <button class="tab-btn active" onclick="switchHRDTab('emp',this)">👥 Data Karyawan</button>
      <button class="tab-btn" onclick="switchHRDTab('leave',this)">🕐 Absensi &amp; Cuti</button>
      <button class="tab-btn" onclick="switchHRDTab('payroll',this)">💵 Penggajian</button>
    </div>

    <!-- Karyawan Tab -->
    <div id="hrd-emp">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="emp-q" placeholder="🔍 Cari nama, posisi, divisi..."
            oninput="filterEmp()" style="flex:1">
          <select class="table-filter" id="emp-div" onchange="filterEmp()">
            <option value="">Semua Divisi</option>
            ${HRD_DIVISIONS.map(d=>`<option>${d}</option>`).join('')}
          </select>
          <select class="table-filter" id="emp-status" onchange="filterEmp()">
            <option value="">Semua Status</option>
            <option>Aktif</option><option>Non-Aktif</option><option>Probasi</option><option>Kontrak</option>
          </select>
        </div>
        <div id="emp-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>

    <!-- Leave Tab -->
    <div id="hrd-leave" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:14px;font-weight:700;color:var(--text)">Pengajuan Cuti & Izin</div>
        <button class="btn btn-teal btn-sm" onclick="openLeaveForm()">+ Ajukan Cuti</button>
      </div>
      <div class="table-wrap">
        <div class="table-toolbar">
          <select class="table-filter" id="leave-status" onchange="loadLeaves()">
            <option value="">Semua Status</option>
            <option>Pending</option><option>Approved</option><option>Rejected</option>
          </select>
          <select class="table-filter" id="leave-type" onchange="loadLeaves()">
            <option value="">Semua Tipe</option>
            ${LEAVE_TYPES.map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div id="leave-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>

    <!-- Payroll Tab -->
    <div id="hrd-payroll" style="display:none">
      <div id="payroll-content">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>`;

  await Promise.all([loadEmployees(), loadLeaves()]);
}

async function loadEmployees() {
  try {
    const data = await sbGet('employees','select=*&order=full_name.asc');
    empAll = Array.isArray(data) ? data : [];
    renderHRDKPI();
    filterEmp();
  } catch(e) {
    document.getElementById('emp-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderHRDKPI() {
  const el = document.getElementById('hrd-kpi');
  if (!el) return;
  const active   = empAll.filter(e=>e.status==='Aktif').length;
  const probasi  = empAll.filter(e=>e.status==='Probasi').length;
  const kontrak  = empAll.filter(e=>e.status==='Kontrak').length;
  const totalGaji= empAll.filter(e=>e.status==='Aktif').reduce((s,e)=>s+(e.base_salary||0),0);
  const byDiv    = {};
  empAll.forEach(e=>{ byDiv[e.division]=(byDiv[e.division]||0)+1; });
  const topDiv   = Object.entries(byDiv).sort((a,b)=>b[1]-a[1])[0];

  el.innerHTML = [
    {icon:'👥',val:empAll.length,  label:'Total Karyawan', color:'#0A2342'},
    {icon:'✅',val:active,         label:'Aktif',           color:'#22C55E'},
    {icon:'🔄',val:probasi,        label:'Probasi',         color:'#F59E0B'},
    {icon:'📋',val:kontrak,        label:'Kontrak',         color:'#0EA5E9'},
    {icon:'💰',val:formatCurrency(totalGaji),label:'Total Gaji/Bln',color:'#8B5CF6'},
    {icon:'🏆',val:topDiv?`${topDiv[0]} (${topDiv[1]})`:'—',label:'Divisi Terbesar',color:'#00897B'},
  ].map(k=>`
    <div style="background:#fff;border-radius:10px;padding:12px;border:1px solid var(--border);
      border-left:4px solid ${k.color}">
      <div style="font-size:20px">${k.icon}</div>
      <div style="font-size:${k.val.toString().length>8?'12px':'16px'};font-weight:800;color:${k.color}">${k.val}</div>
      <div style="font-size:10px;color:var(--text3)">${k.label}</div>
    </div>`).join('');
}

function filterEmp() {
  const q   = (document.getElementById('emp-q')?.value||'').toLowerCase();
  const div = document.getElementById('emp-div')?.value||'';
  const st  = document.getElementById('emp-status')?.value||'';
  const f   = empAll.filter(e=>
    (!q  || (e.full_name||'').toLowerCase().includes(q)||(e.position||'').toLowerCase().includes(q)) &&
    (!div|| e.division===div) &&
    (!st || e.status===st)
  );
  renderEmpTable(f);
}

function renderEmpTable(data) {
  const el = document.getElementById('emp-tbody');
  if (!data.length) {
    el.innerHTML=`<div class="empty-state"><div class="ico">👥</div>
      <h3>${empAll.length?'Tidak ada hasil':'Belum ada data karyawan'}</h3>
      <button class="btn btn-teal" style="margin-top:12px" onclick="openEmpForm()">+ Tambah Karyawan</button>
    </div>`; return;
  }

  const stColors={Aktif:'#22C55E',Probasi:'#F59E0B',Kontrak:'#0EA5E9','Non-Aktif':'#EF4444'};
  el.innerHTML=`<table><thead><tr>
    <th>Karyawan</th><th>Divisi & Posisi</th><th>Kontak</th>
    <th>Status</th><th>Gaji Pokok</th><th>Bergabung</th><th>Aksi</th>
  </tr></thead><tbody>
  ${data.map(e=>`<tr>
    <td>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:32px;height:32px;border-radius:50%;background:${stColors[e.status]||'#94A3B8'}20;
          color:${stColors[e.status]||'#94A3B8'};display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:800;flex-shrink:0">
          ${(e.full_name||'?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-weight:700;color:var(--text)">${e.full_name||'—'}</div>
          <div style="font-size:11px;color:var(--text3)">${e.employee_id||'—'}</div>
        </div>
      </div>
    </td>
    <td>
      <div style="font-size:12px;font-weight:600">${e.position||'—'}</div>
      <div style="font-size:11px;color:var(--text3)">${e.division||'—'}</div>
    </td>
    <td>
      <div style="font-size:12px">${e.phone||'—'}</div>
      <div style="font-size:11px;color:var(--text3)">${e.email||'—'}</div>
    </td>
    <td><span style="background:${(stColors[e.status]||'#94A3B8')}20;color:${stColors[e.status]||'#94A3B8'};
      padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">${e.status||'—'}</span></td>
    <td style="font-size:12px;font-weight:600;color:var(--text)">${e.base_salary?formatCurrency(e.base_salary):'—'}</td>
    <td style="font-size:11px;color:var(--text3)">${e.join_date?formatDateShort(e.join_date):'—'}</td>
    <td>
      <div class="act-row">
        <button class="act-btn edit" onclick="openEmpForm(${e.id})">✏️</button>
        <button class="act-btn" onclick="openLeaveForm(${e.id},'${(e.full_name||'').replace(/'/g,"\\'")}')">📅</button>
        <button class="act-btn del" onclick="deleteEmp(${e.id})">🗑</button>
      </div>
    </td>
  </tr>`).join('')}</tbody></table>`;
}

function switchHRDTab(tab, btn) {
  document.querySelectorAll('#hrd-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['emp','leave','payroll'].forEach(t=>{
    const el=document.getElementById(`hrd-${t}`);
    if (el) el.style.display=t===tab?'block':'none';
  });
  if (tab==='payroll') renderPayrollTab();
}

async function openEmpForm(id=null) {
  let e={};
  if (id) { const d=await sbGet('employees',`select=*&id=eq.${id}`); e=d[0]||{}; }
  const today=new Date().toISOString().split('T')[0];
  const user=getUserName?getUserName():'User';
  const empCode = `EMP-${Date.now().toString().slice(-5)}`;

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Karyawan':'➕ Tambah Karyawan'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>ID Karyawan</label>
        <input type="text" id="ef-code" value="${e.employee_id||empCode}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="ef-status">
          ${['Aktif','Probasi','Kontrak','Non-Aktif'].map(s=>`<option${(e.status||'Aktif')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Lengkap *</label>
        <input type="text" id="ef-name" value="${e.full_name||''}" placeholder="Nama sesuai KTP">
      </div>
      <div class="form-group">
        <label>Divisi</label>
        <select id="ef-div">
          ${HRD_DIVISIONS.map(d=>`<option${e.division===d?' selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Posisi / Jabatan</label>
        <input type="text" id="ef-pos" value="${e.position||''}" placeholder="Analis Medis, Sales Executive...">
      </div>
      <div class="form-group">
        <label>No. HP</label>
        <input type="text" id="ef-phone" value="${e.phone||''}" placeholder="08xxxxxxxxxx">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="ef-email" value="${e.email||''}" placeholder="nama@onelab.id">
      </div>
      <div class="form-group">
        <label>Tanggal Bergabung</label>
        <input type="date" id="ef-join" value="${e.join_date||today}">
      </div>
      <div class="form-group">
        <label>Akhir Kontrak</label>
        <input type="date" id="ef-end" value="${e.end_date||''}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat</label>
        <textarea id="ef-addr" rows="2">${e.address||''}</textarea>
      </div>
    </div>

    <div style="border-top:1px solid var(--border);margin:12px 0;padding-top:12px">
      <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        Info Penggajian
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Gaji Pokok (Rp)</label>
          <input type="number" id="ef-salary" value="${e.base_salary||''}" placeholder="0">
        </div>
        <div class="form-group">
          <label>NPWP</label>
          <input type="text" id="ef-npwp" value="${e.npwp||''}" placeholder="00.000.000.0-000.000">
        </div>
        <div class="form-group">
          <label>Bank</label>
          <select id="ef-bank">
            <option value="">-- Pilih --</option>
            ${['BCA','BRI','BNI','Mandiri','BSI','CIMB','Danamon','Lainnya'].map(b=>
              `<option${e.bank_name===b?' selected':''}>${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>No. Rekening</label>
          <input type="text" id="ef-account" value="${e.bank_account||''}" placeholder="No. rekening">
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveEmployee(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveEmployee(id) {
  const name = document.getElementById('ef-name').value.trim();
  if (!name) { toast('Nama wajib diisi','err'); return; }
  const user=getUserName?getUserName():'User';

  const payload={
    employee_id:   document.getElementById('ef-code').value.trim(),
    full_name:     name,
    division:      document.getElementById('ef-div').value,
    position:      document.getElementById('ef-pos').value.trim(),
    status:        document.getElementById('ef-status').value,
    phone:         document.getElementById('ef-phone').value.trim(),
    email:         document.getElementById('ef-email').value.trim(),
    address:       document.getElementById('ef-addr').value.trim(),
    join_date:     document.getElementById('ef-join').value||null,
    end_date:      document.getElementById('ef-end').value||null,
    base_salary:   parseFloat(document.getElementById('ef-salary').value)||0,
    npwp:          document.getElementById('ef-npwp').value.trim(),
    bank_name:     document.getElementById('ef-bank').value,
    bank_account:  document.getElementById('ef-account').value.trim(),
    created_by_name:user,
    updated_at:    new Date().toISOString(),
  };

  try {
    if (id) { await sbPatch('employees',id,payload); toast('✅ Data diupdate','ok'); }
    else    { await sbPost('employees',payload);     toast('✅ Karyawan ditambahkan','ok'); }
    closeModalForce();
    await loadEmployees();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteEmp(id) {
  if (!confirm('Hapus data karyawan ini?')) return;
  try { await sbDelete('employees',id); toast('🗑 Dihapus','info'); await loadEmployees(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Leave Management ──────────────────────────
async function loadLeaves() {
  try {
    const st=document.getElementById('leave-status')?.value||'';
    const tp=document.getElementById('leave-type')?.value||'';
    let q='select=*&order=created_at.desc';
    if(st) q+=`&status=eq.${st}`;
    if(tp) q+=`&leave_type=eq.${encodeURIComponent(tp)}`;
    const data=await sbGet('leave_requests',q);
    leaveAll=Array.isArray(data)?data:[];
    renderLeaveTable(leaveAll);
  } catch(e) {
    const el=document.getElementById('leave-tbody');
    if(el) el.innerHTML=`<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderLeaveTable(data) {
  const el=document.getElementById('leave-tbody');
  if(!el) return;
  if(!data.length){
    el.innerHTML=`<div class="empty-state"><div class="ico">📅</div>
      <h3>${leaveAll.length?'Tidak ada hasil':'Belum ada pengajuan cuti'}</h3>
    </div>`; return;
  }
  const stColors={Pending:'#F59E0B',Approved:'#22C55E',Rejected:'#EF4444'};
  el.innerHTML=`<table><thead><tr>
    <th>Karyawan</th><th>Tipe Cuti</th><th>Tanggal</th>
    <th>Hari</th><th>Alasan</th><th>Status</th><th>Aksi</th>
  </tr></thead><tbody>
  ${data.map(l=>{
    const sc=stColors[l.status]||'#94A3B8';
    return `<tr>
      <td style="font-weight:600">${l.employee_name||'—'}</td>
      <td style="font-size:12px">${l.leave_type||'—'}</td>
      <td style="font-size:12px;color:var(--text3)">${l.start_date?formatDateShort(l.start_date):'—'}${l.end_date&&l.end_date!==l.start_date?' s/d '+formatDateShort(l.end_date):''}</td>
      <td style="text-align:center;font-weight:700">${l.total_days||1}</td>
      <td style="font-size:12px;color:var(--text3);max-width:150px">${(l.reason||'—').substring(0,40)}</td>
      <td><span style="background:${sc}20;color:${sc};padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700">${l.status||'Pending'}</span></td>
      <td>
        <div class="act-row">
          ${l.status==='Pending'?`
            <button class="act-btn" style="color:#22C55E" onclick="approveLeave(${l.id},'Approved')">✅</button>
            <button class="act-btn" style="color:#EF4444" onclick="approveLeave(${l.id},'Rejected')">❌</button>`:''}
        </div>
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

async function openLeaveForm(empId=null, empName='') {
  let empOpts='<option value="">-- Pilih Karyawan --</option>';
  try {
    const emps=await sbGet('employees','select=id,full_name&status=eq.Aktif&order=full_name');
    empOpts+=(emps||[]).map(e=>`<option value="${e.id}" data-name="${e.full_name}" ${e.id==empId?'selected':''}>${e.full_name}</option>`).join('');
  } catch(e){}
  const today=new Date().toISOString().split('T')[0];

  openModal(`
    <div class="modal-header">
      <div class="modal-title">📅 Ajukan Cuti / Izin</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Karyawan *</label>
      <select id="lf-emp" onchange="document.getElementById('lf-name').value=this.options[this.selectedIndex].dataset.name||''">
        ${empOpts}
      </select>
      <input type="hidden" id="lf-name" value="${empName}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipe Cuti</label>
        <select id="lf-type">${LEAVE_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>Total Hari</label>
        <input type="number" id="lf-days" value="1" min="1" oninput="calcEndDate()">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tanggal Mulai</label>
        <input type="date" id="lf-start" value="${today}" onchange="calcEndDate()">
      </div>
      <div class="form-group">
        <label>Tanggal Selesai</label>
        <input type="date" id="lf-end" value="${today}">
      </div>
    </div>
    <div class="form-group">
      <label>Alasan</label>
      <textarea id="lf-reason" rows="2" placeholder="Alasan pengajuan cuti..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveLeave()">💾 Ajukan</button>
    </div>`);
}

function calcEndDate() {
  const start=document.getElementById('lf-start')?.value;
  const days=parseInt(document.getElementById('lf-days')?.value||1);
  if (!start) return;
  const endDate=new Date(start);
  endDate.setDate(endDate.getDate()+days-1);
  const el=document.getElementById('lf-end');
  if (el) el.value=endDate.toISOString().split('T')[0];
}

async function saveLeave() {
  const empId=document.getElementById('lf-emp').value;
  const empName=document.getElementById('lf-name').value||document.getElementById('lf-emp').options[document.getElementById('lf-emp').selectedIndex]?.text||'';
  if (!empId) { toast('Pilih karyawan dulu','err'); return; }
  const user=getUserName?getUserName():'User';
  const payload={
    employee_id:   parseInt(empId),
    employee_name: empName,
    leave_type:    document.getElementById('lf-type').value,
    start_date:    document.getElementById('lf-start').value,
    end_date:      document.getElementById('lf-end').value,
    total_days:    parseInt(document.getElementById('lf-days').value)||1,
    reason:        document.getElementById('lf-reason').value.trim(),
    status:        'Pending',
    requested_by:  user,
    created_at:    new Date().toISOString(),
  };
  try {
    await sbPost('leave_requests',payload);
    toast('✅ Cuti diajukan','ok');
    closeModalForce();
    await loadLeaves();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function approveLeave(id, status) {
  const user=getUserName?getUserName():'User';
  try {
    await sbPatch('leave_requests',id,{
      status, approved_by:user, approved_at:new Date().toISOString()
    });
    toast(`✅ Cuti ${status==='Approved'?'Disetujui':'Ditolak'}`,'ok');
    await loadLeaves();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Payroll Tab ───────────────────────────────
function renderPayrollTab() {
  const el=document.getElementById('payroll-content');
  if (!el) return;
  const active=empAll.filter(e=>e.status==='Aktif'||e.status==='Probasi'||e.status==='Kontrak');
  const totalGross=active.reduce((s,e)=>s+(e.base_salary||0),0);
  const totalBPJS =active.reduce((s,e)=>s+Math.round((e.base_salary||0)*0.04),0);
  const totalNet  =active.reduce((s,e)=>s+(e.base_salary||0)-Math.round((e.base_salary||0)*0.04),0);

  el.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      ${[
        {label:'Total Karyawan Aktif',val:active.length,color:'var(--navy)'},
        {label:'Total Gaji Bruto',val:formatCurrency(totalGross),color:'#8B5CF6'},
        {label:'Est. Total Net (stlh BPJS 4%)',val:formatCurrency(totalNet),color:'#22C55E'},
      ].map(k=>`<div class="card" style="text-align:center">
        <div style="font-size:18px;font-weight:800;color:${k.color}">${k.val}</div>
        <div style="font-size:11px;color:var(--text3)">${k.label}</div>
      </div>`).join('')}
    </div>
    <div class="table-wrap">
      <table><thead><tr>
        <th>Karyawan</th><th>Divisi</th><th>Gaji Pokok</th>
        <th>BPJS (4%)</th><th>Est. Gaji Net</th><th>Bank</th>
      </tr></thead><tbody>
      ${active.map(e=>{
        const bpjs=Math.round((e.base_salary||0)*0.04);
        const net=(e.base_salary||0)-bpjs;
        return `<tr>
          <td style="font-weight:600">${e.full_name}</td>
          <td style="font-size:12px;color:var(--text3)">${e.division||'—'}</td>
          <td>${e.base_salary?formatCurrency(e.base_salary):'—'}</td>
          <td style="color:#EF4444">${bpjs?formatCurrency(bpjs):'—'}</td>
          <td style="font-weight:700;color:#22C55E">${net?formatCurrency(net):'—'}</td>
          <td style="font-size:12px;color:var(--text3)">${e.bank_name||'—'} ${e.bank_account||''}</td>
        </tr>`;
      }).join('')}
      </tbody></table>
    </div>`;
}

function openPayrollModal() {
  switchHRDTab('payroll', document.querySelector('#hrd-tabs .tab-btn:nth-child(3)'));
}
