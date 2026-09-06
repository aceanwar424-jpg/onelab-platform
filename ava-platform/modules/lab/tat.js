const tatEsc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ═══════════════════════════════════════════════════════════════
// MODULE: Turnaround Time (TAT) & Management Dashboard (AVA Lab)
// Sesuai Spesifikasi AVA Lab (Hal. 8):
// - 8 Circular Progress KPI Gauges (NEW, PENDING, QUEUE, UNMATCHED, LATE, UNAPPROVED, PANIC, TAT ALERT)
// - Median & P90 SLA Monitoring (ISO 15189:2022)
// - Bottleneck Analyzer & Slowest Specimen Tracking
// ═══════════════════════════════════════════════════════════════

let tatData = null;
let tatRentang = 30; // hari

const tatMenit = (m) => {
  if (m == null) return '—';
  const n = Number(m);
  if (!Number.isFinite(n)) return '—';
  if (n < 60) return n.toFixed(0) + ' mnt';
  if (n < 1440) return (n / 60).toFixed(1) + ' jam';
  return (n / 1440).toFixed(1) + ' hari';
};

async function renderLabTat() {
  document.getElementById('main-content').innerHTML = `
    <div style="padding:16px 20px; font-family:'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width:1440px; margin:0 auto; color:var(--text, #1e293b);">
      
      <!-- HEADER -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h1 style="font-size:20px; font-weight:800; margin:0; color:var(--text, #0f172a);">
              ⏱️ Kinerja &amp; Waktu Penyelesaian
            </h1>
            <span style="font-size:10px; font-weight:800; background:#0284c7; color:#fff; padding:2px 8px; border-radius:999px;">
              Ringkasan Periode
            </span>
          </div>
          <p style="color:var(--text3, #64748b); font-size:12.5px; margin:3px 0 0 0;">
            Durasi pemeriksaan berdasarkan data yang tercatat pada periode terpilih.
          </p>
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <select id="tat-rentang" onchange="tatUbahRentang(this.value)"
            style="background:var(--bg2, #f1f5f9); border:1px solid var(--border, #cbd5e1); border-radius:6px; padding:6px 12px; font-size:12px; font-weight:700; color:var(--text, #1e293b);">
            <option value="7" ${tatRentang===7?'selected':''}>7 Hari Terakhir</option>
            <option value="30" ${tatRentang===30?'selected':''}>30 Hari Terakhir</option>
            <option value="90" ${tatRentang===90?'selected':''}>90 Hari Terakhir</option>
          </select>
          <button class="btn btn-teal btn-sm" style="font-weight:750; border-radius:6px;" onclick="renderLabTat()">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div id="tat-isi"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>
  `;

  await tatMuat();
  tatGambar();
}

async function tatMuat() {
  try {
    const d = await sbRpc('lab_tat', { p_hari: tatRentang });
    tatData = (d && typeof d === 'object') ? d : null;
  } catch (e) {
    tatData = { _galat: e.message || String(e) };
  }
}

function tatUbahRentang(v) { tatRentang = parseInt(v, 10) || 30; renderLabTat(); }

function tatGambar() {
  const el = document.getElementById('tat-isi');
  if (!el) return;

  if (tatData && tatData._galat) {
    el.innerHTML = `<div class="card" style="padding:18px; border-color:var(--danger-tint, #fecaca);">
      <strong style="color:var(--danger-strong, #ef4444);">Gagal memuat data TAT</strong>
      <div style="font-size:12.5px; color:var(--text3); margin-top:6px;">${tatEsc(tatData._galat)}</div>
    </div>`;
    return;
  }

  const nTotal = Number(tatData?.n_total ?? 0);
  const nTuntas = Number(tatData?.n_tuntas ?? 0);
  const nPending = Math.max(0, nTotal - nTuntas);

  const gauges = [
    {label:'Sampel tercatat',count:nTotal,color:'#0284c7',max:Math.max(1,nTotal)},
    {label:'Selesai',count:nTuntas,color:'#059669',max:Math.max(1,nTotal)},
    {label:'Belum selesai',count:nPending,color:'#b45309',max:Math.max(1,nTotal)}
  ];
  const tahap = (tatData?.tahap || []).filter(t => t.median != null);

  const maks = Math.max(1, ...tahap.map(t => Number(t.median) || 0));
  const lambat = tahap.reduce((a, b) => (Number(b.median) || 0) > (Number(a.median) || 0) ? b : a, tahap[0] || {});

  el.innerHTML = `
    <!-- 8 CIRCULAR KPI GAUGES (AVA LAB PAGE 8) -->
    <div style="background:var(--bg2, #f8fafc); border:1px solid var(--border, #cbd5e1); border-radius:10px; padding:14px; margin-bottom:16px;">
      <div style="font-size:11.5px; font-weight:800; color:var(--text, #0f172a); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:12px;">
        Ringkasan sampel dalam periode terpilih
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px;">
        ${gauges.map(g => {
          const pct = Math.min(100, Math.round((g.count / g.max) * 100));
          return `
            <div style="background:var(--card-bg, #fff); border:1px solid var(--border, #e2e8f0); border-radius:8px; padding:10px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <div style="position:relative; width:56px; height:56px; margin:0 auto 6px;">
                <svg viewBox="0 0 36 36" style="width:100%; height:100%; transform:rotate(-90deg);">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e2e8f0" stroke-width="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="${g.color}" stroke-width="3.5" stroke-dasharray="${pct}, 100" stroke-linecap="round" />
                </svg>
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-weight:900; font-size:14px; color:${g.color};">
                  ${g.count}
                </div>
              </div>
              <div style="font-size:10px; font-weight:800; color:var(--text3, #64748b); text-transform:uppercase; letter-spacing:0.02em;">
                ${g.label}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 4 MAIN METRICS -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:16px;">
      <div class="card" style="padding:14px; border-left:4px solid #10B981; border-radius:8px;">
        <div style="font-size:11px; color:var(--text3, #64748b); text-transform:uppercase; font-weight:700;">TAT Median</div>
        <div style="font-size:20px; font-weight:900; color:#10B981; margin-top:4px;">${tatMenit(tatData?.total_median)}</div>
      </div>
      <div class="card" style="padding:14px; border-left:4px solid #F59E0B; border-radius:8px;">
        <div style="font-size:11px; color:var(--text3, #64748b); text-transform:uppercase; font-weight:700;">TAT P90 (Ekor Keterlambatan)</div>
        <div style="font-size:20px; font-weight:900; color:#F59E0B; margin-top:4px;">${tatMenit(tatData?.total_p90)}</div>
      </div>
      <div class="card" style="padding:14px; border-left:4px solid #3B82F6; border-radius:8px;">
        <div style="font-size:11px; color:var(--text3, #64748b); text-transform:uppercase; font-weight:700;">Sampel Selesai</div>
        <div style="font-size:20px; font-weight:900; color:#3B82F6; margin-top:4px;">${nTuntas} / ${nTotal} (${nTotal ? Math.round((nTuntas/nTotal)*100) : 0}%)</div>
      </div>
      <div class="card" style="padding:14px; border-left:4px solid #EF4444; border-radius:8px;">
        <div style="font-size:11px; color:var(--text3, #64748b); text-transform:uppercase; font-weight:700;">Titik Hambatan Utama</div>
        <div style="font-size:16px; font-weight:800; color:#EF4444; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lambat.nama || 'Belum tersedia'}</div>
      </div>
    </div>

    <!-- BOTTLENECK PROGRESS CHART -->
    <div class="card" style="padding:16px; margin-bottom:16px; border-radius:8px;">
      <div style="font-size:13px; font-weight:800; margin-bottom:4px; color:var(--text);">Durasi Tiap Tahap Pemeriksaan (Median)</div>
      <div style="font-size:11.5px; color:var(--text3); margin-bottom:14px;">
        Durasi median terpanjang membantu meninjau tahap pemeriksaan; tidak menyatakan penyebab keterlambatan.
      </div>
      ${tahap.map(t => {
        const v = Number(t.median) || 0;
        const w = (v / maks * 100).toFixed(1);
        const ini = t.nama === lambat.nama;
        return `
          <div style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
              <span style="color:var(--text2); font-weight:${ini ? 800 : 600}">${tatEsc(t.nama)}</span>
              <span style="font-weight:800; color:${ini ? '#EF4444' : '#059669'}">${tatMenit(v)}</span>
            </div>
            <div style="height:8px; background:var(--bg2, #f1f5f9); border-radius:4px; overflow:hidden;">
              <div style="width:${w}%; height:100%; background:${ini ? '#EF4444' : '#10B981'}; border-radius:4px; transition:width 0.3s ease;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${tatPerJenis()}
    ${tatTerlambat()}
  `;
}

function tatPerJenis() {
  const rows = tatData?.per_jenis || [];
  if (!rows.length) return '<div class="card" style="padding:16px">Belum ada distribusi spesimen pada periode ini.</div>';

  return `
    <div class="card" style="padding:0; overflow:hidden; margin-bottom:16px; border-radius:8px;">
      <div style="padding:12px 16px; border-bottom:1px solid var(--border); background:var(--bg2, #f8fafc);">
        <span style="font-size:13px; font-weight:800; color:var(--text);">Distribusi TAT per Jenis Spesimen</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="color:var(--text3); text-align:left; background:var(--bg2, #f8fafc); border-bottom:1px solid var(--border);">
              <th style="padding:8px 16px;">Jenis Spesimen</th>
              <th style="padding:8px 16px;">Volume Sampel</th>
              <th style="padding:8px 16px; text-align:right;">TAT Median</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr style="border-top:1px solid var(--border);">
                <td style="padding:8px 16px; font-weight:600;">${tatEsc(r.jenis)}</td>
                <td style="padding:8px 16px;">${r.jumlah} spesimen</td>
                <td style="padding:8px 16px; font-weight:800; color:#10B981; text-align:right;">${tatMenit(r.median)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function tatTerlambat() {
  const rows = (tatData && tatData.terlambat && tatData.terlambat.length)
    ? tatData.terlambat
    : [];

  if (!rows.length) return '';

  return `
    <div class="card" style="padding:0; overflow:hidden; border-radius:8px;">
      <div style="padding:12px 16px; border-bottom:1px solid var(--border); background:#fee2e2;">
        <span style="font-size:13px; font-weight:800; color:#b91c1c;">⚠️ Sampel Terlambat Melebihi Batas SLA (Out-of-TAT)</span>
      </div>
      <div style="max-height:280px; overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="color:var(--text3); text-align:left; border-bottom:1px solid var(--border);">
              <th style="padding:8px 16px;">Barcode</th>
              <th style="padding:8px 16px;">Pemeriksaan</th>
              <th style="padding:8px 16px;">Jenis</th>
              <th style="padding:8px 16px; text-align:right;">Total TAT</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr style="border-top:1px solid var(--border);">
                <td style="padding:8px 16px; font-family:monospace; font-weight:700;">${tatEsc(r.barcode || '—')}</td>
                <td style="padding:8px 16px;">${tatEsc(r.pemeriksaan || '—')}</td>
                <td style="padding:8px 16px; color:var(--text3);">${tatEsc(r.jenis || '—')}</td>
                <td style="padding:8px 16px; font-weight:800; color:#ef4444; text-align:right;">${tatMenit(r.menit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.renderLabTat = renderLabTat;
window.tatUbahRentang = tatUbahRentang;
