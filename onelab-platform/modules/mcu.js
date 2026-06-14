// ═══════════════════════════════════════════
// MODULE: Project MCU v2
// - RAB Calculator (struktur Excel lengkap)
// - 25 Tahapan dengan form per tahap
// - Link ke Partner, Corporate, Contract
// - Plan vs Actual tracking
// ═══════════════════════════════════════════

const MCU_STEPS = [
  {no:1,  group:'Pre-Project', name:'Deal & Negosiasi',           pic:'Sales',   icon:'🤝', fields:['nilai_deal','tipe_layanan','catatan_negosiasi']},
  {no:2,  group:'Pre-Project', name:'Input Data Peserta',         pic:'Sales',   icon:'👥', fields:['jumlah_peserta','nama_perusahaan','contact_hr','list_peserta']},
  {no:3,  group:'Pre-Project', name:'Survei Lokasi',              pic:'SPV',     icon:'📍', fields:['alamat_lokasi','akses_lokasi','fasilitas_tersedia','foto_lokasi']},
  {no:4,  group:'Pre-Project', name:'Buat RAB',                   pic:'SPV',     icon:'💰', fields:['rab_peserta','rab_paket','rab_total','rab_harga_per_orang']},
  {no:5,  group:'Pre-Project', name:'Approval RAB',               pic:'Manager', icon:'✅', fields:['approved_by','approval_date','approval_notes','margin_pct']},
  {no:6,  group:'Pre-Project', name:'Buat Proposal MCU',          pic:'Sales',   icon:'📋', fields:['proposal_file','proposal_notes']},
  {no:7,  group:'Pre-Project', name:'Kirim Proposal ke Partner',  pic:'Sales',   icon:'📤', fields:['tanggal_kirim','penerima','metode_kirim']},
  {no:8,  group:'Pre-Project', name:'Negosiasi Final & Revisi',   pic:'Sales',   icon:'🔄', fields:['revisi_notes','harga_final','perubahan_scope']},
  {no:9,  group:'Pre-Project', name:'Tanda Tangan MOU/SPK',       pic:'Manager', icon:'📜', fields:['mou_number','tanggal_ttd','file_mou','penandatangan']},
  {no:10, group:'Persiapan',   name:'Konfirmasi Jadwal',          pic:'SPV',     icon:'📅', fields:['tanggal_mcu','jam_mulai','jam_selesai','konfirmasi_partner']},
  {no:11, group:'Persiapan',   name:'Persiapan Reagen & Alkes',   pic:'Lab',     icon:'🧪', fields:['list_reagen','qty_reagen','status_stok','catatan_lab']},
  {no:12, group:'Persiapan',   name:'Persiapan SDM & Tim',        pic:'SPV',     icon:'👨‍⚕️', fields:['list_tim','peran_tim','jadwal_tim','briefing_date']},
  {no:13, group:'Persiapan',   name:'Briefing Tim',               pic:'SPV',     icon:'📢', fields:['materi_briefing','peserta_briefing','tanggal_briefing','catatan']},
  {no:14, group:'Persiapan',   name:'Konfirmasi Peserta ke Partner',pic:'Sales', icon:'📞', fields:['jumlah_konfirmasi','perubahan_peserta','komunikasi_hr']},
  {no:15, group:'Eksekusi',    name:'Mobilisasi ke Lokasi',       pic:'SPV',     icon:'🚗', fields:['waktu_berangkat','armada','checklist_alat','catatan_mobilisasi']},
  {no:16, group:'Eksekusi',    name:'Setup & Registrasi Peserta', pic:'Tim',     icon:'🏗️', fields:['waktu_setup','jumlah_registrasi','kendala_setup']},
  {no:17, group:'Eksekusi',    name:'Pengambilan Sampel',         pic:'Analis',  icon:'💉', fields:['waktu_mulai','waktu_selesai','jumlah_diambil','catatan_sampling']},
  {no:18, group:'Eksekusi',    name:'Pengiriman Sampel ke Lab',   pic:'Analis',  icon:'📦', fields:['waktu_kirim','jumlah_sampel','pengantar','tanda_terima']},
  {no:19, group:'Eksekusi',    name:'Pemeriksaan di Lab',         pic:'Analis',  icon:'🔬', fields:['waktu_mulai_lab','alat_dipakai','catatan_analis','qc_status']},
  {no:20, group:'Eksekusi',    name:'Input Hasil ke Sistem',      pic:'Analis',  icon:'💻', fields:['jumlah_input','waktu_input','catatan_input']},
  {no:21, group:'Pasca',       name:'QC & Validasi Hasil',        pic:'Dokter',  icon:'🔍', fields:['dokter_validator','tanggal_validasi','hasil_qc','catatan_qc']},
  {no:22, group:'Pasca',       name:'Generate Laporan MCU',       pic:'Dokter',  icon:'📊', fields:['template_laporan','format_output','file_laporan','catatan_laporan']},
  {no:23, group:'Pasca',       name:'Kirim Laporan ke Partner',   pic:'Sales',   icon:'📨', fields:['tanggal_kirim','penerima_laporan','metode_pengiriman','konfirmasi_terima']},
  {no:24, group:'Pasca',       name:'Invoice & Penagihan',        pic:'Finance', icon:'💵', fields:['nomor_invoice','jumlah_tagihan','tanggal_jatuh_tempo','status_bayar']},
  {no:25, group:'Pasca',       name:'Evaluasi & Dokumentasi',     pic:'Manager', icon:'📝', fields:['rating_partner','lessons_learned','dokumentasi_foto','rekomendasi']},
];

const MCU_GROUPS   = ['Pre-Project','Persiapan','Eksekusi','Pasca'];
const GROUP_COLORS = {'Pre-Project':'#0EA5E9','Persiapan':'#8B5CF6','Eksekusi':'#22C55E','Pasca':'#F59E0B'};

// RAB Sources
const RAB_SOURCES = ['KAS GANTUNG','XENDIT','PR / PO','VENDOR','STOCK INTERNAL'];
const RAB_SCHEMES = ['PRA MCU','MCU','PASCA MCU'];

// RAB Template dari Excel
const RAB_TEMPLATE = [
  // FIXED COST
  {cat:'I. FIXED COST', sub:'I.I.I Tenaga Medis Eksternal (Dokter)', items:[
    {name:'Dokter Pemeriksa Fisik',        uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:60},
    {name:'Dokter Gigi',                   uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:40},
    {name:'Dokter Okupasi',                uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:60},
    {name:'Dokter Spesialis Radiologi',    uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:30},
    {name:'Dokter Spesialis Jantung',      uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:25},
  ]},
  {cat:'I. FIXED COST', sub:'I.I.II Dokter Baca', items:[
    {name:'Baca Rontgen',                  uom:'PACK',source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:200},
    {name:'Baca EKG',                      uom:'PACK',source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:200},
    {name:'Baca Audiometri / Spirometri',  uom:'PACK',source:'XENDIT',       scheme:'PASCA MCU', price:500000,  cap:200},
  ]},
  {cat:'I. FIXED COST', sub:'I.I.III Tenaga Medis Internal', items:[
    {name:'PIC Lapangan Internal',         uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:0,       cap:1},
    {name:'Admin Internal',                uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:0,       cap:1},
    {name:'Analis Internal',               uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:0,       cap:1},
    {name:'Perawat Internal',              uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:0,       cap:1},
    {name:'Incentive Lembur SDM',          uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:1000000, cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'I.I.IV Tenaga Medis Eksternal', items:[
    {name:'PIC Lapangan Eksternal',        uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:250000,  cap:1},
    {name:'Admin Eksternal',               uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:200000,  cap:1},
    {name:'Analis Eksternal',              uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:250000,  cap:1},
    {name:'Perawat Eksternal',             uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:250000,  cap:1},
    {name:'Runner',                        uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:200000,  cap:1},
    {name:'Driver/Kurir',                  uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:150000,  cap:1},
    {name:'Tim Logistik',                  uom:'DAY', source:'XENDIT',       scheme:'PASCA MCU', price:150000,  cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'I.II Transportasi & Logistik', items:[
    {name:'Transport Mobilisasi PP + Tol + BBM',    uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:500000,  cap:1},
    {name:'Transport Logistik Bongkar/Muat',         uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:500000,  cap:1},
    {name:'Transport Operasional Lokasi',            uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:250000,  cap:1},
    {name:'Transport Antar Sampel',                  uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:100000,  cap:1},
    {name:'Sewa Mobil',                              uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:350000,  cap:1},
    {name:'Pengiriman Barang (Ekspedisi/GoBox)',      uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:100000,  cap:1},
    {name:'Biaya Parkir & Tiket Keamanan',           uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:100000,  cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'I.III Akomodasi', items:[
    {name:'Sewa Hotel',                    uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:500000,  cap:1},
    {name:'Sewa Rumah/Kosan',              uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:500000,  cap:1},
    {name:'Laundry Seragam Medis Tim',     uom:'DAY', source:'KAS GANTUNG', scheme:'PASCA MCU',price:50000,   cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'I.IV Konsumsi Petugas', items:[
    {name:'Air Minum Galon/Dus Petugas',   uom:'BOX', source:'KAS GANTUNG', scheme:'PRA MCU', price:100000,  cap:1},
    {name:'Snack Petugas',                 uom:'PACK',source:'KAS GANTUNG', scheme:'PRA MCU', price:20000,   cap:1},
    {name:'Makan Siang Petugas',           uom:'PACK',source:'KAS GANTUNG', scheme:'PRA MCU', price:30000,   cap:1},
    {name:'Makan Malam Petugas',           uom:'PACK',source:'KAS GANTUNG', scheme:'PRA MCU', price:30000,   cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'I.V Sewa Alat Pemeriksaan', items:[
    {name:'Sewa Bus X-Ray',                uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:2500000, cap:1},
    {name:'Sewa Alat EKG Portable',        uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:1500000, cap:1},
    {name:'Sewa Audiometri + Soundproof',  uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:1500000, cap:1},
    {name:'Sewa Spirometer',               uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:1500000, cap:1},
    {name:'Sewa Refraktometer',            uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:900000,  cap:1},
    {name:'Sewa Alat Pendingin Portable',  uom:'DAY', source:'KAS GANTUNG', scheme:'PRA MCU', price:250000,  cap:1},
  ]},
  // VARIABLE COST
  {cat:'II. VARIABLE COST', sub:'II.I Konsumsi Peserta', items:[
    {name:'Snack Peserta',                 uom:'PC',  source:'KAS GANTUNG', scheme:'PRA MCU', price:20000,   cap:1, perPeserta:true},
    {name:'Makan Siang Peserta',           uom:'PC',  source:'KAS GANTUNG', scheme:'PRA MCU', price:35000,   cap:1, perPeserta:true},
  ]},
  {cat:'II. VARIABLE COST', sub:'II.II ATK & Media Cetak', items:[
    {name:'Tinta Hitam',                   uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:80000,   cap:1},
    {name:'Tinta Warna Set',               uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:130000,  cap:1},
    {name:'Kertas HVS',                    uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:58000,   cap:1},
    {name:'Label Barcode',                 uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:82000,   cap:1},
    {name:'Form Anamnesa & Fisik',         uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:500,     cap:1},
    {name:'Foto Kopi Kartu Kontrol',       uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:500,     cap:1},
  ]},
  {cat:'II. VARIABLE COST', sub:'II.III Pra-Analitik (Sampling)', items:[
    {name:'Needle Vacutainer',             uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:215000,  cap:50},
    {name:'Spuit 3 cc',                    uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:95000,   cap:100},
    {name:'Alkohol Swab',                  uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:50000,   cap:100},
    {name:'Sarung Tangan',                 uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:90000,   cap:400},
    {name:'Masker',                        uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:45000,   cap:400},
    {name:'Tabung EDTA',                   uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:165000,  cap:100},
    {name:'Tabung SST (Kuning)',            uom:'BOX', source:'PR / PO',     scheme:'PRA MCU', price:230000,  cap:100},
    {name:'Botol Urine',                   uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:2000,    cap:1,   perPeserta:true},
    {name:'Safety Box',                    uom:'PC',  source:'PR / PO',     scheme:'PRA MCU', price:15000,   cap:80},
    {name:'Plastik Biohazard',             uom:'PACK',source:'PR / PO',     scheme:'PRA MCU', price:35000,   cap:10},
  ]},
  {cat:'II. VARIABLE COST', sub:'II.IV Biaya Lab (HPP Tes)', items:[
    // Will be populated from master products
    {name:'[dari Master Produk]',          uom:'UNT', source:'PR / PO',     scheme:'MCU',     price:0,       cap:1, fromMaster:true},
  ]},
  {cat:'II. VARIABLE COST', sub:'II.V Biaya Vendor (Sub-kontrak)', items:[
    {name:'Gambaran Darah Tepi (Vendor)',  uom:'UNT', source:'VENDOR',      scheme:'MCU',     price:50000,   cap:1, perPeserta:true},
    {name:'Rontgen Thorax PA (Vendor)',    uom:'PC',  source:'VENDOR',      scheme:'PASCA MCU',price:22000,  cap:1, perPeserta:true},
    {name:'EKG (Vendor)',                  uom:'PC',  source:'VENDOR',      scheme:'PASCA MCU',price:39000,  cap:1, perPeserta:true},
    {name:'Audiometri (Vendor)',           uom:'PC',  source:'VENDOR',      scheme:'PASCA MCU',price:30000,  cap:1, perPeserta:true},
    {name:'Spirometri (Vendor)',           uom:'PC',  source:'VENDOR',      scheme:'PASCA MCU',price:30000,  cap:1, perPeserta:true},
  ]},
];

let mcuCurrentId = null;
let mcuFilter = { search:'', status:'', type:'' };
let mcuProjects = [];

// ── RENDER MCU LIST ───────────────────────────
async function renderMCU(params={}) {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>🏥 Project MCU</h1>
        <p>Manajemen project MCU korporat — RAB, 25 tahapan, tracking realisasi</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="navigate('partners')">🤝 Partner</button>
        <button class="btn btn-ghost btn-sm" onclick="navigate('corporate')">🏢 Corporate</button>
        <button class="btn btn-teal" onclick="openMCUForm()">+ Buat Project MCU</button>
      </div>
    </div>

    <!-- KPI -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:20px" id="mcu-kpi">
      ${[1,2,3,4,5,6].map(()=>`<div class="kpi-card"><div class="kpi-icon" style="background:var(--bg2)"><div class="spinner" style="width:16px;height:16px;border-width:2px"></div></div><div><div class="kpi-val">—</div><div class="kpi-label">Memuat...</div></div></div>`).join('')}
    </div>

    <!-- Filter toolbar -->
    <div class="table-wrap" style="margin-bottom:0">
      <div class="table-toolbar">
        <input class="table-search" id="mcu-q" placeholder="Cari nama project, partner..."
          oninput="mcuFilter.search=this.value.toLowerCase();filterMCU()" style="flex:1">
        <select class="table-filter" id="mcu-status" onchange="mcuFilter.status=this.value;filterMCU()">
          <option value="">Semua Status</option>
          <option>Planning</option><option>Aktif</option><option>Selesai</option><option>Batal</option>
        </select>
        <select class="table-filter" id="mcu-type" onchange="mcuFilter.type=this.value;filterMCU()">
          <option value="">Semua Tipe</option>
          <option>MCU</option><option>HealthDay</option><option>Screening</option><option>Vaksinasi</option><option>Lainnya</option>
        </select>
      </div>

      <!-- Project list -->
      <div id="mcu-list" style="padding:0">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>`;

  await loadMCUProjects();
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
  const total    = mcuProjects.length;
  const aktif    = mcuProjects.filter(p=>p.status==='Aktif').length;
  const planning = mcuProjects.filter(p=>p.status==='Planning').length;
  const selesai  = mcuProjects.filter(p=>p.status==='Selesai').length;
  const totalVal = mcuProjects.reduce((s,p)=>s+(p.value||0),0);
  const totalRAB = mcuProjects.reduce((s,p)=>s+(p.rab_total||0),0);

  const kpis = [
    { icon:'📁', val:total,               label:'Total Project',   color:'#0891B2' },
    { icon:'🔥', val:aktif,               label:'Aktif',           color:'#EF4444' },
    { icon:'📋', val:planning,            label:'Planning',        color:'#8B5CF6' },
    { icon:'✅', val:selesai,             label:'Selesai',         color:'#22C55E' },
    { icon:'💰', val:formatCurrency(totalVal), label:'Total Nilai',color:'#F59E0B' },
    { icon:'📊', val:formatCurrency(totalRAB), label:'Total RAB Plan',color:'#06B6D4'},
  ];

  el.innerHTML = kpis.map(k=>`
    <div class="kpi-card" style="border-top:3px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.color}15;font-size:20px">${k.icon}</div>
      <div>
        <div class="kpi-val" style="font-size:${typeof k.val==='string'&&k.val.length>8?'14px':'20px'}">${k.val}</div>
        <div class="kpi-label">${k.label}</div>
      </div>
    </div>`).join('');
}


function filterMCU() {
  let data = [...mcuProjects];
  const q = (mcuFilter.search||'').toLowerCase();
  const s = mcuFilter.status;
  const t = mcuFilter.type;
  if (q) data = data.filter(p=>(p.project_name||'').toLowerCase().includes(q)||(p.partner_name||'').toLowerCase().includes(q));
  if (s) data = data.filter(p=>p.status===s);
  if (t) data = data.filter(p=>p.project_type===t);
  renderMCUKPI();
  renderMCUList(data);
}


function renderMCUList(projects) {
  const el = document.getElementById('mcu-list');
  if (!el) return;

  if (!projects.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="ico">🏥</div>
      <h3>${mcuProjects.length ? 'Tidak ada hasil filter' : 'Belum ada Project MCU'}</h3>
      <p>Buat project MCU baru untuk memulai tracking 25 tahapan.</p>
      <button class="btn btn-teal" style="margin-top:14px" onclick="openMCUForm()">+ Buat Project MCU</button>
    </div>`; return;
  }

  const STATUS_COLORS = {
    'Planning':'#8B5CF6','Aktif':'#22C55E','Selesai':'#0891B2','Batal':'#EF4444','Lewat':'#F59E0B'
  };

  el.innerHTML = projects.map(p => {
    const progress  = Math.round(((p.current_step||0) / 25) * 100);
    const sc        = STATUS_COLORS[p.status] || '#94A3B8';
    const stepLabel = MCU_STEPS[(p.current_step||1)-1]?.name || 'Deal & Negosiasi';

    return `
      <div style="border-bottom:1px solid var(--border);padding:16px 20px;transition:background .15s"
        onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''">
        <div style="display:flex;align-items:flex-start;gap:12px">

          <!-- Left accent -->
          <div style="width:4px;align-self:stretch;border-radius:4px;background:${sc};flex-shrink:0;margin:-4px 0"></div>

          <!-- Main info -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-weight:800;font-size:14px;color:var(--text);cursor:pointer"
                onclick="openMCUDetail(${p.id})">${p.project_name}</span>
              <span style="background:${sc}20;color:${sc};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px">${p.status}</span>
              ${p.project_type&&p.project_type!=='MCU'?`<span class="badge badge-gray" style="font-size:10px">${p.project_type}</span>`:''}
            </div>
            <div style="font-size:12px;color:var(--text3);display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
              ${p.partner_name?`<span>🏢 ${p.partner_name}</span>`:''}
              <span>👤 ${p.created_by_name||'—'}</span>
              ${p.start_date?`<span>📅 ${formatDateShort(p.start_date)}</span>`:''}
              ${p.target_participants?`<span>👥 ${p.target_participants} peserta</span>`:''}
            </div>

            <!-- Progress -->
            <div style="display:flex;align-items:center;gap:10px">
              <div style="flex:1;height:8px;background:var(--bg2);border-radius:8px;overflow:hidden;cursor:pointer"
                onclick="openMCUDetail(${p.id})" title="Klik untuk lihat tahapan">
                <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,${sc},${sc}99);border-radius:8px;transition:width .5s"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:${sc};white-space:nowrap">${progress}%</span>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px">
              Tahap ${p.current_step||1}/25 — <span style="color:var(--text);font-weight:600">${stepLabel}</span>
            </div>
          </div>

          <!-- Right side -->
          <div style="text-align:right;flex-shrink:0">
            ${p.value?`<div style="font-size:13px;font-weight:800;color:var(--text)">Nilai Project</div>
              <div style="font-size:15px;font-weight:800;color:var(--teal)">${formatCurrency(p.value)}</div>`:''}
            <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
              <button class="btn btn-ghost btn-sm" onclick="openMCUDetail(${p.id})">📋 Detail</button>
              <button class="btn btn-outline btn-sm" onclick="openMCUForm(${p.id})">✏️</button>
              <button class="btn btn-sm" style="background:var(--teal);color:#fff" onclick="advanceMCUStep(${p.id},${p.current_step||0})">▶ Lanjut</button>
            </div>
          </div>

        </div>
      </div>`;
  }).join('');
}


async function openMCUForm(id=null, prefillPartnerId=null, prefillDealId=null) {
  let p = {};
  if (id) { const d=await sbGet('projects',`select=*&id=eq.${id}`); p=d[0]||{}; }

  let partnerOpts = '<option value="">-- Pilih Partner --</option>';
  let corpOpts    = '<option value="">-- Tidak terkait Corporate --</option>';
  try {
    const pts = await sbGet('partners','select=id,partner_name&order=partner_name&limit=200');
    partnerOpts += (pts||[]).map(pt=>`<option value="${pt.id}" ${(p.partner_id||prefillPartnerId)==pt.id?'selected':''}>${pt.partner_name}</option>`).join('');
  } catch(e){}
  try {
    const corps = await sbGet('corporates','select=id,corporate_name&status=eq.Aktif&order=corporate_name');
    corpOpts += (corps||[]).map(c=>`<option value="${c.id}" ${p.corporate_id==c.id?'selected':''}>${c.corporate_name}</option>`).join('');
  } catch(e){}

  const today = new Date().toISOString().split('T')[0];
  const user  = getUserName?getUserName():'User';
  const code  = `MCU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Project MCU':'🏥 Buat Project MCU Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Nama Project *</label>
        <input type="text" id="mf-name" value="${p.project_name||''}" placeholder="MCU Karyawan PT. ABC - Mei 2026">
      </div>
      <div class="form-group">
        <label>Tipe Project</label>
        <select id="mf-type">
          ${['MCU','HealthDay','Screening','Wellness'].map(t=>`<option${(p.project_type||'MCU')===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Partner / Klien *</label>
        <select id="mf-partner">${partnerOpts}</select>
      </div>
      <div class="form-group">
        <label>Corporate (jika korporat)</label>
        <select id="mf-corporate">${corpOpts}</select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Tanggal Mulai</label>
        <input type="date" id="mf-start" value="${p.start_date||today}">
      </div>
      <div class="form-group">
        <label>Target Selesai</label>
        <input type="date" id="mf-end" value="${p.end_date||''}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Target Peserta</label>
        <input type="number" id="mf-peserta" value="${p.target_participants||100}">
      </div>
      <div class="form-group">
        <label>Nilai Project (Rp)</label>
        <input type="number" id="mf-value" value="${p.value||''}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>PIC OneLab (SPV)</label>
        <input type="text" id="mf-pic-ol" value="${p.pic_onelab||user}">
      </div>
      <div class="form-group">
        <label>PIC Partner</label>
        <input type="text" id="mf-pic-pt" value="${p.pic_partner||''}">
      </div>
    </div>

    <div class="form-group">
      <label>Lokasi Pelaksanaan</label>
      <input type="text" id="mf-location" value="${p.location||''}" placeholder="Nama gedung, alamat">
    </div>

    <div class="form-group">
      <label>Scope Layanan / Deskripsi</label>
      <textarea id="mf-desc" rows="2" placeholder="Paket pemeriksaan, jenis tes...">${p.description||''}</textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveMCU(${id||'null'})">
        ${id?'💾 Simpan':'🏥 Buat Project → Lanjut ke RAB'}
      </button>
    </div>`);
}

async function saveMCU(id) {
  const name      = document.getElementById('mf-name').value.trim();
  const partnerId = document.getElementById('mf-partner').value;
  if (!name)     { toast('Nama project wajib','err'); return; }
  if (!partnerId){ toast('Pilih partner dulu','err'); return; }

  const pEl = document.getElementById('mf-partner');
  const partnerName = pEl.options[pEl.selectedIndex]?.text||'';
  const user = getUserName?getUserName():'User';
  const code = `MCU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const payload = {
    project_code:        code,
    project_name:        name,
    project_type:        document.getElementById('mf-type').value,
    partner_id:          parseInt(partnerId),
    partner_name:        partnerName,
    corporate_id:        parseInt(document.getElementById('mf-corporate').value)||null,
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
      await sbPatch('projects',id,payload);
      toast('✅ Project diupdate','ok');
      closeModalForce();
      openMCUDetail(id);
    } else {
      const res = await sbPost('projects',payload);
      const newId = res[0]?.id;
      toast('✅ Project dibuat! Lanjut ke RAB...','ok');
      closeModalForce();
      await loadMCUProjects();
      if (newId) {
        setTimeout(()=>openRABModal(newId), 300);
      }
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── MCU DETAIL ────────────────────────────────
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
          ${p.corporate_id?`· 🏢 Korporat`:''}
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-teal btn-sm" onclick="openRABModal(${id})">💰 RAB</button>
        <button class="btn btn-outline btn-sm" onclick="openMCUForm(${id})">✏️ Edit</button>
        <button class="modal-close" onclick="closeModalForce()">✕</button>
      </div>
    </div>

    <!-- Summary -->
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

    <!-- RAB Summary if exists -->
    ${p.rab_total?`
      <div style="background:var(--lgray);border-radius:10px;padding:12px 14px;margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap">
        <div><div style="font-size:10px;color:var(--gray)">RAB Plan</div><div style="font-size:14px;font-weight:800;color:var(--navy)">${formatCurrency(p.rab_total)}</div></div>
        ${p.rab_actual?`<div><div style="font-size:10px;color:var(--gray)">Realisasi</div><div style="font-size:14px;font-weight:800;color:${p.rab_actual>p.rab_total?'#EF4444':'#22C55E'}">${formatCurrency(p.rab_actual)}</div></div>`:''}
        <div><div style="font-size:10px;color:var(--gray)">Nilai Project</div><div style="font-size:14px;font-weight:800;color:var(--teal)">${formatCurrency(p.value||0)}</div></div>
        <div><div style="font-size:10px;color:var(--gray)">Est. Margin</div><div style="font-size:14px;font-weight:800;color:#22C55E">${p.rab_total&&p.value?formatCurrency(p.value-p.rab_total):'—'}</div></div>
      </div>`:''}

    <!-- 25 Steps -->
    <div style="max-height:52vh;overflow-y:auto">
      ${MCU_GROUPS.map(g=>{
        const gSteps = MCU_STEPS.filter(s=>s.group===g);
        const color  = GROUP_COLORS[g];
        return `
          <div style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;
              letter-spacing:.08em;padding:6px 12px;background:${color}15;border-radius:6px;margin-bottom:6px">
              ${g}
            </div>
            ${gSteps.map(step=>{
              const stepData = (steps||[]).find(s=>s.step_number===step.no)||{};
              const isDone   = step.no < (p.current_step||0);
              const isCurrent= step.no === (p.current_step||0);
              const actualSt = stepData.status || (isDone?'Done':isCurrent?'In Progress':'Pending');
              return `
                <div onclick="openStepForm(${id},${step.no})"
                  style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;
                    cursor:pointer;margin-bottom:4px;
                    background:${isCurrent?color+'12':isDone?'#F0FDF4':'var(--lgray)'};
                    border:1.5px solid ${isCurrent?color:isDone?'#BBF7D0':'var(--border)'};
                    transition:all .15s"
                  onmouseover="this.style.borderColor='${color}'"
                  onmouseout="this.style.borderColor='${isCurrent?color:isDone?'#BBF7D0':'var(--border)'}'">
                  <div style="width:26px;height:26px;border-radius:50%;
                    background:${isDone?'#22C55E':isCurrent?color:'var(--border)'};
                    color:#fff;display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;flex-shrink:0">
                    ${isDone?'✓':step.no}
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:${isCurrent?700:600};
                      color:${isCurrent?color:isDone?'#15803D':'var(--text)'}">
                      ${step.icon} ${step.name}
                    </div>
                    <div style="font-size:10px;color:var(--gray)">
                      PIC: ${step.pic}
                      ${stepData.done_by?` · ${stepData.done_by}`:''}
                      ${stepData.done_date?` · ${formatDateShort(stepData.done_date)}`:''}
                    </div>
                  </div>
                  <div style="font-size:10px;white-space:nowrap">
                    ${isDone?'✅':isCurrent?'🔵':'⚪'} ${actualSt}
                  </div>
                  ${isCurrent?`<span style="font-size:9px;font-weight:700;color:${color};background:${color}20;padding:2px 6px;border-radius:4px">AKTIF</span>`:''}
                </div>`;
            }).join('')}
          </div>`;
      }).join('')}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
      ${(p.current_step||0)<25?`
        <button class="btn btn-outline" onclick="openStepForm(${id},${p.current_step||1})">
          📝 Isi Form Tahap ${p.current_step||1}
        </button>
        <button class="btn btn-teal" onclick="advanceMCUStep(${id},${p.current_step||0})">
          ➡ Lanjut Tahap ${(p.current_step||0)+1}
        </button>`
        :`<button class="btn btn-teal" style="background:#22C55E" disabled>✅ Selesai!</button>`}
    </div>`);
}

// ── RAB CALCULATOR (Full Excel Structure) ────
async function openRABModal(projectId) {
  const d = await sbGet('projects',`select=*&id=eq.${projectId}`);
  const p = d[0]||{};
  const peserta = p.target_participants||100;
  const days    = 1; // default 1 hari

  // Load existing RAB items
  const existing = await sbGet('rab_items',`select=*&project_id=eq.${projectId}`).catch(()=>[]);
  const rabMap = {};
  (existing||[]).forEach(r=>{ rabMap[r.item_name] = r; });

  // Load master products for HPP
  let masterProds = [];
  try {
    masterProds = await sbGet('products','select=id,nama_tes,hpp,harga_normal,kategori&is_active=eq.true&order=kategori,nama_tes') || [];
  } catch(e){}

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">💰 RAB Calculator — ${p.project_name}</div>
        <div style="font-size:12px;color:var(--gray)">Rencana Anggaran Biaya · Plan vs Actual</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-outline btn-sm" onclick="printRAB(${projectId})">🖨 Print</button>
        <button class="modal-close" onclick="closeModalForce();openMCUDetail(${projectId})">✕</button>
      </div>
    </div>

    <!-- Parameter Header -->
    <div style="background:var(--mint);border-radius:10px;padding:12px 16px;margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Parameter Project</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <div>
          <label style="font-size:11px;color:var(--gray)">Jumlah Peserta</label>
          <input type="number" id="rab-peserta" value="${peserta}" min="1"
            onchange="recalcRABFull()" style="width:80px;border:1.5px solid var(--teal);border-radius:6px;padding:4px 8px;font-size:14px;font-weight:700;margin-top:2px">
        </div>
        <div>
          <label style="font-size:11px;color:var(--gray)">Hari Pelaksanaan</label>
          <input type="number" id="rab-days" value="${days}" min="1"
            onchange="recalcRABFull()" style="width:60px;border:1.5px solid var(--teal);border-radius:6px;padding:4px 8px;font-size:14px;font-weight:700;margin-top:2px">
        </div>
        <div>
          <label style="font-size:11px;color:var(--gray)">Target Margin (%)</label>
          <input type="number" id="rab-margin" value="30" min="0" max="100"
            onchange="recalcRABFull()" style="width:60px;border:1.5px solid var(--teal);border-radius:6px;padding:4px 8px;font-size:14px;font-weight:700;margin-top:2px">
        </div>
      </div>
    </div>

    <!-- Dashboard Summary -->
    <div id="rab-dashboard" style="margin-bottom:14px"></div>

    <!-- Alokasi Dana -->
    <div id="rab-alokasi" style="margin-bottom:14px"></div>

    <!-- RAB Detail Table -->
    <div style="max-height:45vh;overflow-y:auto" id="rab-detail-container">
      <div class="loading-row"><div class="spinner"></div></div>
    </div>

    <!-- Master Produk (HPP dari config) -->
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:10px">
      <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        🧬 Tambah Biaya Lab dari Master Produk (HPP)
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select id="rab-prod-sel" class="table-filter" style="flex:1;min-width:200px">
          <option value="">-- Pilih Tes dari Master --</option>
          ${masterProds.map(p=>`<option value="${p.id}" data-name="${p.nama_tes}" data-hpp="${p.hpp||0}" data-kat="${p.kategori||''}">${p.nama_tes} (HPP: ${formatCurrency(p.hpp||0)})</option>`).join('')}
        </select>
        <button class="btn btn-teal btn-sm" onclick="addMasterProdToRAB()">+ Tambah ke RAB</button>
      </div>
      <div id="rab-master-list" style="margin-top:8px"></div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce();openMCUDetail(${projectId})">Kembali</button>
      <button class="btn btn-outline btn-sm" onclick="switchRABMode()">🔄 Mode Realisasi</button>
      <button class="btn btn-teal" onclick="saveRABFull(${projectId})">💾 Simpan RAB</button>
    </div>`);

  await renderRABDetail(projectId, peserta, days, rabMap, masterProds, existing);
  recalcRABFull();
}

let rabMode = 'plan'; // 'plan' or 'actual'
let rabMasterItems = []; // Items added from master products

function switchRABMode() {
  rabMode = rabMode === 'plan' ? 'actual' : 'plan';
  const btn = document.querySelector('button[onclick="switchRABMode()"]');
  if (btn) btn.textContent = rabMode === 'plan' ? '🔄 Mode Realisasi' : '📋 Mode Planning';
  // Toggle visibility of columns
  document.querySelectorAll('.rab-plan-col').forEach(el=>el.style.display=rabMode==='plan'?'':'none');
  document.querySelectorAll('.rab-actual-col').forEach(el=>el.style.display=rabMode==='actual'?'':'none');
  document.querySelectorAll('.rab-both-col').forEach(el=>el.style.display='');
}

function addMasterProdToRAB() {
  const sel  = document.getElementById('rab-prod-sel');
  const opt  = sel?.options[sel.selectedIndex];
  if (!opt?.value) { toast('Pilih produk dulu','err'); return; }

  const item = {
    id:     opt.value,
    name:   opt.dataset.name,
    hpp:    parseFloat(opt.dataset.hpp)||0,
    kat:    opt.dataset.kat,
    source: 'PR / PO',
    scheme: 'MCU',
  };

  if (rabMasterItems.find(i=>i.id===item.id)) { toast('Sudah ditambahkan','warn'); return; }
  rabMasterItems.push(item);

  const el = document.getElementById('rab-master-list');
  if (el) {
    el.innerHTML = rabMasterItems.map(i=>`
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--lgray);border-radius:6px;margin-bottom:4px">
        <span style="flex:1;font-size:12px;font-weight:600">${i.name}</span>
        <span style="font-size:11px;color:var(--gray)">${i.kat}</span>
        <select style="font-size:11px;padding:3px 6px;border:1px solid var(--border);border-radius:4px"
          onchange="rabMasterItems.find(x=>x.id==='${i.id}').source=this.value;recalcRABFull()">
          ${RAB_SOURCES.map(s=>`<option${i.source===s?' selected':''}>${s}</option>`).join('')}
        </select>
        <input type="number" id="rab-master-qty-${i.id}" value="1"
          style="width:60px;border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-size:11px"
          onchange="recalcRABFull()">
        <span style="font-size:11px;font-weight:700;color:var(--teal)" id="rab-master-total-${i.id}">${formatCurrency(i.hpp)}</span>
        <button onclick="rabMasterItems=rabMasterItems.filter(x=>x.id!=='${i.id}');addMasterProdToRAB.call({noop:true});document.getElementById('rab-prod-sel').value=''" 
          class="act-btn del" style="padding:3px 6px">✕</button>
      </div>`).join('');
  }
  recalcRABFull();
}

async function renderRABDetail(projectId, peserta, days, rabMap, masterProds, existing) {
  const el = document.getElementById('rab-detail-container'); if (!el) return;

  const srcColors = {
    'KAS GANTUNG': '#F59E0B',
    'XENDIT':      '#8B5CF6',
    'PR / PO':     '#0EA5E9',
    'VENDOR':      '#EF4444',
    'STOCK INTERNAL': '#22C55E',
  };

  let html = '';
  for (const section of RAB_TEMPLATE) {
    if (section.sub === 'II.IV Biaya Lab (HPP Tes)') continue; // handled by master products
    html += `
      <div style="margin-bottom:10px">
        <div style="font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;
          letter-spacing:.06em;padding:4px 10px;background:var(--lgray);border-radius:6px;margin-bottom:4px;
          display:flex;justify-content:space-between">
          <span>${section.sub}</span>
          <span>${section.cat}</span>
        </div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <thead>
            <tr style="background:#F8FAFC">
              <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">Item</th>
              <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">UOM</th>
              <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">Sumber</th>
              <th style="padding:5px 8px;text-align:left;color:var(--gray);font-size:10px">Skema</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px">Harga</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px;color:#0EA5E9" class="rab-plan-col">Qty Plan</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px;color:#0EA5E9" class="rab-plan-col">Total Plan</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px;color:#22C55E;display:none" class="rab-actual-col">Qty Aktual</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px;color:#22C55E;display:none" class="rab-actual-col">Total Aktual</th>
              <th style="padding:5px 8px;text-align:right;color:var(--gray);font-size:10px;color:#F59E0B;display:none" class="rab-actual-col">Selisih</th>
            </tr>
          </thead>
          <tbody>
            ${section.items.map(item=>{
              const key      = item.name.replace(/\s/g,'_');
              const ex       = rabMap[item.name]||{};
              const sc       = srcColors[item.source]||'#94A3B8';
              const defQty   = item.perPeserta ? peserta : (item.cap===1 ? days : 1);
              const qtyPlan  = ex.qty || defQty;
              const price    = ex.unit_price !== undefined ? ex.unit_price : item.price;
              const totalPlan= qtyPlan * price;
              const qtyActual= ex.qty_actual || 0;
              const totActual= qtyActual * price;
              const selisih  = totActual - totalPlan;

              return `<tr style="border-bottom:1px solid #F1F5F9" id="rab-row-${key}">
                <td style="padding:5px 8px;color:var(--text)">${item.name}</td>
                <td style="padding:5px 8px;color:var(--gray)">${item.uom}</td>
                <td style="padding:5px 8px">
                  <span style="background:${sc}20;color:${sc};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">${item.source}</span>
                </td>
                <td style="padding:5px 8px;font-size:10px;color:var(--gray)">${item.scheme}</td>
                <td style="padding:5px 8px;text-align:right">
                  <input type="number" class="rab-price" data-key="${key}" data-name="${item.name}" data-source="${item.source}" data-scheme="${item.scheme}" data-uom="${item.uom}"
                    value="${price}" min="0"
                    onchange="updateRABRowFull(this)"
                    style="width:85px;border:1px solid var(--border);border-radius:4px;padding:2px 5px;text-align:right;font-size:11px">
                </td>
                <td style="padding:5px 8px;text-align:right" class="rab-plan-col">
                  <input type="number" class="rab-qty-plan" data-key="${key}"
                    value="${qtyPlan}" min="0" step="0.5"
                    onchange="updateRABRowFull(this)"
                    style="width:60px;border:1px solid var(--border);border-radius:4px;padding:2px 5px;text-align:right;font-size:11px">
                </td>
                <td style="padding:5px 8px;text-align:right;font-weight:600;color:var(--navy)" class="rab-plan-col" id="rab-total-plan-${key}">
                  ${formatCurrency(totalPlan)}
                </td>
                <td style="padding:5px 8px;text-align:right;display:none" class="rab-actual-col">
                  <input type="number" class="rab-qty-actual" data-key="${key}"
                    value="${qtyActual}" min="0" step="0.5"
                    onchange="updateRABRowFull(this)"
                    style="width:60px;border:1px solid var(--border);border-radius:4px;padding:2px 5px;text-align:right;font-size:11px">
                </td>
                <td style="padding:5px 8px;text-align:right;font-weight:600;display:none" class="rab-actual-col" id="rab-total-actual-${key}">
                  ${formatCurrency(totActual)}
                </td>
                <td style="padding:5px 8px;text-align:right;font-weight:600;display:none;color:${selisih>0?'#EF4444':'#22C55E'}" class="rab-actual-col" id="rab-selisih-${key}">
                  ${selisih!==0?(selisih>0?'+':'')+formatCurrency(selisih):'—'}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }
  el.innerHTML = html;
}

function updateRABRowFull(el) {
  const key      = el.dataset.key;
  const priceEl  = document.querySelector(`.rab-price[data-key="${key}"]`);
  const planEl   = document.querySelector(`.rab-qty-plan[data-key="${key}"]`);
  const actualEl = document.querySelector(`.rab-qty-actual[data-key="${key}"]`);

  const price   = parseFloat(priceEl?.value||0);
  const qtyPlan = parseFloat(planEl?.value||0);
  const qtyAct  = parseFloat(actualEl?.value||0);

  const tPlan   = price * qtyPlan;
  const tActual = price * qtyAct;
  const selisih = tActual - tPlan;

  const tpEl = document.getElementById(`rab-total-plan-${key}`);
  const taEl = document.getElementById(`rab-total-actual-${key}`);
  const seEl = document.getElementById(`rab-selisih-${key}`);

  if (tpEl) tpEl.textContent = formatCurrency(tPlan);
  if (taEl) taEl.textContent = formatCurrency(tActual);
  if (seEl) {
    seEl.textContent = selisih!==0?(selisih>0?'+':'')+formatCurrency(selisih):'—';
    seEl.style.color = selisih>0?'#EF4444':'#22C55E';
  }
  recalcRABFull();
}

function recalcRABFull() {
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||1)||1;
  const days    = parseInt(document.getElementById('rab-days')?.value||1)||1;
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30)||30;

  // Recalc per-peserta items
  document.querySelectorAll('.rab-qty-plan').forEach(el=>{
    const priceEl = document.querySelector(`.rab-price[data-key="${el.dataset.key}"]`);
    // Check if this is a per-peserta row (we'll use data attribute)
  });

  // Sum all plan totals
  let totalPlanFixed    = 0;
  let totalPlanVariable = 0;
  let totalActualAll    = 0;
  const srcTotals = {'KAS GANTUNG':0,'XENDIT':0,'PR / PO':0,'VENDOR':0,'STOCK INTERNAL':0};
  const schemeTotals = {'PRA MCU':0,'MCU':0,'PASCA MCU':0};

  document.querySelectorAll('.rab-price').forEach(priceEl=>{
    const key    = priceEl.dataset.key;
    const source = priceEl.dataset.source;
    const scheme = priceEl.dataset.scheme;
    const planEl = document.querySelector(`.rab-qty-plan[data-key="${key}"]`);
    const actEl  = document.querySelector(`.rab-qty-actual[data-key="${key}"]`);
    const price  = parseFloat(priceEl.value||0);
    const qty    = parseFloat(planEl?.value||0);
    const act    = parseFloat(actEl?.value||0);
    const total  = price * qty;
    const totalA = price * act;

    totalPlanFixed += total; // simplified
    totalActualAll += totalA;
    if (srcTotals[source]!==undefined) srcTotals[source] += total;
    if (schemeTotals[scheme]!==undefined) schemeTotals[scheme] += total;
  });

  // Add master products
  rabMasterItems.forEach(item=>{
    const qtyEl = document.getElementById(`rab-master-qty-${item.id}`);
    const qty   = parseFloat(qtyEl?.value||1);
    const total = item.hpp * qty * peserta; // per peserta
    const totEl = document.getElementById(`rab-master-total-${item.id}`);
    if (totEl) totEl.textContent = formatCurrency(total);
    totalPlanFixed += total;
    srcTotals[item.source] = (srcTotals[item.source]||0) + total;
    schemeTotals['MCU'] = (schemeTotals['MCU']||0) + total;
  });

  const totalPlan  = totalPlanFixed;
  const hpp        = totalPlan;
  const hargaJual  = hpp / (1-margin/100);
  const marginRp   = hargaJual - hpp;
  const perOrang   = hargaJual / peserta;
  const xenditFee  = hargaJual * 0.025;
  const netRevenue = hargaJual - xenditFee;
  const ebitdaPct  = hargaJual > 0 ? (marginRp/hargaJual*100).toFixed(1) : 0;

  // Update dashboard
  const dashEl = document.getElementById('rab-dashboard');
  if (dashEl) dashEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
      ${[
        {l:'A. Total HPP/COGS',    v:formatCurrency(Math.round(hpp)),        c:'var(--text)',  bold:false},
        {l:'Margin ('+margin+'%)', v:formatCurrency(Math.round(marginRp)),   c:'#22C55E',     bold:true},
        {l:'Harga Jual',           v:formatCurrency(Math.round(hargaJual)),  c:'var(--navy)', bold:true},
        {l:'Harga/Orang',          v:formatCurrency(Math.round(perOrang)),   c:'var(--teal)', bold:true},
        {l:'Fee Xendit (2.5%)',    v:formatCurrency(Math.round(xenditFee)),  c:'#F59E0B',     bold:false},
        {l:'Net Revenue',          v:formatCurrency(Math.round(netRevenue)), c:'#8B5CF6',     bold:true},
        {l:'EBITDA %',             v:ebitdaPct+'%',                          c:'#22C55E',     bold:true},
        {l:'Realisasi (Aktual)',   v:formatCurrency(Math.round(totalActualAll)),c:totalActualAll>hpp?'#EF4444':'#22C55E',bold:false},
      ].map(k=>`
        <div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid var(--border);border-top:3px solid ${k.c}">
          <div style="font-size:${k.bold?'13px':'12px'};font-weight:${k.bold?800:600};color:${k.c}">${k.v}</div>
          <div style="font-size:10px;color:var(--gray);margin-top:2px">${k.l}</div>
        </div>`).join('')}
    </div>`;

  // Update alokasi
  const alokasiEl = document.getElementById('rab-alokasi');
  const srcColors = {'KAS GANTUNG':'#F59E0B','XENDIT':'#8B5CF6','PR / PO':'#0EA5E9','VENDOR':'#EF4444','STOCK INTERNAL':'#22C55E'};
  const schemeColors = {'PRA MCU':'#0EA5E9','MCU':'#22C55E','PASCA MCU':'#F59E0B'};
  if (alokasiEl) alokasiEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="card" style="padding:12px">
        <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">C. Alokasi Sumber Dana</div>
        ${RAB_SOURCES.map(src=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;border-radius:2px;background:${srcColors[src]||'#94A3B8'};display:inline-block"></span>
              ${src}
            </span>
            <span style="font-size:12px;font-weight:700;color:${srcColors[src]||'#94A3B8'}">${formatCurrency(Math.round(srcTotals[src]||0))}</span>
          </div>`).join('')}
      </div>
      <div class="card" style="padding:12px">
        <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">C. Skema Pengeluaran</div>
        ${Object.entries(schemeTotals).map(([scheme,total])=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;border-radius:2px;background:${schemeColors[scheme]||'#94A3B8'};display:inline-block"></span>
              ${scheme}
            </span>
            <span style="font-size:12px;font-weight:700;color:${schemeColors[scheme]||'#94A3B8'}">${formatCurrency(Math.round(total))}</span>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:6px 0;margin-top:4px">
          <span style="font-size:11px;font-weight:700">TOTAL</span>
          <span style="font-size:12px;font-weight:800;color:var(--navy)">${formatCurrency(Math.round(Object.values(schemeTotals).reduce((s,v)=>s+v,0)))}</span>
        </div>
      </div>
    </div>`;
}

async function saveRABFull(projectId) {
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||0);
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30);

  // Collect all items
  const items = [];
  let totalPlan = 0, totalActual = 0;

  document.querySelectorAll('.rab-price').forEach(priceEl=>{
    const key    = priceEl.dataset.key;
    const name   = priceEl.dataset.name;
    const source = priceEl.dataset.source;
    const scheme = priceEl.dataset.scheme;
    const uom    = priceEl.dataset.uom;
    const planEl = document.querySelector(`.rab-qty-plan[data-key="${key}"]`);
    const actEl  = document.querySelector(`.rab-qty-actual[data-key="${key}"]`);
    const price  = parseFloat(priceEl.value||0);
    const qtyPlan= parseFloat(planEl?.value||0);
    const qtyAct = parseFloat(actEl?.value||0);

    if (qtyPlan > 0 || qtyAct > 0) {
      const tPlan = price * qtyPlan;
      const tAct  = price * qtyAct;
      totalPlan  += tPlan;
      totalActual+= tAct;
      items.push({
        project_id:   projectId,
        category:     'RAB Item',
        item_name:    name,
        unit:         uom||'UNT',
        qty:          qtyPlan,
        qty_actual:   qtyAct,
        unit_price:   price,
        total_price:  tPlan,
        total_actual: tAct,
        notes:        `${source}|${scheme}`,
      });
    }
  });

  // Add master product items
  rabMasterItems.forEach(item=>{
    const qtyEl = document.getElementById(`rab-master-qty-${item.id}`);
    const qty   = parseFloat(qtyEl?.value||1) * peserta;
    const total = item.hpp * qty;
    totalPlan  += total;
    items.push({
      project_id: projectId,
      category:   'Lab HPP',
      item_name:  item.name,
      unit:       'UNT',
      qty,
      qty_actual: 0,
      unit_price: item.hpp,
      total_price:total,
      total_actual:0,
      notes:      `${item.source}|MCU`,
    });
  });

  const hpp        = totalPlan;
  const hargaJual  = hpp / (1-margin/100);

  try {
    // Delete old
    await fetch(`${SUPABASE_URL}/rest/v1/rab_items?project_id=eq.${projectId}`,{
      method:'DELETE', headers:{...SB_HEADERS,'Prefer':'return=minimal'}
    });

    // Insert new
    if (items.length) await sbPost('rab_items', items);

    // Update project totals
    await sbPatch('projects', projectId, {
      rab_total:          Math.round(hargaJual),
      rab_actual:         Math.round(totalActual),
      target_participants:peserta,
      updated_at:         new Date().toISOString(),
    });

    toast('✅ RAB disimpan','ok');
    closeModalForce();
    await loadMCUProjects();
    setTimeout(()=>openMCUDetail(projectId), 300);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function printRAB(projectId) {
  // Capture current RAB state
  const peserta  = document.getElementById('rab-peserta')?.value||'—';
  const dashboard= document.getElementById('rab-dashboard')?.innerHTML||'';
  const alokasi  = document.getElementById('rab-alokasi')?.innerHTML||'';
  const detail   = document.getElementById('rab-detail-container')?.innerHTML||'';
  const orgName  = localStorage.getItem('ol_org_name')||'OneLab Diagnostics';
  const p        = mcuProjects.find(x=>x.id===projectId)||{};

  const w = window.open('','_blank','width=1000,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>RAB — ${p.project_name||'Project MCU'}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#1A2B3C}
      .header{border-bottom:3px solid #0A2342;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between}
      h2{color:#0A2342;margin:0;font-size:18px}
      input{border:none;background:transparent;font-size:inherit;font-family:inherit;text-align:inherit;width:100%}
      @media print{button{display:none}}
    </style></head><body>
    <button onclick="window.print()" style="position:fixed;top:12px;right:12px;padding:8px 16px;background:#0A2342;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨 Print</button>
    <div class="header">
      <div><h2>${orgName}</h2><div style="font-size:11px;color:#546E7A">Rencana Anggaran Biaya (RAB)</div></div>
      <div style="text-align:right">
        <strong style="font-size:16px;color:#0A2342">${p.project_name||'—'}</strong>
        <div style="font-size:11px;color:#546E7A">${p.partner_name||'—'} · ${peserta} peserta</div>
        <div style="font-size:11px;color:#546E7A">${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
    </div>
    <h3 style="color:#0A2342;font-size:13px;margin-bottom:8px">A. Dashboard Summary</h3>
    ${dashboard}
    <h3 style="color:#0A2342;font-size:13px;margin:16px 0 8px">B. Alokasi Dana</h3>
    ${alokasi}
    <h3 style="color:#0A2342;font-size:13px;margin:16px 0 8px">C. Detail Pengeluaran</h3>
    ${detail}
    </body></html>`);
  w.document.close();
}

// ── STEP FORM (simplified, same as before) ────
async function openStepForm(projectId, stepNo) {
  const step = MCU_STEPS.find(s=>s.no===stepNo); if (!step) return;
  const existing = await sbGet('project_steps',
    `select=*&project_id=eq.${projectId}&step_number=eq.${stepNo}`).catch(()=>[]);
  const d = existing[0]||{};
  let existingVals = {};
  try { existingVals = JSON.parse(d.notes||'{}'); } catch(e) {}
  const user = getUserName?getUserName():'User';

  const fieldLabels = {
    nilai_deal:'Nilai Deal (Rp)',catatan_negosiasi:'Catatan Negosiasi',tipe_layanan:'Tipe Layanan',
    jumlah_peserta:'Jumlah Peserta',nama_perusahaan:'Nama Perusahaan',contact_hr:'Kontak HR',list_peserta:'Catatan List Peserta',
    alamat_lokasi:'Alamat Lokasi',akses_lokasi:'Akses & Kondisi',fasilitas_tersedia:'Fasilitas Tersedia',foto_lokasi:'Catatan Foto',
    rab_peserta:'Jumlah Peserta RAB',rab_paket:'Paket Pemeriksaan',rab_total:'Total RAB (Rp)',rab_harga_per_orang:'Harga/Orang (Rp)',
    approved_by:'Disetujui Oleh',approval_date:'Tanggal Approval',approval_notes:'Catatan Approval',margin_pct:'Margin (%)',
    proposal_file:'Link File Proposal',proposal_notes:'Catatan Proposal',
    tanggal_kirim:'Tanggal Kirim',penerima:'Penerima',metode_kirim:'Metode',
    revisi_notes:'Catatan Revisi',harga_final:'Harga Final (Rp)',perubahan_scope:'Perubahan Scope',
    mou_number:'No. MOU/SPK',tanggal_ttd:'Tanggal TTD',file_mou:'Link File MOU',penandatangan:'Penandatangan',
    tanggal_mcu:'Tanggal MCU',jam_mulai:'Jam Mulai',jam_selesai:'Jam Selesai',konfirmasi_partner:'Konfirmasi Partner',
    list_reagen:'List Reagen',qty_reagen:'Qty Reagen',status_stok:'Status Stok',catatan_lab:'Catatan Lab',
    list_tim:'List Tim',peran_tim:'Peran',jadwal_tim:'Jadwal Tim',briefing_date:'Tanggal Briefing',
    materi_briefing:'Materi Briefing',peserta_briefing:'Peserta Briefing',tanggal_briefing:'Tanggal',catatan:'Catatan',
    jumlah_konfirmasi:'Jumlah Konfirmasi',perubahan_peserta:'Perubahan Peserta',komunikasi_hr:'Komunikasi HR',
    waktu_berangkat:'Waktu Berangkat',armada:'Armada',checklist_alat:'Checklist Alat',catatan_mobilisasi:'Catatan',
    waktu_setup:'Waktu Setup',jumlah_registrasi:'Jumlah Registrasi',kendala_setup:'Kendala',
    waktu_mulai:'Waktu Mulai',waktu_selesai:'Waktu Selesai',jumlah_diambil:'Jumlah Sampel',catatan_sampling:'Catatan',
    waktu_kirim:'Waktu Kirim',jumlah_sampel:'Jumlah Sampel Kirim',pengantar:'Pengantar',tanda_terima:'No. Tanda Terima',
    waktu_mulai_lab:'Waktu Mulai Lab',alat_dipakai:'Alat Dipakai',catatan_analis:'Catatan Analis',qc_status:'Status QC',
    jumlah_input:'Jumlah Input',waktu_input:'Waktu Input',catatan_input:'Catatan',
    dokter_validator:'Dokter Validator',tanggal_validasi:'Tanggal Validasi',hasil_qc:'Hasil QC',catatan_qc:'Catatan QC',
    template_laporan:'Template',format_output:'Format',file_laporan:'Link File',catatan_laporan:'Catatan',
    penerima_laporan:'Penerima',metode_pengiriman:'Metode',konfirmasi_terima:'Konfirmasi',
    nomor_invoice:'No. Invoice',jumlah_tagihan:'Jumlah Tagihan (Rp)',tanggal_jatuh_tempo:'Jatuh Tempo',status_bayar:'Status Bayar',
    rating_partner:'Rating (1-5)',lessons_learned:'Lessons Learned',dokumentasi_foto:'Link Foto',rekomendasi:'Rekomendasi',
  };

  const formFields = step.fields.map(f=>{
    const label = fieldLabels[f]||f;
    const val   = existingVals[f]||'';
    const isArea= ['catatan_negosiasi','list_peserta','akses_lokasi','fasilitas_tersedia','revisi_notes',
                   'perubahan_scope','list_reagen','qty_reagen','list_tim','peran_tim','jadwal_tim',
                   'materi_briefing','komunikasi_hr','catatan_mobilisasi','kendala_setup','catatan_sampling',
                   'catatan_analis','catatan_input','catatan_qc','catatan_laporan','lessons_learned','rekomendasi'].includes(f);
    const isDate= f.includes('date')||f.includes('tanggal')||f==='jatuh_tempo';
    const isTime= f.includes('waktu')||f.includes('jam');
    const isNum = ['nilai_deal','jumlah_peserta','rab_peserta','rab_total','rab_harga_per_orang','margin_pct',
                   'harga_final','jumlah_konfirmasi','jumlah_registrasi','jumlah_diambil','jumlah_sampel',
                   'jumlah_input','nomor_invoice','jumlah_tagihan'].includes(f);

    const type  = isDate?'date':isTime?'time':isNum?'number':'text';
    if (isArea) return `<div class="form-group" style="grid-column:1/-1"><label>${label}</label><textarea id="sf_${f}" rows="2">${val}</textarea></div>`;
    return `<div class="form-group"><label>${label}</label><input type="${type}" id="sf_${f}" value="${val}" placeholder="${label}..."></div>`;
  }).join('');

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">${step.icon} Tahap ${step.no}: ${step.name}</div>
        <div style="font-size:11px;color:var(--gray)">PIC: ${step.pic} · Grup: ${step.group}</div>
      </div>
      <button class="modal-close" onclick="closeModalForce();openMCUDetail(${projectId})">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${formFields}
    </div>
    <div class="form-row" style="margin-top:10px">
      <div class="form-group">
        <label>Status</label>
        <select id="sf_status">
          ${['Pending','In Progress','Done','Blocked'].map(s=>`<option${(d.status||'In Progress')===s?' selected':''}>${s}</option>`).join('')}
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
  const step = MCU_STEPS.find(s=>s.no===stepNo); if (!step) return;
  const data = {};
  step.fields.forEach(f=>{ const el=document.getElementById(`sf_${f}`); if(el) data[f]=el.value; });
  const status    = document.getElementById('sf_status')?.value||'In Progress';
  const done_by   = document.getElementById('sf_done_by')?.value||'';
  const done_date = document.getElementById('sf_done_date')?.value||null;

  try {
    const existing = await sbGet('project_steps',
      `select=id&project_id=eq.${projectId}&step_number=eq.${stepNo}`).catch(()=>[]);
    const payload = {
      project_id:stepNo===1?projectId:projectId,
      step_number:stepNo, step_name:step.name, step_group:step.group,
      status, done_by, done_date:done_date||null,
      notes:JSON.stringify(data), updated_at:new Date().toISOString(),
    };
    if (existing[0]?.id) await sbPatch('project_steps',existing[0].id,payload);
    else await sbPost('project_steps',{...payload,project_id:projectId});

    if (status==='Done') {
      const proj = await sbGet('projects',`select=current_step&id=eq.${projectId}`);
      const cur  = proj[0]?.current_step||0;
      if (stepNo>=cur) {
        await sbPatch('projects',projectId,{
          current_step:Math.min(stepNo+1,25),
          status:stepNo>=25?'Completed':'Active',
          updated_at:new Date().toISOString(),
        });
      }
    }
    toast(`✅ Tahap ${stepNo} disimpan`,'ok');
    closeModalForce();
    await openMCUDetail(projectId);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function advanceMCUStep(projectId, currentStep) {
  await openStepForm(projectId, Math.min(currentStep+1, 25));
}
