// ═══════════════════════════════════════════════════════════
// MODULE: Jadwal Kerja & Shift
// Sub-menu HRD — fondasi kapasitas Task Management
// ═══════════════════════════════════════════════════════════

const SHIFT_TEMPLATES = [
  { name:'Shift Pagi',   masuk:'07:00', pulang:'15:00', hari:['Mon','Tue','Wed','Thu','Fri'] },
  { name:'Shift Siang',  masuk:'14:00', pulang:'22:00', hari:['Mon','Tue','Wed','Thu','Fri'] },
  { name:'Shift Malam',  masuk:'22:00', pulang:'06:00', hari:['Mon','Tue','Wed','Thu','Fri'], cross:true },
  { name:'Office Hours', masuk:'09:00', pulang:'17:00', hari:['Mon','Tue','Wed','Thu','Fri'] },
  { name:'Sabtu Masuk',  masuk:'08:00', pulang:'14:00', hari:['Mon','Tue','Wed','Thu','Fri','Sat'] },
];

const DAYS_LABEL = { Mon:'Sen',Tue:'Sel',Wed:'Rab',Thu:'Kam',Fri:'Jum',Sat:'Sab',Sun:'Min' };

let scheduleAll = [], scheduleEmpList = [];

// ── RENDER UTAMA ──────────────────────────────────────────
async function renderWorkSchedule() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>🕐 Jadwal Kerja & Shift</h1>
        <p>Atur jadwal shift per karyawan — kapasitas harian dihitung otomatis</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="renderWorkSchedule()">↻ Refresh</button>
        <button class="btn btn-teal" onclick="openScheduleForm()">+ Tambah Jadwal</button>
      </div>
    </div>

    <!-- Info kapasitas -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px" id="sched-kpi">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>

    <!-- Template Shift Quick Setup -->
    <div class="card" style="margin-bottom:18px">
      <div class="card-title" style="margin-bottom:12px">⚡ Quick Setup — Template Shift</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${SHIFT_TEMPLATES.map(t=>`
          <button class="btn btn-ghost btn-sm" onclick="applyShiftTemplate(${JSON.stringify(t).replace(/"/g,'&quot;')})">
            📋 ${t.name} (${t.masuk}–${t.pulang})
          </button>`).join('')}
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-toolbar">
        <input class="table-search" id="sched-q" placeholder="Cari nama karyawan..."
          oninput="filterSchedule(this.value)" style="flex:1">
        <select class="table-filter" id="sched-status" onchange="filterSchedule()">
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Non-Aktif</option>
        </select>
      </div>
      <div id="sched-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>`;

  await loadSchedules();
}

async function loadSchedules() {
  try {
    const [scheds, emps] = await Promise.all([
      sbGet('work_schedules','select=*,employees(id,full_name,division,position)&order=created_at.desc'),
      sbGet('employees','select=id,full_name,division,position&status=eq.Aktif&order=full_name'),
    ]);
    scheduleAll  = Array.isArray(scheds) ? scheds : [];
    scheduleEmpList = Array.isArray(emps) ? emps : [];
    renderScheduleKPI();
    filterSchedule();
  } catch(e) {
    document.getElementById('sched-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderScheduleKPI() {
  const el = document.getElementById('sched-kpi'); if (!el) return;
  const active  = scheduleAll.filter(s=>s.is_active).length;
  const total   = scheduleAll.length;
  const empWithSched = new Set(scheduleAll.map(s=>s.employee_id)).size;
  const avgKap  = scheduleAll.length
    ? (scheduleAll.reduce((s,x)=>s+(parseFloat(x.kapasitas_jam)||7),0)/scheduleAll.length).toFixed(1)
    : 0;

  el.innerHTML = [
    {icon:'📋', val:total,        label:'Total Jadwal',    color:'#0891B2'},
    {icon:'✅', val:active,       label:'Jadwal Aktif',    color:'#22C55E'},
    {icon:'👥', val:empWithSched, label:'Karyawan Terjadwal', color:'#7C3AED'},
    {icon:'⏱', val:avgKap+'j',   label:'Rata-rata Kapasitas/hari', color:'#F59E0B'},
  ].map(k=>`
    <div class="kpi-card" style="border-top:3px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.color}18;font-size:20px">${k.icon}</div>
      <div><div class="kpi-val" style="font-size:20px">${k.val}</div>
      <div class="kpi-label">${k.label}</div></div>
    </div>`).join('');
}

function filterSchedule(q='') {
  const status = document.getElementById('sched-status')?.value;
  const search = (q || document.getElementById('sched-q')?.value || '').toLowerCase();
  let data = [...scheduleAll];
  if (search) data = data.filter(s=>(s.employees?.full_name||s.employee_name||'').toLowerCase().includes(search));
  if (status !== '') data = data.filter(s=>String(s.is_active)===status);
  renderScheduleTable(data);
}

function renderScheduleTable(data) {
  const el = document.getElementById('sched-tbody'); if (!el) return;
  if (!data.length) {
    el.innerHTML = `<div class="empty-state" style="padding:40px">
      <div class="ico">🕐</div>
      <h3>Belum ada jadwal kerja</h3>
      <p>Tambah jadwal shift untuk setiap karyawan agar kapasitas harian bisa dihitung.</p>
      <button class="btn btn-teal" style="margin-top:14px" onclick="openScheduleForm()">+ Tambah Jadwal</button>
    </div>`; return;
  }

  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:left;border-bottom:1px solid var(--border)">KARYAWAN</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:left;border-bottom:1px solid var(--border)">SHIFT</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:center;border-bottom:1px solid var(--border)">JAM KERJA</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:center;border-bottom:1px solid var(--border)">KAPASITAS</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:left;border-bottom:1px solid var(--border)">HARI KERJA</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:center;border-bottom:1px solid var(--border)">STATUS</th>
          <th style="padding:10px 14px;background:var(--bg);font-size:11px;color:var(--text3);text-align:center;border-bottom:1px solid var(--border)">AKSI</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((s,i)=>{
          const empName = s.employees?.full_name || '—';
          const empDiv  = s.employees?.division || '';
          const hari    = (() => { try { return JSON.parse(s.hari_kerja||'[]'); } catch(e) { return []; } })();
          const kap     = parseFloat(s.kapasitas_jam||7).toFixed(1);
          const priMax  = (parseFloat(kap)*(s.primary_max_pct||80)/100).toFixed(1);
          return `
          <tr style="background:${i%2?'var(--bg2)':'#fff'};border-bottom:1px solid var(--border)">
            <td style="padding:12px 14px">
              <div style="font-weight:700;font-size:13px">${empName}</div>
              <div style="font-size:11px;color:var(--text3)">${empDiv}</div>
            </td>
            <td style="padding:12px 14px">
              <div style="font-weight:600">${s.shift_name}</div>
              ${s.notes?`<div style="font-size:11px;color:var(--text3)">${s.notes}</div>`:''}
            </td>
            <td style="padding:12px 14px;text-align:center">
              <div style="font-weight:700">${s.jam_masuk?.slice(0,5)||'—'} – ${s.jam_pulang?.slice(0,5)||'—'}</div>
              ${s.is_cross_midnight?'<div style="font-size:10px;color:var(--text3)">lintas tengah malam</div>':''}
            </td>
            <td style="padding:12px 14px;text-align:center">
              <div style="font-weight:800;font-size:15px;color:var(--teal)">${kap}j</div>
              <div style="font-size:10px;color:var(--text3)">Primary max ${priMax}j</div>
            </td>
            <td style="padding:12px 14px">
              <div style="display:flex;gap:3px;flex-wrap:wrap">
                ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`
                  <span style="padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;
                    background:${hari.includes(d)?'var(--teal)':'var(--bg2)'};
                    color:${hari.includes(d)?'#fff':'var(--text3)'}">
                    ${DAYS_LABEL[d]}
                  </span>`).join('')}
              </div>
            </td>
            <td style="padding:12px 14px;text-align:center">
              <span class="badge ${s.is_active?'badge-green':'badge-gray'}">
                ${s.is_active?'Aktif':'Non-Aktif'}
              </span>
            </td>
            <td style="padding:12px 14px;text-align:center">
              <div class="act-row" style="justify-content:center">
                <button class="act-btn edit" onclick="openScheduleForm(${s.id})">✏️</button>
                <button class="act-btn del" onclick="deleteSchedule(${s.id},'${empName}')">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── FORM JADWAL ────────────────────────────────────────────
async function openScheduleForm(id=null) {
  let s = {};
  if (id) { const d=await sbGet('work_schedules',`select=*&id=eq.${id}`); s=d[0]||{}; }
  const hari = (() => { try { return JSON.parse(s.hari_kerja||'["Mon","Tue","Wed","Thu","Fri"]'); } catch(e){ return ['Mon','Tue','Wed','Thu','Fri']; } })();

  const empOpts = scheduleEmpList.map(e=>`
    <option value="${e.id}" ${s.employee_id==e.id?'selected':''}>
      ${e.full_name} — ${e.division||'—'}
    </option>`).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">🕐 ${id?'Edit':'Tambah'} Jadwal Kerja</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-group">
      <label>Karyawan *</label>
      <select id="sf-emp"><option value="">-- Pilih Karyawan --</option>${empOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nama Shift *</label>
        <input type="text" id="sf-shift" value="${s.shift_name||''}" placeholder="Shift Pagi, Office Hours...">
      </div>
      <div class="form-group">
        <label>Prioritas Primary (%)</label>
        <input type="number" id="sf-pct" value="${s.primary_max_pct||80}" min="50" max="95">
        <div class="form-hint">Max alokasi Primary dari total kapasitas</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Jam Masuk *</label>
        <input type="time" id="sf-masuk" value="${s.jam_masuk?.slice(0,5)||'08:00'}" oninput="calcKapasitas()">
      </div>
      <div class="form-group">
        <label>Jam Pulang *</label>
        <input type="time" id="sf-pulang" value="${s.jam_pulang?.slice(0,5)||'17:00'}" oninput="calcKapasitas()">
      </div>
    </div>

    <div class="form-group">
      <label>Lintas Tengah Malam? (shift malam)</label>
      <select id="sf-cross" onchange="calcKapasitas()">
        <option value="false" ${!s.is_cross_midnight?'selected':''}>Tidak</option>
        <option value="true"  ${s.is_cross_midnight?'selected':''}>Ya (jam pulang hari berikutnya)</option>
      </select>
    </div>

    <div style="background:var(--teal-light);border-radius:var(--r);padding:10px 14px;margin-bottom:14px">
      <div style="font-size:12px;color:var(--teal);font-weight:700">⏱ Kapasitas Harian (auto)</div>
      <div style="font-size:18px;font-weight:800;color:var(--teal)" id="sf-kap-display">—</div>
      <div style="font-size:11px;color:var(--text3)" id="sf-kap-detail"></div>
    </div>

    <div class="form-group">
      <label>Hari Kerja *</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;
            padding:5px 10px;border-radius:6px;border:1.5px solid ${hari.includes(d)?'var(--teal)':'var(--border)'};
            background:${hari.includes(d)?'var(--teal-light)':'var(--bg2)'};transition:all .15s"
            onclick="toggleDay('${d}',this)">
            <input type="checkbox" id="day-${d}" ${hari.includes(d)?'checked':''} style="display:none">
            <span style="font-size:12px;font-weight:700;color:${hari.includes(d)?'var(--teal)':'var(--text3)'}">${DAYS_LABEL[d]}</span>
          </label>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label>Catatan</label>
      <input type="text" id="sf-notes" value="${s.notes||''}" placeholder="Catatan tambahan...">
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="sf-active">
        <option value="true"  ${s.is_active!==false?'selected':''}>Aktif</option>
        <option value="false" ${s.is_active===false?'selected':''}>Non-Aktif</option>
      </select>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveSchedule(${id||'null'})">💾 Simpan</button>
    </div>`);

  calcKapasitas();
}

function toggleDay(d, labelEl) {
  const cb = document.getElementById(`day-${d}`);
  if (!cb) return;
  cb.checked = !cb.checked;
  const active = cb.checked;
  labelEl.style.borderColor = active ? 'var(--teal)' : 'var(--border)';
  labelEl.style.background  = active ? 'var(--teal-light)' : 'var(--bg2)';
  labelEl.querySelector('span').style.color = active ? 'var(--teal)' : 'var(--text3)';
}

function calcKapasitas() {
  const masuk  = document.getElementById('sf-masuk')?.value;
  const pulang = document.getElementById('sf-pulang')?.value;
  const cross  = document.getElementById('sf-cross')?.value === 'true';
  const pct    = parseInt(document.getElementById('sf-pct')?.value||80);
  const disp   = document.getElementById('sf-kap-display');
  const detail = document.getElementById('sf-kap-detail');
  if (!masuk || !pulang || !disp) return;

  const [mh,mm] = masuk.split(':').map(Number);
  const [ph,pm] = pulang.split(':').map(Number);
  let totalMins = (ph*60+pm) - (mh*60+mm);
  if (cross || totalMins <= 0) totalMins += 24*60;
  const kapJam   = (totalMins/60) - 1; // minus 1 jam istirahat
  const priMax   = (kapJam * pct/100).toFixed(1);
  const secMax   = (kapJam * (100-pct)/100).toFixed(1);

  disp.textContent   = `${kapJam.toFixed(1)} jam/hari`;
  detail.textContent = `Primary max: ${priMax}j · Secondary: ${secMax}j`;
}

function applyShiftTemplate(tpl) {
  document.getElementById('sf-shift')?.setAttribute('value',tpl.name);
  if(document.getElementById('sf-shift')) document.getElementById('sf-shift').value = tpl.name;
  if(document.getElementById('sf-masuk')) document.getElementById('sf-masuk').value = tpl.masuk;
  if(document.getElementById('sf-pulang')) document.getElementById('sf-pulang').value = tpl.pulang;
  if(document.getElementById('sf-cross')) document.getElementById('sf-cross').value = tpl.cross?'true':'false';
  const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  allDays.forEach(d=>{
    const cb = document.getElementById(`day-${d}`);
    const lb = cb?.closest('label');
    if (!cb || !lb) return;
    const active = tpl.hari.includes(d);
    cb.checked = active;
    lb.style.borderColor = active ? 'var(--teal)' : 'var(--border)';
    lb.style.background  = active ? 'var(--teal-light)' : 'var(--bg2)';
    lb.querySelector('span').style.color = active ? 'var(--teal)' : 'var(--text3)';
  });
  calcKapasitas();
}

async function saveSchedule(id) {
  const empId  = document.getElementById('sf-emp')?.value;
  const shift  = document.getElementById('sf-shift')?.value.trim();
  const masuk  = document.getElementById('sf-masuk')?.value;
  const pulang = document.getElementById('sf-pulang')?.value;
  if (!empId)  { toast('Pilih karyawan dulu','err'); return; }
  if (!shift)  { toast('Nama shift wajib','err'); return; }
  if (!masuk||!pulang) { toast('Jam masuk & pulang wajib','err'); return; }

  const hari = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    .filter(d=>document.getElementById(`day-${d}`)?.checked);
  if (!hari.length) { toast('Pilih minimal 1 hari kerja','err'); return; }

  const payload = {
    employee_id:     parseInt(empId),
    shift_name:      shift,
    jam_masuk:       masuk,
    jam_pulang:      pulang,
    is_cross_midnight: document.getElementById('sf-cross')?.value === 'true',
    hari_kerja:      JSON.stringify(hari),
    primary_max_pct: parseInt(document.getElementById('sf-pct')?.value||80),
    notes:           document.getElementById('sf-notes')?.value.trim()||null,
    is_active:       document.getElementById('sf-active')?.value === 'true',
    created_by:      getUserName?getUserName():'User',
    updated_at:      new Date().toISOString(),
  };

  try {
    if (id) await sbPatch('work_schedules',id,payload);
    else    await sbPost('work_schedules',payload);
    toast('✅ Jadwal disimpan','ok');
    closeModalForce();
    await loadSchedules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteSchedule(id, name) {
  if (!confirm(`Hapus jadwal kerja ${name}?`)) return;
  try {
    await sbDelete('work_schedules',id);
    toast('🗑 Jadwal dihapus','info');
    await loadSchedules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Helper: get schedule for user ─────────────────────────
async function getMySchedule() {
  const user = getUserName?getUserName():'';
  try {
    const emps = await sbGet('employees',`select=id&full_name=eq.${encodeURIComponent(user)}&limit=1`);
    if (!emps?.length) return null;
    const scheds = await sbGet('work_schedules',`select=*&employee_id=eq.${emps[0].id}&is_active=eq.true&limit=1`);
    return scheds?.[0]||null;
  } catch(e) { return null; }
}
