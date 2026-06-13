// ═══════════════════════════════════════════
// MODULE: Home Care Management
// ═══════════════════════════════════════════

const HC_STATUSES = ['Baru','Dijadwalkan','Dalam Perjalanan','Sedang Berlangsung','Selesai','Dibatalkan'];
const HC_SERVICES = ['Pengambilan Sampel Darah','Pengambilan Sampel Urin','Rapid Test','Swab PCR',
  'Pemeriksaan Tekanan Darah','EKG','Nebulizer','Pemasangan Infus','Perawatan Luka','Konsultasi Dokter','Lainnya'];

let hcAll = [];

async function renderHomeCare() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Home Care</h1>
        <p>Order layanan, jadwal kunjungan, dan tracking perawat/analis</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="switchHCTab('schedule',document.querySelector('#hc-tabs .tab-btn:nth-child(2)'))">📅 Jadwal</button>
        <button class="btn btn-teal" onclick="openHCForm()">+ Order Baru</button>
      </div>
    </div>

    <div class="tabs" id="hc-tabs">
      <button class="tab-btn active" onclick="switchHCTab('orders',this)">📋 Semua Order</button>
      <button class="tab-btn" onclick="switchHCTab('schedule',this)">📅 Jadwal Hari Ini</button>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${HC_STATUSES.slice(0,4).map(s=>`
        <div style="padding:8px 14px;background:#fff;border-radius:8px;border:1px solid var(--border);flex:1;min-width:80px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:var(--navy)" id="hc-count-${s.replace(/ /g,'')}">0</div>
          <div style="font-size:10px;color:var(--gray)">${s}</div>
        </div>`).join('')}
    </div>

    <div id="hc-orders">
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="table-search" id="hc-q" placeholder="🔍 Cari nama pasien, alamat..."
            oninput="filterHC()" style="flex:1">
          <select class="table-filter" id="hc-sf" onchange="filterHC()">
            <option value="">Semua Status</option>
            ${HC_STATUSES.map(s=>`<option>${s}</option>`).join('')}
          </select>
          <input type="date" id="hc-date-f" onchange="filterHC()"
            style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:12px">
        </div>
        <div id="hc-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
      </div>
    </div>
    <div id="hc-schedule" style="display:none"></div>`;

  await loadHC();
}

async function loadHC() {
  try {
    const data = await sbGet('homecare_orders','select=*&order=visit_date.asc,visit_time.asc');
    hcAll = Array.isArray(data) ? data : [];
    updateHCCounts();
    filterHC();
  } catch(e) {
    document.getElementById('hc-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function updateHCCounts() {
  HC_STATUSES.slice(0,4).forEach(s => {
    const el = document.getElementById(`hc-count-${s.replace(/ /g,'')}`);
    if (el) el.textContent = hcAll.filter(h=>h.status===s).length;
  });
}

function filterHC() {
  const q = (document.getElementById('hc-q')?.value||'').toLowerCase();
  const st = document.getElementById('hc-sf')?.value||'';
  const dt = document.getElementById('hc-date-f')?.value||'';
  const filtered = hcAll.filter(h=>
    (!q || ['patient_name','address','phone'].some(k=>(h[k]||'').toLowerCase().includes(q))) &&
    (!st || h.status===st) &&
    (!dt || h.visit_date===dt)
  );
  renderHCTable(filtered);
}

function renderHCTable(data) {
  const el = document.getElementById('hc-tbody');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🏠</div>
      <h3>${hcAll.length?'Tidak ada hasil':'Belum ada order'}</h3>
      <p>Klik "+ Order Baru" untuk membuat order layanan home care.</p></div>`; return;
  }
  const stColors = {'Baru':'#0EA5E9','Dijadwalkan':'#8B5CF6','Dalam Perjalanan':'#F59E0B',
    'Sedang Berlangsung':'#06B6D4','Selesai':'#22C55E','Dibatalkan':'#EF4444'};
  el.innerHTML = `<table>
    <thead><tr>
      <th>No. Order</th><th>Pasien</th><th>Layanan</th><th>Jadwal</th>
      <th>Petugas</th><th>Status</th><th>Tagihan</th><th>Aksi</th>
    </tr></thead>
    <tbody>${data.map(h=>{
      const col = stColors[h.status]||'#94A3B8';
      return `<tr>
        <td style="font-size:11px;font-family:monospace;color:var(--teal)">${h.order_number||'—'}</td>
        <td>
          <div style="font-weight:600;color:var(--navy)">${h.patient_name||'—'}</div>
          <div style="font-size:11px;color:var(--gray)">${h.phone||''}</div>
          <div style="font-size:11px;color:var(--gray)">${h.address||''}</div>
        </td>
        <td style="font-size:12px">${(h.services||'').split(',').slice(0,2).join(', ')}${(h.services||'').split(',').length>2?'...':''}</td>
        <td style="font-size:12px">
          <div style="font-weight:600">${formatDateShort(h.visit_date)}</div>
          <div style="color:var(--gray)">${h.visit_time||''}</div>
        </td>
        <td style="font-size:11px;color:var(--gray)">${h.petugas_name||'Belum assign'}</td>
        <td>
          <select style="border:none;background:${col}20;color:${col};font-size:11px;font-weight:700;border-radius:8px;padding:3px 8px;cursor:pointer"
            onchange="updateHCStatus(${h.id},this.value)">
            ${HC_STATUSES.map(s=>`<option${h.status===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px;font-weight:600">${h.total_fee?formatCurrency(h.total_fee):'—'}</td>
        <td><div class="act-row">
          <button class="act-btn edit" onclick="openHCForm(${h.id})">✏️</button>
          <button class="act-btn del" onclick="deleteHC(${h.id})">🗑</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

function switchHCTab(tab, btn) {
  document.querySelectorAll('#hc-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('hc-orders').style.display = tab==='orders'?'block':'none';
  document.getElementById('hc-schedule').style.display = tab==='schedule'?'block':'none';
  if (tab==='schedule') renderHCSchedule();
}

function renderHCSchedule() {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = hcAll.filter(h=>h.visit_date===today);
  const el = document.getElementById('hc-schedule');
  if (!el) return;
  if (!todayOrders.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">📅</div>
      <h3>Tidak ada jadwal hari ini</h3></div>`; return;
  }
  el.innerHTML = todayOrders.sort((a,b)=>(a.visit_time||'').localeCompare(b.visit_time||'')).map(h=>`
    <div class="card" style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px">
      <div style="background:var(--teal);color:#fff;border-radius:8px;padding:8px 12px;text-align:center;min-width:60px;flex-shrink:0">
        <div style="font-size:16px;font-weight:800">${h.visit_time||'—'}</div>
      </div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:var(--navy)">${h.patient_name}</div>
        <div style="font-size:12px;color:var(--gray)">${h.address||'—'}</div>
        <div style="font-size:12px;color:var(--gray)">${h.services||''}</div>
        <div style="font-size:11px;color:var(--teal);margin-top:4px">👤 ${h.petugas_name||'Belum assign'}</div>
      </div>
      <span style="font-size:11px;font-weight:700;color:#fff;background:var(--teal);padding:3px 10px;border-radius:10px">${h.status}</span>
    </div>`).join('');
}

async function openHCForm(id=null) {
  let h = {};
  if (id) { const d = await sbGet('homecare_orders',`select=*&id=eq.${id}`); h=d[0]||{}; }
  const today = new Date().toISOString().split('T')[0];
  const orderNum = `HC/${Date.now().toString().slice(-6)}`;

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Order':'🏠 Order Home Care Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nama Pasien *</label>
        <input type="text" id="hf-patient" value="${h.patient_name||''}" placeholder="Nama lengkap pasien">
      </div>
      <div class="form-group">
        <label>No. HP / WA</label>
        <input type="text" id="hf-phone" value="${h.phone||''}" placeholder="08xx">
      </div>
      <div class="form-group">
        <label>Tanggal Lahir</label>
        <input type="date" id="hf-dob" value="${h.date_of_birth||''}">
      </div>
      <div class="form-group">
        <label>Jenis Kelamin</label>
        <select id="hf-gender">
          <option${(h.gender||'')===''?' selected':''}>Pilih...</option>
          <option${h.gender==='L'?' selected':''} value="L">Laki-laki</option>
          <option${h.gender==='P'?' selected':''} value="P">Perempuan</option>
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat Kunjungan *</label>
        <input type="text" id="hf-addr" value="${h.address||''}" placeholder="Alamat lengkap">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Layanan yang Diminta</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;border:1px solid var(--border);border-radius:8px">
          ${HC_SERVICES.map(s=>`
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
              <input type="checkbox" value="${s}" ${(h.services||'').includes(s)?'checked':''} 
                style="accent-color:var(--teal)">${s}
            </label>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Tanggal Kunjungan</label>
        <input type="date" id="hf-date" value="${h.visit_date||today}">
      </div>
      <div class="form-group">
        <label>Jam Kunjungan</label>
        <input type="time" id="hf-time" value="${h.visit_time||'08:00'}">
      </div>
      <div class="form-group">
        <label>Petugas / Analis</label>
        <input type="text" id="hf-petugas" value="${h.petugas_name||''}" placeholder="Nama perawat/analis">
      </div>
      <div class="form-group">
        <label>Total Biaya (Rp)</label>
        <input type="number" id="hf-fee" value="${h.total_fee||''}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="hf-status">
          ${HC_STATUSES.map(s=>`<option${(h.status||'Baru')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Catatan Klinis / Instruksi</label>
        <textarea id="hf-notes" rows="2" placeholder="Kondisi khusus pasien, instruksi dokter...">${h.notes||''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveHC(${id||'null'})">💾 Simpan Order</button>
    </div>`);
}

async function saveHC(id) {
  const patient = document.getElementById('hf-patient').value.trim();
  if (!patient) { toast('Nama pasien wajib diisi','err'); return; }
  const svcs = Array.from(document.querySelectorAll('input[type=checkbox]:checked')).map(c=>c.value).join(',');
  const payload = {
    order_number: id ? undefined : `HC/${Date.now().toString().slice(-6)}`,
    patient_name: patient,
    phone: document.getElementById('hf-phone').value.trim(),
    date_of_birth: document.getElementById('hf-dob').value||null,
    gender: document.getElementById('hf-gender').value,
    address: document.getElementById('hf-addr').value.trim(),
    services: svcs,
    visit_date: document.getElementById('hf-date').value,
    visit_time: document.getElementById('hf-time').value,
    petugas_name: document.getElementById('hf-petugas').value.trim(),
    total_fee: parseFloat(document.getElementById('hf-fee').value)||0,
    status: document.getElementById('hf-status').value,
    notes: document.getElementById('hf-notes').value.trim(),
    created_by_name: getUserName(),
    updated_at: new Date().toISOString(),
  };
  if (id) delete payload.order_number;
  try {
    if (id) { await sbPatch('homecare_orders',id,payload); toast('✅ Order diupdate','ok'); }
    else { await sbPost('homecare_orders',payload); toast('✅ Order dibuat','ok'); }
    closeModalForce(); await loadHC();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function updateHCStatus(id, status) {
  try {
    await sbPatch('homecare_orders',id,{status,updated_at:new Date().toISOString()});
    const idx = hcAll.findIndex(h=>h.id===id);
    if (idx>=0) hcAll[idx].status = status;
    updateHCCounts();
    toast(`✅ Status → ${status}`,'ok');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteHC(id) {
  if (!confirm('Hapus order ini?')) return;
  try { await sbDelete('homecare_orders',id); toast('🗑 Order dihapus','info'); await loadHC(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}
