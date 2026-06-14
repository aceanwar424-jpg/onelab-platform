// ═══════════════════════════════════════════
// MODULE: Project MCU v1
// - Kalkulator RAB inline
// - 25 Tahapan dengan form per tahap
// - Tracking progress visual
// - Inline dengan Lead → Deal → Partner chain
// ═══════════════════════════════════════════

// ── 25 TAHAPAN MCU ───────────────────────────
const MCU_STEPS = [
  // PRE-PROJECT
  { no:1,  group:'Pre-Project',  name:'Deal & Negosiasi',          pic:'Sales',    icon:'🤝', fields:['nilai_deal','tipe_layanan','catatan_negosiasi'] },
  { no:2,  group:'Pre-Project',  name:'Input Data Peserta',        pic:'Sales',    icon:'👥', fields:['jumlah_peserta','nama_perusahaan','contact_hr','list_peserta'] },
  { no:3,  group:'Pre-Project',  name:'Survei Lokasi',             pic:'SPV',      icon:'📍', fields:['alamat_lokasi','akses_lokasi','fasilitas_tersedia','foto_lokasi'] },
  { no:4,  group:'Pre-Project',  name:'Buat RAB',                  pic:'SPV',      icon:'💰', fields:['rab_peserta','rab_paket','rab_total','rab_harga_per_orang'] },
  { no:5,  group:'Pre-Project',  name:'Approval RAB',              pic:'Manager',  icon:'✅', fields:['approved_by','approval_date','approval_notes','margin_pct'] },
  { no:6,  group:'Pre-Project',  name:'Buat Proposal MCU',         pic:'Sales',    icon:'📋', fields:['proposal_file','proposal_notes'] },
  { no:7,  group:'Pre-Project',  name:'Kirim Proposal ke Partner', pic:'Sales',    icon:'📤', fields:['tanggal_kirim','penerima','metode_kirim'] },
  { no:8,  group:'Pre-Project',  name:'Negosiasi Final & Revisi',  pic:'Sales',    icon:'🔄', fields:['revisi_notes','harga_final','perubahan_scope'] },
  { no:9,  group:'Pre-Project',  name:'Tanda Tangan MOU/SPK',      pic:'Manager',  icon:'📜', fields:['mou_number','tanggal_ttd','file_mou','penandatangan'] },
  // PERSIAPAN
  { no:10, group:'Persiapan',    name:'Konfirmasi Jadwal',         pic:'SPV',      icon:'📅', fields:['tanggal_mcu','jam_mulai','jam_selesai','konfirmasi_partner'] },
  { no:11, group:'Persiapan',    name:'Persiapan Reagen & Alkes',  pic:'Lab',      icon:'🧪', fields:['list_reagen','qty_reagen','status_stok','catatan_lab'] },
  { no:12, group:'Persiapan',    name:'Persiapan SDM & Tim',       pic:'SPV',      icon:'👨‍⚕️', fields:['list_tim','peran_tim','jadwal_tim','briefing_date'] },
  { no:13, group:'Persiapan',    name:'Briefing Tim',              pic:'SPV',      icon:'📢', fields:['materi_briefing','peserta_briefing','tanggal_briefing','catatan'] },
  { no:14, group:'Persiapan',    name:'Konfirmasi Peserta ke Partner', pic:'Sales', icon:'📞', fields:['jumlah_konfirmasi','perubahan_peserta','komunikasi_hr'] },
  // EKSEKUSI
  { no:15, group:'Eksekusi',     name:'Mobilisasi ke Lokasi',      pic:'SPV',      icon:'🚗', fields:['waktu_berangkat','armada','checklist_alat','catatan_mobilisasi'] },
  { no:16, group:'Eksekusi',     name:'Setup & Registrasi Peserta',pic:'Tim',      icon:'🏗️', fields:['waktu_setup','jumlah_registrasi','kendala_setup'] },
  { no:17, group:'Eksekusi',     name:'Pengambilan Sampel',        pic:'Analis',   icon:'💉', fields:['waktu_mulai','waktu_selesai','jumlah_diambil','catatan_sampling'] },
  { no:18, group:'Eksekusi',     name:'Pengiriman Sampel ke Lab',  pic:'Analis',   icon:'📦', fields:['waktu_kirim','jumlah_sampel','pengantar','tanda_terima'] },
  { no:19, group:'Eksekusi',     name:'Pemeriksaan di Lab',        pic:'Analis',   icon:'🔬', fields:['waktu_mulai_lab','alat_dipakai','catatan_analis','qc_status'] },
  { no:20, group:'Eksekusi',     name:'Input Hasil ke Sistem',     pic:'Analis',   icon:'💻', fields:['jumlah_input','waktu_input','catatan_input'] },
  // PASCA
  { no:21, group:'Pasca',        name:'QC & Validasi Hasil',       pic:'Dokter',   icon:'🔍', fields:['dokter_validator','tanggal_validasi','hasil_qc','catatan_qc'] },
  { no:22, group:'Pasca',        name:'Generate Laporan MCU',      pic:'Dokter',   icon:'📊', fields:['template_laporan','format_output','file_laporan','catatan_laporan'] },
  { no:23, group:'Pasca',        name:'Kirim Laporan ke Partner',  pic:'Sales',    icon:'📨', fields:['tanggal_kirim','penerima_laporan','metode_pengiriman','konfirmasi_terima'] },
  { no:24, group:'Pasca',        name:'Invoice & Penagihan',       pic:'Finance',  icon:'💵', fields:['nomor_invoice','jumlah_tagihan','tanggal_jatuh_tempo','status_bayar'] },
  { no:25, group:'Pasca',        name:'Evaluasi & Dokumentasi',    pic:'Manager',  icon:'📝', fields:['rating_partner','lessons_learned','dokumentasi_foto','rekomendasi'] },
];

const MCU_GROUPS   = ['Pre-Project','Persiapan','Eksekusi','Pasca'];
const GROUP_COLORS = { 'Pre-Project':'#0EA5E9','Persiapan':'#8B5CF6','Eksekusi':'#22C55E','Pasca':'#F59E0B' };
const STEP_STATUS  = ['Pending','In Progress','Done','Blocked'];

// RAB Item categories
const RAB_CATEGORIES = [
  { cat:'Reagen & Consumables', icon:'🧪', items:[
    {name:'Tabung Vacutainer (set)',unit:'pcs',price:8000},
    {name:'Lancet / Jarum',unit:'pcs',price:3000},
    {name:'Alkohol Swab',unit:'pcs',price:500},
    {name:'Kapas',unit:'gram',price:200},
    {name:'Plester',unit:'pcs',price:1000},
    {name:'Sarung Tangan Latex',unit:'box',price:120000},
    {name:'Masker',unit:'pcs',price:3000},
    {name:'Reagen Gula Darah',unit:'test',price:15000},
    {name:'Reagen Kolesterol',unit:'test',price:25000},
    {name:'Reagen Asam Urat',unit:'test',price:20000},
    {name:'Reagen HbA1c',unit:'test',price:85000},
    {name:'Strip/Reagent Lainnya',unit:'test',price:0},
  ]},
  { cat:'SDM & Honorarium', icon:'👨‍⚕️', items:[
    {name:'Dokter (per hari)',unit:'orang/hari',price:1500000},
    {name:'Analis Medis (per hari)',unit:'orang/hari',price:800000},
    {name:'Perawat/Bidan (per hari)',unit:'orang/hari',price:600000},
    {name:'Admin/Registrasi (per hari)',unit:'orang/hari',price:400000},
    {name:'Driver/Kurir Sampel',unit:'orang/hari',price:350000},
    {name:'SPV Project (per hari)',unit:'orang/hari',price:1000000},
  ]},
  { cat:'Transport & Logistik', icon:'🚗', items:[
    {name:'Sewa Kendaraan Operasional',unit:'hari',price:500000},
    {name:'BBM & Tol',unit:'trip',price:150000},
    {name:'Pengiriman Sampel (ekspres)',unit:'trip',price:100000},
    {name:'Sewa Box Cooler Sampel',unit:'unit',price:50000},
  ]},
  { cat:'Konsumsi Tim', icon:'🍱', items:[
    {name:'Makan Siang Tim',unit:'orang',price:35000},
    {name:'Snack/Air Minum',unit:'orang',price:15000},
  ]},
  { cat:'Alkes & Peralatan', icon:'⚕️', items:[
    {name:'Sewa/Pakai Tensimeter Digital',unit:'unit/hari',price:50000},
    {name:'Sewa EKG',unit:'unit/hari',price:200000},
    {name:'Sewa Spirometer',unit:'unit/hari',price:150000},
    {name:'Sewa Timbangan & Meteran',unit:'unit/hari',price:30000},
    {name:'Wadah Limbah Medis (safety box)',unit:'pcs',price:25000},
  ]},
  { cat:'Overhead & Operasional', icon:'🏢', items:[
    {name:'Biaya Admin & Dokumen',unit:'project',price:200000},
    {name:'Cetakan Hasil Lab (per orang)',unit:'orang',price:5000},
    {name:'Amplop & ATK',unit:'set',price:50000},
    {name:'Koordinasi & Komunikasi',unit:'project',price:100000},
  ]},
  { cat:'Kas Gantung & Payment', icon:'💳', items:[
    {name:'Fee Payment Gateway Xendit (2.5%)',unit:'%',price:0},
    {name:'Biaya Transfer Bank',unit:'transaksi',price:7000},
    {name:'Cadangan Tak Terduga (3%)',unit:'%',price:0},
  ]},
];

let mcuProjects = [];
let mcuCurrentId = null;

// ── RENDER MCU LIST ───────────────────────────
async function renderMCU(params={}) {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>Project MCU</h1>
        <p>Manajemen project MCU — dari RAB sampai laporan, 25 tahapan tracking</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="navigate('partners')">🤝 Partner</button>
        <button class="btn btn-teal" onclick="openMCUForm()">+ Buat Project MCU</button>
      </div>
    </div>

    <!-- Summary KPI -->
    <div id="mcu-kpi" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px">
      <div class="loading-row" style="grid-column:1/-1;padding:20px"><div class="spinner"></div></div>
    </div>

    <!-- Filter -->
    <div class="table-toolbar" style="background:#fff;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap">
      <input class="table-search" id="mcu-q" placeholder="🔍 Cari nama project, partner..."
        oninput="filterMCU()" style="flex:1;min-width:180px">
      <select class="table-filter" id="mcu-status" onchange="filterMCU()">
        <option value="">Semua Status</option>
        <option>Planning</option><option>Active</option><option>Completed</option><option>Cancelled</option>
      </select>
      <select class="table-filter" id="mcu-type" onchange="filterMCU()">
        <option value="">Semua Tipe</option>
        <option>MCU</option><option>HealthDay</option><option>Screening</option><option>Wellness</option>
      </select>
    </div>

    <!-- Project List -->
    <div id="mcu-list">
      <div class="loading-row"><div class="spinner"></div></div>
    </div>`;

  await loadMCUProjects();
  if (params.project_id) openMCUDetail(params.project_id);
}

async function loadMCUProjects() {
  try {
    const data = await sbGet('projects','select=*&order=created_at.desc');
    mcuProjects = Array.isArray(data) ? data : [];
    renderMCUKPI();
    renderMCUList(mcuProjects);
  } catch(e) {
    document.getElementById('mcu-list').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderMCUKPI() {
  const el = document.getElementById('mcu-kpi');
  if (!el) return;
  const active    = mcuProjects.filter(p=>p.status==='Active').length;
  const completed = mcuProjects.filter(p=>p.status==='Completed').length;
  const planning  = mcuProjects.filter(p=>p.status==='Planning').length;
  const totalVal  = mcuProjects.reduce((s,p)=>s+(p.value||0),0);
  const totalRab  = mcuProjects.reduce((s,p)=>s+(p.rab_total||0),0);

  el.innerHTML = [
    {icon:'📋',val:mcuProjects.length, label:'Total Project',  color:'#0A2342'},
    {icon:'🔥',val:active,             label:'Aktif',          color:'#22C55E'},
    {icon:'📅',val:planning,           label:'Planning',       color:'#0EA5E9'},
    {icon:'✅',val:completed,          label:'Selesai',        color:'#8B5CF6'},
    {icon:'💰',val:formatCurrency(totalVal), label:'Total Nilai', color:'#F59E0B'},
    {icon:'📊',val:formatCurrency(totalRab), label:'Total RAB',   color:'#EF4444'},
  ].map(k=>`
    <div style="background:#fff;border-radius:10px;padding:12px 14px;border:1px solid var(--border);border-left:4px solid ${k.color}">
      <div style="font-size:18px;font-weight:800;color:${k.color}">${k.val}</div>
      <div style="font-size:11px;color:var(--gray);margin-top:2px">${k.label}</div>
    </div>`).join('');
}

function filterMCU() {
  const q  = document.getElementById('mcu-q')?.value.toLowerCase()||'';
  const st = document.getElementById('mcu-status')?.value||'';
  const tp = document.getElementById('mcu-type')?.value||'';
  const filtered = mcuProjects.filter(p=>
    (!q  || (p.project_name||'').toLowerCase().includes(q)||(p.partner_name||'').toLowerCase().includes(q)) &&
    (!st || p.status===st) &&
    (!tp || p.project_type===tp)
  );
  renderMCUList(filtered);
}

function renderMCUList(projects) {
  const el = document.getElementById('mcu-list');
  if (!projects.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="ico">🏥</div>
        <h3>${mcuProjects.length?'Tidak ada hasil':'Belum ada project MCU'}</h3>
        <p>Buat project MCU baru atau convert dari Output Kerjasama di Partner Database.</p>
        <button class="btn btn-teal" style="margin-top:12px" onclick="openMCUForm()">+ Buat Project</button>
      </div>`; return;
  }

  el.innerHTML = projects.map(p => {
    const stColors = {Planning:'#0EA5E9',Active:'#22C55E',Completed:'#8B5CF6',Cancelled:'#EF4444'};
    const stColor  = stColors[p.status]||'#94A3B8';
    const progress = p.current_step ? Math.round((p.current_step/25)*100) : 0;
    const groupIdx = p.current_step ? MCU_STEPS[p.current_step-1]?.group : 'Planning';
    const groupColor = GROUP_COLORS[groupIdx]||'#94A3B8';
    const daysLeft = p.end_date ?
      Math.ceil((new Date(p.end_date)-new Date())/86400000) : null;

    return `
      <div class="card" style="margin-bottom:12px;cursor:pointer"
        onclick="openMCUDetail(${p.id})"
        onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,.12)'"
        onmouseout="this.style.boxShadow=''">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <!-- Status indicator -->
          <div style="width:4px;height:70px;border-radius:2px;background:${stColor};flex-shrink:0;margin-top:4px"></div>

          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--navy)">${p.project_name||'—'}</div>
                <div style="font-size:12px;color:var(--gray);margin-top:2px">
                  🏢 ${p.partner_name||'—'} &nbsp;·&nbsp;
                  ${p.project_type||'MCU'} &nbsp;·&nbsp;
                  👤 ${p.pic_onelab||'—'}
                </div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
                <span style="background:${stColor}20;color:${stColor};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700">
                  ${p.status}
                </span>
                ${daysLeft!==null?`
                  <span style="background:${daysLeft<7?'#FFEBEE':daysLeft<14?'#FFF8E1':'#E8F5E9'};
                    color:${daysLeft<7?'#C62828':daysLeft<14?'#F57F17':'#2E7D32'};
                    padding:3px 8px;border-radius:8px;font-size:11px;font-weight:600">
                    ${daysLeft>0?daysLeft+'h lagi':'Lewat target'}
                  </span>`:''
                }
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-top:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:11px;color:var(--gray)">
                  Tahap ${p.current_step||0}/25 — 
                  <strong style="color:${groupColor}">${p.current_step?MCU_STEPS[(p.current_step||1)-1]?.name:'Belum mulai'}</strong>
                </span>
                <span style="font-size:11px;font-weight:700;color:${progress>=100?'#22C55E':'var(--navy)'}">${progress}%</span>
              </div>
              <!-- Multi-group progress bar -->
              <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;gap:1px">
                ${MCU_GROUPS.map(g=>{
                  const gSteps = MCU_STEPS.filter(s=>s.group===g);
                  const gDone  = gSteps.filter(s=>s.no<=(p.current_step||0)).length;
                  const gTotal = gSteps.length;
                  const gPct   = Math.round(gDone/gTotal*100);
                  return `<div style="flex:${gTotal};background:${GROUP_COLORS[g]}30;position:relative;overflow:hidden">
                    <div style="position:absolute;left:0;top:0;height:100%;width:${gPct}%;background:${GROUP_COLORS[g]}"></div>
                  </div>`;
                }).join('')}
              </div>
              <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
                ${MCU_GROUPS.map(g=>`
                  <span style="font-size:9px;color:${GROUP_COLORS[g]};font-weight:700">
                    ● ${g}
                  </span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Right info -->
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:14px;font-weight:800;color:var(--navy)">${p.value?formatCurrency(p.value):'—'}</div>
            <div style="font-size:11px;color:var(--gray)">Nilai Project</div>
            ${p.target_participants?`
              <div style="font-size:13px;font-weight:600;color:var(--teal);margin-top:4px">${p.target_participants} peserta</div>`:''
            }
            ${p.rab_total?`
              <div style="font-size:11px;color:var(--gray)">RAB: ${formatCurrency(p.rab_total)}</div>`:''
            }
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── MCU DETAIL (25 Tahapan + RAB) ────────────
async function openMCUDetail(id) {
  mcuCurrentId = id;
  const d = await sbGet('projects',`select=*&id=eq.${id}`);
  const p = d[0]; if (!p) return;

  const steps = await sbGet('project_steps',
    `select=*&project_id=eq.${id}&order=step_number.asc`).catch(()=>[]);

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">🏥 ${p.project_name}</div>
        <div style="font-size:12px;color:var(--gray);margin-top:2px">
          ${p.partner_name||'—'} · ${p.project_type||'MCU'} · ${p.target_participants||0} peserta
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="openRABModal(${id})">💰 RAB</button>
        <button class="btn btn-outline btn-sm" onclick="openMCUForm(${id})">✏️ Edit</button>
        <button class="modal-close" onclick="closeModalForce()">✕</button>
      </div>
    </div>

    <!-- Progress Summary -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
      ${MCU_GROUPS.map(g=>{
        const gSteps = MCU_STEPS.filter(s=>s.group===g);
        const gDone  = gSteps.filter(s=>s.no<=(p.current_step||0)).length;
        const color  = GROUP_COLORS[g];
        return `<div style="background:${color}12;border-radius:8px;padding:10px;text-align:center;border-top:3px solid ${color}">
          <div style="font-size:16px;font-weight:800;color:${color}">${gDone}/${gSteps.length}</div>
          <div style="font-size:10px;color:var(--gray);font-weight:600">${g}</div>
        </div>`;
      }).join('')}
    </div>

    <!-- 25 Steps -->
    <div style="max-height:55vh;overflow-y:auto">
      ${MCU_GROUPS.map(g=>{
        const gSteps = MCU_STEPS.filter(s=>s.group===g);
        const color  = GROUP_COLORS[g];
        return `
          <div style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.08em;
              padding:6px 12px;background:${color}15;border-radius:6px;margin-bottom:8px">
              ${g}
            </div>
            ${gSteps.map(step=>{
              const stepData = (steps||[]).find(s=>s.step_number===step.no)||{};
              const status   = step.no < (p.current_step||0) ? 'Done' :
                               step.no === (p.current_step||0) ? 'In Progress' : 'Pending';
              const actualSt = stepData.status || status;
              const stIcon   = actualSt==='Done'?'✅':actualSt==='In Progress'?'🔵':actualSt==='Blocked'?'🔴':'⚪';
              const isCurrent= step.no === (p.current_step||0);

              return `
                <div onclick="openStepForm(${id},${step.no})"
                  style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;
                    cursor:pointer;margin-bottom:4px;
                    background:${isCurrent?color+'12':actualSt==='Done'?'#F0FDF4':'var(--lgray)'};
                    border:1.5px solid ${isCurrent?color:actualSt==='Done'?'#BBF7D0':'var(--border)'};
                    transition:all .15s"
                  onmouseover="this.style.borderColor='${color}'"
                  onmouseout="this.style.borderColor='${isCurrent?color:actualSt==='Done'?'#BBF7D0':'var(--border)'}'">
                  <!-- Step number -->
                  <div style="width:26px;height:26px;border-radius:50%;
                    background:${actualSt==='Done'?'#22C55E':isCurrent?color:'var(--border)'};
                    color:#fff;display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;flex-shrink:0">
                    ${actualSt==='Done'?'✓':step.no}
                  </div>
                  <!-- Step info -->
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:${isCurrent?700:600};
                      color:${isCurrent?color:actualSt==='Done'?'#15803D':'var(--text)'}">
                      ${step.icon} ${step.name}
                    </div>
                    <div style="font-size:10px;color:var(--gray)">
                      PIC: ${step.pic}
                      ${stepData.done_by?` · Dikerjakan: ${stepData.done_by}`:''}
                      ${stepData.done_date?` · ${formatDateShort(stepData.done_date)}`:''}
                    </div>
                  </div>
                  <!-- Status badge -->
                  <div style="font-size:10px;white-space:nowrap">
                    ${stIcon} <span style="color:var(--gray)">${actualSt}</span>
                  </div>
                  ${isCurrent?`<span style="font-size:9px;font-weight:700;color:${color};
                    background:${color}20;padding:2px 6px;border-radius:4px">AKTIF</span>`:''}
                </div>`;
            }).join('')}
          </div>`;
      }).join('')}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
      ${(p.current_step||0) < 25 ? `
        <button class="btn btn-outline" onclick="openStepForm(${id},${(p.current_step||0)||1})">
          📝 Isi Form Tahap ${(p.current_step||0)||1}
        </button>
        <button class="btn btn-teal" onclick="advanceMCUStep(${id},${p.current_step||0})">
          ➡ Lanjut ke Tahap ${(p.current_step||0)+1}
        </button>` :
        `<button class="btn btn-teal" style="background:#22C55E" disabled>✅ Project Selesai!</button>`
      }
    </div>`);
}

// ── Step Form ─────────────────────────────────
async function openStepForm(projectId, stepNo) {
  const step = MCU_STEPS.find(s=>s.no===stepNo);
  if (!step) return;

  const existing = await sbGet('project_steps',
    `select=*&project_id=eq.${projectId}&step_number=eq.${stepNo}`).catch(()=>[]);
  const d = existing[0]||{};
  const user = getUserName?getUserName():'User';

  // Build dynamic form fields based on step
  const fieldLabels = {
    nilai_deal:       ['Nilai Deal (Rp)','number'],
    tipe_layanan:     ['Tipe Layanan','select:MCU,HealthDay,Screening,Wellness,Branding'],
    catatan_negosiasi:['Catatan Negosiasi','textarea'],
    jumlah_peserta:   ['Jumlah Peserta','number'],
    nama_perusahaan:  ['Nama Perusahaan','text'],
    contact_hr:       ['Kontak HR / PIC Partner','text'],
    list_peserta:     ['Catatan List Peserta','textarea'],
    alamat_lokasi:    ['Alamat Lokasi MCU','text'],
    akses_lokasi:     ['Akses & Kondisi Lokasi','textarea'],
    fasilitas_tersedia:['Fasilitas Tersedia','textarea'],
    foto_lokasi:      ['Catatan Foto Lokasi','textarea'],
    rab_peserta:      ['Jumlah Peserta RAB','number'],
    rab_paket:        ['Paket Pemeriksaan','text'],
    rab_total:        ['Total RAB (Rp)','number'],
    rab_harga_per_orang:['Harga per Orang (Rp)','number'],
    approved_by:      ['Disetujui Oleh','text'],
    approval_date:    ['Tanggal Approval','date'],
    approval_notes:   ['Catatan Approval','textarea'],
    margin_pct:       ['Margin (%)','number'],
    proposal_file:    ['Link/Nama File Proposal','text'],
    proposal_notes:   ['Catatan Proposal','textarea'],
    tanggal_kirim:    ['Tanggal Kirim','date'],
    penerima:         ['Penerima','text'],
    metode_kirim:     ['Metode Pengiriman','select:Email,WhatsApp,Hardcopy,Drive'],
    revisi_notes:     ['Catatan Revisi','textarea'],
    harga_final:      ['Harga Final (Rp)','number'],
    perubahan_scope:  ['Perubahan Scope','textarea'],
    mou_number:       ['Nomor MOU/SPK','text'],
    tanggal_ttd:      ['Tanggal TTD','date'],
    file_mou:         ['Link File MOU','text'],
    penandatangan:    ['Nama Penandatangan','text'],
    tanggal_mcu:      ['Tanggal Pelaksanaan MCU','date'],
    jam_mulai:        ['Jam Mulai','time'],
    jam_selesai:      ['Jam Selesai','time'],
    konfirmasi_partner:['Konfirmasi dari Partner','select:Sudah,Belum,Revisi'],
    list_reagen:      ['List Reagen Dibutuhkan','textarea'],
    qty_reagen:       ['Qty per Item','textarea'],
    status_stok:      ['Status Stok','select:Cukup,Kurang,Perlu Order'],
    catatan_lab:      ['Catatan Lab','textarea'],
    list_tim:         ['List Nama Tim','textarea'],
    peran_tim:        ['Peran Masing-masing','textarea'],
    jadwal_tim:       ['Jadwal Tim','textarea'],
    briefing_date:    ['Tanggal Briefing','date'],
    materi_briefing:  ['Materi Briefing','textarea'],
    peserta_briefing: ['Peserta Briefing','text'],
    tanggal_briefing: ['Tanggal Briefing','date'],
    catatan:          ['Catatan','textarea'],
    jumlah_konfirmasi:['Jumlah Peserta Konfirmasi','number'],
    perubahan_peserta:['Perubahan Peserta','textarea'],
    komunikasi_hr:    ['Catatan Komunikasi HR','textarea'],
    waktu_berangkat:  ['Waktu Berangkat','time'],
    armada:           ['Armada/Kendaraan','text'],
    checklist_alat:   ['Checklist Alat Terbawa','textarea'],
    catatan_mobilisasi:['Catatan Mobilisasi','textarea'],
    waktu_setup:      ['Waktu Setup','time'],
    jumlah_registrasi:['Jumlah Peserta Registrasi','number'],
    kendala_setup:    ['Kendala Setup','textarea'],
    waktu_mulai:      ['Waktu Mulai','time'],
    waktu_selesai:    ['Waktu Selesai','time'],
    jumlah_diambil:   ['Jumlah Sampel Diambil','number'],
    catatan_sampling: ['Catatan Sampling','textarea'],
    waktu_kirim:      ['Waktu Pengiriman','time'],
    jumlah_sampel:    ['Jumlah Sampel Dikirim','number'],
    pengantar:        ['Nama Pengantar','text'],
    tanda_terima:     ['No. Tanda Terima','text'],
    waktu_mulai_lab:  ['Waktu Mulai di Lab','time'],
    alat_dipakai:     ['Alat yang Dipakai','text'],
    catatan_analis:   ['Catatan Analis','textarea'],
    qc_status:        ['Status QC','select:Pass,Fail,Repeat'],
    jumlah_input:     ['Jumlah Hasil Diinput','number'],
    waktu_input:      ['Waktu Input','time'],
    catatan_input:    ['Catatan Input','textarea'],
    dokter_validator: ['Nama Dokter Validator','text'],
    tanggal_validasi: ['Tanggal Validasi','date'],
    hasil_qc:         ['Hasil QC','select:Valid,Invalid,Partial'],
    catatan_qc:       ['Catatan QC','textarea'],
    template_laporan: ['Template Laporan','select:Standard,Executive,Detail'],
    format_output:    ['Format Output','select:PDF,Word,Excel'],
    file_laporan:     ['Link File Laporan','text'],
    catatan_laporan:  ['Catatan Laporan','textarea'],
    penerima_laporan: ['Penerima Laporan','text'],
    metode_pengiriman:['Metode Pengiriman','select:Email,WhatsApp,Hardcopy'],
    konfirmasi_terima:['Konfirmasi Diterima','select:Sudah,Belum'],
    nomor_invoice:    ['Nomor Invoice','text'],
    jumlah_tagihan:   ['Jumlah Tagihan (Rp)','number'],
    tanggal_jatuh_tempo:['Tanggal Jatuh Tempo','date'],
    status_bayar:     ['Status Bayar','select:Belum,DP,Lunas'],
    rating_partner:   ['Rating Kepuasan Partner (1-5)','select:1,2,3,4,5'],
    lessons_learned:  ['Lessons Learned','textarea'],
    dokumentasi_foto: ['Link Dokumentasi Foto','text'],
    rekomendasi:      ['Rekomendasi untuk Project Berikutnya','textarea'],
  };

  // Parse existing notes as JSON
  let existingVals = {};
  try { existingVals = JSON.parse(d.notes||'{}'); } catch(e) {}

  const formFields = step.fields.map(f=>{
    const [label,type='text'] = fieldLabels[f]||[f,'text'];
    const val = existingVals[f]||'';
    if (type==='textarea') return `
      <div class="form-group">
        <label>${label}</label>
        <textarea id="sf_${f}" rows="2">${val}</textarea>
      </div>`;
    if (type.startsWith('select:')) {
      const opts = type.replace('select:','').split(',');
      return `<div class="form-group">
        <label>${label}</label>
        <select id="sf_${f}">${opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('')}</select>
      </div>`;
    }
    return `<div class="form-group">
      <label>${label}</label>
      <input type="${type}" id="sf_${f}" value="${val}">
    </div>`;
  }).join('');

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">${step.icon} Tahap ${step.no}: ${step.name}</div>
        <div style="font-size:11px;color:var(--gray)">PIC: ${step.pic} · Grup: ${step.group}</div>
      </div>
      <button class="modal-close" onclick="closeModalForce();openMCUDetail(${projectId})">✕</button>
    </div>

    ${formFields}

    <div class="form-row">
      <div class="form-group">
        <label>Status Tahap</label>
        <select id="sf_status">
          ${STEP_STATUS.map(s=>`<option${(d.status||'In Progress')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Dikerjakan Oleh</label>
        <input type="text" id="sf_done_by" value="${d.done_by||user}">
      </div>
      <div class="form-group">
        <label>Tanggal Selesai</label>
        <input type="date" id="sf_done_date" value="${d.done_date||''}">
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce();openMCUDetail(${projectId})">Kembali</button>
      <button class="btn btn-teal" onclick="saveStepForm(${projectId},${stepNo})">💾 Simpan</button>
    </div>`);
}

async function saveStepForm(projectId, stepNo) {
  const step = MCU_STEPS.find(s=>s.no===stepNo);
  if (!step) return;

  const data = {};
  step.fields.forEach(f=>{
    const el = document.getElementById(`sf_${f}`);
    if (el) data[f] = el.value;
  });

  const status   = document.getElementById('sf_status')?.value||'In Progress';
  const done_by  = document.getElementById('sf_done_by')?.value||'';
  const done_date= document.getElementById('sf_done_date')?.value||null;

  try {
    // Upsert project_steps
    const existing = await sbGet('project_steps',
      `select=id&project_id=eq.${projectId}&step_number=eq.${stepNo}`).catch(()=>[]);

    const payload = {
      project_id:  projectId,
      step_number: stepNo,
      step_name:   step.name,
      step_group:  step.group,
      status,
      done_by,
      done_date:   done_date||null,
      notes:       JSON.stringify(data),
      updated_at:  new Date().toISOString(),
    };

    if (existing[0]?.id) {
      await sbPatch('project_steps', existing[0].id, payload);
    } else {
      await sbPost('project_steps', payload);
    }

    // If Done, advance current_step
    if (status==='Done') {
      const proj = await sbGet('projects',`select=current_step&id=eq.${projectId}`);
      const curStep = proj[0]?.current_step||0;
      if (stepNo >= curStep) {
        await sbPatch('projects', projectId, {
          current_step: Math.min(stepNo+1, 25),
          updated_at: new Date().toISOString(),
          status: stepNo>=25 ? 'Completed' : 'Active',
        });
      }
    }

    await logActivity('update','projects',projectId,
      `Tahap ${stepNo} (${step.name}) → ${status}`, '');
    toast(`✅ Tahap ${stepNo} disimpan`,'ok');
    closeModalForce();
    await openMCUDetail(projectId);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function advanceMCUStep(projectId, currentStep) {
  const nextStep = currentStep + 1;
  if (nextStep > 25) { toast('Project sudah selesai!','info'); return; }
  await openStepForm(projectId, nextStep||1);
}

// ── RAB MODAL ─────────────────────────────────
async function openRABModal(projectId) {
  const d   = await sbGet('projects',`select=*&id=eq.${projectId}`);
  const p   = d[0]||{};
  const peserta = p.target_participants||100;

  // Load existing RAB
  const existing = await sbGet('rab_items',`select=*&project_id=eq.${projectId}`).catch(()=>[]);
  const rabMap = {};
  (existing||[]).forEach(r=>{ rabMap[r.item_name] = r; });

  openModal(`
    <div class="modal-header">
      <div class="modal-title">💰 Kalkulator RAB — ${p.project_name}</div>
      <button class="modal-close" onclick="closeModalForce();openMCUDetail(${projectId})">✕</button>
    </div>

    <div style="background:var(--mint);border-radius:8px;padding:10px 14px;margin-bottom:14px;
      display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div>
        <span style="font-size:12px;color:var(--gray)">Jumlah Peserta: </span>
        <input type="number" id="rab-peserta" value="${peserta}"
          onchange="recalcRAB()" style="width:70px;border:1.5px solid var(--teal);border-radius:6px;padding:4px 8px;font-size:14px;font-weight:700">
      </div>
      <div>
        <span style="font-size:12px;color:var(--gray)">Total RAB: </span>
        <span id="rab-total-display" style="font-size:16px;font-weight:800;color:var(--navy)">Rp 0</span>
      </div>
      <div>
        <span style="font-size:12px;color:var(--gray)">Harga/Orang: </span>
        <span id="rab-per-orang" style="font-size:14px;font-weight:700;color:var(--teal)">Rp 0</span>
      </div>
      <div>
        <span style="font-size:12px;color:var(--gray)">Margin Target: </span>
        <input type="number" id="rab-margin" value="30" min="0" max="100"
          onchange="recalcRAB()" style="width:50px;border:1.5px solid var(--teal);border-radius:6px;padding:4px 8px">
        <span style="font-size:12px;color:var(--gray)">%</span>
      </div>
    </div>

    <div style="max-height:50vh;overflow-y:auto">
      ${RAB_CATEGORIES.map(cat=>`
        <div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:800;color:var(--navy);text-transform:uppercase;
            letter-spacing:.06em;padding:5px 10px;background:var(--lgray);border-radius:6px;margin-bottom:6px">
            ${cat.icon} ${cat.cat}
          </div>
          <table style="width:100%;font-size:12px;border-collapse:collapse">
            <thead>
              <tr style="background:#F8FAFC">
                <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">Item</th>
                <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">Satuan</th>
                <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px">Qty</th>
                <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px">Harga Satuan</th>
                <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cat.items.map((item,i)=>{
                const key = `${cat.cat}__${item.name}`.replace(/\s/g,'_');
                const ex  = rabMap[item.name]||{};
                const defaultQty = item.unit.includes('orang')||item.unit==='test'||item.unit==='pcs' ? peserta : 1;
                const qty  = ex.qty  || defaultQty;
                const price= ex.unit_price || item.price;
                const total= qty * price;
                return `<tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:5px 8px;color:var(--text)">${item.name}</td>
                  <td style="padding:5px 8px;color:var(--gray)">${item.unit}</td>
                  <td style="padding:3px 4px">
                    <input type="number" class="rab-qty" data-key="${key}" data-name="${item.name}" data-cat="${cat.cat}"
                      data-unit="${item.unit}" value="${qty}" min="0"
                      onchange="updateRABRow(this)"
                      style="width:60px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;text-align:right;font-size:12px">
                  </td>
                  <td style="padding:3px 4px">
                    <input type="number" class="rab-price" data-key="${key}"
                      value="${price}" min="0"
                      onchange="updateRABRow(this)"
                      style="width:90px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;text-align:right;font-size:12px">
                  </td>
                  <td style="padding:5px 8px;text-align:right;font-weight:600;color:var(--navy)" id="rab-row-${key}">
                    ${formatCurrency(total)}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`).join('')}
    </div>

    <!-- Summary -->
    <div id="rab-summary" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px"></div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce();openMCUDetail(${projectId})">Kembali</button>
      <button class="btn btn-outline btn-sm" onclick="printRAB(${projectId})">🖨 Print RAB</button>
      <button class="btn btn-teal" onclick="saveRAB(${projectId})">💾 Simpan RAB</button>
    </div>`);

  recalcRAB();
}

function updateRABRow(el) {
  const key    = el.dataset.key;
  const rowEl  = document.getElementById(`rab-row-${key}`);
  const qtyEl  = document.querySelector(`.rab-qty[data-key="${key}"]`);
  const priceEl= document.querySelector(`.rab-price[data-key="${key}"]`);
  if (!rowEl||!qtyEl||!priceEl) return;
  const total  = parseFloat(qtyEl.value||0) * parseFloat(priceEl.value||0);
  rowEl.textContent = formatCurrency(total);
  recalcRAB();
}

function recalcRAB() {
  let total = 0;
  document.querySelectorAll('.rab-qty').forEach(qEl=>{
    const key    = qEl.dataset.key;
    const priceEl= document.querySelector(`.rab-price[data-key="${key}"]`);
    if (!priceEl) return;
    total += parseFloat(qEl.value||0) * parseFloat(priceEl.value||0);
  });

  const peserta = parseInt(document.getElementById('rab-peserta')?.value||1)||1;
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30)||30;
  const hpp     = total;
  const selling = hpp / (1 - margin/100);
  const perOrang= selling / peserta;

  const tEl = document.getElementById('rab-total-display');
  const pEl = document.getElementById('rab-per-orang');
  if (tEl) tEl.textContent = formatCurrency(Math.round(selling));
  if (pEl) pEl.textContent = formatCurrency(Math.round(perOrang));

  const sumEl = document.getElementById('rab-summary');
  if (sumEl) sumEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">
      ${[
        {label:'Total HPP', val:formatCurrency(Math.round(hpp)), color:'var(--text)'},
        {label:`Margin ${margin}%`, val:formatCurrency(Math.round(selling-hpp)), color:'#22C55E'},
        {label:'Harga Jual', val:formatCurrency(Math.round(selling)), color:'var(--navy)'},
        {label:'Harga/Orang', val:formatCurrency(Math.round(perOrang)), color:'var(--teal)'},
        {label:`Fee Xendit 2.5%`, val:formatCurrency(Math.round(selling*0.025)), color:'#F59E0B'},
        {label:'Net Revenue', val:formatCurrency(Math.round(selling*0.975)), color:'#8B5CF6'},
      ].map(s=>`
        <div style="background:var(--lgray);border-radius:8px;padding:8px 12px">
          <div style="font-size:10px;color:var(--gray)">${s.label}</div>
          <div style="font-size:13px;font-weight:700;color:${s.color}">${s.val}</div>
        </div>`).join('')}
    </div>`;
}

async function saveRAB(projectId) {
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||0);
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30);

  let total = 0;
  const items = [];
  document.querySelectorAll('.rab-qty').forEach(qEl=>{
    const key    = qEl.dataset.key;
    const priceEl= document.querySelector(`.rab-price[data-key="${key}"]`);
    if (!priceEl) return;
    const qty   = parseFloat(qEl.value||0);
    const price = parseFloat(priceEl.value||0);
    const rowTotal = qty * price;
    total += rowTotal;
    if (qty > 0) {
      items.push({
        project_id: projectId,
        category:   qEl.dataset.cat,
        item_name:  qEl.dataset.name,
        unit:       qEl.dataset.unit,
        qty, unit_price: price, total_price: rowTotal,
      });
    }
  });

  const selling = total / (1 - margin/100);

  try {
    // Delete old RAB items
    await fetch(`${SUPABASE_URL}/rest/v1/rab_items?project_id=eq.${projectId}`, {
      method:'DELETE', headers:{...SB_HEADERS,'Prefer':'return=minimal'}
    });

    // Insert new items
    if (items.length) await sbPost('rab_items', items);

    // Update project RAB total
    await sbPatch('projects', projectId, {
      rab_total: Math.round(selling),
      target_participants: peserta,
      updated_at: new Date().toISOString(),
    });

    toast('✅ RAB disimpan','ok');
    closeModalForce();
    await openMCUDetail(projectId);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function printRAB(projectId) {
  let total = 0;
  let html  = '';
  RAB_CATEGORIES.forEach(cat=>{
    let catRows = '';
    cat.items.forEach(item=>{
      const key    = `${cat.cat}__${item.name}`.replace(/\s/g,'_');
      const qEl   = document.querySelector(`.rab-qty[data-key="${key}"]`);
      const pEl   = document.querySelector(`.rab-price[data-key="${key}"]`);
      if (!qEl||!pEl) return;
      const qty   = parseFloat(qEl.value||0);
      const price = parseFloat(pEl.value||0);
      const rowtotal = qty*price;
      if (qty>0) {
        total += rowtotal;
        catRows += `<tr><td>${item.name}</td><td>${item.unit}</td>
          <td style="text-align:right">${qty}</td>
          <td style="text-align:right">${price.toLocaleString('id-ID')}</td>
          <td style="text-align:right">${rowtotal.toLocaleString('id-ID')}</td></tr>`;
      }
    });
    if (catRows) html += `<tr style="background:#f0f4f8"><td colspan="5" style="font-weight:700;padding:6px 8px">${cat.icon} ${cat.cat}</td></tr>${catRows}`;
  });

  const peserta = parseInt(document.getElementById('rab-peserta')?.value||1);
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30);
  const selling = total/(1-margin/100);

  const w = window.open('','_blank','width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>RAB MCU</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;font-size:13px}
    h2{color:#0A2342}table{width:100%;border-collapse:collapse;margin:14px 0}
    th,td{border:1px solid #ddd;padding:6px 10px}
    thead{background:#0A2342;color:#fff}
    .total-row{background:#E0F2F1;font-weight:700}
    .summary{display:flex;gap:20px;margin-top:16px;background:#F4F9F8;padding:14px;border-radius:8px}
    .sum-item{flex:1;text-align:center}
    .sum-val{font-size:18px;font-weight:800;color:#0A2342}
    .sum-label{font-size:11px;color:#546E7A;margin-top:3px}
    @media print{button{display:none}}</style></head><body>
    <button onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:8px 16px;
      background:#0A2342;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨 Print</button>
    <h2>Rencana Anggaran Biaya (RAB) — Project MCU</h2>
    <p>OneLab Diagnostics · Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
    <table><thead><tr><th>Item</th><th>Satuan</th><th>Qty</th><th>Harga Satuan</th><th>Total</th></tr></thead>
    <tbody>${html}
    <tr class="total-row"><td colspan="4">TOTAL HPP</td><td>${total.toLocaleString('id-ID')}</td></tr>
    </tbody></table>
    <div class="summary">
      <div class="sum-item"><div class="sum-val">${peserta} orang</div><div class="sum-label">Peserta</div></div>
      <div class="sum-item"><div class="sum-val">${total.toLocaleString('id-ID')}</div><div class="sum-label">Total HPP</div></div>
      <div class="sum-item"><div class="sum-val">${margin}%</div><div class="sum-label">Target Margin</div></div>
      <div class="sum-item"><div class="sum-val">${selling.toLocaleString('id-ID')}</div><div class="sum-label">Harga Jual</div></div>
      <div class="sum-item"><div class="sum-val">${Math.round(selling/peserta).toLocaleString('id-ID')}</div><div class="sum-label">Harga/Orang</div></div>
      <div class="sum-item"><div class="sum-val">${Math.round(selling*0.975).toLocaleString('id-ID')}</div><div class="sum-label">Net (stlh Xendit)</div></div>
    </div>
    </body></html>`);
  w.document.close();
}

// ── MCU Form (Create/Edit) ────────────────────
async function openMCUForm(id=null, prefillPartnerId=null, prefillDealId=null) {
  let p = {};
  if (id) {
    const d = await sbGet('projects',`select=*&id=eq.${id}`);
    p = d[0]||{};
  }

  // Use prefilled partner if coming from deals
  const prePartnerId = prefillPartnerId || p.partner_id;
  let partnerOpts = '<option value="">-- Pilih Partner --</option>';
  let dealOpts    = '<option value="">-- Pilih Output Kerjasama --</option>';
  try {
    const pts = await sbGet('partners','select=id,partner_name&order=partner_name&limit=200');
    partnerOpts += (pts||[]).map(pt=>`
      <option value="${pt.id}" ${p.partner_id==pt.id?'selected':''}>${pt.partner_name}</option>`).join('');
  } catch(e){}

  const today = new Date().toISOString().split('T')[0];
  const user  = getUserName?getUserName():'User';

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Project MCU':'🏥 Buat Project MCU Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Nama Project *</label>
        <input type="text" id="mf-name" value="${p.project_name||''}"
          placeholder="MCU Karyawan PT. ABC - Mei 2026">
      </div>
      <div class="form-group">
        <label>Tipe Project</label>
        <select id="mf-type">
          ${['MCU','HealthDay','Screening','Wellness'].map(t=>
            `<option${(p.project_type||'MCU')===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Partner / Klien *</label>
        <select id="mf-partner" onchange="loadPartnerDeals(this.value,'mf-deal')">
          ${partnerOpts}
        </select>
      </div>
      <div class="form-group">
        <label>Output Kerjasama</label>
        <select id="mf-deal">${dealOpts}</select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Tanggal Mulai</label>
        <input type="date" id="mf-start" value="${p.start_date||today}">
      </div>
      <div class="form-group">
        <label>Tanggal Target Selesai</label>
        <input type="date" id="mf-end" value="${p.end_date||''}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Target Peserta</label>
        <input type="number" id="mf-peserta" value="${p.target_participants||100}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Nilai Project (Rp)</label>
        <input type="number" id="mf-value" value="${p.value||''}" placeholder="0">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>PIC OneLab (SPV)</label>
        <input type="text" id="mf-pic-ol" value="${p.pic_onelab||user}" placeholder="Nama SPV">
      </div>
      <div class="form-group">
        <label>PIC Partner (HR/Manager)</label>
        <input type="text" id="mf-pic-pt" value="${p.pic_partner||''}" placeholder="Nama PIC Partner">
      </div>
    </div>

    <div class="form-group">
      <label>Lokasi Pelaksanaan</label>
      <input type="text" id="mf-location" value="${p.location||''}"
        placeholder="Nama gedung, alamat lokasi MCU">
    </div>

    <div class="form-group">
      <label>Deskripsi / Scope Layanan</label>
      <textarea id="mf-desc" rows="2"
        placeholder="Jenis pemeriksaan: darah lengkap, kolesterol, gula darah, EKG...">${p.description||''}</textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveMCU(${id||'null'})">
        ${id?'💾 Simpan':'🏥 Buat Project'}
      </button>
    </div>`);

  if (p.partner_id) loadPartnerDeals(p.partner_id, 'mf-deal', p.deal_id);
}

async function loadPartnerDeals(partnerId, selectId, selectedId=null) {
  if (!partnerId) return;
  try {
    const deals = await sbGet('partner_deals',
      `select=id,deal_name,deal_type&partner_id=eq.${partnerId}&order=created_at.desc`);
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Pilih Output Kerjasama --</option>' +
      (deals||[]).map(d=>`<option value="${d.id}" ${d.id==selectedId?'selected':''}>${d.deal_name} (${d.deal_type})</option>`).join('');
  } catch(e){}
}

async function saveMCU(id) {
  const name     = document.getElementById('mf-name').value.trim();
  const partnerId= document.getElementById('mf-partner').value;
  if (!name)     { toast('Nama project wajib diisi','err'); return; }
  if (!partnerId){ toast('Pilih partner dulu','err'); return; }

  // Get partner name
  let partnerName = '';
  const pEl = document.getElementById('mf-partner');
  if (pEl) partnerName = pEl.options[pEl.selectedIndex]?.text||'';

  const user = getUserName?getUserName():'User';

  // Generate project code
  const code = `MCU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const payload = {
    project_code:        code,
    project_name:        name,
    project_type:        document.getElementById('mf-type').value,
    partner_id:          parseInt(partnerId),
    partner_name:        partnerName,
    deal_id:             parseInt(document.getElementById('mf-deal').value)||null,
    start_date:          document.getElementById('mf-start').value||null,
    end_date:            document.getElementById('mf-end').value||null,
    target_participants: parseInt(document.getElementById('mf-peserta').value)||0,
    value:               parseFloat(document.getElementById('mf-value').value)||0,
    pic_onelab:          document.getElementById('mf-pic-ol').value.trim(),
    pic_partner:         document.getElementById('mf-pic-pt').value.trim(),
    location:            document.getElementById('mf-location').value.trim(),
    description:         document.getElementById('mf-desc').value.trim(),
    current_step:        id ? undefined : 1,
    status:              'Planning',
    created_by_name:     user,
    updated_at:          new Date().toISOString(),
  };
  if (id) delete payload.current_step;

  try {
    if (id) {
      await sbPatch('projects', id, payload);
      toast('✅ Project diupdate','ok');
      closeModalForce();
      openMCUDetail(id);
    } else {
      const res = await sbPost('projects', payload);
      const newId = res[0]?.id;
      toast('✅ Project MCU dibuat!','ok');
      await logActivity('create','projects',newId,`Project MCU baru: ${name}`,name);
      closeModalForce();
      await loadMCUProjects();
      if (newId) openMCUDetail(newId);
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}
