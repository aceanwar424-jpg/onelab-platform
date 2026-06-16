// ═══════════════════════════════════════════════════════════════
// MODULE: Jadwal Kerja & Shift — v2
// Weekday vs Sabtu jam berbeda, rotasi P1↔P2 support
// ═══════════════════════════════════════════════════════════════

const SHIFT_TEMPLATES = [
  { name:'P1 – Shift 1',  code:'P1', masuk_wd:'09:00', pulang_wd:'17:00', masuk_sb:'08:00', pulang_sb:'14:00', hari:['Mon','Tue','Wed','Thu','Fri','Sat'] },
  { name:'P2 – Shift 2',  code:'P2', masuk_wd:'10:00', pulang_wd:'18:00', masuk_sb:'09:00', pulang_sb:'15:00', hari:['Mon','Tue','Wed','Thu','Fri','Sat'] },
  { name:'P3 – Shift 3',  code:'P3', masuk_wd:'08:00', pulang_wd:'16:00', masuk_sb:'08:00', pulang_sb:'13:00', hari:['Mon','Tue','Wed','Thu','Fri','Sat'] },
  { name:'OH – Office Hr', code:'OH', masuk_wd:'09:00', pulang_wd:'18:00', masuk_sb:null,   pulang_sb:null,   hari:['Mon','Tue','Wed','Thu','Fri'] },
  { name:'Shift Malam',   code:'ML', masuk_wd:'22:00', pulang_wd:'06:00', masuk_sb:'22:00', pulang_sb:'06:00', hari:['Mon','Tue','Wed','Thu','Fri','Sat'], cross:true },
];

const ROTATION_TYPES = [
  {value:'none',    label:'Tidak Rotasi (Tetap)'},
  {value:'weekly',  label:'Rotasi Mingguan (P1↔P2)'},
  {value:'biweekly',label:'Rotasi 2 Minggu Sekali'},
];

const DAYS_LABEL = {Mon:'Sen',Tue:'Sel',Wed:'Rab',Thu:'Kam',Fri:'Jum',Sat:'Sab',Sun:'Min'};

let scheduleAll = [], scheduleEmpList = [];

// ── RENDER UTAMA ──────────────────────────────────────────────
async function renderWorkSchedule() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>📅 Jadwal Kerja & Shift</h1>
        <p>Setup shift per karyawan — jam weekday vs sabtu, rotasi P1↔P2</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="seedScheduleFromExcel()">📥 Import dari Template</button>
        <button class="btn btn-teal" onclick="openScheduleForm()">+ Tambah Jadwal</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:20px" id="sched-kpi">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>

    <!-- Quick setup templates -->
    <div class="card" style="margin-bottom:18px">
      <div class="card-title" style="margin-bottom:12px">⚡ Quick Setup — Template Shift</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${SHIFT_TEMPLATES.map(t=>`
          <button class="btn btn-ghost btn-sm" onclick='applyShiftTemplate(${JSON.stringify(t).replace(/'/g,"&apos;")})'>
            ${t.name} (${t.masuk_wd}–${t.pulang_wd})
          </button>`).join('')}
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div class="table-toolbar">
        <input class="table-search" id="sched-q" placeholder="Cari nama karyawan..."
          oninput="filterSchedule(this.value)" style="flex:1">
        <select class="table-filter" id="sched-shift" onchange="filterSchedule()">
          <option value="">Semua Shift</option>
          ${SHIFT_TEMPLATES.map(t=>`<option value="${t.code}">${t.name}</option>`).join('')}
        </select>
      </div>
      <div id="sched-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>`;

  await loadSchedules();
}

async function loadSchedules() {
  try {
    const [scheds, emps] = await Promise.all([
      sbGet('work_schedules','select=*,employees(id,full_name,division,position)&order=created_at.desc').catch(()=>[]),
      sbGet('employees','select=id,full_name,division,position&status=eq.Aktif&order=full_name').catch(()=>[]),
    ]);
    scheduleAll     = Array.isArray(scheds) ? scheds : [];
    scheduleEmpList = Array.isArray(emps)   ? emps   : [];
    renderScheduleKPI();
    filterSchedule();
  } catch(e) {
    document.getElementById('sched-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderScheduleKPI() {
  const el = document.getElementById('sched-kpi'); if (!el) return;
  const active     = scheduleAll.filter(s=>s.is_active).length;
  const withRot    = scheduleAll.filter(s=>s.rotation_type&&s.rotation_type!=='none').length;
  const empWithSch = new Set(scheduleAll.filter(s=>s.employee_id).map(s=>s.employee_id)).size;
  const avgKap     = scheduleAll.length
    ? (scheduleAll.reduce((s,x)=>s+(calcKapFromSchedule(x)||7),0)/scheduleAll.length).toFixed(1) : '0';

  el.innerHTML = [
    {icon:'📋', val:scheduleAll.length, label:'Total Jadwal',       color:'#0891B2'},
    {icon:'✅', val:active,             label:'Jadwal Aktif',       color:'#22C55E'},
    {icon:'👥', val:empWithSch,         label:'Karyawan Terjadwal', color:'#7C3AED'},
    {icon:'🔄', val:withRot,            label:'Dengan Rotasi',      color:'#F59E0B'},
    {icon:'⏱', val:avgKap+'j',          label:'Rata-rata Kapasitas',color:'#06B6D4'},
  ].map(k=>`
    <div class="kpi-card" style="border-top:3px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.color}18;font-size:18px">${k.icon}</div>
      <div><div class="kpi-val" style="font-size:20px">${k.val}</div>
      <div class="kpi-label">${k.label}</div></div>
    </div>`).join('');
}

function calcKapFromSchedule(s) {
  const masuk  = s.jam_masuk_weekday;
  const pulang = s.jam_pulang_weekday;
  if (!masuk || !pulang) return 7;
  const [mh,mm] = masuk.slice(0,5).split(':').map(Number);
  const [ph,pm] = pulang.slice(0,5).split(':').map(Number);
  let mins = (ph*60+pm) - (mh*60+mm);
  if (s.is_cross_midnight || mins <= 0) mins += 24*60;
  return Math.max(0, (mins/60) - 1);
}

function filterSchedule(q='') {
  const shift  = document.getElementById('sched-shift')?.value||'';
  const search = (q || document.getElementById('sched-q')?.value || '').toLowerCase();
  let data = [...scheduleAll];
  if (search) data = data.filter(s=>(s.employees?.full_name||'').toLowerCase().includes(search));
  if (shift)  data = data.filter(s=>s.shift_code===shift);
  renderScheduleTable(data);
}

function renderScheduleTable(data) {
  const el = document.getElementById('sched-tbody'); if (!el) return;
  if (!data.length) {
    el.innerHTML = `<div class="empty-state" style="padding:40px">
      <div class="ico">📅</div><h3>Belum ada jadwal kerja</h3>
      <p>Klik "+ Tambah Jadwal" atau "Import dari Template"</p>
      <button class="btn btn-teal" style="margin-top:14px" onclick="openScheduleForm()">+ Tambah Jadwal</button>
    </div>`; return;
  }

  const ROT_COLORS = {none:'var(--bg2)',weekly:'#EDE9FE',biweekly:'#FEF3C7'};

  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        ${['KARYAWAN','SHIFT','WEEKDAY','SABTU','KAPASITAS/HARI','HARI KERJA','ROTASI','AKSI'].map(h=>`
          <th style="padding:9px 12px;background:var(--bg);font-size:11px;color:var(--text3);
            text-align:left;border-bottom:1px solid var(--border)">${h}</th>`).join('')}
      </tr></thead>
      <tbody>
        ${data.map((s,i)=>{
          const empName = s.employees?.full_name||'—';
          const hari    = (() => { try { return JSON.parse(s.hari_kerja||'[]'); } catch(e){ return []; } })();
          const kap     = calcKapFromSchedule(s).toFixed(1);
          const kapSab  = s.jam_masuk_sabtu && s.jam_pulang_sabtu
            ? calcKapFromSchedule({jam_masuk_weekday:s.jam_masuk_sabtu, jam_pulang_weekday:s.jam_pulang_sabtu, is_cross_midnight:false}).toFixed(1)
            : null;
          const rotLbl  = ROTATION_TYPES.find(r=>r.value===(s.rotation_type||'none'))?.label||'Tetap';
          return `
            <tr style="background:${i%2?'var(--bg2)':'#fff'};border-bottom:1px solid var(--border)">
              <td style="padding:10px 12px">
                <div style="font-weight:700;font-size:13px">${empName}</div>
                <div style="font-size:11px;color:var(--text3)">${s.employees?.division||''}</div>
              </td>
              <td style="padding:10px 12px">
                <div style="font-weight:600">${s.shift_name}</div>
                <span class="badge badge-teal" style="font-size:10px">${s.shift_code||'—'}</span>
              </td>
              <td style="padding:10px 12px;font-weight:700">
                ${s.jam_masuk_weekday?.slice(0,5)||'—'} – ${s.jam_pulang_weekday?.slice(0,5)||'—'}
              </td>
              <td style="padding:10px 12px">
                ${s.jam_masuk_sabtu
                  ? `<span style="font-size:12px">${s.jam_masuk_sabtu.slice(0,5)} – ${s.jam_pulang_sabtu?.slice(0,5)||'—'}</span>`
                  : '<span style="color:var(--text3);font-size:11px">OFF</span>'}
              </td>
              <td style="padding:10px 12px;text-align:center">
                <div style="font-size:15px;font-weight:800;color:var(--teal)">${kap}j</div>
                ${kapSab?`<div style="font-size:10px;color:var(--text3)">Sab: ${kapSab}j</div>`:''}
              </td>
              <td style="padding:10px 12px">
                <div style="display:flex;gap:2px;flex-wrap:wrap">
                  ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`
                    <span style="padding:2px 5px;border-radius:4px;font-size:10px;font-weight:700;
                      background:${hari.includes(d)?'var(--teal)':'var(--bg2)'};
                      color:${hari.includes(d)?'#fff':'var(--text3)'}">${DAYS_LABEL[d]}</span>`).join('')}
                </div>
              </td>
              <td style="padding:10px 12px">
                <div style="background:${ROT_COLORS[s.rotation_type||'none']};padding:3px 8px;
                  border-radius:6px;font-size:11px;font-weight:600">${rotLbl}</div>
              </td>
              <td style="padding:10px 12px">
                <div class="act-row">
                  <button class="act-btn edit" onclick="openScheduleForm(${s.id})">✏️</button>
                  <button class="act-btn del" onclick="deleteSchedule(${s.id},'${(empName||'').replace(/'/g,'').slice(0,20)}')">🗑</button>
                </div>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── FORM ──────────────────────────────────────────────────────
async function openScheduleForm(id=null) {
  let s = {};
  if (id) { const d=await sbGet('work_schedules',`select=*&id=eq.${id}`); s=d[0]||{}; }
  const hari = (() => { try { return JSON.parse(s.hari_kerja||'["Mon","Tue","Wed","Thu","Fri"]'); } catch(e){ return ['Mon','Tue','Wed','Thu','Fri']; } })();

  const empOpts = scheduleEmpList.map(e=>`
    <option value="${e.id}" ${s.employee_id==e.id?'selected':''}>${e.full_name} — ${e.division||'—'}</option>`).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">📅 ${id?'Edit':'Tambah'} Jadwal Shift</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Karyawan *</label>
        <select id="sf-emp"><option value="">-- Pilih --</option>${empOpts}</select>
      </div>
      <div class="form-group">
        <label>Kode Shift</label>
        <select id="sf-code">
          ${SHIFT_TEMPLATES.map(t=>`<option value="${t.code}" ${(s.shift_code||'P1')===t.code?'selected':''}>${t.code} — ${t.name}</option>`).join('')}
          <option value="CUSTOM" ${s.shift_code==='CUSTOM'?'selected':''}>CUSTOM</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Nama Shift *</label>
      <input type="text" id="sf-shift" value="${s.shift_name||''}">
    </div>

    <div class="section-label">Jam Kerja Senin–Jumat</div>
    <div class="form-row">
      <div class="form-group">
        <label>Jam Masuk *</label>
        <input type="time" id="sf-masuk-wd" value="${s.jam_masuk_weekday?.slice(0,5)||'09:00'}" oninput="calcSchedKapasitas()">
      </div>
      <div class="form-group">
        <label>Jam Pulang *</label>
        <input type="time" id="sf-pulang-wd" value="${s.jam_pulang_weekday?.slice(0,5)||'17:00'}" oninput="calcSchedKapasitas()">
      </div>
    </div>

    <div class="section-label">Jam Kerja Sabtu (kosongkan jika OFF)</div>
    <div class="form-row">
      <div class="form-group">
        <label>Jam Masuk Sabtu</label>
        <input type="time" id="sf-masuk-sb" value="${s.jam_masuk_sabtu?.slice(0,5)||''}" oninput="calcSchedKapasitas()">
        <div class="form-hint">Kosongkan jika Sabtu libur</div>
      </div>
      <div class="form-group">
        <label>Jam Pulang Sabtu</label>
        <input type="time" id="sf-pulang-sb" value="${s.jam_pulang_sabtu?.slice(0,5)||''}" oninput="calcSchedKapasitas()">
      </div>
    </div>

    <div class="form-group">
      <label>Lintas Tengah Malam (shift malam)?</label>
      <select id="sf-cross" onchange="calcSchedKapasitas()">
        <option value="false" ${!s.is_cross_midnight?'selected':''}>Tidak</option>
        <option value="true"  ${s.is_cross_midnight?'selected':''}>Ya</option>
      </select>
    </div>

    <div style="background:var(--teal-light);border-radius:var(--r);padding:10px 14px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--teal)">⏱ Kapasitas Harian</div>
      <div id="sched-kap-display" style="font-size:16px;font-weight:800;color:var(--teal)">—</div>
      <div id="sched-kap-detail" style="font-size:11px;color:var(--text3)"></div>
    </div>

    <div class="form-group">
      <label>Hari Kerja</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`
          <label id="day-lbl-${d}" style="display:flex;align-items:center;gap:4px;cursor:pointer;
            padding:5px 10px;border-radius:6px;transition:all .15s;
            border:1.5px solid ${hari.includes(d)?'var(--teal)':'var(--border)'};
            background:${hari.includes(d)?'var(--teal-light)':'var(--bg2)'}">
            <input type="checkbox" id="day-${d}" ${hari.includes(d)?'checked':''} style="display:none">
            <span id="day-txt-${d}" style="font-size:12px;font-weight:700;
              color:${hari.includes(d)?'var(--teal)':'var(--text3)'}">${DAYS_LABEL[d]}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Tipe Rotasi</label>
        <select id="sf-rotation">
          ${ROTATION_TYPES.map(r=>`<option value="${r.value}" ${(s.rotation_type||'none')===r.value?'selected':''}>${r.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Primary Max (%)</label>
        <input type="number" id="sf-pct" value="${s.primary_max_pct||80}" min="50" max="95">
      </div>
    </div>
    <div class="form-group">
      <label>Catatan</label>
      <input type="text" id="sf-notes" value="${s.notes||''}">
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

  // Wire day toggles
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>{
    document.getElementById(`day-lbl-${d}`)?.addEventListener('click', ()=>{
      const cb  = document.getElementById(`day-${d}`);
      const lbl = document.getElementById(`day-lbl-${d}`);
      const txt = document.getElementById(`day-txt-${d}`);
      if (!cb||!lbl||!txt) return;
      cb.checked = !cb.checked;
      lbl.style.borderColor = cb.checked ? 'var(--teal)' : 'var(--border)';
      lbl.style.background  = cb.checked ? 'var(--teal-light)' : 'var(--bg2)';
      txt.style.color       = cb.checked ? 'var(--teal)' : 'var(--text3)';
    });
  });
  calcSchedKapasitas();
}

function calcSchedKapasitas() {
  const masuk  = document.getElementById('sf-masuk-wd')?.value;
  const pulang = document.getElementById('sf-pulang-wd')?.value;
  const masukSb= document.getElementById('sf-masuk-sb')?.value;
  const pulangSb=document.getElementById('sf-pulang-sb')?.value;
  const cross  = document.getElementById('sf-cross')?.value === 'true';
  const pct    = parseInt(document.getElementById('sf-pct')?.value||80);
  const disp   = document.getElementById('sched-kap-display');
  const detail = document.getElementById('sched-kap-detail');
  if (!masuk||!pulang||!disp) return;

  const calcKap = (m, p, cr) => {
    if (!m||!p) return null;
    const [mh,mm] = m.split(':').map(Number);
    const [ph,pm] = p.split(':').map(Number);
    let mins = (ph*60+pm)-(mh*60+mm);
    if (cr||mins<=0) mins += 24*60;
    return Math.max(0,(mins/60)-1);
  };

  const kapWd   = calcKap(masuk,pulang,cross);
  const kapSb   = calcKap(masukSb,pulangSb,false);
  const priMaxWd= (kapWd*(pct/100)).toFixed(1);

  disp.textContent = `${kapWd?.toFixed(1)||'?'}j/hari${kapSb?` · Sabtu: ${kapSb.toFixed(1)}j`:''}`;
  detail.textContent= `Primary max: ${priMaxWd}j · Secondary: ${(kapWd*(1-pct/100)).toFixed(1)}j`;
}

function applyShiftTemplate(tpl) {
  if (document.getElementById('sf-shift'))   document.getElementById('sf-shift').value   = tpl.name;
  if (document.getElementById('sf-code'))    document.getElementById('sf-code').value    = tpl.code;
  if (document.getElementById('sf-masuk-wd')) document.getElementById('sf-masuk-wd').value = tpl.masuk_wd;
  if (document.getElementById('sf-pulang-wd'))document.getElementById('sf-pulang-wd').value= tpl.pulang_wd;
  if (document.getElementById('sf-masuk-sb')) document.getElementById('sf-masuk-sb').value = tpl.masuk_sb||'';
  if (document.getElementById('sf-pulang-sb'))document.getElementById('sf-pulang-sb').value= tpl.pulang_sb||'';
  if (document.getElementById('sf-cross'))   document.getElementById('sf-cross').value   = tpl.cross?'true':'false';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>{
    const cb  = document.getElementById(`day-${d}`);
    const lbl = document.getElementById(`day-lbl-${d}`);
    const txt = document.getElementById(`day-txt-${d}`);
    if (!cb||!lbl||!txt) return;
    cb.checked = tpl.hari.includes(d);
    lbl.style.borderColor = cb.checked?'var(--teal)':'var(--border)';
    lbl.style.background  = cb.checked?'var(--teal-light)':'var(--bg2)';
    txt.style.color       = cb.checked?'var(--teal)':'var(--text3)';
  });
  calcSchedKapasitas();
}

async function saveSchedule(id) {
  const empId   = document.getElementById('sf-emp')?.value;
  const shift   = document.getElementById('sf-shift')?.value.trim();
  const masukWd = document.getElementById('sf-masuk-wd')?.value;
  const pulangWd= document.getElementById('sf-pulang-wd')?.value;
  if (!empId)     { toast('Pilih karyawan','err'); return; }
  if (!shift)     { toast('Nama shift wajib','err'); return; }
  if (!masukWd||!pulangWd) { toast('Jam weekday wajib diisi','err'); return; }

  const hari = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].filter(d=>document.getElementById(`day-${d}`)?.checked);
  if (!hari.length) { toast('Pilih minimal 1 hari kerja','err'); return; }

  const masukSb = document.getElementById('sf-masuk-sb')?.value||null;
  const pulangSb= document.getElementById('sf-pulang-sb')?.value||null;

  const payload = {
    employee_id:       parseInt(empId),
    shift_name:        shift,
    shift_code:        document.getElementById('sf-code')?.value||'P1',
    jam_masuk_weekday: masukWd,
    jam_pulang_weekday:pulangWd,
    jam_masuk_sabtu:   masukSb,
    jam_pulang_sabtu:  pulangSb,
    is_cross_midnight: document.getElementById('sf-cross')?.value==='true',
    hari_kerja:        JSON.stringify(hari),
    primary_max_pct:   parseInt(document.getElementById('sf-pct')?.value||80),
    rotation_type:     document.getElementById('sf-rotation')?.value||'none',
    notes:             document.getElementById('sf-notes')?.value.trim()||null,
    is_active:         document.getElementById('sf-active')?.value==='true',
    created_by:        getUserName?getUserName():'User',
    updated_at:        new Date().toISOString(),
  };

  try {
    if (id) await sbPatch('work_schedules',id,payload);
    else    await sbPost('work_schedules',{...payload,created_at:new Date().toISOString()});
    toast('✅ Jadwal disimpan','ok');
    closeModalForce();
    await loadSchedules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteSchedule(id, name) {
  if (!confirm(`Hapus jadwal ${name}?`)) return;
  try { await sbDelete('work_schedules',id); toast('🗑 Dihapus','info'); await loadSchedules(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// Import dari data Excel
async function seedScheduleFromExcel() {
  const seed = [
    {name:'Ace Darojatun Anwar',  shift:'OH – Office Hr', code:'OH'},
    {name:'dr. Laras Sheila Andini',shift:'OH – Office Hr', code:'OH'},
    {name:'Farenty',              shift:'P1 – Shift 1',   code:'P1'},
    {name:'Nurul',                shift:'P2 – Shift 2',   code:'P2', rotation:'weekly'},
    {name:'Faiz Prasetyo',        shift:'P1 – Shift 1',   code:'P1', rotation:'weekly'},
    {name:'Hilmi',                shift:'P1 – Shift 1',   code:'P1', rotation:'weekly'},
    {name:'Prayitno',             shift:'P3 – Shift 3',   code:'P3'},
    {name:'Dado',                 shift:'P2 – Shift 2',   code:'P2'},
    {name:'Reza',                 shift:'P1 – Shift 1',   code:'P1'},
  ];
  const emps = scheduleEmpList;
  let added=0, skipped=0;
  const user = getUserName?getUserName():'System';

  for (const item of seed) {
    const emp = emps.find(e=>e.full_name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
    if (!emp) { skipped++; continue; }
    const tpl = SHIFT_TEMPLATES.find(t=>t.code===item.code)||SHIFT_TEMPLATES[0];
    const hari= tpl.hari||['Mon','Tue','Wed','Thu','Fri'];
    const ex  = scheduleAll.find(s=>s.employee_id===emp.id);
    if (ex)   { skipped++; continue; }

    await sbPost('work_schedules',{
      employee_id:        emp.id,
      shift_name:         tpl.name,
      shift_code:         item.code,
      jam_masuk_weekday:  tpl.masuk_wd,
      jam_pulang_weekday: tpl.pulang_wd,
      jam_masuk_sabtu:    tpl.masuk_sb||null,
      jam_pulang_sabtu:   tpl.pulang_sb||null,
      is_cross_midnight:  tpl.cross||false,
      hari_kerja:         JSON.stringify(hari),
      primary_max_pct:    80,
      rotation_type:      item.rotation||'none',
      is_active:          true,
      created_by:         user,
      created_at:         new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    }).catch(()=>{ skipped++; });
    added++;
  }
  toast(`✅ ${added} jadwal diimport dari template Excel, ${skipped} dilewati`,'ok');
  await loadSchedules();
}

// ── Helper: get schedule for current user ─────────────────────
async function getMySchedule() {
  const user = getUserName?getUserName():'';
  try {
    const emps = await sbGet('employees',`select=id&full_name=eq.${encodeURIComponent(user)}&limit=1`);
    if (!emps?.length) return null;
    const scheds = await sbGet('work_schedules',
      `select=*&employee_id=eq.${emps[0].id}&is_active=eq.true&limit=1`);
    return scheds?.[0]||null;
  } catch(e) { return null; }
}
