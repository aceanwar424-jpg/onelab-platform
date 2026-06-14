// ═══════════════════════════════════════════
// MODULE: Home Care v2 — Complete
// ═══════════════════════════════════════════

const HC_SERVICES = [
  'Pengambilan Sampel Darah','Cek Gula Darah','Cek Kolesterol','Injeksi',
  'Perawatan Luka','Fisioterapi','Nebulizer','Cek Tekanan Darah',
  'EKG Home Visit','Paket MCU Home','Konsultasi Dokter','Lainnya'
];

const HC_STATUS = {
  'Baru':        {color:'#94A3B8',icon:'📋'},
  'Dikonfirmasi':{color:'#0EA5E9',icon:'✅'},
  'Dijadwalkan': {color:'#8B5CF6',icon:'📅'},
  'Dalam Perjalanan':{color:'#F97316',icon:'🚗'},
  'Sedang Dilayani':{color:'#22C55E',icon:'⚕️'},
  'Selesai':     {color:'#00897B',icon:'🎉'},
  'Dibatalkan':  {color:'#EF4444',icon:'❌'},
};

let hcAll = [];

async function renderHomeCare() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Home Care</h1>
        <p>Manajemen order layanan kunjungan rumah — jadwal, nakes, billing</p></div>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" onclick="renderHCReport()">📊 Laporan</button>
        <button class="btn btn-teal" onclick="openHCForm()">+ Order Baru</button>
      </div>
    </div>

    <!-- KPI -->
    <div id="hc-kpi" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px">
      <div class="loading-row" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="tabs" id="hc-tabs" style="margin-bottom:14px">
      <button class="tab-btn active" onclick="filterHCStatus('',this)">Semua</button>
      ${Object.entries(HC_STATUS).map(([s,v])=>
        `<button class="tab-btn" onclick="filterHCStatus('${s}',this)">${v.icon} ${s}</button>`
      ).join('')}
    </div>

    <!-- Search -->
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <input class="table-search" id="hc-q" placeholder="🔍 Cari nama pasien, nakes, layanan..."
        oninput="applyHCFilter()" style="flex:1">
      <input type="date" class="table-filter" id="hc-date" onchange="applyHCFilter()">
    </div>

    <div id="hc-list">
      <div class="loading-row"><div class="spinner"></div></div>
    </div>`;

  await loadHCOrders();
}

async function loadHCOrders() {
  try {
    const data = await sbGet('homecare_orders','select=*&order=scheduled_date.asc,created_at.desc');
    hcAll = Array.isArray(data) ? data : [];
    renderHCKPI();
    applyHCFilter();
  } catch(e) {
    document.getElementById('hc-list').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderHCKPI() {
  const el = document.getElementById('hc-kpi');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = hcAll.filter(o=>o.scheduled_date===today);
  const pending  = hcAll.filter(o=>['Baru','Dikonfirmasi'].includes(o.status)).length;
  const active   = hcAll.filter(o=>['Dijadwalkan','Dalam Perjalanan','Sedang Dilayani'].includes(o.status)).length;
  const done     = hcAll.filter(o=>o.status==='Selesai').length;
  const revenue  = hcAll.filter(o=>o.status==='Selesai').reduce((s,o)=>s+(o.total_amount||0),0);

  el.innerHTML = [
    {icon:'📋',val:hcAll.length,    label:'Total Order',   color:'#0A2342'},
    {icon:'📅',val:todayOrders.length,label:'Jadwal Hari Ini',color:'#8B5CF6'},
    {icon:'⏳',val:pending,         label:'Menunggu',      color:'#F59E0B'},
    {icon:'🔵',val:active,          label:'Aktif',         color:'#0EA5E9'},
    {icon:'✅',val:done,            label:'Selesai',       color:'#22C55E'},
    {icon:'💰',val:formatCurrency(revenue),label:'Revenue', color:'#00897B'},
  ].map(k=>`
    <div style="background:#fff;border-radius:10px;padding:12px;border:1px solid var(--border);
      border-left:4px solid ${k.color};text-align:center">
      <div style="font-size:20px">${k.icon}</div>
      <div style="font-size:16px;font-weight:800;color:${k.color}">${k.val}</div>
      <div style="font-size:10px;color:var(--gray)">${k.label}</div>
    </div>`).join('');
}

let hcActiveStatus = '';
function filterHCStatus(status, btn) {
  hcActiveStatus = status;
  document.querySelectorAll('#hc-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  applyHCFilter();
}

function applyHCFilter() {
  const q    = (document.getElementById('hc-q')?.value||'').toLowerCase();
  const date = document.getElementById('hc-date')?.value||'';
  const filtered = hcAll.filter(o=>
    (!hcActiveStatus || o.status===hcActiveStatus) &&
    (!q || (o.patient_name||'').toLowerCase().includes(q) ||
           (o.assigned_staff||'').toLowerCase().includes(q) ||
           (o.service_type||'').toLowerCase().includes(q) ||
           (o.order_number||'').toLowerCase().includes(q)) &&
    (!date || o.scheduled_date===date)
  );
  renderHCList(filtered);
}

function renderHCList(orders) {
  const el = document.getElementById('hc-list');
  if (!orders.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🏠</div>
      <h3>${hcAll.length?'Tidak ada hasil':'Belum ada order Home Care'}</h3>
      <p>Buat order baru untuk layanan kunjungan ke rumah pasien.</p>
      <button class="btn btn-teal" style="margin-top:12px" onclick="openHCForm()">+ Order Baru</button>
    </div>`; return;
  }

  el.innerHTML = `<div style="display:grid;gap:10px">
    ${orders.map(o=>{
      const st = HC_STATUS[o.status]||HC_STATUS['Baru'];
      const today = new Date().toISOString().split('T')[0];
      const isToday = o.scheduled_date===today;
      const isPast  = o.scheduled_date && o.scheduled_date<today && o.status!=='Selesai';

      return `<div class="card" style="padding:14px 16px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:44px;height:44px;border-radius:50%;background:${st.color}20;
            display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            ${st.icon}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--navy)">${o.patient_name||'—'}</div>
                <div style="font-size:12px;color:var(--gray);margin-top:2px">
                  📞 ${o.patient_phone||'—'} &nbsp;·&nbsp; 🩺 ${o.service_type||'—'}
                </div>
                <div style="font-size:11px;color:var(--gray);margin-top:2px">📍 ${(o.patient_address||'').substring(0,60)}${o.patient_address?.length>60?'...':''}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <span style="background:${st.color}20;color:${st.color};padding:3px 10px;
                  border-radius:10px;font-size:11px;font-weight:700">${o.status||'Baru'}</span>
                <div style="font-size:12px;font-weight:700;color:${isPast?'#EF4444':isToday?'#8B5CF6':'var(--navy)'};margin-top:4px">
                  ${isToday?'📅 HARI INI':''}${isPast?'⚠️ LEWAT':''}
                  ${o.scheduled_date?formatDateShort(o.scheduled_date):'Belum dijadwalkan'}
                  ${o.scheduled_time?' · '+o.scheduled_time:''}
                </div>
                ${o.assigned_staff?`<div style="font-size:11px;color:var(--gray)">👤 ${o.assigned_staff}</div>`:''}
                ${o.total_amount?`<div style="font-size:12px;font-weight:700;color:var(--teal)">${formatCurrency(o.total_amount)}</div>`:''}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div style="display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);flex-wrap:wrap">
          ${o.status==='Baru'?`<button class="btn btn-teal btn-sm" onclick="updateHCStatus(${o.id},'Dikonfirmasi')">✅ Konfirmasi</button>`:''}
          ${o.status==='Dikonfirmasi'?`<button class="btn btn-teal btn-sm" onclick="updateHCStatus(${o.id},'Dijadwalkan')">📅 Jadwalkan</button>`:''}
          ${o.status==='Dijadwalkan'?`<button class="btn btn-teal btn-sm" onclick="updateHCStatus(${o.id},'Dalam Perjalanan')">🚗 Berangkat</button>`:''}
          ${o.status==='Dalam Perjalanan'?`<button class="btn btn-teal btn-sm" onclick="updateHCStatus(${o.id},'Sedang Dilayani')">⚕️ Mulai Layanan</button>`:''}
          ${o.status==='Sedang Dilayani'?`<button class="btn btn-teal btn-sm" onclick="updateHCStatus(${o.id},'Selesai')">🎉 Selesai</button>`:''}
          ${o.patient_phone?`<button class="btn btn-outline btn-sm" onclick="window.open('https://wa.me/${(o.patient_phone||'').replace(/\D/g,'').replace(/^0/,'62')}','_blank')">💬 WA Pasien</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="openHCForm(${o.id})">✏️ Edit</button>
          ${o.status!=='Selesai'&&o.status!=='Dibatalkan'?`<button class="btn btn-ghost btn-sm" style="color:#EF4444" onclick="updateHCStatus(${o.id},'Dibatalkan')">Batal</button>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

async function updateHCStatus(id, status) {
  try {
    await sbPatch('homecare_orders', id, {status, updated_at: new Date().toISOString()});
    toast(`✅ Status → ${status}`,'ok');
    await loadHCOrders();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function openHCForm(id=null) {
  let o = {};
  if (id) { const d=await sbGet('homecare_orders',`select=*&id=eq.${id}`); o=d[0]||{}; }
  
  // Load partners for reference
  let partnerOpts = '<option value="">-- Dari Partner (opsional) --</option>';
  try {
    const pts=await sbGet('partners','select=id,partner_name&status=eq.Aktif&order=partner_name&limit=100');
    partnerOpts+=(pts||[]).map(p=>`<option value="${p.id}" ${o.partner_id==p.id?'selected':''}>${p.partner_name}</option>`).join('');
  } catch(e){}

  const user = getUserName?getUserName():'User';
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Order':'🏠 Order Home Care Baru'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Pasien *</label>
        <input type="text" id="hf-name" value="${o.patient_name||''}" placeholder="Nama lengkap pasien">
      </div>
      <div class="form-group">
        <label>No. HP / WA Pasien</label>
        <input type="text" id="hf-phone" value="${o.patient_phone||''}" placeholder="08xxxxxxxxxx">
      </div>
      <div class="form-group">
        <label>Tipe Layanan *</label>
        <select id="hf-service">
          ${HC_SERVICES.map(s=>`<option${o.service_type===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat Kunjungan *</label>
        <textarea id="hf-addr" rows="2" placeholder="Jl. ..., RT/RW, Kelurahan, Kecamatan">${o.patient_address||''}</textarea>
      </div>
      <div class="form-group">
        <label>Tanggal Kunjungan</label>
        <input type="date" id="hf-date" value="${o.scheduled_date||today}">
      </div>
      <div class="form-group">
        <label>Jam Kunjungan</label>
        <input type="time" id="hf-time" value="${o.scheduled_time||'08:00'}">
      </div>
      <div class="form-group">
        <label>Nakes / Tim yang Bertugas</label>
        <input type="text" id="hf-staff" value="${o.assigned_staff||''}" placeholder="Nama perawat/analis">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="hf-status">
          ${Object.keys(HC_STATUS).map(s=>`<option${(o.status||'Baru')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tarif Layanan (Rp)</label>
        <input type="number" id="hf-amount" value="${o.total_amount||''}" placeholder="0">
      </div>
      <div class="form-group">
        <label>Referral Partner</label>
        <select id="hf-partner">${partnerOpts}</select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Catatan</label>
        <textarea id="hf-notes" rows="2" placeholder="Kondisi pasien, alat yang dibawa, instruksi khusus...">${o.notes||''}</textarea>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveHCOrder(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveHCOrder(id) {
  const name = document.getElementById('hf-name').value.trim();
  const addr = document.getElementById('hf-addr').value.trim();
  const svc  = document.getElementById('hf-service').value;
  if (!name) { toast('Nama pasien wajib diisi','err'); return; }
  if (!addr) { toast('Alamat wajib diisi','err'); return; }

  const user = getUserName?getUserName():'User';
  const num  = id ? '' : `HC-${Date.now().toString().slice(-6)}`;

  const payload = {
    patient_name:    name,
    patient_phone:   document.getElementById('hf-phone').value.trim(),
    patient_address: addr,
    service_type:    svc,
    scheduled_date:  document.getElementById('hf-date').value||null,
    scheduled_time:  document.getElementById('hf-time').value||null,
    assigned_staff:  document.getElementById('hf-staff').value.trim(),
    status:          document.getElementById('hf-status').value,
    total_amount:    parseFloat(document.getElementById('hf-amount').value)||0,
    partner_id:      parseInt(document.getElementById('hf-partner').value)||null,
    notes:           document.getElementById('hf-notes').value.trim(),
    created_by_name: user,
    updated_at:      new Date().toISOString(),
    ...(num ? {order_number:num} : {}),
  };

  try {
    if (id) {
      await sbPatch('homecare_orders',id,payload);
      toast('✅ Order diupdate','ok');
    } else {
      const res=await sbPost('homecare_orders',payload);
      await logActivity('create','homecare_orders',res[0]?.id,`Order HC baru: ${name}`,name);
      toast('✅ Order dibuat','ok');
    }
    closeModalForce();
    await loadHCOrders();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function renderHCReport() {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0,7);
  const byStaff = {};
  hcAll.filter(o=>o.status==='Selesai').forEach(o=>{
    const n=o.assigned_staff||'Tidak Ditugaskan';
    byStaff[n]=(byStaff[n]||0)+(o.total_amount||0);
  });

  openModal(`
    <div class="modal-header">
      <div class="modal-title">📊 Laporan Home Care</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
      ${[
        {label:'Total Order',val:hcAll.length,color:'var(--navy)'},
        {label:'Selesai',val:hcAll.filter(o=>o.status==='Selesai').length,color:'#22C55E'},
        {label:'Dibatalkan',val:hcAll.filter(o=>o.status==='Dibatalkan').length,color:'#EF4444'},
        {label:'Total Revenue',val:formatCurrency(hcAll.filter(o=>o.status==='Selesai').reduce((s,o)=>s+(o.total_amount||0),0)),color:' var(--teal)'},
      ].map(k=>`<div style="background:var(--lgray);border-radius:8px;padding:12px">
        <div style="font-size:18px;font-weight:800;color:${k.color}">${k.val}</div>
        <div style="font-size:11px;color:var(--gray)">${k.label}</div>
      </div>`).join('')}
    </div>
    <div class="card-title" style="margin-bottom:8px">Revenue per Nakes</div>
    ${Object.entries(byStaff).sort((a,b)=>b[1]-a[1]).map(([name,rev])=>`
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${name}</span>
        <span style="font-size:13px;font-weight:700;color:var(--teal)">${formatCurrency(rev)}</span>
      </div>`).join('')||'<div style="color:var(--gray);font-size:13px">Belum ada data</div>'}
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Tutup</button>
    </div>`);
}
