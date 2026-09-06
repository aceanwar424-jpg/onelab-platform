// ═══════════════════════════════════════════════════════════════
// HIS · VIEWER HASIL LIS
//
// HIS adalah konsumen hasil yang sudah dirilis LIS. Modul ini sengaja hanya
// memakai sbGet: input, koreksi, validasi, dan rilis hasil tetap dilakukan
// pada LIS agar tidak muncul dua sumber kebenaran untuk hasil klinis.
// ═══════════════════════════════════════════════════════════════

const HIS_LIS_VIEWERS = {
  'clinical-pathology': {
    title: 'Viewer Hasil Patologi Klinik',
    short: 'Patologi Klinik', icon: '🧪', accent: '#0f9c83',
    description: 'Hasil kimia klinik, hematologi, imunologi, dan pemeriksaan laboratorium klinik yang sudah dirilis LIS.',
  },
  microbiology: {
    title: 'Viewer Hasil Mikrobiologi',
    short: 'Mikrobiologi', icon: '🦠', accent: '#7c5ce0',
    description: 'Hasil pewarnaan, kultur, identifikasi, dan sensitivitas yang sudah dirilis LIS.',
  },
  'anatomical-pathology': {
    title: 'Viewer Hasil Patologi Anatomi',
    short: 'Patologi Anatomi', icon: '🔬', accent: '#c05a8f',
    description: 'Hasil histopatologi, sitologi, dan pemeriksaan anatomi patologi yang sudah dirilis LIS.',
  },
};

let hisLisViewerMode = 'clinical-pathology';
let hisLisViewerRows = [];
let hisLisViewerCatalog = new Map();

function hisLisEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
}

function hisLisCatalogText(row) {
  const catalog = hisLisViewerCatalog.get(String(row?.product_id)) || {};
  return [catalog.kategori, catalog.sub_kategori, catalog.nama_tes, row?.product_name, row?.item_name, row?.notes]
    .filter(Boolean).join(' ').toLowerCase();
}

function hisLisDiscipline(row) {
  const text = hisLisCatalogText(row);
  if (/(micro|mikrobiolog|kultur|culture|sensitivit|pewarnaan|\bbta\b|\bkoh\b|gram stain)/i.test(text)) return 'microbiology';
  if (/(anatomi|anatomic|histopat|histolog|sitolog|cytolog|biopsi|biopsy|pap smear)/i.test(text)) return 'anatomical-pathology';
  return 'clinical-pathology';
}

function hisLisResultStatus(row) {
  return String(row?.status || '').toLowerCase();
}

function hisLisIsReleased(row) {
  const status = hisLisResultStatus(row);
  return ['approved', 'released', 'rilis', 'released_to_his'].includes(status) || !!row?.released_at;
}

async function renderHisLisResultViewer(params = {}) {
  const requested = params.discipline || params.mode || hisLisViewerMode;
  hisLisViewerMode = HIS_LIS_VIEWERS[requested] ? requested : 'clinical-pathology';
  const cfg = HIS_LIS_VIEWERS[hisLisViewerMode];
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <section class="clinical-results-viewer" style="--viewer-accent:${cfg.accent}">
      <header class="clinical-results-head">
        <div>
          <div class="clinical-results-eyebrow">PELAYANAN KLINIS · VIEWER LIS</div>
          <h1>${cfg.icon} ${cfg.title}</h1>
          <p>${cfg.description}</p>
        </div>
        <div class="clinical-results-readonly" title="Data pada layar ini tidak dapat diubah dari HIS">
          <span>🔒</span><div><strong>Read-only dari LIS</strong><small>Hanya hasil yang sudah dirilis</small></div>
        </div>
      </header>

      <div class="clinical-results-notice">
        <span>ⓘ</span>
        <span>Koreksi, validasi, persetujuan, dan rilis hasil dilakukan di LIS. HIS menampilkan salinan hasil untuk kesinambungan pelayanan klinis.</span>
      </div>

      <div class="clinical-results-toolbar" aria-label="Filter hasil LIS">
        <input id="his-lis-q" type="search" placeholder="Cari pasien, nomor kunjungan, atau pemeriksaan" oninput="filterHisLisViewer()">
        <select id="his-lis-period" onchange="filterHisLisViewer()" aria-label="Periode hasil">
          <option value="30">30 hari terakhir</option>
          <option value="90" selected>90 hari terakhir</option>
          <option value="365">12 bulan terakhir</option>
          <option value="all">Semua periode</option>
        </select>
        <select id="his-lis-flag" onchange="filterHisLisViewer()" aria-label="Status klinis hasil">
          <option value="">Semua hasil rilis</option>
          <option value="critical">Nilai kritis</option>
          <option value="flagged">Di luar rentang</option>
          <option value="normal">Tanpa flag</option>
        </select>
      </div>

      <div class="clinical-results-summary" id="his-lis-summary" aria-live="polite">
        <span class="clinical-results-skeleton"></span><span class="clinical-results-skeleton"></span><span class="clinical-results-skeleton"></span>
      </div>
      <div class="clinical-results-table-wrap" id="his-lis-table"><div class="loading-row"><div class="spinner"></div></div></div>
    </section>`;

  await loadHisLisViewer();
}

async function loadHisLisViewer() {
  const table = document.getElementById('his-lis-table');
  try {
    const [rows, products] = await Promise.all([
      sbGet('lab_results', 'select=*&order=created_at.desc&limit=500'),
      sbGet('products', 'select=id,kategori,sub_kategori,nama_tes&limit=2000').catch(() => []),
    ]);
    hisLisViewerCatalog = new Map((products || []).map(p => [String(p.id), p]));
    hisLisViewerRows = (rows || []).filter(r => hisLisIsReleased(r) && hisLisDiscipline(r) === hisLisViewerMode);
    filterHisLisViewer();
  } catch (error) {
    hisLisViewerRows = [];
    if (table) table.innerHTML = `<div class="empty-state clinical-results-empty"><div class="ico">🔗</div><h3>Hasil LIS belum dapat dimuat</h3><p>Periksa koneksi sinkronisasi atau hak akses viewer. Tidak ada data hasil yang dibuat dari HIS.</p></div>`;
    const summary = document.getElementById('his-lis-summary');
    if (summary) summary.innerHTML = '';
  }
}

function hisLisHasFlag(row) {
  const color = String(row?.color_code || '').toLowerCase();
  return ['red', 'yellow', 'orange'].includes(color) || row?.normal_min != null || row?.normal_max != null;
}

function hisLisIsCritical(row) {
  const text = `${row?.interpretation || ''} ${row?.notes || ''}`.toLowerCase();
  return String(row?.color_code || '').toLowerCase() === 'red' || /critical|kritis/.test(text);
}

function hisLisOutOfRange(row) {
  const numeric = Number(row?.result_numeric);
  if (!Number.isFinite(numeric)) return ['yellow', 'orange', 'red'].includes(String(row?.color_code || '').toLowerCase());
  return (row?.normal_min != null && numeric < Number(row.normal_min)) || (row?.normal_max != null && numeric > Number(row.normal_max));
}

function hisLisDate(row) {
  return row?.released_at || row?.approved_at || row?.updated_at || row?.created_at;
}

function hisLisFormatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function hisLisFlagBadge(row) {
  if (hisLisIsCritical(row)) return '<span class="clinical-flag critical">Kritis</span>';
  if (hisLisOutOfRange(row)) return '<span class="clinical-flag flagged">Di luar rentang</span>';
  return '<span class="clinical-flag normal">Dalam rentang</span>';
}

function filterHisLisViewer() {
  const q = String(document.getElementById('his-lis-q')?.value || '').trim().toLowerCase();
  const period = document.getElementById('his-lis-period')?.value || '90';
  const flag = document.getElementById('his-lis-flag')?.value || '';
  const since = period === 'all' ? null : Date.now() - Number(period) * 86400000;
  const data = hisLisViewerRows.filter(row => {
    const searchable = `${row.patient_name || ''} ${row.visit_number || ''} ${row.product_name || ''} ${row.item_name || ''}`.toLowerCase();
    const date = new Date(hisLisDate(row) || 0).getTime();
    const flagOk = !flag || (flag === 'critical' && hisLisIsCritical(row)) || (flag === 'flagged' && hisLisOutOfRange(row)) || (flag === 'normal' && !hisLisIsCritical(row) && !hisLisOutOfRange(row));
    return (!q || searchable.includes(q)) && (!since || date >= since) && flagOk;
  });
  renderHisLisViewerRows(data);
}

function renderHisLisViewerRows(data) {
  const table = document.getElementById('his-lis-table');
  const summary = document.getElementById('his-lis-summary');
  const critical = data.filter(hisLisIsCritical).length;
  const patients = new Set(data.map(r => `${r.patient_name || ''}|${r.visit_number || ''}`)).size;
  if (summary) summary.innerHTML = `
    <div><strong>${data.length}</strong><span>hasil dirilis</span></div>
    <div><strong>${patients}</strong><span>kunjungan</span></div>
    <div class="${critical ? 'has-critical' : ''}"><strong>${critical}</strong><span>perlu perhatian</span></div>`;
  if (!table) return;
  if (!data.length) {
    table.innerHTML = `<div class="empty-state clinical-results-empty"><div class="ico">${HIS_LIS_VIEWERS[hisLisViewerMode].icon}</div><h3>Belum ada hasil dirilis</h3><p>Ubah filter atau tunggu hasil dari LIS diterbitkan ke HIS.</p></div>`;
    return;
  }
  table.innerHTML = `<table class="clinical-results-table"><thead><tr>
    <th>Pasien / Kunjungan</th><th>Pemeriksaan</th><th>Hasil</th><th>Rentang rujukan</th><th>Status klinis</th><th>Rilis LIS</th>
  </tr></thead><tbody>${data.map((row, index) => {
    const result = [row.result_value, row.unit].filter(Boolean).join(' ') || '—';
    const range = row.normal_min != null || row.normal_max != null ? `${row.normal_min ?? '—'} – ${row.normal_max ?? '—'} ${row.unit || ''}` : '—';
    const interpretation = row.interpretation ? `<small>${hisLisEscape(row.interpretation)}</small>` : '';
    return `<tr class="${hisLisIsCritical(row) ? 'critical-row' : ''}">
      <td><strong>${hisLisEscape(row.patient_name || '—')}</strong><small>${hisLisEscape(row.visit_number || 'Tanpa nomor kunjungan')}</small></td>
      <td><strong>${hisLisEscape(row.item_name || row.product_name || '—')}</strong><small>${hisLisEscape(row.product_name && row.item_name ? row.product_name : '')}</small></td>
      <td class="clinical-result-value"><strong>${hisLisEscape(result)}</strong>${interpretation}</td>
      <td>${hisLisEscape(range)}</td>
      <td>${hisLisFlagBadge(row)}</td>
      <td><time datetime="${hisLisEscape(hisLisDate(row) || '')}">${hisLisFormatDate(hisLisDate(row))}</time><small>${hisLisEscape(row.approved_by || row.validated_by || 'LIS')}</small></td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

window.renderHisLisResultViewer = renderHisLisResultViewer;
window.filterHisLisViewer = filterHisLisViewer;
