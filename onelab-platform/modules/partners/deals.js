// ═══════════════════════════════════════════
// PARTNER SUB-MODULE: Deals / Kerjasama
// ═══════════════════════════════════════════

const DEAL_TYPES = [
  { key:'MCU',          label:'🏥 MCU Karyawan',        color:'#0EA5E9' },
  { key:'Wellness',     label:'💪 Program Wellness',     color:'#22C55E' },
  { key:'Branding',     label:'📣 Branding Platform',    color:'#8B5CF6' },
  { key:'OfficeCare',   label:'🏢 Office Care',          color:'#F97316' },
  { key:'HomeCare',     label:'🏠 Home Care',            color:'#EF4444' },
  { key:'Personal',     label:'👤 Personal Health',      color:'#EC4899' },
  { key:'LabDiagnostic',label:'🔬 Lab Diagnostik',       color:'#14B8A6' },
  { key:'Screening',    label:'🎯 Skrining Massal',      color:'#F59E0B' },
  { key:'HealthDay',    label:'📅 Employee Health Day',  color:'#6366F1' },
  { key:'Lainnya',      label:'📋 Lainnya',              color:'#94A3B8' },
];

const DEAL_FREQ = ['Sekali','Per Event','Bulanan','Kuartalan','Tahunan','Ongoing'];

async function openDealsModal(partnerId, partnerName) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">🤝 Kerjasama — ${partnerName}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="margin-bottom:14px;display:flex;justify-content:flex-end">
      <button class="btn btn-teal btn-sm" onclick="openDealForm(${partnerId},null)">+ Tambah Kerjasama</button>
    </div>
    <div id="deals-list-${partnerId}">
      <div class="loading-row"><div class="spinner"></div></div>
    </div>`);

  await loadDeals(partnerId);
}

async function loadDeals(partnerId) {
  try {
    const data = await sbGet('partner_deals',
      `select=*&partner_id=eq.${partnerId}&order=created_at.desc`);
    renderDealsList(partnerId, Array.isArray(data)?data:[]);
  } catch(e) {
    document.getElementById(`deals-list-${partnerId}`).innerHTML =
      `<div class="status-box status-err">❌ ${e.message}</div>`;
  }
}

function renderDealsList(partnerId, deals) {
  const el = document.getElementById(`deals-list-${partnerId}`);
  if (!el) return;

  if (!deals.length) {
    el.innerHTML=`<div class="empty-state" style="padding:30px">
      <div class="ico">🤝</div>
      <h3>Belum ada kerjasama</h3>
      <p>Klik "+ Tambah Kerjasama" untuk mencatat output kerjasama.</p>
    </div>`;
    return;
  }

  const totalValue = deals.filter(d=>d.status==='Active').reduce((s,d)=>s+(d.value||0),0);

  el.innerHTML = `
    <div style="background:var(--mint);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;color:var(--gray)">Total Nilai Aktif</div>
        <div style="font-size:18px;font-weight:800;color:var(--navy)">${formatCurrency(totalValue)}</div>
      </div>
      <div style="font-size:12px;color:var(--gray)">${deals.filter(d=>d.status==='Active').length} dari ${deals.length} aktif</div>
    </div>
    ${deals.map(d => {
      const dt = DEAL_TYPES.find(t=>t.key===d.deal_type)||{color:'#94A3B8',label:d.deal_type||'—'};
      const stColor = d.status==='Active'?'#22C55E':d.status==='Inactive'?'#94A3B8':'#EF4444';
      return `
        <div style="border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;border-left:4px solid ${dt.color}">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:4px">${d.deal_name}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                <span style="background:${dt.color}20;color:${dt.color};padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700">${dt.label}</span>
                <span style="background:${stColor}20;color:${stColor};padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700">${d.status}</span>
                ${d.frequency?`<span class="badge badge-gray" style="font-size:10px">${d.frequency}</span>`:''}
              </div>
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                ${d.value?`<div style="font-size:12px"><span style="color:var(--gray)">Nilai:</span> <strong>${formatCurrency(d.value)}</strong></div>`:''}
                ${d.start_date?`<div style="font-size:12px;color:var(--gray)">Mulai: ${formatDateShort(d.start_date)}</div>`:''}
                ${d.end_date?`<div style="font-size:12px;color:var(--gray)">Selesai: ${formatDateShort(d.end_date)}</div>`:''}
                ${d.pic_partner?`<div style="font-size:12px;color:var(--gray)">PIC: ${d.pic_partner}</div>`:''}
              </div>
              ${d.description?`<div style="font-size:12px;color:var(--gray);margin-top:6px">${d.description}</div>`:''}
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="act-btn edit" onclick="openDealForm(${d.partner_id},${d.id})">✏️</button>
              <button class="act-btn del" onclick="deleteDeal(${d.id},${d.partner_id})">🗑</button>
            </div>
          </div>
        </div>`;
    }).join('')}`;
}

async function openDealForm(partnerId, dealId=null) {
  let d = {};
  if (dealId) {
    const data = await sbGet('partner_deals',`select=*&id=eq.${dealId}`);
    d = data[0]||{};
  }

  // Keep deals modal open, use second overlay
  const existing = document.getElementById('deal-form-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'deal-form-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;max-width:520px;width:100%;padding:24px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div style="font-size:16px;font-weight:800;color:var(--navy)">${dealId?'✏️ Edit Kerjasama':'➕ Tambah Kerjasama'}</div>
        <button onclick="document.getElementById('deal-form-overlay').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--gray)">✕</button>
      </div>

      <div class="form-group">
        <label>Nama Kerjasama *</label>
        <input type="text" id="df-name" value="${d.deal_name||''}" placeholder="MCU Karyawan 2026, Health Day Mei...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipe Kerjasama *</label>
          <select id="df-type">
            ${DEAL_TYPES.map(t=>`<option value="${t.key}"${d.deal_type===t.key?' selected':''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="df-status">
            <option${d.status==='Active'||!d.status?' selected':''}>Active</option>
            <option${d.status==='Inactive'?' selected':''}>Inactive</option>
            <option${d.status==='Expired'?' selected':''}>Expired</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Nilai Kerjasama (Rp)</label>
          <input type="number" id="df-value" value="${d.value||''}" placeholder="0">
        </div>
        <div class="form-group">
          <label>Frekuensi</label>
          <select id="df-freq">
            <option value="">Pilih...</option>
            ${DEAL_FREQ.map(f=>`<option${d.frequency===f?' selected':''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tanggal Mulai</label>
          <input type="date" id="df-start" value="${d.start_date||''}">
        </div>
        <div class="form-group">
          <label>Tanggal Selesai</label>
          <input type="date" id="df-end" value="${d.end_date||''}">
        </div>
      </div>
      <div class="form-group">
        <label>PIC dari Partner</label>
        <input type="text" id="df-pic" value="${d.pic_partner||''}" placeholder="Nama kontak dari perusahaan partner">
      </div>
      <div class="form-group">
        <label>Deskripsi / Detail</label>
        <textarea id="df-desc" rows="3" placeholder="Detail kerjasama, jumlah peserta, lingkup layanan...">${d.description||''}</textarea>
      </div>
      <div class="form-group">
        <label>Catatan Internal</label>
        <textarea id="df-notes" rows="2" placeholder="Catatan tim OneLab...">${d.notes||''}</textarea>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <button class="btn btn-ghost" onclick="document.getElementById('deal-form-overlay').remove()">Batal</button>
        <button class="btn btn-teal" onclick="saveDeal(${partnerId},${dealId||'null'})">
          ${dealId?'💾 Simpan':'➕ Tambah'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

async function saveDeal(partnerId, dealId) {
  const name = document.getElementById('df-name').value.trim();
  const type = document.getElementById('df-type').value;
  if (!name) { toast('Nama kerjasama wajib diisi','err'); return; }

  const payload = {
    partner_id:  partnerId,
    deal_name:   name,
    deal_type:   type,
    status:      document.getElementById('df-status').value,
    value:       parseFloat(document.getElementById('df-value').value)||0,
    frequency:   document.getElementById('df-freq').value,
    start_date:  document.getElementById('df-start').value||null,
    end_date:    document.getElementById('df-end').value||null,
    pic_partner: document.getElementById('df-pic').value.trim(),
    description: document.getElementById('df-desc').value.trim(),
    notes:       document.getElementById('df-notes').value.trim(),
    updated_at:  new Date().toISOString(),
  };

  try {
    if (dealId) { await sbPatch('partner_deals',dealId,payload); toast('✅ Kerjasama diupdate','ok'); }
    else        { await sbPost('partner_deals',payload);         toast('✅ Kerjasama ditambahkan','ok'); }
    document.getElementById('deal-form-overlay')?.remove();
    await loadDeals(partnerId);
    // Update partner status to Aktif if adding first deal
    if (!dealId) await sbPatch('partners',partnerId,{status:'Aktif',updated_at:new Date().toISOString()});
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteDeal(dealId, partnerId) {
  if (!confirm('Hapus kerjasama ini?')) return;
  try {
    await sbDelete('partner_deals',dealId);
    toast('🗑 Kerjasama dihapus','info');
    await loadDeals(partnerId);
  } catch(e) { toast('❌ '+e.message,'err'); }
}
