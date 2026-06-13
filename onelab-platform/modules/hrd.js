// ═══════════════════════════════════════════
// MODULE: HRD & SDM
// ═══════════════════════════════════════════

const HRD_DIVISIONS = ['Laboratorium','Marketing & Sales','Operasional','Finance','HRD','IT','Manajemen'];
const HRD_STATUS    = ['Aktif','Probation','Cuti','Resign','Kontrak Berakhir'];
const LEAVE_TYPES   = ['Cuti Tahunan','Cuti Sakit','Cuti Melahirkan','Izin','Dinas Luar','Lainnya'];

let hrdEmployees=[], hrdLeaves=[];

async function renderHRD() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>HRD & SDM</h1>
        <p>Data karyawan, absensi, leave request, dan penggajian</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" id="hrd-add-btn" onclick="openEmployeeForm()">+ Tambah Karyawan</button>
      </div>
    </div>

    <div class="tabs" id="hrd-tabs">
      <button class="tab-btn active" onclick="switchHRDTab('employees',this)">👥 Data Karyawan</button>
      <button class="tab-btn" onclick="switchHRDTab('leave',this)">📅 Leave Request</button>
      <button class="tab-btn" onclick="switchHRDTab('payroll',this)">💵 Penggajian</button>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:24px;font-weight:800;color:var(--navy)" id="hrd-total">—</div>
        <div style="font-size:11px;color:var(--gray)">Total Karyawan</div>
      </div>
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:24px;font-weight:800;color:#22C55E" id="hrd-aktif">—</div>
        <div style="font-size:11px;color:var(--gray)">Aktif</div>
      </div>
      <div class="card" style="text-align:center;padding:12px">
        <div style="font-size:24px;font-weight:800;color:#F59E0B" id="hrd-leave-pend">—</div>
        <div style="font-size:11px;color:var(--gray)">Cuti Pending</div>
      </div>
    </div>

    <div id="hrd-employees"><div class="loading-row"><div class="spinner"></div></div></div>
    <div id="hrd-leave" style="display:none"></div>
    <div id="hrd-payroll" style="display:none"></div>`;

  await loadHRD();
}

async function loadHRD() {
  try {
    const [emps, leaves] = await Promise.all([
      sbGet('employees','select=*&order=full_name'),
      sbGet('leave_requests','select=*&order=created_at.desc'),
    ]);
    hrdEmployees = Array.isArray(emps)?emps:[];
    hrdLeaves    = Array.isArray(leaves)?leaves:[];

    document.getElementById('hrd-total').textContent = hrdEmployees.length;
    document.getElementById('hrd-aktif').textContent = hrdEmployees.filter(e=>e.status==='Aktif').length;
    document.getElementById('hrd-leave-pend').textContent = hrdLeaves.filter(l=>l.status==='Menunggu Approval').length;

    renderEmployeeTable(hrdEmployees);
  } catch(e) {
    document.getElementById('hrd-employees').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function switchHRDTab(tab, btn) {
  document.querySelectorAll('#hrd-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['employees','leave','payroll'].forEach(t=>{
    const el = document.getElementById(`hrd-${t}`);
    if (el) el.style.display = t===tab?'block':'none';
  });
  const addBtn = document.getElementById('hrd-add-btn');
  if (tab==='employees') { addBtn.textContent='+ Tambah Karyawan'; addBtn.onclick=openEmployeeForm; }
  if (tab==='leave') { addBtn.textContent='+ Ajukan Cuti'; addBtn.onclick=openLeaveForm; renderLeaveList(); }
  if (tab==='payroll') { addBtn.textContent='+ Generate Slip'; addBtn.onclick=()=>toast('Fitur segera hadir','info'); renderPayrollPanel(); }
}

function renderEmployeeTable(data) {
  const el = document.getElementById('hrd-employees');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">👥</div>
      <h3>Belum ada data karyawan</h3></div>`; return;
  }
  const stColors = {'Aktif':'#22C55E','Probation':'#F59E0B','Cuti':'#0EA5E9','Resign':'#EF4444','Kontrak Berakhir':'#94A3B8'};
  el.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <input class="table-search" placeholder="🔍 Cari karyawan..." oninput="filterEmp(this.value)" style="flex:1">
      <select class="table-filter" onchange="filterEmpDiv(this.value)">
        <option value="">Semua Divisi</option>
        ${HRD_DIVISIONS.map(d=>`<option>${d}</option>`).join('')}
      </select>
    </div>
    <table>
      <thead><tr>
        <th>Karyawan</th><th>NIK</th><th>Jabatan</th><th>Divisi</th>
        <th>Tgl Masuk</th><th>Gaji Pokok</th><th>Status</th><th>Aksi</th>
      </tr></thead>
      <tbody id="emp-tbody">
        ${data.map(e=>{
          const col = stColors[e.status]||'#94A3B8';
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">
                  ${(e.full_name||'?').charAt(0)}
                </div>
                <div>
                  <div style="font-weight:600;color:var(--navy)">${e.full_name}</div>
                  <div style="font-size:11px;color:var(--gray)">${e.email||''}</div>
                </div>
              </div>
            </td>
            <td style="font-size:11px;font-family:monospace">${e.nik||'—'}</td>
            <td style="font-size:12px">${e.position||'—'}</td>
            <td><span class="badge badge-gray" style="font-size:10px">${e.division||'—'}</span></td>
            <td style="font-size:11px;color:var(--gray)">${formatDateShort(e.join_date)}</td>
            <td style="font-size:12px;font-weight:600">${e.base_salary?formatCurrency(e.base_salary):'—'}</td>
            <td><span style="background:${col}20;color:${col};padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700">${e.status||'Aktif'}</span></td>
            <td><div class="act-row">
              <button class="act-btn edit" onclick="openEmployeeForm(${e.id})">✏️</button>
              <button class="act-btn del" onclick="deleteEmployee(${e.id})">🗑</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

let _empFilterQ='', _empFilterDiv='';
function filterEmp(q) { _empFilterQ=q.toLowerCase(); applyEmpFilter(); }
function filterEmpDiv(d) { _empFilterDiv=d; applyEmpFilter(); }
function applyEmpFilter() {
  const filtered = hrdEmployees.filter(e=>
    (!_empFilterQ||(e.full_name||'').toLowerCase().includes(_empFilterQ)) &&
    (!_empFilterDiv||e.division===_empFilterDiv)
  );
  const tbody = document.getElementById('emp-tbody');
  if (tbody) tbody.innerHTML = filtered.map(e=>`
    <tr><td><strong>${e.full_name}</strong><div style="font-size:11px;color:var(--gray)">${e.email||''}</div></td>
    <td>${e.nik||'—'}</td><td>${e.position||'—'}</td>
    <td><span class="badge badge-gray">${e.division||'—'}</span></td>
    <td>${formatDateShort(e.join_date)}</td>
    <td>${e.base_salary?formatCurrency(e.base_salary):'—'}</td>
    <td><span style="font-size:11px">${e.status||'Aktif'}</span></td>
    <td><button class="act-btn edit" onclick="openEmployeeForm(${e.id})">✏️</button></td>
    </tr>`).join('');
}

async function openEmployeeForm(id=null) {
  let e = {};
  if (id) { const d = await sbGet('employees',`select=*&id=eq.${id}`); e=d[0]||{}; }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Karyawan':'👤 Tambah Karyawan'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Lengkap *</label>
        <input type="text" id="ef-name" value="${e.full_name||''}" placeholder="Nama sesuai KTP">
      </div>
      <div class="form-group"><label>NIK Karyawan</label><input type="text" id="ef-nik" value="${e.nik||''}"></div>
      <div class="form-group"><label>No. HP</label><input type="text" id="ef-phone" value="${e.phone||''}"></div>
      <div class="form-group"><label>Email</label><input type="email" id="ef-email" value="${e.email||''}"></div>
      <div class="form-group"><label>Jabatan</label><input type="text" id="ef-pos" value="${e.position||''}" placeholder="Analis, Sales, dll"></div>
      <div class="form-group"><label>Divisi</label>
        <select id="ef-div">${HRD_DIVISIONS.map(d=>`<option${e.division===d?' selected':''}>${d}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Tanggal Masuk</label><input type="date" id="ef-join" value="${e.join_date||''}"></div>
      <div class="form-group"><label>Status</label>
        <select id="ef-status">${HRD_STATUS.map(s=>`<option${(e.status||'Aktif')===s?' selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Gaji Pokok (Rp)</label><input type="number" id="ef-salary" value="${e.base_salary||''}"></div>
      <div class="form-group"><label>No. BPJS Kesehatan</label><input type="text" id="ef-bpjs-kes" value="${e.bpjs_kesehatan||''}"></div>
      <div class="form-group"><label>No. BPJS Ketenagakerjaan</label><input type="text" id="ef-bpjs-tk" value="${e.bpjs_ketenagakerjaan||''}"></div>
      <div class="form-group"><label>No. NPWP</label><input type="text" id="ef-npwp" value="${e.npwp||''}"></div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat</label><textarea id="ef-addr" rows="2">${e.address||''}</textarea>
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
  const payload = {
    full_name: name, nik: document.getElementById('ef-nik').value.trim(),
    phone: document.getElementById('ef-phone').value.trim(),
    email: document.getElementById('ef-email').value.trim(),
    position: document.getElementById('ef-pos').value.trim(),
    division: document.getElementById('ef-div').value,
    join_date: document.getElementById('ef-join').value||null,
    status: document.getElementById('ef-status').value,
    base_salary: parseFloat(document.getElementById('ef-salary').value)||0,
    bpjs_kesehatan: document.getElementById('ef-bpjs-kes').value.trim(),
    bpjs_ketenagakerjaan: document.getElementById('ef-bpjs-tk').value.trim(),
    npwp: document.getElementById('ef-npwp').value.trim(),
    address: document.getElementById('ef-addr').value.trim(),
    updated_at: new Date().toISOString(),
  };
  try {
    if (id) { await sbPatch('employees',id,payload); toast('✅ Data karyawan diupdate','ok'); }
    else { await sbPost('employees',payload); toast('✅ Karyawan ditambahkan','ok'); }
    closeModalForce(); await loadHRD();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteEmployee(id) {
  if (!confirm('Hapus data karyawan ini?')) return;
  try { await sbDelete('employees',id); toast('🗑 Dihapus','info'); await loadHRD(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Leave Request ─────────────────────────
function renderLeaveList() {
  const el = document.getElementById('hrd-leave');
  if (!el) return;
  const stColors = {'Menunggu Approval':'#F59E0B','Approved':'#22C55E','Rejected':'#EF4444','Selesai':'#94A3B8'};
  if (!hrdLeaves.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">📅</div><h3>Belum ada leave request</h3></div>`; return;
  }
  el.innerHTML = `<table>
    <thead><tr><th>Karyawan</th><th>Tipe</th><th>Periode</th><th>Hari</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${hrdLeaves.map(l=>{
      const col = stColors[l.status]||'#94A3B8';
      const days = l.start_date&&l.end_date ? Math.round((new Date(l.end_date)-new Date(l.start_date))/(86400000))+1 : '—';
      return `<tr>
        <td style="font-weight:600">${l.employee_name||'—'}</td>
        <td><span class="badge badge-gray" style="font-size:10px">${l.leave_type||'—'}</span></td>
        <td style="font-size:11px">${formatDateShort(l.start_date)} → ${formatDateShort(l.end_date)}</td>
        <td style="font-size:12px;font-weight:700;color:var(--navy)">${days}</td>
        <td style="font-size:11px;color:var(--gray)">${l.reason||'—'}</td>
        <td><span style="background:${col}20;color:${col};padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700">${l.status}</span></td>
        <td><div class="act-row">
          ${l.status==='Menunggu Approval'?`
            <button class="act-btn" onclick="approveLeave(${l.id})" style="color:#22C55E">✅</button>
            <button class="act-btn" onclick="rejectLeave(${l.id})" style="color:#EF4444">❌</button>`:'' }
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

async function openLeaveForm() {
  let empOpts = '<option value="">-- Pilih Karyawan --</option>';
  empOpts += hrdEmployees.map(e=>`<option value="${e.id}">${e.full_name}</option>`).join('');
  openModal(`
    <div class="modal-header">
      <div class="modal-title">📅 Ajukan Leave / Cuti</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Karyawan *</label>
      <select id="lrf-emp">${empOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Tipe Leave</label>
        <select id="lrf-type">${LEAVE_TYPES.map(t=>`<option>${t}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Tanggal Mulai</label><input type="date" id="lrf-start"></div>
      <div class="form-group"><label>Tanggal Selesai</label><input type="date" id="lrf-end"></div>
    </div>
    <div class="form-group"><label>Alasan</label>
      <textarea id="lrf-reason" rows="2" placeholder="Alasan pengajuan cuti..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveLeave()">📤 Ajukan</button>
    </div>`);
}

async function saveLeave() {
  const empSel = document.getElementById('lrf-emp');
  if (!empSel?.value) { toast('Pilih karyawan','err'); return; }
  const empName = empSel.options[empSel.selectedIndex].textContent;
  const payload = {
    employee_id: parseInt(empSel.value),
    employee_name: empName,
    leave_type: document.getElementById('lrf-type').value,
    start_date: document.getElementById('lrf-start').value||null,
    end_date: document.getElementById('lrf-end').value||null,
    reason: document.getElementById('lrf-reason').value.trim(),
    status: 'Menunggu Approval',
    requested_by: getUserName(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    await sbPost('leave_requests',payload);
    toast('✅ Leave request diajukan','ok');
    closeModalForce(); await loadHRD(); renderLeaveList();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function approveLeave(id) {
  try { await sbPatch('leave_requests',id,{status:'Approved',approved_by:getUserName(),updated_at:new Date().toISOString()}); toast('✅ Approved','ok'); await loadHRD(); renderLeaveList(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}
async function rejectLeave(id) {
  try { await sbPatch('leave_requests',id,{status:'Rejected',updated_at:new Date().toISOString()}); toast('❌ Rejected','info'); await loadHRD(); renderLeaveList(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Payroll Panel ─────────────────────────
function renderPayrollPanel() {
  const el = document.getElementById('hrd-payroll');
  if (!el) return;
  const now = new Date();
  el.innerHTML = `
    <div class="card" style="max-width:700px">
      <div class="card-title" style="margin-bottom:14px">💵 Penggajian — ${now.toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</div>
      <div style="background:var(--lgray);border-radius:8px;padding:12px 14px;font-size:13px;color:var(--gray);margin-bottom:14px">
        📊 Total karyawan aktif: <strong style="color:var(--navy)">${hrdEmployees.filter(e=>e.status==='Aktif').length} orang</strong> |
        Estimasi total gaji: <strong style="color:var(--navy)">${formatCurrency(hrdEmployees.filter(e=>e.status==='Aktif').reduce((s,e)=>s+(e.base_salary||0),0))}</strong>
      </div>
      <table>
        <thead><tr><th>Nama</th><th>Jabatan</th><th>Gaji Pokok</th><th>BPJS</th><th>Take Home</th></tr></thead>
        <tbody>
          ${hrdEmployees.filter(e=>e.status==='Aktif').map(e=>{
            const bpjs = Math.round((e.base_salary||0)*0.01);
            const take = (e.base_salary||0) - bpjs;
            return `<tr>
              <td style="font-weight:600">${e.full_name}</td>
              <td style="font-size:12px;color:var(--gray)">${e.position||'—'}</td>
              <td style="font-size:12px">${formatCurrency(e.base_salary||0)}</td>
              <td style="font-size:12px;color:#EF4444">-${formatCurrency(bpjs)}</td>
              <td style="font-size:12px;font-weight:700;color:#22C55E">${formatCurrency(take)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:14px">
        <button class="btn btn-teal" onclick="toast('Fitur generate slip gaji PDF segera hadir!','info')">🖨 Generate Slip Gaji PDF</button>
      </div>
    </div>`;
}
