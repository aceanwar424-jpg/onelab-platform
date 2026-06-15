// ═══════════════════════════════════════════════════════════════
// MODULE: Project MCU B2B — v5
// 31 Stage (S01–S31), 6 Fase, Gate System, RAB terintegrasi
// Data flows: S01→S03→S04→S08→S15→S23→S25
// ═══════════════════════════════════════════════════════════════

// ── KONSTANTA FASE & STAGE ────────────────────────────────────
const MCU_PHASES = [
  { id:'F1', label:'Perencanaan & Penjualan',  color:'#0891B2', stages:['S01','S02','S03','S04','S05','S06'] },
  { id:'F2', label:'Persiapan & Mobilisasi',   color:'#7C3AED', stages:['S07','S08','S09','S10','S11','S12'] },
  { id:'F3', label:'Pelaksanaan Lapangan',      color:'#059669', stages:['S13','S14','S15','S16'] },
  { id:'F4', label:'Pasca MCU & QC',            color:'#D97706', stages:['S17','S18','S19','S20','S21','S22','S23','S24'] },
  { id:'F5', label:'Billing & Penutupan',       color:'#DC2626', stages:['S25','S26','S27','S28','S29'] },
  { id:'F6', label:'Evaluasi & Feedback',       color:'#6B7280', stages:['S30','S31'] },
];

const MCU_STAGES = {
  S01:{ id:'S01', no:1,  phase:'F1', name:'Discovery & Kebutuhan Klien',          pic:'Sales/AM',      icon:'🔍', form:'F-01-B2B',
    fields:['industri_klien','lokasi_pelaksanaan','alamat_lokasi','target_peserta','tujuan_mcu','preferensi_tanggal_1','target_sla_hasil','kebutuhan_hardcopy','kontak_pic_klien','skenario_risiko'],
    gate:['credit_hold_status_clear','f01_lengkap'],
    gateLabel:'F-01 terisi lengkap + Status Credit Hold klien = CLEAR' },
  S02:{ id:'S02', no:2,  phase:'F1', name:'Mapping Parameter & Validasi Klinis',  pic:'Sales + PJ Medis', icon:'🧬', form:'F-02-B2B',
    fields:['paket_utama','parameter_list','catatan_klinis','validasi_pj_medis'],
    gate:['f01_done','signoff_pj_medis'],
    gateLabel:'F-01 selesai + Sign-off PJ Medis + Admin Project' },
  S03:{ id:'S03', no:3,  phase:'F1', name:'Pra-Kalkulasi & Approval Harga (RAB)', pic:'Sales + Finance', icon:'💰', form:'F-03-B2B',
    fields:['rab_hpp_total','rab_harga_per_peserta','rab_minimum_guarantee','approval_head_ops'],
    gate:['f02_done','rab_exists'],
    gateLabel:'F-02 selesai + RAB sudah diisi & disetujui Head of Operations' },
  S04:{ id:'S04', no:4,  phase:'F1', name:'Penguncian Order MCU (F-05)',          pic:'Sales + SPV',   icon:'🔒', form:'F-05-B2B',
    fields:['harga_per_peserta','minimum_guarantee','sla_hasil_kontraktual','skema_pembayaran','tanggal_pelaksanaan','signed_by_sales','signed_by_spv'],
    gate:['f03_approved','signed_by_sales','signed_by_spv'],
    gateLabel:'F-03 disetujui + F-05 ditandatangani Sales & SPV Project' },
  S05:{ id:'S05', no:5,  phase:'F1', name:'Technical Meeting & Site Survey',      pic:'Sales + SPV',   icon:'📋', form:'F-TM-B2B',
    fields:['tanggal_tm','peserta_tm','temuan_site','catatan_tm','signed_tm'],
    gate:['f05_locked'],
    gateLabel:'F-05 sudah dikunci (kedua tanda tangan terpenuhi)' },
  S06:{ id:'S06', no:6,  phase:'F1', name:'Handover Project ke SPV Project',      pic:'Sales → SPV',   icon:'🤝', form:'F-06-B2B',
    fields:['checklist_handover','pic_spv_project','pic_admin_project','catatan_handover','signed_handover_sales','signed_handover_spv'],
    gate:['f05_done','7_syarat_handover'],
    gateLabel:'F-05 selesai + 7 syarat handover F-06 terpenuhi + tanda tangan kedua pihak' },
  S07:{ id:'S07', no:7,  phase:'F2', name:'Konfigurasi Sistem & Distribusi F-OPS-02', pic:'SPV + IT Ops', icon:'⚙️', form:'F-OPS-02',
    fields:['parameter_sistem','konfirmasi_it_ops','master_data_ready'],
    gate:['f06_done'],
    gateLabel:'F-06 Handover selesai & ditandatangani' },
  S08:{ id:'S08', no:8,  phase:'F2', name:'Database Cleansing & Master Data Peserta', pic:'Admin Project', icon:'🗃️', form:'F-OPS-02 (lampiran)',
    fields:['file_peserta_upload','jumlah_peserta_final','status_cleansing','validasi_admin','validasi_spv'],
    gate:['s07_done'],
    gateLabel:'S07 selesai + Master Data divalidasi Admin Project & SPV' },
  S09:{ id:'S09', no:9,  phase:'F2', name:'Pengajuan & Approval Dana Kas Gantung', pic:'SPV + Finance', icon:'💵', form:'F-OPS-01',
    fields:['rab_ops_total','pengajuan_dana','approval_finance','dana_cair'],
    gate:['s07_done'],
    gateLabel:'S07/S08 paralel selesai + Finance verifikasi & cairkan dana' },
  S10:{ id:'S10', no:10, phase:'F2', name:'Persiapan Logistik, Alat & BMHP',     pic:'SPV + PIC BMHP', icon:'📦', form:'F-OPS-02 + F-CKL-01',
    fields:['list_bmhp','function_test_result','kalibrasi_status','bmhp_terkemas'],
    gate:['s09_done'],
    gateLabel:'S09 approved + Semua alat LAYAK di F-CKL-01 + BMHP terkemas' },
  S11:{ id:'S11', no:11, phase:'F2', name:'Penugasan SDM (F-OPS-03)',             pic:'Admin + SPV',   icon:'👥', form:'F-OPS-03',
    fields:['list_personel','peran_personel','konfirmasi_personel','akses_sistem_diberikan'],
    gate:['s10_done'],
    gateLabel:'S10 paralel selesai + Semua personel terkonfirmasi + akses sistem diberikan' },
  S12:{ id:'S12', no:12, phase:'F2', name:'Briefing & Dry Run (GO/NO-GO)',        pic:'SPV Project',   icon:'📢', form:'F-OPS-04',
    fields:['tanggal_briefing','absensi_briefing','go_nogo_checklist','hasil_go_nogo','catatan_briefing'],
    gate:['s10_done','s11_done'],
    gateLabel:'S10+S11 selesai + Absensi 100% personel kunci + GO/NO-GO = GO' },
  S13:{ id:'S13', no:13, phase:'F3', name:'Setup Lokasi & Konfirmasi Kesiapan Final', pic:'SPV Project', icon:'🏗️', form:'F-CKL-03',
    fields:['waktu_tiba','setup_selesai','sistem_online','koneksi_stabil','konfirmasi_spv'],
    gate:['s12_go'],
    gateLabel:'S12 GO/NO-GO = GO + SPV konfirmasi setup selesai & sistem online' },
  S14:{ id:'S14', no:14, phase:'F3', name:'Pelaksanaan Layanan Peserta (Hari-H)', pic:'SPV Project',   icon:'⚕️', form:'F-CKL-03 + LOG-UNREG',
    fields:['total_hadir','total_unreg','log_unreg_notes','catatan_eksepsi','jam_selesai_layanan'],
    gate:['s13_done'],
    gateLabel:'S13 selesai + Semua peserta sudah Checkout' },
  S15:{ id:'S15', no:15, phase:'F3', name:'Rekonsiliasi Total & Penerbitan BAST', pic:'SPV + Klien',   icon:'📝', form:'F-OPS-06',
    fields:['total_terdaftar','total_hadir_bast','total_tidak_hadir','total_unregistered','dasar_tagihan_awal','deviasi_notes','signed_by_spv_bast','signed_by_klien','signed_klien_jabatan'],
    gate:['s14_done','signed_by_klien'],
    gateLabel:'S14 selesai + BAST ditandatangani PIC Klien yang berwenang' },
  S16:{ id:'S16', no:16, phase:'F3', name:'Laporan Harian & Serah Terima Dokumen', pic:'SPV → Admin', icon:'📄', form:'Daily Report',
    fields:['laporan_harian','manifest_sampel','log_addon','dokumen_fisik_diterima','admin_konfirmasi'],
    gate:['s15_done'],
    gateLabel:'S15 selesai + Admin Project konfirmasi terima semua dokumen fisik' },
  S17:{ id:'S17', no:17, phase:'F4', name:'Konsolidasi Master Data & Generate Hasil', pic:'Admin + IT Ops', icon:'🔄', form:'F-19',
    fields:['data_source_integrated','status_complete','status_incomplete','status_missed','catatan_konsolidasi'],
    gate:['s16_done'],
    gateLabel:'S16 selesai + Semua data source terintegrasi' },
  S18:{ id:'S18', no:18, phase:'F4', name:'QC Layer 1 — Administratif',           pic:'Admin Project', icon:'✅', form:'F-027 L1',
    fields:['cek_identitas','cek_parameter','cek_vendor','error_list_l1','resolved_l1','signoff_qc_l1'],
    gate:['s17_done'],
    gateLabel:'S17 selesai + Tidak ada error administratif ATAU semua error resolved' },
  S19:{ id:'S19', no:19, phase:'F4', name:'QC Layer 2 — Teknis/Analis',           pic:'Analis/Lab PIC', icon:'🔬', form:'F-027 L2',
    fields:['null_value_check','critical_value_flag','catatan_teknis','signoff_qc_l2'],
    gate:['s18_done'],
    gateLabel:'S18 selesai + Tidak ada null value tanpa alasan + Critical Value di-flag' },
  S20:{ id:'S20', no:20, phase:'F4', name:'QC Layer 3 — Medis/Dokter PJ',        pic:'Dokter PJ',     icon:'👨‍⚕️', form:'F-027 L3',
    fields:['review_dokter','kesimpulan_fit','kesimpulan_fwn','kesimpulan_unfit','catatan_medis','signoff_qc_l3','data_locked'],
    gate:['s19_done'],
    gateLabel:'S19 selesai + Semua peserta punya kesimpulan + Dokter approve digital' },
  S21:{ id:'S21', no:21, phase:'F4', name:'QC Layer 4 — Produksi PDF & Locking', pic:'Admin Project', icon:'📊', form:'F-027 L4',
    fields:['pdf_generated','placeholder_incomplete','admin_finalize','signoff_qc_l4'],
    gate:['s20_done'],
    gateLabel:'S20 selesai + PDF ter-generate semua + Admin klik Finalize' },
  S22:{ id:'S22', no:22, phase:'F4', name:'QC Layer 5 — Final Sign-Off SPV',     pic:'SPV Project',   icon:'🏆', form:'F-027 L5',
    fields:['sampling_pct','sampling_hasil','report_clean','signoff_qc_l5'],
    gate:['s21_done'],
    gateLabel:'S21 selesai + SPV klik REPORT CLEAN — membuka S23 & S24 paralel' },
  S23:{ id:'S23', no:23, phase:'F4', name:'Rekonsiliasi Data & Rekap Billing Final', pic:'Admin + SPV + Finance', icon:'💳', form:'F-019 + F-020',
    fields:['deviasi_kat1','deviasi_kat2','deviasi_kat3','deviasi_kat4','total_dapat_ditagih','rekap_billing_komponen','signed_admin_f020','signed_spv_f020','signed_finance_f020'],
    gate:['s22_done'],
    gateLabel:'S22 selesai + Semua deviasi resolved + F-020 ditandatangani 3 pihak' },
  S24:{ id:'S24', no:24, phase:'F4', name:'Serah Terima Laporan ke Sales & Klien', pic:'Admin → SPV → Sales', icon:'📨', form:'F-028',
    fields:['paket_laporan','serah_terima_sales','kirim_ke_klien','client_receipt_confirmed_at'],
    gate:['s22_done'],
    gateLabel:'S22 selesai (paralel S23) + Klien konfirmasi penerimaan laporan' },
  S25:{ id:'S25', no:25, phase:'F5', name:'Penerbitan Invoice',                   pic:'Finance',       icon:'🧾', form:'F-Faktur',
    fields:['nomor_invoice','nilai_invoice','tanggal_invoice','deadline_bayar','ar_register_updated'],
    gate:['s23_done','s24_done','all_deviasi_resolved','f020_3_ttd'],
    gateLabel:'S23+S24 selesai + Semua deviasi resolved + F-020 sudah 3 tanda tangan' },
  S26:{ id:'S26', no:26, phase:'F5', name:'Monitoring AR & Aging Piutang',        pic:'Finance',       icon:'📈', form:'F-021',
    fields:['ar_register','aging_status','follow_up_notes'],
    gate:['s25_done'],
    gateLabel:'S25 selesai + Invoice sudah dikirim ke klien' },
  S27:{ id:'S27', no:27, phase:'F5', name:'Verifikasi Pembayaran & PPh 23',       pic:'Finance',       icon:'💰', form:'F-032',
    fields:['bukti_transfer','nominal_bayar','tanggal_bayar','pph23_status','invoice_status_lunas'],
    gate:['s26_done'],
    gateLabel:'S26 selesai + Pembayaran masuk terverifikasi' },
  S28:{ id:'S28', no:28, phase:'F5', name:'Laporan Realisasi RAB & Gross Margin', pic:'SPV + Finance', icon:'📋', form:'F-031',
    fields:['rab_realisasi','gross_margin_actual','selisih_plan_actual','laporan_verified_finance'],
    gate:['s27_done'],
    gateLabel:'S27 selesai + SPV submit + Finance verifikasi laporan RAB' },
  S29:{ id:'S29', no:29, phase:'F5', name:'Financial Closing Notice',             pic:'Finance + Head of Ops', icon:'🔐', form:'F-030',
    fields:['7_kondisi_closing','financial_closing_notice','signed_finance_closing','signed_head_ops'],
    gate:['s28_done','status_financial_paid'],
    gateLabel:'7 kondisi closing terpenuhi + status_financial = PAID + tanda tangan Finance & Head of Ops' },
  S30:{ id:'S30', no:30, phase:'F6', name:'Rapat Evaluasi Internal',              pic:'SPV (fasilitator)', icon:'🗣️', form:'F-EVAL-01',
    fields:['tanggal_evaluasi','peserta_evaluasi','temuan_evaluasi','cap_terdokumentasi','signoff_evaluasi'],
    gate:['s24_done'],
    gateLabel:'S24 selesai (trigger pertama) — berjalan paralel dengan FASE 5' },
  S31:{ id:'S31', no:31, phase:'F6', name:'Survei Kepuasan Klien (NPS)',          pic:'Sales/AM',      icon:'⭐', form:'F-KPK-01',
    fields:['nps_score','feedback_klien','response_received','tanggal_survey'],
    gate:['s24_done'],
    gateLabel:'S24 selesai + Sales kirim kuesioner (maks H+3) + Response atau deadline H+14' },
};

// ── GATE CONDITIONS ────────────────────────────────────────────
// Returns array of unmet conditions (empty = gate open)
function checkGate(stage, project, stepsData) {
  const unmet = [];
  const isDone = (sid) => {
    const sno = parseInt(sid.replace('S',''));
    return (project.current_step||1) > sno ||
      stepsData.some(s => s.step_id === sid && s.status === 'Done');
  };
  const getField = (field) => project[field] || null;

  switch(stage.id) {
    case 'S02':
      if (!isDone('S01')) unmet.push('S01 (Discovery) belum selesai');
      if (getField('credit_hold_status') === 'HOLD') unmet.push('Klien berstatus Credit Hold — butuh approval Direksi');
      break;
    case 'S03':
      if (!isDone('S02')) unmet.push('S02 (Mapping Parameter) belum selesai');
      break;
    case 'S04':
      if (!isDone('S03')) unmet.push('S03 (RAB) belum selesai');
      if (!project.rab_total || project.rab_total <= 0) unmet.push('RAB belum diisi — buka RAB Calculator dulu');
      break;
    case 'S05':
      if (!isDone('S04')) unmet.push('S04 (F-05 Order) belum selesai');
      if (!project.f05_locked) unmet.push('F-05 belum dikunci (belum ada 2 tanda tangan)');
      break;
    case 'S06':
      if (!isDone('S05')) unmet.push('S05 (Technical Meeting) belum selesai');
      break;
    case 'S07':
      if (!isDone('S06')) unmet.push('S06 (Handover) belum selesai — F-06 harus ditandatangani Sales & SPV');
      break;
    case 'S08': case 'S09':
      if (!isDone('S07')) unmet.push('S07 (Konfigurasi Sistem) belum selesai');
      break;
    case 'S10':
      if (!isDone('S09')) unmet.push('S09 (Dana Kas Gantung) belum cair');
      break;
    case 'S11':
      if (!isDone('S10')) unmet.push('S10 (Logistik & BMHP) belum selesai');
      break;
    case 'S12':
      if (!isDone('S10')) unmet.push('S10 (Logistik) belum selesai');
      if (!isDone('S11')) unmet.push('S11 (SDM) belum selesai');
      break;
    case 'S13':
      if (!isDone('S12')) unmet.push('S12 (Briefing GO/NO-GO) belum selesai');
      const gono = stepsData.find(s=>s.step_id==='S12');
      let gonoData = {};
      try { gonoData = JSON.parse(gono?.form_data||'{}'); } catch(e){}
      if (gonoData.hasil_go_nogo && gonoData.hasil_go_nogo !== 'GO') unmet.push('GO/NO-GO = NO — tidak bisa setup. Hubungi Head of Operations');
      break;
    case 'S14':
      if (!isDone('S13')) unmet.push('S13 (Setup Lokasi) belum selesai');
      break;
    case 'S15':
      if (!isDone('S14')) unmet.push('S14 (Pelaksanaan Hari-H) belum selesai');
      break;
    case 'S16':
      if (!isDone('S15')) unmet.push('S15 (BAST) belum selesai');
      const bast = stepsData.find(s=>s.step_id==='S15');
      let bastData = {};
      try { bastData = JSON.parse(bast?.form_data||'{}'); } catch(e){}
      if (!bastData.signed_by_klien) unmet.push('BAST belum ditandatangani PIC Klien yang berwenang');
      break;
    case 'S17': if (!isDone('S16')) unmet.push('S16 (Serah Terima Dokumen) belum selesai'); break;
    case 'S18': if (!isDone('S17')) unmet.push('S17 (Konsolidasi Data) belum selesai'); break;
    case 'S19': if (!isDone('S18')) unmet.push('QC Layer 1 (Admin) belum selesai'); break;
    case 'S20': if (!isDone('S19')) unmet.push('QC Layer 2 (Teknis/Analis) belum selesai'); break;
    case 'S21': if (!isDone('S20')) unmet.push('QC Layer 3 (Dokter PJ) belum selesai'); break;
    case 'S22': if (!isDone('S21')) unmet.push('QC Layer 4 (Produksi PDF) belum selesai'); break;
    case 'S23': case 'S30': case 'S31':
      if (!isDone('S22') && stage.id !== 'S30' && stage.id !== 'S31') unmet.push('QC Layer 5 (SPV Sign-off) belum selesai');
      if ((stage.id==='S30'||stage.id==='S31') && !isDone('S24')) unmet.push('S24 (Serah Terima Laporan ke Klien) belum selesai');
      break;
    case 'S24': if (!isDone('S22')) unmet.push('QC Layer 5 (SPV Sign-off) belum selesai — S23 & S24 buka paralel'); break;
    case 'S25':
      if (!isDone('S23')) unmet.push('S23 (Rekap Billing) belum selesai');
      if (!isDone('S24')) unmet.push('S24 (Laporan ke Klien) belum selesai');
      if (!project.all_deviasi_resolved) unmet.push('Masih ada deviasi rekonsiliasi yang belum diselesaikan');
      if (!project.f020_signed_3) unmet.push('F-020 belum ditandatangani 3 pihak (Admin+SPV+Finance)');
      break;
    case 'S26': if (!isDone('S25')) unmet.push('S25 (Invoice) belum diterbitkan'); break;
    case 'S27': if (!isDone('S26')) unmet.push('S26 (Monitoring AR) belum aktif'); break;
    case 'S28': if (!isDone('S27')) unmet.push('S27 (Verifikasi Pembayaran) belum selesai'); break;
    case 'S29':
      if (!isDone('S28')) unmet.push('S28 (Laporan RAB) belum selesai');
      if (project.status_financial !== 'PAID') unmet.push(`Status financial masih ${project.status_financial||'OPEN'} — harus PAID`);
      break;
  }
  return unmet;
}

// ── SLA HELPERS ────────────────────────────────────────────────
function getSLACategory(peserta) {
  if (peserta <= 250) return 'SMALL';
  if (peserta <= 500) return 'MEDIUM';
  return 'LARGE';
}
function getSLAPrep(peserta) {
  const cat = getSLACategory(peserta);
  return cat === 'SMALL' ? 3 : cat === 'MEDIUM' ? 5 : 7;
}
function calcSLADeadline(tanggal, peserta) {
  if (!tanggal) return null;
  const d = new Date(tanggal);
  d.setDate(d.getDate() - getSLAPrep(peserta));
  return d.toISOString().split('T')[0];
}

// ── RAB TEMPLATE ───────────────────────────────────────────────
const RAB_SOURCES = ['KAS GANTUNG','XENDIT','PR / PO','VENDOR','STOCK INTERNAL'];
const RAB_SCHEMES = ['PRA MCU','MCU','PASCA MCU'];
const RAB_TEMPLATE = [
  {cat:'I. FIXED COST', sub:'Tenaga Medis Eksternal (Dokter)', items:[
    {name:'Dokter Pemeriksa Fisik',       uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:500000, cap:60},
    {name:'Dokter Gigi',                  uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:500000, cap:40},
    {name:'Dokter Okupasi',               uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:500000, cap:60},
    {name:'Dokter Spesialis Radiologi',   uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:500000, cap:30},
    {name:'Baca Rontgen',                 uom:'PACK',source:'XENDIT',     scheme:'PASCA MCU',price:500000, cap:200},
    {name:'Baca EKG',                     uom:'PACK',source:'XENDIT',     scheme:'PASCA MCU',price:500000, cap:200},
  ]},
  {cat:'I. FIXED COST', sub:'Tenaga Medis Internal', items:[
    {name:'PIC Lapangan Internal',        uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:0,      cap:1},
    {name:'Admin Internal',               uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:0,      cap:1},
    {name:'Analis Internal',              uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:0,      cap:1},
    {name:'Perawat Internal',             uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:0,      cap:1},
    {name:'Incentive Lembur SDM',         uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:1000000,cap:1},
    {name:'PIC Lapangan Eksternal',       uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:250000, cap:1},
    {name:'Analis Eksternal',             uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:250000, cap:1},
    {name:'Perawat Eksternal',            uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:250000, cap:1},
    {name:'Runner',                       uom:'DAY',source:'XENDIT',      scheme:'PASCA MCU',price:200000, cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'Transportasi & Logistik', items:[
    {name:'Transport Mobilisasi PP + Tol',uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:500000, cap:1},
    {name:'Transport Logistik Bongkar/Muat',uom:'DAY',source:'KAS GANTUNG',scheme:'PRA MCU', price:500000, cap:1},
    {name:'Transport Antar Sampel',       uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:100000, cap:1},
    {name:'Sewa Mobil',                   uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:350000, cap:1},
    {name:'Pengiriman Barang (Ekspedisi)',uom:'DAY',source:'KAS GANTUNG',  scheme:'PRA MCU',  price:100000, cap:1},
    {name:'Biaya Parkir & Keamanan',      uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:100000, cap:1},
    {name:'Sewa Hotel',                   uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:500000, cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'Konsumsi Petugas', items:[
    {name:'Air Minum Petugas',            uom:'BOX',source:'KAS GANTUNG', scheme:'PRA MCU',  price:100000, cap:1},
    {name:'Snack Petugas',                uom:'PACK',source:'KAS GANTUNG',scheme:'PRA MCU',  price:20000,  cap:1},
    {name:'Makan Siang Petugas',          uom:'PACK',source:'KAS GANTUNG',scheme:'PRA MCU',  price:30000,  cap:1},
  ]},
  {cat:'I. FIXED COST', sub:'Sewa Alat Pemeriksaan', items:[
    {name:'Sewa Bus X-Ray',               uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:2500000,cap:1},
    {name:'Sewa Alat EKG Portable',       uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:1500000,cap:1},
    {name:'Sewa Audiometri + Soundproof', uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:1500000,cap:1},
    {name:'Sewa Spirometer',              uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:1500000,cap:1},
    {name:'Sewa Refraktometer',           uom:'DAY',source:'KAS GANTUNG', scheme:'PRA MCU',  price:900000, cap:1},
  ]},
  {cat:'II. VARIABLE COST', sub:'Konsumsi Peserta', items:[
    {name:'Snack Peserta',                uom:'PC', source:'KAS GANTUNG', scheme:'PRA MCU',  price:20000,  cap:1, perPeserta:true},
    {name:'Makan Siang Peserta',          uom:'PC', source:'KAS GANTUNG', scheme:'PRA MCU',  price:35000,  cap:1, perPeserta:true},
  ]},
  {cat:'II. VARIABLE COST', sub:'ATK & Media Cetak', items:[
    {name:'Tinta Hitam',                  uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:80000,  cap:1},
    {name:'Tinta Warna Set',              uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:130000, cap:1},
    {name:'Kertas HVS',                   uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:58000,  cap:1},
    {name:'Label Barcode',                uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:82000,  cap:1},
    {name:'Form Anamnesa & Fisik',        uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:500,    cap:1},
  ]},
  {cat:'II. VARIABLE COST', sub:'Pra-Analitik (Sampling)', items:[
    {name:'Needle Vacutainer',            uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:215000, cap:50},
    {name:'Spuit 3 cc',                   uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:95000,  cap:100},
    {name:'Alkohol Swab',                 uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:50000,  cap:100},
    {name:'Sarung Tangan',                uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:90000,  cap:400},
    {name:'Masker',                       uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:45000,  cap:400},
    {name:'Tabung EDTA',                  uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:165000, cap:100},
    {name:'Tabung SST (Kuning)',           uom:'BOX',source:'PR / PO',     scheme:'PRA MCU',  price:230000, cap:100},
    {name:'Botol Urine',                  uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:2000,   cap:1,  perPeserta:true},
    {name:'Safety Box',                   uom:'PC', source:'PR / PO',     scheme:'PRA MCU',  price:15000,  cap:80},
  ]},
  {cat:'II. VARIABLE COST', sub:'Biaya Vendor (Sub-kontrak)', items:[
    {name:'Gambaran Darah Tepi (Vendor)', uom:'UNT',source:'VENDOR',      scheme:'MCU',      price:50000,  cap:1, perPeserta:true},
    {name:'Rontgen Thorax PA (Vendor)',   uom:'PC', source:'VENDOR',      scheme:'PASCA MCU',price:22000,  cap:1, perPeserta:true},
    {name:'EKG (Vendor)',                 uom:'PC', source:'VENDOR',      scheme:'PASCA MCU',price:39000,  cap:1, perPeserta:true},
    {name:'Audiometri (Vendor)',          uom:'PC', source:'VENDOR',      scheme:'PASCA MCU',price:30000,  cap:1, perPeserta:true},
    {name:'Spirometri (Vendor)',          uom:'PC', source:'VENDOR',      scheme:'PASCA MCU',price:30000,  cap:1, perPeserta:true},
  ]},
];

// ── STATE ──────────────────────────────────────────────────────
let mcuProjects = [], mcuFilter = { search:'', status:'', type:'' };
let rabParams   = {};   // { peserta, days, margin, selectedTests, items }

// ══════════════════════════════════════════════════════════════
// RENDER UTAMA
// ══════════════════════════════════════════════════════════════
async function renderMCU() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>🏥 Project MCU</h1>
        <p>Manajemen project MCU korporat B2B — 6 Fase, 31 Tahapan, Gate System</p>
      </div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="renderMCU()">↻ Refresh</button>
        <button class="btn btn-teal" onclick="openMCUForm()">+ Buat Project MCU</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px;margin-bottom:20px" id="mcu-kpi">
      ${[1,2,3,4,5,6].map(()=>`<div class="kpi-card"><div class="kpi-icon" style="background:var(--bg2)"><div class="spinner" style="width:16px;height:16px;border-width:2px"></div></div><div><div class="kpi-val">—</div><div class="kpi-label">Memuat...</div></div></div>`).join('')}
    </div>

    <div class="table-wrap">
      <div class="table-toolbar">
        <input class="table-search" id="mcu-q" placeholder="Cari project, partner..."
          oninput="mcuFilter.search=this.value.toLowerCase();filterMCU()" style="flex:1">
        <select class="table-filter" id="mcu-status" onchange="mcuFilter.status=this.value;filterMCU()">
          <option value="">Semua Status</option>
          <option>Planning</option><option>Active</option><option>Completed</option><option>Cancelled</option>
        </select>
        <select class="table-filter" id="mcu-type" onchange="mcuFilter.type=this.value;filterMCU()">
          <option value="">Semua Tipe</option>
          <option>MCU</option><option>HealthDay</option><option>Screening</option><option>Wellness</option>
        </select>
      </div>
      <div id="mcu-list"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>`;

  mcuProjects = [];
  await loadMCUProjects();
}

async function loadMCUProjects() {
  try {
    const data = await sbGet('projects','select=*&order=created_at.desc');
    mcuProjects = Array.isArray(data) ? data : [];
    renderMCUKPI();
    filterMCU();
  } catch(e) {
    document.getElementById('mcu-list').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderMCUKPI() {
  const el = document.getElementById('mcu-kpi'); if (!el) return;
  const total   = mcuProjects.length;
  const aktif   = mcuProjects.filter(p=>p.status==='Active').length;
  const plan    = mcuProjects.filter(p=>p.status==='Planning').length;
  const selesai = mcuProjects.filter(p=>p.status==='Completed').length;
  const totalVal= mcuProjects.reduce((s,p)=>s+(p.value||0),0);
  const totalRAB= mcuProjects.reduce((s,p)=>s+(p.rab_total||0),0);

  const kpis = [
    {icon:'📁', val:total,               label:'Total Project', color:'#0891B2'},
    {icon:'🔥', val:aktif,               label:'Aktif',         color:'#EF4444'},
    {icon:'📋', val:plan,                label:'Planning',      color:'#8B5CF6'},
    {icon:'✅', val:selesai,             label:'Selesai',       color:'#22C55E'},
    {icon:'💰', val:formatCurrency(totalVal), label:'Total Nilai', color:'#F59E0B'},
    {icon:'📊', val:formatCurrency(totalRAB), label:'Total RAB',   color:'#06B6D4'},
  ];
  el.innerHTML = kpis.map(k=>`
    <div class="kpi-card" style="border-top:3px solid ${k.color}">
      <div class="kpi-icon" style="background:${k.color}18;font-size:20px">${k.icon}</div>
      <div>
        <div class="kpi-val" style="font-size:${typeof k.val==='string'&&k.val.length>8?'13px':'20px'}">${k.val}</div>
        <div class="kpi-label">${k.label}</div>
      </div>
    </div>`).join('');
}

function filterMCU() {
  let data = [...mcuProjects];
  const q = mcuFilter.search, s = mcuFilter.status, t = mcuFilter.type;
  if (q) data = data.filter(p=>(p.project_name||'').toLowerCase().includes(q)||(p.partner_name||'').toLowerCase().includes(q));
  if (s) data = data.filter(p=>p.status===s);
  if (t) data = data.filter(p=>p.project_type===t);
  renderMCUList(data);
}

function renderMCUList(projects) {
  const el = document.getElementById('mcu-list'); if (!el) return;
  if (!projects.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="ico">🏥</div>
      <h3>${mcuProjects.length ? 'Tidak ada hasil filter' : 'Belum ada Project MCU'}</h3>
      <p>Klik "+ Buat Project MCU" untuk memulai.</p>
      <button class="btn btn-teal" style="margin-top:14px" onclick="openMCUForm()">+ Buat Project MCU</button>
    </div>`; return;
  }

  const STATUS_COLOR = {Planning:'#8B5CF6',Active:'#22C55E',Completed:'#0891B2',Cancelled:'#EF4444'};

  el.innerHTML = projects.map(p => {
    const sc       = STATUS_COLOR[p.status]||'#94A3B8';
    const progress = Math.round(((p.current_step||0) / 31) * 100);
    const stageObj = Object.values(MCU_STAGES).find(s=>s.no===(p.current_step||1)) || MCU_STAGES.S01;
    const phase    = MCU_PHASES.find(f=>f.stages.includes(stageObj.id));
    const peserta  = p.target_participants||0;
    const slaDeadline = calcSLADeadline(p.tanggal_pelaksanaan, peserta);
    const daysToSLA = slaDeadline ? Math.ceil((new Date(slaDeadline)-new Date())/(1000*60*60*24)) : null;

    return `
    <div style="border-bottom:1px solid var(--border);padding:16px 20px;transition:background .15s"
      onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:4px;align-self:stretch;border-radius:4px;background:${sc};flex-shrink:0;margin:-4px 0"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-weight:800;font-size:14px;color:var(--text);cursor:pointer"
              onclick="openMCUDetail(${p.id})">${p.project_name}</span>
            <span style="background:${sc}20;color:${sc};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px">${p.status}</span>
            ${p.project_type&&p.project_type!=='MCU'?`<span class="badge badge-gray" style="font-size:10px">${p.project_type}</span>`:''}
            ${p.f05_locked?'<span class="badge badge-teal" style="font-size:10px">F-05 Locked</span>':''}
          </div>
          <div style="font-size:12px;color:var(--text3);display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
            ${p.partner_name?`<span>🤝 ${p.partner_name}</span>`:''}
            ${peserta?`<span>👥 ${peserta} peserta · ${getSLACategory(peserta)}</span>`:''}
            ${p.tanggal_pelaksanaan?`<span>📅 ${formatDateShort(p.tanggal_pelaksanaan)}</span>`:''}
            ${daysToSLA!==null?`<span style="color:${daysToSLA<3?'#EF4444':daysToSLA<7?'#F59E0B':'var(--text3)'}">⏱ SLA prep: ${daysToSLA>0?daysToSLA+'h lagi':'LEWAT'}</span>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="flex:1;height:8px;background:var(--bg2);border-radius:8px;overflow:hidden;cursor:pointer"
              onclick="openMCUDetail(${p.id})">
              <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,${phase?.color||sc},${phase?.color||sc}99);border-radius:8px;transition:width .5s"></div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${phase?.color||sc};white-space:nowrap">${progress}%</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">
            ${stageObj.id} — <span style="color:var(--text);font-weight:600">${stageObj.name}</span>
            ${phase?`· <span style="color:${phase.color}">${phase.label}</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;min-width:130px">
          ${p.value?`<div style="font-size:13px;font-weight:800;color:var(--teal)">${formatCurrency(p.value)}</div>`:''}
          ${p.rab_total?`<div style="font-size:11px;color:var(--text3)">RAB: ${formatCurrency(p.rab_total)}</div>`:''}
          <div style="display:flex;gap:5px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap">
            <button class="btn btn-ghost btn-xs" onclick="openMCUDetail(${p.id})">📋 Detail</button>
            <button class="btn btn-outline btn-xs" onclick="openMCUForm(${p.id})">✏️</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// FORM BUAT / EDIT PROJECT
// ══════════════════════════════════════════════════════════════
async function openMCUForm(id=null) {
  let p = {};
  if (id) { const d=await sbGet('projects',`select=*&id=eq.${id}`); p=d[0]||{}; }

  let partnerOpts = '<option value="">-- Pilih Partner --</option>';
  let corpOpts    = '<option value="">-- Tidak terkait Corporate --</option>';
  try {
    const pts = await sbGet('partners','select=id,partner_name,status&order=partner_name&limit=300');
    partnerOpts += (pts||[]).map(pt=>`<option value="${pt.id}" ${p.partner_id==pt.id?'selected':''}>${pt.partner_name} [${pt.status||'—'}]</option>`).join('');
  } catch(e){}
  try {
    const corps = await sbGet('corporates','select=id,corporate_name&status=eq.Aktif&order=corporate_name');
    corpOpts += (corps||[]).map(c=>`<option value="${c.id}" ${p.corporate_id==c.id?'selected':''}>${c.corporate_name}</option>`).join('');
  } catch(e){}

  const today = new Date().toISOString().split('T')[0];
  const user  = getUserName?getUserName():'User';

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Project MCU':'🏥 Buat Project MCU Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="status-box status-warn" style="margin-bottom:14px;font-size:12.5px">
      📌 Setelah membuat project, langsung lanjut ke <strong>RAB Calculator</strong> untuk mengisi
      parameter tes & biaya operasional. Data RAB akan mengisi otomatis ke form-form berikutnya.
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Nama Project *</label>
        <input type="text" id="mf-name" value="${p.project_name||''}" placeholder="MCU Karyawan PT. ABC — Juni 2026">
      </div>
      <div class="form-group">
        <label>Tipe Project</label>
        <select id="mf-type">
          ${['MCU','HealthDay','Screening','Wellness','Vaksinasi'].map(t=>`<option${(p.project_type||'MCU')===t?' selected':''}>${t}</option>`).join('')}
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
        <label>Tanggal Pelaksanaan (Hari-H)</label>
        <input type="date" id="mf-tgl" value="${p.tanggal_pelaksanaan||''}">
        <div class="form-hint" id="mf-sla-hint"></div>
      </div>
      <div class="form-group">
        <label>Target Peserta *</label>
        <input type="number" id="mf-peserta" value="${p.target_participants||100}" min="1"
          oninput="updateSLAHint()">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>PIC Sales / AM</label>
        <input type="text" id="mf-sales" value="${p.pic_sales||user}">
      </div>
      <div class="form-group">
        <label>PIC SPV Project</label>
        <input type="text" id="mf-spv" value="${p.pic_spv||''}">
      </div>
    </div>
    <div class="form-group">
      <label>Lokasi Pelaksanaan</label>
      <input type="text" id="mf-loc" value="${p.location||''}" placeholder="Nama gedung / alamat klien">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Target SLA Hasil</label>
        <select id="mf-sla">
          ${['H+3','H+5','H+7','H+10','Lainnya'].map(s=>`<option${(p.sla_hasil_kontraktual||'H+5')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Skema Pembayaran</label>
        <select id="mf-payment">
          ${['CREDIT','DP50','FULLPAYMENT','CREDIT_HOLD_EXCEPTION'].map(s=>`<option${(p.skema_pembayaran||'CREDIT')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveMCU(${id||'null'})">
        ${id?'💾 Simpan':'🏥 Buat Project → Lanjut ke RAB'}
      </button>
    </div>`);

  updateSLAHint();
}

function updateSLAHint() {
  const tgl = document.getElementById('mf-tgl')?.value;
  const pes = parseInt(document.getElementById('mf-peserta')?.value||0);
  const el  = document.getElementById('mf-sla-hint');
  if (!el) return;
  if (tgl && pes) {
    const cat = getSLACategory(pes);
    const sl  = getSLAPrep(pes);
    const dl  = calcSLADeadline(tgl, pes);
    el.textContent = `SLA Persiapan (${cat}): H-${sl} = deadline ${dl}`;
    el.style.color = 'var(--teal)';
  } else {
    el.textContent = 'Isi tanggal & peserta untuk lihat SLA';
  }
}

async function saveMCU(id) {
  const name      = document.getElementById('mf-name')?.value.trim();
  const partnerId = document.getElementById('mf-partner')?.value;
  if (!name)     { toast('Nama project wajib','err'); return; }
  if (!partnerId){ toast('Pilih partner dulu','err'); return; }

  const pEl     = document.getElementById('mf-partner');
  const partnerName = pEl.options[pEl.selectedIndex]?.text?.split(' [')[0]||'';
  const peserta = parseInt(document.getElementById('mf-peserta')?.value||0);
  const tgl     = document.getElementById('mf-tgl')?.value||null;
  const user    = getUserName?getUserName():'User';
  const code    = id ? undefined : `MCU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const payload = {
    project_name:          name,
    project_type:          document.getElementById('mf-type')?.value||'MCU',
    partner_id:            parseInt(partnerId),
    partner_name:          partnerName,
    corporate_id:          parseInt(document.getElementById('mf-corporate')?.value)||null,
    tanggal_pelaksanaan:   tgl,
    target_participants:   peserta,
    sla_category:          peserta ? getSLACategory(peserta) : null,
    sla_deadline_persiapan:tgl && peserta ? calcSLADeadline(tgl, peserta) : null,
    sla_hasil_kontraktual: document.getElementById('mf-sla')?.value||'H+5',
    skema_pembayaran:      document.getElementById('mf-payment')?.value||'CREDIT',
    pic_sales:             document.getElementById('mf-sales')?.value.trim()||user,
    pic_spv:               document.getElementById('mf-spv')?.value.trim()||null,
    location:              document.getElementById('mf-loc')?.value.trim()||null,
    status:                'Planning',
    credit_hold_status:    'CLEAR',
    status_financial:      'OPEN',
    updated_at:            new Date().toISOString(),
  };
  if (code) { payload.project_code = code; payload.current_step = 1; payload.created_by_name = user; }

  try {
    let projId = id;
    if (id) {
      await sbPatch('projects', id, payload);
      toast('✅ Project diupdate','ok');
      closeModalForce();
      openMCUDetail(id);
    } else {
      const res = await sbPost('projects', payload);
      projId = res[0]?.id;
      toast('✅ Project dibuat! Lanjut ke RAB...','ok');
      closeModalForce();
      mcuProjects = [];
      await loadMCUProjects();
      if (projId) setTimeout(()=>openRABModal(projId), 400);
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ══════════════════════════════════════════════════════════════
// RAB CALCULATOR — REBUILT
// Parameter tes PERTAMA, biaya operasional auto-template
// ══════════════════════════════════════════════════════════════
async function openRABModal(projectId) {
  const d = await sbGet('projects',`select=*&id=eq.${projectId}`);
  const p = d[0]||{};
  const peserta = p.target_participants||100;

  // Load existing RAB items & master products
  const [existing, masterProds] = await Promise.all([
    sbGet('rab_items',`select=*&project_id=eq.${projectId}`).catch(()=>[]),
    sbGet('products','select=id,kode_internal,nama_tes,hpp,harga_normal,kategori&is_active=eq.true&order=kategori,nama_tes').catch(()=>[]),
  ]);

  // Restore state
  const existingTests = (existing||[]).filter(r=>r.category==='LAB_TEST');
  const existingOps   = (existing||[]).filter(r=>r.category!=='LAB_TEST');
  const opMap = {};
  existingOps.forEach(r=>{ opMap[r.item_name] = r; });

  rabParams = {
    peserta,
    days:   p.rab_days||1,
    margin: p.rab_margin_pct||30,
    selectedTests: existingTests.map(r=>({
      id: r.product_id||'', name:r.item_name, hpp:r.unit_price||0,
      kat:r.notes?.split('|')[0]||'', qty:r.qty||1, perPeserta:true,
    })),
  };

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">💰 RAB — ${p.project_name}</div>
        <div style="font-size:11.5px;color:var(--text3)">
          ${peserta} peserta · ${getSLACategory(peserta)} · SLA Prep H-${getSLAPrep(peserta)}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm" onclick="printRAB(${projectId})">🖨 Print</button>
        <button class="modal-close" onclick="closeModalForce()">✕</button>
      </div>
    </div>

    <!-- BAGIAN 1: PARAMETER TES (WAJIB DIISI DULU) -->
    <div style="background:var(--teal-light);border-radius:var(--r);padding:14px 16px;margin-bottom:16px;border-left:4px solid var(--teal)">
      <div style="font-weight:800;font-size:13px;color:var(--teal);margin-bottom:10px">
        🧬 STEP 1 — Pilih Parameter Tes (Menentukan Scope & HPP)
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <select id="rab-test-sel" class="table-filter" style="flex:1;min-width:220px">
          <option value="">-- Pilih Tes dari Master Produk --</option>
          ${(masterProds||[]).map(pr=>`
            <option value="${pr.id}" data-name="${pr.nama_tes}" data-hpp="${pr.hpp||0}"
              data-harga="${pr.harga_normal||0}" data-kat="${pr.kategori||''}">
              [${pr.kode_internal||'—'}] ${pr.nama_tes} · HPP ${formatCurrency(pr.hpp||0)}
            </option>`).join('')}
        </select>
        <button class="btn btn-teal btn-sm" onclick="rabAddTest()">+ Tambah Tes</button>
        <button class="btn btn-ghost btn-sm" onclick="rabAddAllTests()">+ Semua Tes Aktif</button>
      </div>
      <div id="rab-test-list">
        ${rabParams.selectedTests.length ? '' : '<div style="font-size:12px;color:var(--text3);text-align:center;padding:10px">Belum ada parameter tes dipilih</div>'}
      </div>
      <div id="rab-test-summary" style="margin-top:8px"></div>
    </div>

    <!-- BAGIAN 2: PARAMETER PROJECT -->
    <div style="background:var(--bg2);border-radius:var(--r);padding:12px 16px;margin-bottom:14px">
      <div style="font-weight:700;font-size:12px;color:var(--text);margin-bottom:10px">⚙️ STEP 2 — Parameter Project</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end">
        <div>
          <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">Jumlah Peserta</label>
          <input type="number" id="rab-peserta" value="${peserta}" min="1" style="width:90px;padding:6px 10px;border:1.5px solid var(--teal);border-radius:6px;font-size:14px;font-weight:700"
            oninput="rabRecalc()">
        </div>
        <div>
          <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">Hari Pelaksanaan</label>
          <input type="number" id="rab-days" value="${rabParams.days}" min="1" style="width:70px;padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;font-weight:700"
            oninput="rabRecalc()">
        </div>
        <div>
          <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">Minimum Guarantee</label>
          <input type="number" id="rab-mg" value="${p.minimum_guarantee||Math.round(peserta*0.8)}" min="0" style="width:90px;padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;font-weight:700">
        </div>
        <div>
          <label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">Target Margin (%)</label>
          <input type="number" id="rab-margin" value="${rabParams.margin}" min="0" max="100" style="width:70px;padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:14px;font-weight:700"
            oninput="rabRecalc()">
        </div>
      </div>
    </div>

    <!-- DASHBOARD SUMMARY -->
    <div id="rab-dashboard" style="margin-bottom:14px"></div>

    <!-- BAGIAN 3: BIAYA OPERASIONAL (TEMPLATE) -->
    <div style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-weight:700;font-size:12px;color:var(--text)">📦 STEP 3 — Biaya Operasional (Template)</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="rabToggleMode()">🔄 <span id="rab-mode-lbl">Mode Realisasi</span></button>
        </div>
      </div>
      <div id="rab-ops-table" style="max-height:35vh;overflow-y:auto;border-radius:var(--r);border:1px solid var(--border)"></div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Kembali</button>
      <button class="btn btn-outline btn-sm" onclick="printRAB(${projectId})">🖨 Print RAB</button>
      <button class="btn btn-teal" onclick="saveRAB(${projectId})">💾 Simpan & Kunci ke Project</button>
    </div>`,'wide');

  rabRenderTests();
  await rabRenderOpsTable(opMap, peserta, rabParams.days);
  rabRecalc();
}

// ── RAB: Tambah Tes ───────────────────────────────────────────
function rabAddTest() {
  const sel = document.getElementById('rab-test-sel');
  const opt = sel?.options[sel.selectedIndex];
  if (!opt?.value) { toast('Pilih tes dulu','warn'); return; }
  if (rabParams.selectedTests.find(t=>t.id===opt.value)) { toast('Sudah ditambahkan','warn'); return; }
  rabParams.selectedTests.push({
    id: opt.value, name: opt.dataset.name, hpp: parseFloat(opt.dataset.hpp)||0,
    harga: parseFloat(opt.dataset.harga)||0, kat: opt.dataset.kat, qty:1, perPeserta:true,
  });
  sel.value = '';
  rabRenderTests();
  rabRecalc();
}

async function rabAddAllTests() {
  if (!confirm('Tambahkan SEMUA produk aktif ke RAB?')) return;
  const all = await sbGet('products','select=id,kode_internal,nama_tes,hpp,harga_normal,kategori&is_active=eq.true&order=kategori,nama_tes').catch(()=>[]);
  let added = 0;
  (all||[]).forEach(pr=>{
    if (!rabParams.selectedTests.find(t=>t.id===String(pr.id))) {
      rabParams.selectedTests.push({
        id:String(pr.id), name:pr.nama_tes, hpp:pr.hpp||0, harga:pr.harga_normal||0,
        kat:pr.kategori||'', qty:1, perPeserta:true,
      });
      added++;
    }
  });
  toast(`${added} tes ditambahkan`,'ok');
  rabRenderTests();
  rabRecalc();
}

function rabRenderTests() {
  const el = document.getElementById('rab-test-list'); if (!el) return;
  if (!rabParams.selectedTests.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:10px">Belum ada parameter tes dipilih</div>';
    return;
  }
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||rabParams.peserta||100);
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:var(--navy)">
          <th style="padding:6px 10px;color:#fff;text-align:left;font-size:11px">Nama Tes</th>
          <th style="padding:6px 10px;color:#fff;text-align:left;font-size:11px">Kategori</th>
          <th style="padding:6px 10px;color:#fff;text-align:right;font-size:11px">HPP/unit</th>
          <th style="padding:6px 10px;color:#fff;text-align:center;font-size:11px">Qty</th>
          <th style="padding:6px 10px;color:#fff;text-align:center;font-size:11px">Per Peserta?</th>
          <th style="padding:6px 10px;color:#fff;text-align:right;font-size:11px">Total HPP</th>
          <th style="padding:6px;color:#fff;text-align:center;font-size:11px">Hapus</th>
        </tr>
      </thead>
      <tbody>
        ${rabParams.selectedTests.map((t,i)=>{
          const totalHPP = t.hpp * (t.qty||1) * (t.perPeserta ? peserta : 1);
          return `<tr style="background:${i%2?'var(--bg2)':'#fff'};border-bottom:1px solid var(--border)">
            <td style="padding:6px 10px;font-weight:600">${t.name}</td>
            <td style="padding:6px 10px;color:var(--text3)">${t.kat||'—'}</td>
            <td style="padding:6px 10px;text-align:right">${formatCurrency(t.hpp)}</td>
            <td style="padding:6px;text-align:center">
              <input type="number" value="${t.qty||1}" min="1" style="width:50px;text-align:center;border:1px solid var(--border);border-radius:4px;padding:2px 4px"
                onchange="rabParams.selectedTests[${i}].qty=parseInt(this.value)||1;rabRenderTests();rabRecalc()">
            </td>
            <td style="padding:6px;text-align:center">
              <input type="checkbox" ${t.perPeserta?'checked':''} 
                onchange="rabParams.selectedTests[${i}].perPeserta=this.checked;rabRenderTests();rabRecalc()">
            </td>
            <td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--teal)">${formatCurrency(totalHPP)}</td>
            <td style="padding:6px;text-align:center">
              <button onclick="rabParams.selectedTests.splice(${i},1);rabRenderTests();rabRecalc()" 
                class="act-btn del" style="padding:3px 7px">✕</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  rabRecalc();
}

async function rabRenderOpsTable(opMap={}, peserta=100, days=1) {
  const el = document.getElementById('rab-ops-table'); if (!el) return;
  const isAct = rabParams.mode === 'actual';
  let html = '';
  RAB_TEMPLATE.forEach(section=>{
    html += `<div style="background:var(--navy);color:#fff;padding:5px 12px;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${section.cat} — ${section.sub}</div>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <thead><tr style="background:var(--bg)">
        <th style="padding:5px 10px;text-align:left;font-size:10px;color:var(--text3)">Item</th>
        <th style="padding:5px 8px;text-align:center;font-size:10px;color:var(--text3)">UoM</th>
        <th style="padding:5px 8px;text-align:right;font-size:10px;color:var(--text3)">Harga</th>
        <th style="padding:5px 8px;text-align:center;font-size:10px;color:var(--text3)">Qty Plan</th>
        ${isAct?'<th style="padding:5px 8px;text-align:center;font-size:10px;color:var(--text3)">Qty Aktual</th>':''}
        <th style="padding:5px 8px;text-align:right;font-size:10px;color:var(--text3)">Total Plan</th>
        ${isAct?'<th style="padding:5px 8px;text-align:right;font-size:10px;color:var(--text3)">Total Aktual</th>':''}
      </tr></thead><tbody>`;

    section.items.forEach(item=>{
      const key     = item.name;
      const exist   = opMap[key]||{};
      const defQty  = item.perPeserta ? peserta : (item.uom==='DAY'?days:1);
      const qtyPlan = exist.qty ?? defQty;
      const qtyAct  = exist.qty_actual ?? 0;
      const price   = exist.unit_price ?? item.price;
      const safeKey = key.replace(/[^a-zA-Z0-9]/g,'_');
      html += `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:5px 10px">
          <div style="font-weight:600">${key}</div>
          <div style="font-size:10px;color:var(--text3)">${item.source} · ${item.scheme}</div>
        </td>
        <td style="padding:5px 8px;text-align:center;color:var(--text3)">${item.uom}</td>
        <td style="padding:5px 8px;text-align:right">
          <input type="number" class="rab-price" data-key="${safeKey}" data-name="${key}" data-source="${item.source}" data-scheme="${item.scheme}" data-uom="${item.uom}"
            value="${price}" min="0" style="width:90px;text-align:right;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px"
            oninput="rabRecalc()">
        </td>
        <td style="padding:5px 8px;text-align:center">
          <input type="number" class="rab-qty-plan" data-key="${safeKey}" value="${qtyPlan}" min="0" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px"
            oninput="rabRecalc()">
        </td>
        ${isAct?`<td style="padding:5px 8px;text-align:center">
          <input type="number" class="rab-qty-actual" data-key="${safeKey}" value="${qtyAct}" min="0" style="width:55px;text-align:center;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px"
            oninput="rabRecalc()">
        </td>`:''}
        <td style="padding:5px 8px;text-align:right;font-weight:600" id="rab-row-total-${safeKey}">${formatCurrency(price*qtyPlan)}</td>
        ${isAct?`<td style="padding:5px 8px;text-align:right;font-weight:600;color:#06B6D4" id="rab-row-act-${safeKey}">${formatCurrency(price*qtyAct)}</td>`:''}
      </tr>`;
    });
    html += '</tbody></table>';
  });
  el.innerHTML = html;
}

function rabToggleMode() {
  rabParams.mode = rabParams.mode === 'actual' ? 'plan' : 'actual';
  const lbl = document.getElementById('rab-mode-lbl');
  if (lbl) lbl.textContent = rabParams.mode === 'actual' ? 'Mode Plan' : 'Mode Realisasi';
  const opMap = {};
  document.querySelectorAll('.rab-price').forEach(el=>{
    const key     = el.dataset.name;
    const planEl  = document.querySelector(`.rab-qty-plan[data-key="${el.dataset.key}"]`);
    const actEl   = document.querySelector(`.rab-qty-actual[data-key="${el.dataset.key}"]`);
    opMap[key] = { unit_price:parseFloat(el.value||0), qty:parseFloat(planEl?.value||0), qty_actual:parseFloat(actEl?.value||0) };
  });
  rabRenderOpsTable(opMap, parseInt(document.getElementById('rab-peserta')?.value||100), parseInt(document.getElementById('rab-days')?.value||1))
    .then(()=>rabRecalc());
}

function rabRecalc() {
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||100);
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30);

  // HPP dari parameter tes
  let hppTests = 0;
  rabParams.selectedTests.forEach(t=>{
    hppTests += (t.hpp||0) * (t.qty||1) * (t.perPeserta ? peserta : 1);
  });

  // HPP dari operasional
  let hppOps = 0, hppOpsActual = 0;
  document.querySelectorAll('.rab-price').forEach(priceEl=>{
    const key     = priceEl.dataset.key;
    const price   = parseFloat(priceEl.value||0);
    const planEl  = document.querySelector(`.rab-qty-plan[data-key="${key}"]`);
    const actEl   = document.querySelector(`.rab-qty-actual[data-key="${key}"]`);
    const qtyP    = parseFloat(planEl?.value||0);
    const qtyA    = parseFloat(actEl?.value||0);
    const total   = price * qtyP;
    const totalA  = price * qtyA;
    hppOps       += total;
    hppOpsActual += totalA;
    const rowEl   = document.getElementById(`rab-row-total-${key}`);
    const rowActEl= document.getElementById(`rab-row-act-${key}`);
    if (rowEl)    rowEl.textContent   = formatCurrency(total);
    if (rowActEl) rowActEl.textContent = formatCurrency(totalA);
  });

  const hppTotal    = hppTests + hppOps;
  const hppPerPes   = peserta > 0 ? hppTotal / peserta : 0;
  const hargaJual   = margin < 100 ? hppTotal / (1 - margin/100) : hppTotal;
  const hargaPerPes = peserta > 0 ? hargaJual / peserta : 0;
  const grossMargin = hargaJual - hppTotal;

  // Update test summary
  const sumEl = document.getElementById('rab-test-summary');
  if (sumEl) sumEl.innerHTML = `
    <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px">
      <span>🧬 HPP Tes: <strong style="color:var(--teal)">${formatCurrency(hppTests)}</strong></span>
      <span>📦 HPP Ops: <strong>${formatCurrency(hppOps)}</strong></span>
      <span>💰 HPP Total: <strong>${formatCurrency(hppTotal)}</strong></span>
      <span>👤 HPP/Peserta: <strong>${formatCurrency(hppPerPes)}</strong></span>
    </div>`;

  // Dashboard
  const dash = document.getElementById('rab-dashboard');
  if (dash) dash.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${[
        {label:'HPP Total',  val:formatCurrency(hppTotal),  color:'#EF4444', sub:'Plan'},
        {label:'Harga Jual', val:formatCurrency(hargaJual),  color:'#0891B2', sub:'Per project'},
        {label:'Per Peserta',val:formatCurrency(hargaPerPes),color:'#7C3AED', sub:'Harga jual'},
        {label:'Gross Margin',val:formatCurrency(grossMargin), color:'#22C55E', sub:`${margin}%`},
        {label:'MG Berlaku', val:`${document.getElementById('rab-mg')?.value||0} peserta`,color:'#F59E0B', sub:'Minimum Guarantee'},
        {label:'Mode',       val:rabParams.mode==='actual'?'Realisasi':'Planning', color:'#6B7280', sub:'RAB mode'},
      ].map(k=>`
        <div style="background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;border-top:3px solid ${k.color}">
          <div style="font-size:11px;color:var(--text3);margin-bottom:3px">${k.label}</div>
          <div style="font-size:14px;font-weight:800;color:${k.color}">${k.val}</div>
          <div style="font-size:10px;color:var(--text3)">${k.sub}</div>
        </div>`).join('')}
    </div>`;
}

async function saveRAB(projectId) {
  const peserta = parseInt(document.getElementById('rab-peserta')?.value||100);
  const days    = parseInt(document.getElementById('rab-days')?.value||1);
  const margin  = parseFloat(document.getElementById('rab-margin')?.value||30);
  const mg      = parseInt(document.getElementById('rab-mg')?.value||0);
  const user    = getUserName?getUserName():'User';

  const items = [];
  let hppTotal = 0;

  // Save parameter tes
  rabParams.selectedTests.forEach(t=>{
    const totalHPP = (t.hpp||0) * (t.qty||1) * (t.perPeserta ? peserta : 1);
    hppTotal += totalHPP;
    items.push({
      project_id: projectId, category:'LAB_TEST', product_id: t.id,
      item_name: t.name, unit:'UNT', qty: (t.qty||1)*(t.perPeserta?peserta:1),
      unit_price: t.hpp||0, total_price: totalHPP, total_actual:0,
      notes: `${t.kat||''}|${t.perPeserta?'per_peserta':'fixed'}`,
    });
  });

  // Save ops items
  document.querySelectorAll('.rab-price').forEach(priceEl=>{
    const key   = priceEl.dataset.key;
    const name  = priceEl.dataset.name;
    const price = parseFloat(priceEl.value||0);
    const planEl= document.querySelector(`.rab-qty-plan[data-key="${key}"]`);
    const actEl = document.querySelector(`.rab-qty-actual[data-key="${key}"]`);
    const qtyP  = parseFloat(planEl?.value||0);
    const qtyA  = parseFloat(actEl?.value||0);
    if (qtyP > 0 || qtyA > 0) {
      const total = price * qtyP;
      hppTotal += total;
      items.push({
        project_id: projectId, category:'OPS',
        item_name: name, unit: priceEl.dataset.uom||'UNT',
        qty: qtyP, qty_actual: qtyA, unit_price: price,
        total_price: total, total_actual: price*qtyA,
        notes: `${priceEl.dataset.source||''}|${priceEl.dataset.scheme||''}`,
      });
    }
  });

  const hargaJual  = margin < 100 ? hppTotal / (1 - margin/100) : hppTotal;
  const hargaPerPes= peserta > 0 ? Math.round(hargaJual / peserta) : 0;

  try {
    // Delete old & insert new
    await fetch(`${SUPABASE_URL}/rest/v1/rab_items?project_id=eq.${projectId}`,{
      method:'DELETE', headers:{...SB_HEADERS,'Prefer':'return=minimal'}
    });
    if (items.length) await sbPost('rab_items', items);

    // Update project — RAB data flows to project master
    const selectedTestIds = rabParams.selectedTests.map(t=>t.id);
    await sbPatch('projects', projectId, {
      rab_total:            Math.round(hargaJual),
      rab_hpp:              Math.round(hppTotal),
      rab_margin_pct:       margin,
      rab_days:             days,
      target_participants:  peserta,
      minimum_guarantee:    mg,
      nilai_kontrak:        Math.round(hargaJual),
      harga_per_peserta:    hargaPerPes,
      rab_parameter_tests:  JSON.stringify(selectedTestIds),
      sla_category:         getSLACategory(peserta),
      updated_at:           new Date().toISOString(),
    });

    toast('✅ RAB disimpan & data tersinkron ke project','ok');
    closeModalForce();
    mcuProjects = [];
    await loadMCUProjects();
    setTimeout(()=>openMCUDetail(projectId), 400);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function printRAB(projectId) {
  toast('🖨 Fitur print sedang dikembangkan','info');
}

// ══════════════════════════════════════════════════════════════
// DETAIL PROJECT — 31 STAGE
// ══════════════════════════════════════════════════════════════
async function openMCUDetail(id) {
  const [dArr, stepsArr] = await Promise.all([
    sbGet('projects',`select=*&id=eq.${id}`),
    sbGet('project_steps',`select=*&project_id=eq.${id}&order=step_number.asc`).catch(()=>[]),
  ]);
  const p = dArr[0]; if (!p) return;
  const steps = stepsArr||[];

  const curNo    = p.current_step||1;
  const progress = Math.round((curNo / 31) * 100);
  const curPhase = MCU_PHASES.find(f=>f.stages.includes(`S${String(curNo).padStart(2,'0')}`));

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">🏥 ${p.project_name}</div>
        <div style="font-size:11.5px;color:var(--text3)">
          ${p.partner_name||'—'} · ${p.project_type||'MCU'} · ${p.target_participants||0} peserta
          ${p.sla_category?`· ${p.sla_category}`:''}
          ${p.f05_locked?'· <span style="color:var(--teal);font-weight:700">F-05 Locked</span>':''}
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-teal btn-sm" onclick="closeModalForce();setTimeout(()=>openRABModal(${id}),100)">💰 RAB</button>
        <button class="btn btn-outline btn-sm" onclick="closeModalForce();setTimeout(()=>openMCUForm(${id}),100)">✏️ Edit</button>
        <button class="modal-close" onclick="closeModalForce()">✕</button>
      </div>
    </div>

    <!-- Progress & Summary -->
    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="flex:1;height:10px;background:var(--bg2);border-radius:10px;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--teal),var(--accent));border-radius:10px;transition:width .5s"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:var(--teal)">${progress}% · S${String(curNo).padStart(2,'0')}/S31</span>
      </div>
      ${curPhase?`<div style="font-size:11px;color:${curPhase.color};font-weight:700">${curPhase.label}</div>`:''}
    </div>

    <!-- RAB Summary -->
    ${p.rab_total?`
    <div style="background:var(--bg2);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap">
      ${[
        ['RAB Plan', formatCurrency(p.rab_total),'var(--teal)'],
        ['HPP', formatCurrency(p.rab_hpp||0),'var(--danger)'],
        ['Harga/Peserta', formatCurrency(p.harga_per_peserta||0),'#7C3AED'],
        ['MG', `${p.minimum_guarantee||0} peserta`,'#F59E0B'],
        ['SLA Hasil', p.sla_hasil_kontraktual||'—','#06B6D4'],
        ['Financial', p.status_financial||'OPEN', p.status_financial==='PAID'?'#22C55E':'#94A3B8'],
      ].map(([l,v,c])=>`<div><div style="font-size:10px;color:var(--text3)">${l}</div><div style="font-size:13px;font-weight:700;color:${c}">${v}</div></div>`).join('')}
    </div>`:''}

    <!-- 6 Fase + 31 Stage -->
    <div style="max-height:52vh;overflow-y:auto">
      ${MCU_PHASES.map(phase=>{
        const phaseStages = phase.stages.map(sid=>MCU_STAGES[sid]).filter(Boolean);
        const doneCnt  = phaseStages.filter(s=>{
          const sno = s.no;
          return sno < curNo || steps.some(st=>st.step_id===s.id&&st.status==='Done');
        }).length;
        return `
          <div style="margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:${phase.color}18;border-radius:var(--r);margin-bottom:6px;border-left:4px solid ${phase.color}">
              <div style="font-size:11px;font-weight:800;color:${phase.color};text-transform:uppercase;flex:1">${phase.label}</div>
              <span style="font-size:11px;font-weight:700;color:${phase.color}">${doneCnt}/${phaseStages.length}</span>
            </div>
            ${phaseStages.map(stage=>{
              const stepData = steps.find(s=>s.step_id===stage.id)||{};
              const isActive = stage.no === curNo;
              const isDone   = stage.no < curNo || stepData.status === 'Done';
              const isBlocked= stage.no > curNo;
              const gateUnmet= isActive ? checkGate(stage, p, steps) : [];
              const hasIssue = gateUnmet.length > 0;
              return `
                <div onclick="${isDone||isActive?`openStepForm(${id},'${stage.id}')`:''}"
                  style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r);
                    cursor:${isDone||isActive?'pointer':'default'};margin-bottom:4px;
                    background:${isActive?(hasIssue?'#FEF2F2':phase.color+'12'):isDone?'#F0FDF4':'var(--bg2)'};
                    border:1.5px solid ${isActive?(hasIssue?'#FECACA':phase.color):isDone?'#BBF7D0':'var(--border)'};
                    opacity:${isBlocked?.6:1};transition:all .15s"
                  ${isDone||isActive?`onmouseover="this.style.borderColor='${phase.color}'" onmouseout="this.style.borderColor='${isActive?(hasIssue?'#FECACA':phase.color):isDone?'#BBF7D0':'var(--border)'}'"`:''}>
                  <div style="width:26px;height:26px;border-radius:50%;
                    background:${isDone?'#22C55E':isActive?(hasIssue?'#EF4444':phase.color):'var(--border2)'};
                    color:#fff;display:flex;align-items:center;justify-content:center;
                    font-size:11px;font-weight:800;flex-shrink:0">
                    ${isDone?'✓':stage.no}
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:${isActive?700:600};
                      color:${isActive?(hasIssue?'#DC2626':phase.color):isDone?'#15803D':'var(--text2)'}">
                      ${stage.icon} ${stage.id} · ${stage.name}
                    </div>
                    <div style="font-size:10px;color:var(--text3)">
                      PIC: ${stage.pic} · ${stage.form}
                      ${stepData.done_by?` · ${stepData.done_by}`:''} ${stepData.done_date?`· ${formatDateShort(stepData.done_date)}`:''}
                    </div>
                    ${isActive&&hasIssue?`<div style="font-size:10.5px;color:#DC2626;margin-top:3px">⛔ ${gateUnmet[0]}</div>`:''}
                  </div>
                  <div style="font-size:10px;white-space:nowrap;text-align:right">
                    ${isDone?'<span class="badge badge-green" style="font-size:10px">✅ Done</span>':isActive?`<span class="badge ${hasIssue?'badge-red':'badge-teal'}" style="font-size:10px">${hasIssue?'⛔ Blocked':'🔵 Aktif'}</span>`:'<span style="color:var(--text3);font-size:11px">⚪</span>'}
                  </div>
                </div>`;
            }).join('')}
          </div>`;
      }).join('')}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
      ${curNo<=31?`
        <button class="btn btn-outline btn-sm" onclick="openStepForm(${id},'S${String(curNo).padStart(2,'0')}')">
          📝 Isi Form ${`S${String(curNo).padStart(2,'0')}`}
        </button>
        <button class="btn btn-teal" onclick="advanceMCUStep(${id})">
          ▶ Lanjut ke ${`S${String(Math.min(curNo+1,31)).padStart(2,'0')}`}
        </button>`
        :`<button class="btn btn-teal" style="background:#22C55E" disabled>✅ Project Selesai!</button>`}
    </div>`,'wide');
}

// ══════════════════════════════════════════════════════════════
// FORM PER STAGE — Data Prefill dari Stage Sebelumnya
// ══════════════════════════════════════════════════════════════
async function openStepForm(projectId, stageId) {
  const stage = MCU_STAGES[stageId]; if (!stage) return;

  // Load project + all steps data
  const [dArr, stepsArr, rabItems] = await Promise.all([
    sbGet('projects',`select=*&id=eq.${projectId}`),
    sbGet('project_steps',`select=*&project_id=eq.${projectId}&order=step_number.asc`).catch(()=>[]),
    sbGet('rab_items',`select=*&project_id=eq.${projectId}&category=eq.LAB_TEST`).catch(()=>[]),
  ]);
  const p     = dArr[0]||{};
  const steps = stepsArr||[];

  // Check gate
  const gateUnmet = checkGate(stage, p, steps);

  // Get existing data for THIS stage
  const existing  = steps.find(s=>s.step_id===stageId)||{};
  let formData    = {};
  try { formData  = JSON.parse(existing.form_data||'{}'); } catch(e){}

  // Build prefill from project + previous steps
  const prefill   = buildPrefill(stage, p, steps, rabItems);
  const merged    = { ...prefill, ...formData }; // existing data overrides prefill

  const phase     = MCU_PHASES.find(f=>f.stages.includes(stageId));
  const user      = getUserName?getUserName():'User';
  const isLocked  = p.f05_locked && parseInt(stageId.replace('S','')) <= 4 && stageId !== 'S01';

  openModal(`
    <div class="modal-header">
      <div>
        <div class="modal-title">${stage.icon} ${stage.id} · ${stage.name}</div>
        <div style="font-size:11.5px;color:${phase?.color||'var(--text3)'}">
          ${phase?.label||''} · Form: ${stage.form} · PIC: ${stage.pic}
        </div>
      </div>
      <button class="modal-close" onclick="closeModalForce();openMCUDetail(${projectId})">✕</button>
    </div>

    ${gateUnmet.length?`
    <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:var(--r);padding:12px 16px;margin-bottom:14px">
      <div style="font-weight:700;color:#DC2626;margin-bottom:6px">⛔ Gate Condition Belum Terpenuhi</div>
      ${gateUnmet.map(g=>`<div style="font-size:12.5px;color:#DC2626;margin-bottom:4px">• ${g}</div>`).join('')}
      <div style="font-size:11.5px;color:#9CA3AF;margin-top:8px">Anda masih bisa melihat & mengisi form ini, namun tidak bisa menandai sebagai Done.</div>
    </div>`:''}

    ${isLocked?`<div class="status-box status-warn" style="margin-bottom:14px;font-size:12px">🔒 F-05 sudah dikunci. Data ini READ-ONLY. Perubahan hanya via Form Addendum.</div>`:''}

    ${renderStageForm(stage, merged, p, isLocked)}

    <div class="form-row" style="margin-top:12px">
      <div class="form-group">
        <label>Status</label>
        <select id="sf-status" ${isLocked?'disabled':''}>
          ${['In Progress','Done','Blocked','Pending'].map(s=>`<option${(existing.status||'In Progress')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Dikerjakan Oleh</label>
        <input type="text" id="sf-done-by" value="${existing.done_by||user}" ${isLocked?'disabled':''}>
      </div>
      <div class="form-group">
        <label>Tanggal / Waktu</label>
        <input type="datetime-local" id="sf-done-date" value="${existing.done_date||''}" ${isLocked?'disabled':''}>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce();openMCUDetail(${projectId})">Kembali</button>
      ${!isLocked?`<button class="btn btn-teal" onclick="saveStepForm(${projectId},'${stageId}')">💾 Simpan</button>`:''}
      ${gateUnmet.length===0&&!isLocked?`<button class="btn btn-accent" onclick="markStageDone(${projectId},'${stageId}')">✅ Tandai Done & Lanjut</button>`:''}
    </div>`,'wide');
}

// Prefill data dari project dan stage sebelumnya
function buildPrefill(stage, p, steps, rabItems) {
  const pf = {};
  const getStepData = (sid) => {
    const s = steps.find(x=>x.step_id===sid);
    let d = {};
    try { d = JSON.parse(s?.form_data||'{}'); } catch(e){}
    return d;
  };

  // Data project selalu tersedia
  pf.nama_project    = p.project_name||'';
  pf.nama_partner    = p.partner_name||'';
  pf.target_peserta  = p.target_participants||'';
  pf.tanggal_pelaksanaan = p.tanggal_pelaksanaan||'';
  pf.sla_category    = p.sla_category||'';
  pf.pic_sales       = p.pic_sales||'';
  pf.pic_spv         = p.pic_spv||'';
  pf.lokasi          = p.location||'';

  // S01 → S02, S03, S04
  const s01 = getStepData('S01');
  if (s01.target_peserta)     pf.target_peserta     = s01.target_peserta;
  if (s01.lokasi_pelaksanaan) pf.lokasi_pelaksanaan = s01.lokasi_pelaksanaan;
  if (s01.kontak_pic_klien)   pf.kontak_pic_klien   = s01.kontak_pic_klien;
  if (s01.tujuan_mcu)         pf.tujuan_mcu         = s01.tujuan_mcu;

  // RAB → S03, S04, S10, S11
  if (p.rab_total) {
    pf.rab_hpp_total        = p.rab_hpp||0;
    pf.rab_harga_per_peserta= p.harga_per_peserta||0;
    pf.rab_minimum_guarantee= p.minimum_guarantee||0;
    pf.harga_per_peserta    = p.harga_per_peserta||0;
    pf.minimum_guarantee    = p.minimum_guarantee||0;
    pf.nilai_kontrak        = p.nilai_kontrak||p.rab_total||0;
  }

  // S04 → S05..S25
  if (p.f05_locked) {
    pf.paket_terkunci = 'Yes — F-05 Locked';
    pf.skema_pembayaran = p.skema_pembayaran||'';
    pf.sla_hasil_kontraktual = p.sla_hasil_kontraktual||'';
  }

  // S08 → S14, S15, S23
  const s08 = getStepData('S08');
  if (s08.jumlah_peserta_final) pf.total_terdaftar = s08.jumlah_peserta_final;

  // S14 → S15
  const s14 = getStepData('S14');
  if (s14.total_hadir)  pf.total_hadir_bast  = s14.total_hadir;
  if (s14.total_unreg)  pf.total_unregistered = s14.total_unreg;

  // S15 → S23
  const s15 = getStepData('S15');
  if (s15.dasar_tagihan_awal) pf.dasar_tagihan_awal = s15.dasar_tagihan_awal;

  // Inline tes dari RAB
  if (rabItems?.length) {
    pf.parameter_tes_list = rabItems.map(r=>r.item_name).join(', ');
  }

  return pf;
}

// Render form fields per stage
function renderStageForm(stage, data, project, readOnly) {
  const ro = readOnly ? 'disabled' : '';
  const val = (k) => data[k] !== undefined && data[k] !== null ? String(data[k]) : '';

  // Stage-specific forms
  const forms = {
    S01: ()=>`
      <div class="form-row">
        <div class="form-group"><label>Industri Klien *</label><input type="text" id="sf_industri_klien" value="${val('industri_klien')}" ${ro}></div>
        <div class="form-group"><label>Lokasi Pelaksanaan *</label>
          <select id="sf_lokasi_pelaksanaan" ${ro}>
            ${['ONSITE','OFFSITE','CLINIC'].map(s=>`<option${val('lokasi_pelaksanaan')===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Alamat Lokasi</label><input type="text" id="sf_alamat_lokasi" value="${val('alamat_lokasi')||val('lokasi')}" ${ro} placeholder="Wajib jika ONSITE/OFFSITE"></div>
      <div class="form-row">
        <div class="form-group"><label>Target Peserta *</label><input type="number" id="sf_target_peserta" value="${val('target_peserta')||project.target_participants||''}" ${ro}></div>
        <div class="form-group"><label>Preferensi Tanggal *</label><input type="date" id="sf_preferensi_tanggal_1" value="${val('preferensi_tanggal_1')||project.tanggal_pelaksanaan||''}" ${ro}></div>
      </div>
      <div class="form-group"><label>Tujuan MCU *</label><textarea id="sf_tujuan_mcu" rows="2" ${ro}>${val('tujuan_mcu')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Target SLA Hasil *</label>
          <select id="sf_target_sla_hasil" ${ro}>
            ${['H+3','H+5','H+7','H+10','Lainnya'].map(s=>`<option${val('target_sla_hasil')===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Kebutuhan Hardcopy?</label>
          <select id="sf_kebutuhan_hardcopy" ${ro}>
            <option${val('kebutuhan_hardcopy')==='true'?' selected':''}>true</option>
            <option${val('kebutuhan_hardcopy')==='false'?' selected':''}>false</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Kontak PIC Klien (Nama, Jabatan, HP/Email) *</label><input type="text" id="sf_kontak_pic_klien" value="${val('kontak_pic_klien')}" ${ro} placeholder="dr. Andi, HR Manager, 081234567"></div>
      <div class="form-group"><label>Status Credit Hold Klien</label>
        <select id="sf_credit_hold_status" ${ro}>
          <option${val('credit_hold_status')==='CLEAR'?' selected':''}>CLEAR</option>
          <option${val('credit_hold_status')==='HOLD'?' selected':''}>HOLD</option>
          <option${val('credit_hold_status')==='HOLD_APPROVED'?' selected':''}>HOLD_APPROVED</option>
        </select>
      </div>`,

    S03: ()=>`
      <div class="status-box status-ok" style="margin-bottom:12px;font-size:12px">
        ✅ Data RAB dari Calculator: HPP/peserta = <strong>${formatCurrency(project.harga_per_peserta||0)}</strong> · 
        MG = <strong>${project.minimum_guarantee||'—'}</strong> peserta
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total HPP (dari RAB)</label><input type="number" id="sf_rab_hpp_total" value="${val('rab_hpp_total')||project.rab_hpp||0}" ${ro}></div>
        <div class="form-group"><label>Harga Jual/Peserta (dari RAB)</label><input type="number" id="sf_rab_harga_per_peserta" value="${val('rab_harga_per_peserta')||project.harga_per_peserta||0}" ${ro}></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Minimum Guarantee</label><input type="number" id="sf_rab_minimum_guarantee" value="${val('rab_minimum_guarantee')||project.minimum_guarantee||0}" ${ro}></div>
        <div class="form-group"><label>Margin (%)</label><input type="number" id="sf_margin_pct" value="${val('margin_pct')||project.rab_margin_pct||30}" ${ro}></div>
      </div>
      <div class="form-group"><label>Catatan / Justifikasi Harga</label><textarea id="sf_catatan_harga" rows="2" ${ro}>${val('catatan_harga')}</textarea></div>
      <div class="form-group"><label>Approval Head of Operations</label>
        <select id="sf_approval_head_ops" ${ro}>
          <option${val('approval_head_ops')==='Pending'?' selected':''}>Pending</option>
          <option${val('approval_head_ops')==='Approved'?' selected':''}>Approved</option>
          <option${val('approval_head_ops')==='Rejected'?' selected':''}>Rejected</option>
        </select>
      </div>`,

    S04: ()=>`
      <div class="status-box status-warn" style="margin-bottom:12px;font-size:12px">
        🔒 Setelah kedua tanda tangan → F-05 DIKUNCI. Data tidak bisa diubah kecuali via Addendum.
      </div>
      <div class="form-row">
        <div class="form-group"><label>Harga per Peserta (Rp)</label><input type="number" id="sf_harga_per_peserta" value="${val('harga_per_peserta')||project.harga_per_peserta||0}" ${ro}></div>
        <div class="form-group"><label>Minimum Guarantee</label><input type="number" id="sf_minimum_guarantee" value="${val('minimum_guarantee')||project.minimum_guarantee||0}" ${ro}></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>SLA Hasil Kontraktual</label>
          <select id="sf_sla_hasil_kontraktual" ${ro}>
            ${['H+3','H+5','H+7','H+10'].map(s=>`<option${(val('sla_hasil_kontraktual')||project.sla_hasil_kontraktual||'H+5')===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Skema Pembayaran</label>
          <select id="sf_skema_pembayaran" ${ro}>
            ${['CREDIT','DP50','FULLPAYMENT','CREDIT_HOLD_EXCEPTION'].map(s=>`<option${(val('skema_pembayaran')||project.skema_pembayaran||'CREDIT')===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Tanda Tangan Sales/AM *</label><input type="text" id="sf_signed_by_sales" value="${val('signed_by_sales')||project.pic_sales||''}" ${ro} placeholder="Nama Sales"></div>
        <div class="form-group"><label>Tanda Tangan SPV Project *</label><input type="text" id="sf_signed_by_spv" value="${val('signed_by_spv')||project.pic_spv||''}" ${ro} placeholder="Nama SPV"></div>
      </div>
      <div class="form-group">
        <label>Kunci F-05 (Wajib kedua tanda tangan terisi)</label>
        <select id="sf_f05_locked" ${ro}>
          <option value="false" ${project.f05_locked?'':'selected'}>Belum dikunci</option>
          <option value="true" ${project.f05_locked?'selected':''}>KUNCI F-05 ✓</option>
        </select>
        <div class="form-hint">Setelah dikunci, semua perubahan hanya via Form Addendum L4_035</div>
      </div>`,

    S15: ()=>`
      <div class="status-box status-ok" style="margin-bottom:12px;font-size:12px">
        📋 Data dari Master Peserta (S08): <strong>${val('total_terdaftar')||project.target_participants||'—'}</strong> terdaftar
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total Terdaftar (dari S08)</label><input type="number" id="sf_total_terdaftar" value="${val('total_terdaftar')||project.target_participants||0}" ${ro}></div>
        <div class="form-group"><label>Total Hadir *</label><input type="number" id="sf_total_hadir_bast" value="${val('total_hadir_bast')||val('total_hadir')||0}" ${ro} oninput="calcBAST()"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total Unregistered (LOG-UNREG)</label><input type="number" id="sf_total_unregistered" value="${val('total_unregistered')||0}" ${ro} oninput="calcBAST()"></div>
        <div class="form-group"><label>Total Tidak Hadir (auto)</label><input type="number" id="sf_total_tidak_hadir" value="${val('total_tidak_hadir')||0}" disabled style="background:var(--bg2)"></div>
      </div>
      <div class="form-group">
        <label>Dasar Tagihan Awal (MAX(hadir+unreg, MG) — auto)</label>
        <input type="number" id="sf_dasar_tagihan_awal" value="${val('dasar_tagihan_awal')||0}" disabled style="background:var(--bg2);font-weight:700">
        <div class="form-hint">MG = ${project.minimum_guarantee||'—'} peserta</div>
      </div>
      <div class="form-group"><label>Catatan Deviasi</label><textarea id="sf_deviasi_notes" rows="2" ${ro}>${val('deviasi_notes')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Tanda Tangan SPV Project *</label><input type="text" id="sf_signed_by_spv_bast" value="${val('signed_by_spv_bast')||project.pic_spv||''}" ${ro}></div>
        <div class="form-group"><label>Tanda Tangan PIC Klien *</label><input type="text" id="sf_signed_by_klien" value="${val('signed_by_klien')||''}" ${ro} placeholder="Nama + Jabatan PIC Klien"></div>
      </div>`,

    S23: ()=>`
      <div class="status-box status-ok" style="margin-bottom:12px;font-size:12px">
        📋 Dasar tagihan awal (dari BAST S15): <strong>${formatCurrency(parseFloat(val('dasar_tagihan_awal')||project.dasar_tagihan_bast||0))}</strong>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Deviasi Kategori 1 (Hadir–Tanpa Hasil)</label><input type="number" id="sf_deviasi_kat1" value="${val('deviasi_kat1')||0}" ${ro} oninput="calcBilling()"></div>
        <div class="form-group"><label>Deviasi Kategori 2 (Hasil–Tanpa Kehadiran)</label><input type="number" id="sf_deviasi_kat2" value="${val('deviasi_kat2')||0}" ${ro} oninput="calcBilling()"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Deviasi Kategori 3 (Pemeriksaan Tanpa Rekam)</label><input type="number" id="sf_deviasi_kat3" value="${val('deviasi_kat3')||0}" ${ro} oninput="calcBilling()"></div>
        <div class="form-group"><label>Deviasi Kategori 4 (Paket Tidak Sesuai)</label><input type="number" id="sf_deviasi_kat4" value="${val('deviasi_kat4')||0}" ${ro} oninput="calcBilling()"></div>
      </div>
      <div class="form-group">
        <label>Total Dapat Ditagih (auto)</label>
        <input type="number" id="sf_total_dapat_ditagih" value="${val('total_dapat_ditagih')||0}" disabled style="background:var(--bg2);font-weight:700">
        <div class="form-hint" id="billing-hint"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Tanda Tangan Admin Project *</label><input type="text" id="sf_signed_admin_f020" value="${val('signed_admin_f020')||''}" ${ro}></div>
        <div class="form-group"><label>Tanda Tangan SPV Project *</label><input type="text" id="sf_signed_spv_f020" value="${val('signed_spv_f020')||project.pic_spv||''}" ${ro}></div>
      </div>
      <div class="form-group"><label>Tanda Tangan Finance *</label><input type="text" id="sf_signed_finance_f020" value="${val('signed_finance_f020')||''}" ${ro} placeholder="Tanda tangan ke-3 → membuka Invoice (S25)"></div>`,
  };

  // Default form untuk stage lain
  const defaultForm = ()=>`
    ${stage.fields.map(f=>{
      const label = f.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      const v = val(f);
      const isArea = ['catatan','notes','temuan','hasil','list','cap','feedback','lessons'].some(k=>f.includes(k));
      const isDate = f.includes('tanggal')||f.includes('date');
      const isNum  = f.includes('total')||f.includes('jumlah')||f.includes('qty')||f.includes('nilai');
      const type   = isDate?'date':isNum?'number':'text';
      if (isArea) return `<div class="form-group" style="grid-column:1/-1"><label>${label}</label><textarea id="sf_${f}" rows="2" ${ro}>${v}</textarea></div>`;
      if (f.includes('signed')||f.includes('status')||f.includes('hasil_go_nogo')) {
        return `<div class="form-group"><label>${label}</label>
          <select id="sf_${f}" ${ro}>
            ${f.includes('signed')||f.includes('konfirmasi')?
              ['Belum','Sudah / Ya'].map(s=>`<option${v===s?' selected':''}>${s}</option>`).join(''):
              ['Pending','Yes','No','GO','NO-GO','Done'].map(s=>`<option${v===s?' selected':''}>${s}</option>`).join('')
            }
          </select></div>`;
      }
      return `<div class="form-group"><label>${label}</label><input type="${type}" id="sf_${f}" value="${v}" ${ro} placeholder="${label}..."></div>`;
    }).join('')}`;

  const render = forms[stageId] || defaultForm;
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px">${render()}</div>`;
}

// Kalkulasi BAST otomatis
function calcBAST() {
  const hadir  = parseInt(document.getElementById('sf_total_hadir_bast')?.value||0);
  const terd   = parseInt(document.getElementById('sf_total_terdaftar')?.value||0);
  const unreg  = parseInt(document.getElementById('sf_total_unregistered')?.value||0);
  const tdkHd  = Math.max(0, terd - hadir);
  const mg     = parseInt(document.getElementById('sf_rab_minimum_guarantee')?.value||0) ||
                 parseInt(document.querySelector('#sf_minimum_guarantee')?.value||0);
  const dasar  = Math.max(hadir + unreg, mg || 0);
  const tdkHdEl = document.getElementById('sf_total_tidak_hadir');
  const dasarEl = document.getElementById('sf_dasar_tagihan_awal');
  if (tdkHdEl) tdkHdEl.value = tdkHd;
  if (dasarEl)  dasarEl.value = dasar;
}

// Kalkulasi Billing S23 otomatis
function calcBilling() {
  const dasar = parseInt(document.getElementById('sf_dasar_tagihan_awal')?.value||0);
  const k1 = parseInt(document.getElementById('sf_deviasi_kat1')?.value||0);
  const k2 = parseInt(document.getElementById('sf_deviasi_kat2')?.value||0);
  const k3 = parseInt(document.getElementById('sf_deviasi_kat3')?.value||0);
  const k4 = parseInt(document.getElementById('sf_deviasi_kat4')?.value||0);
  const total = Math.max(0, dasar - k1 - k2 - k3 - k4);
  const el = document.getElementById('sf_total_dapat_ditagih');
  const hint = document.getElementById('billing-hint');
  if (el) el.value = total;
  if (hint) hint.textContent = `${dasar} - ${k1}(K1) - ${k2}(K2) - ${k3}(K3) - ${k4}(K4) = ${total} peserta dapat ditagih`;
}

// ── SAVE STEP FORM ─────────────────────────────────────────────
async function saveStepForm(projectId, stageId) {
  const stage = MCU_STAGES[stageId]; if (!stage) return;
  const user = getUserName?getUserName():'User';

  // Collect all form data
  const formData = {};
  stage.fields.forEach(f=>{
    const el = document.getElementById(`sf_${f}`);
    if (el) formData[f] = el.value;
  });

  // Extra meta fields
  const extraFields = ['f05_locked','credit_hold_status','signed_by_sales','signed_by_spv',
    'harga_per_peserta','minimum_guarantee','sla_hasil_kontraktual','skema_pembayaran',
    'total_terdaftar','total_hadir_bast','total_unregistered','total_tidak_hadir','dasar_tagihan_awal','signed_by_klien',
    'deviasi_kat1','deviasi_kat2','deviasi_kat3','deviasi_kat4','total_dapat_ditagih',
    'signed_admin_f020','signed_spv_f020','signed_finance_f020','approval_head_ops'];
  extraFields.forEach(f=>{ const el=document.getElementById(`sf_${f}`); if(el) formData[f]=el.value; });

  const status    = document.getElementById('sf-status')?.value||'In Progress';
  const done_by   = document.getElementById('sf-done-by')?.value||user;
  const done_date = document.getElementById('sf-done-date')?.value||null;

  // Project-level updates based on stage
  const projUpdate = { updated_at: new Date().toISOString() };

  if (stageId === 'S01') {
    if (formData.credit_hold_status) projUpdate.credit_hold_status = formData.credit_hold_status;
    if (formData.target_peserta)     projUpdate.target_participants = parseInt(formData.target_peserta)||null;
    if (formData.preferensi_tanggal_1) projUpdate.tanggal_pelaksanaan = formData.preferensi_tanggal_1;
    if (formData.lokasi_pelaksanaan) projUpdate.lokasi_pelaksanaan = formData.lokasi_pelaksanaan;
  }
  if (stageId === 'S04') {
    if (formData.harga_per_peserta) projUpdate.harga_per_peserta = parseFloat(formData.harga_per_peserta)||0;
    if (formData.minimum_guarantee) projUpdate.minimum_guarantee = parseInt(formData.minimum_guarantee)||0;
    if (formData.sla_hasil_kontraktual) projUpdate.sla_hasil_kontraktual = formData.sla_hasil_kontraktual;
    if (formData.skema_pembayaran)  projUpdate.skema_pembayaran = formData.skema_pembayaran;
    if (formData.f05_locked === 'true' && formData.signed_by_sales && formData.signed_by_spv) {
      projUpdate.f05_locked = true;
      projUpdate.f05_signed_at = new Date().toISOString();
      toast('🔒 F-05 dikunci! Data order tidak bisa diubah lagi.','warn',4000);
    }
  }
  if (stageId === 'S06') {
    projUpdate.f06_signed_at = new Date().toISOString();
  }
  if (stageId === 'S15') {
    if (formData.dasar_tagihan_awal) projUpdate.dasar_tagihan_bast = parseInt(formData.dasar_tagihan_awal)||0;
    if (formData.signed_by_klien)    projUpdate.bast_signed_at = new Date().toISOString();
  }
  if (stageId === 'S23') {
    const allResolved = ['deviasi_kat1','deviasi_kat2','deviasi_kat3'].every(k=>!parseInt(formData[k]||0));
    projUpdate.all_deviasi_resolved = allResolved;
    projUpdate.f020_signed_3 = !!(formData.signed_admin_f020 && formData.signed_spv_f020 && formData.signed_finance_f020);
    if (formData.total_dapat_ditagih) projUpdate.rekap_billing_final = parseFloat(formData.total_dapat_ditagih)||0;
  }
  if (stageId === 'S24') {
    if (formData.client_receipt_confirmed_at||status==='Done') {
      projUpdate.client_receipt_confirmed_at = formData.client_receipt_confirmed_at || new Date().toISOString();
    }
  }
  if (stageId === 'S27') {
    projUpdate.status_financial = 'PAID';
  }

  try {
    // Save step record
    const existing = await sbGet('project_steps',`select=id&project_id=eq.${projectId}&step_id=eq.${stageId}`).catch(()=>[]);
    const stepNo   = stage.no;
    const payload  = {
      project_id: projectId, step_id: stageId, step_number: stepNo,
      step_name: stage.name, phase_id: stage.phase,
      status, done_by, done_date: done_date||null,
      form_data: JSON.stringify(formData),
      updated_at: new Date().toISOString(),
    };
    if (existing[0]?.id) await sbPatch('project_steps', existing[0].id, payload);
    else await sbPost('project_steps', {...payload, created_at: new Date().toISOString()});

    // Update project
    if (Object.keys(projUpdate).length > 1) await sbPatch('projects', projectId, projUpdate);

    toast(`✅ ${stage.id} disimpan`,'ok');
    closeModalForce();
    mcuProjects = [];
    await loadMCUProjects();
    setTimeout(()=>openMCUDetail(projectId), 300);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── MARK DONE & ADVANCE ────────────────────────────────────────
async function markStageDone(projectId, stageId) {
  const stage    = MCU_STAGES[stageId]; if (!stage) return;
  const [dArr, stepsArr] = await Promise.all([
    sbGet('projects',`select=*&id=eq.${projectId}`),
    sbGet('project_steps',`select=*&project_id=eq.${projectId}`).catch(()=>[]),
  ]);
  const p = dArr[0]||{};

  // Final gate check
  const unmet = checkGate(stage, p, stepsArr||[]);
  if (unmet.length) {
    toast('⛔ ' + unmet[0],'err',5000);
    return;
  }

  // Save as Done first
  document.getElementById('sf-status').value = 'Done';
  await saveStepForm(projectId, stageId);

  // Advance current_step
  const nextNo = Math.min(stage.no + 1, 31);
  await sbPatch('projects', projectId, {
    current_step: nextNo,
    status: stage.no >= 31 ? 'Completed' : 'Active',
    updated_at: new Date().toISOString(),
  });

  toast(`✅ ${stageId} selesai → Lanjut ke S${String(nextNo).padStart(2,'0')}`,'ok',3000);
}

async function advanceMCUStep(projectId) {
  const d = await sbGet('projects',`select=current_step&id=eq.${projectId}`);
  const curNo = d[0]?.current_step||1;
  const curId = `S${String(curNo).padStart(2,'0')}`;
  openStepForm(projectId, curId);
}
