// ═══════════════════════════════════════════
// MODULE: Inventory & Logistik
// - Master Item, Stock, PR/PO, Supplier
// ═══════════════════════════════════════════

const INV_CATS = ['Reagen Lab','APD','Alat Kesehatan','ATK','Bahan Habis Pakai','Obat & Farmasi','Peralatan','Lainnya'];
const PR_STATUSES = ['Draft','Menunggu Approval','Approved','PO Dibuat','Rejected'];
const PO_STATUSES = ['Draft','Dikirim ke Supplier','Sebagian Diterima','Diterima Lengkap','Cancelled'];

let invItems=[], invPRs=[], invSuppliers=[];

async function renderInventory() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Inventory & Logistik</h1>
        <p>Master item, stok reagen & APD, Purchase Request, dan supplier</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" id="inv-add-btn" onclick="openItemForm()">+ Tambah Item</button>
      </div>
    </div>
    <div class="tabs" id="inv-tabs">
      <button class="tab-btn active" onclick="switchInvTab('stock',this)">📦 Master Stok</button>
      <button class="tab-btn" onclick="switchInvTab('pr',this)">🛒 Purchase Request</button>
      <button class="tab-btn" onclick="switchInvTab('supplier',this)">🏭 Supplier</button>
    </div>

    <!-- Stock alerts -->
    <div id="inv-alerts" style="margin-bottom:12px"></div>

    <div id="inv-stock">
      <div class="table-toolbar">
        <input class="table-search" id="inv-q" placeholder="🔍 Cari nama item, kode..."
          oninput="filterInvItems()" style="flex:1">
        <select class="table-filter" id="inv-cat-f" onchange="filterInvItems()">
          <option value="">Semua Kategori</option>
          ${INV_CATS.map(c=>`<option>${c}</option>`).join('')}
        </select>
        <select class="table-filter" id="inv-stock-f" onchange="filterInvItems()">
          <option value="">Semua Stok</option>
          <option value="low">⚠️ Stok Rendah</option>
          <option value="out">❌ Habis</option>
        </select>
      </div>
      <div id="inv-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>
    <div id="inv-pr" style="display:none"></div>
    <div id="inv-supplier" style="display:none"></div>`;

  await loadInventory();
}

async function loadInventory() {
  try {
    const [items, prs, suppliers] = await Promise.all([
      sbGet('inventory_items','select=*&order=item_name'),
      sbGet('purchase_requests','select=*&order=created_at.desc'),
      sbGet('suppliers','select=*&order=supplier_name'),
    ]);
    invItems = Array.isArray(items)?items:[];
    invPRs   = Array.isArray(prs)?prs:[];
    invSuppliers = Array.isArray(suppliers)?suppliers:[];
    renderStockAlerts();
    filterInvItems();
  } catch(e) {
    document.getElementById('inv-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderStockAlerts() {
  const lowStock = invItems.filter(i=>(i.stock_qty||0) <= (i.min_stock||5) && (i.stock_qty||0) > 0);
  const outStock  = invItems.filter(i=>(i.stock_qty||0) === 0);
  const el = document.getElementById('inv-alerts');
  if (!el) return;
  let html = '';
  if (outStock.length) html += `<div class="status-box status-err" style="margin-bottom:8px">❌ <strong>${outStock.length} item habis:</strong> ${outStock.slice(0,3).map(i=>i.item_name).join(', ')}${outStock.length>3?'...':''}</div>`;
  if (lowStock.length) html += `<div class="status-box" style="background:#FFF8E1;border-color:#F59E0B;margin-bottom:8px">⚠️ <strong>${lowStock.length} item stok rendah:</strong> ${lowStock.slice(0,3).map(i=>i.item_name).join(', ')}${lowStock.length>3?'...':''}</div>`;
  el.innerHTML = html;
}

function filterInvItems() {
  const q   = (document.getElementById('inv-q')?.value||'').toLowerCase();
  const cat = document.getElementById('inv-cat-f')?.value||'';
  const stk = document.getElementById('inv-stock-f')?.value||'';
  const filtered = invItems.filter(i=>
    (!q || (i.item_name||'').toLowerCase().includes(q) || (i.item_code||'').toLowerCase().includes(q)) &&
    (!cat || i.category===cat) &&
    (!stk || (stk==='low' && (i.stock_qty||0)<=(i.min_stock||5) && (i.stock_qty||0)>0) ||
             (stk==='out' && (i.stock_qty||0)===0))
  );
  renderStockTable(filtered);
}

function renderStockTable(data) {
  const el = document.getElementById('inv-tbody');
  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">📦</div>
      <h3>${invItems.length?'Tidak ada hasil':'Belum ada item'}</h3>
      <p>Tambah master item untuk mulai tracking stok.</p></div>`; return;
  }
  el.innerHTML = `<table>
    <thead><tr>
      <th>Kode</th><th>Nama Item</th><th>Kategori</th><th>Satuan</th>
      <th>Stok</th><th>Min Stok</th><th>Harga/Unit</th><th>Supplier</th><th>Aksi</th>
    </tr></thead>
    <tbody>${data.map(i=>{
      const stockPct = i.min_stock>0 ? Math.min(100,(i.stock_qty||0)/i.min_stock*100) : 100;
      const stockCol = (i.stock_qty||0)===0?'#EF4444':(i.stock_qty||0)<=(i.min_stock||5)?'#F59E0B':'#22C55E';
      return `<tr>
        <td style="font-size:11px;font-family:monospace;color:var(--teal)">${i.item_code||'—'}</td>
        <td>
          <div style="font-weight:600;color:var(--text)">${i.item_name}</div>
          <div style="font-size:11px;color:var(--text3)">${i.description||''}</div>
        </td>
        <td><span class="badge badge-gray" style="font-size:10px">${i.category||'—'}</span></td>
        <td style="font-size:12px">${i.unit||'—'}</td>
        <td>
          <div style="font-weight:700;color:${stockCol};font-size:14px">${i.stock_qty||0}</div>
          <div style="background:var(--lgray);height:4px;border-radius:2px;margin-top:3px;width:60px">
            <div style="background:${stockCol};height:4px;width:${stockPct}%;border-radius:2px"></div>
          </div>
        </td>
        <td style="font-size:12px;color:var(--text3)">${i.min_stock||5}</td>
        <td style="font-size:12px">${i.unit_price?formatCurrency(i.unit_price):'—'}</td>
        <td style="font-size:11px;color:var(--text3)">${i.supplier_name||'—'}</td>
        <td><div class="act-row">
          <button class="act-btn" onclick="adjustStock(${i.id},'${i.item_name}',${i.stock_qty||0})">📥 Adjust</button>
          <button class="act-btn edit" onclick="openItemForm(${i.id})">✏️</button>
          <button class="act-btn del" onclick="deleteItem(${i.id})">🗑</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

function switchInvTab(tab, btn) {
  document.querySelectorAll('#inv-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['stock','pr','supplier'].forEach(t=>{
    const el = document.getElementById(`inv-${t}`);
    if (el) el.style.display = t===tab?'block':'none';
  });
  const addBtn = document.getElementById('inv-add-btn');
  if (addBtn) {
    if (tab==='stock')    { addBtn.textContent='+ Tambah Item'; addBtn.onclick=openItemForm; }
    if (tab==='pr')       { addBtn.textContent='+ Buat PR'; addBtn.onclick=openPRForm; renderPRList(); }
    if (tab==='supplier') { addBtn.textContent='+ Tambah Supplier'; addBtn.onclick=openSupplierForm; renderSupplierList(); }
  }
}

// ── Stock Adjustment ──────────────────────
function adjustStock(id, name, current) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">📥 Adjust Stok — ${name}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Jenis Penyesuaian</label>
      <select id="adj-type" style="font-size:14px">
        <option value="in">Masuk (Penerimaan / GR)</option>
        <option value="out">Keluar (Pemakaian)</option>
        <option value="set">Set Manual (Opname)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Jumlah</label>
      <input type="number" id="adj-qty" value="" placeholder="0" style="font-size:18px;font-weight:700;text-align:center">
      <div style="font-size:12px;color:var(--text3);margin-top:4px">Stok saat ini: <strong>${current}</strong></div>
    </div>
    <div class="form-group">
      <label>Keterangan</label>
      <input type="text" id="adj-note" placeholder="Penerimaan PO, pemakaian MCU, dll">
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveStockAdj(${id},${current})">✅ Simpan</button>
    </div>`);
}

async function saveStockAdj(id, current) {
  const type = document.getElementById('adj-type').value;
  const qty  = parseFloat(document.getElementById('adj-qty').value)||0;
  const note = document.getElementById('adj-note').value.trim();
  let newQty = current;
  if (type==='in')  newQty = current + qty;
  if (type==='out') newQty = Math.max(0, current - qty);
  if (type==='set') newQty = qty;
  try {
    await sbPatch('inventory_items',id,{stock_qty:newQty,updated_at:new Date().toISOString()});
    await logActivity('stock_adj','inventory_items',id,`Stok disesuaikan: ${current} → ${newQty} (${note})`,note);
    toast(`✅ Stok diupdate → ${newQty}`,'ok');
    closeModalForce(); await loadInventory();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Item Form ─────────────────────────────
async function openItemForm(id=null) {
  let item = {};
  if (id) { const d = await sbGet('inventory_items',`select=*&id=eq.${id}`); item=d[0]||{}; }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Item':'📦 Tambah Item'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Kode Item</label>
        <input type="text" id="if-code" value="${item.item_code||''}" placeholder="REG-001">
      </div>
      <div class="form-group">
        <label>Kategori</label>
        <select id="if-cat">
          ${INV_CATS.map(c=>`<option${item.category===c?' selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Item *</label>
        <input type="text" id="if-name" value="${item.item_name||''}" placeholder="Nama reagen, APD, dll">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Deskripsi / Spesifikasi</label>
        <input type="text" id="if-desc" value="${item.description||''}" placeholder="Merk, ukuran, spesifikasi...">
      </div>
      <div class="form-group">
        <label>Satuan</label>
        <select id="if-unit">
          ${['pcs','box','botol','tube','pack','strip','liter','ml','gram','kg','set'].map(u=>`<option${item.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Stok Awal</label>
        <input type="number" id="if-stock" value="${item.stock_qty||0}">
      </div>
      <div class="form-group">
        <label>Min Stok (alert)</label>
        <input type="number" id="if-min" value="${item.min_stock||5}">
      </div>
      <div class="form-group">
        <label>Harga per Unit (Rp)</label>
        <input type="number" id="if-price" value="${item.unit_price||''}">
      </div>
      <div class="form-group">
        <label>Supplier Utama</label>
        <input type="text" id="if-supplier" value="${item.supplier_name||''}" placeholder="Nama supplier">
      </div>
      <div class="form-group">
        <label>Lokasi Penyimpanan</label>
        <input type="text" id="if-location" value="${item.location||''}" placeholder="Rak A-3, Kulkas 2...">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveItem(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveItem(id) {
  const name = document.getElementById('if-name').value.trim();
  if (!name) { toast('Nama item wajib diisi','err'); return; }
  const payload = {
    item_code: document.getElementById('if-code').value.trim(),
    category:  document.getElementById('if-cat').value,
    item_name: name,
    description: document.getElementById('if-desc').value.trim(),
    unit: document.getElementById('if-unit').value,
    stock_qty: parseFloat(document.getElementById('if-stock').value)||0,
    min_stock: parseFloat(document.getElementById('if-min').value)||5,
    unit_price: parseFloat(document.getElementById('if-price').value)||0,
    supplier_name: document.getElementById('if-supplier').value.trim(),
    location: document.getElementById('if-location').value.trim(),
    updated_at: new Date().toISOString(),
  };
  try {
    if (id) { await sbPatch('inventory_items',id,payload); toast('✅ Item diupdate','ok'); }
    else { await sbPost('inventory_items',payload); toast('✅ Item ditambahkan','ok'); }
    closeModalForce(); await loadInventory();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteItem(id) {
  if (!confirm('Hapus item ini?')) return;
  try { await sbDelete('inventory_items',id); toast('🗑 Dihapus','info'); await loadInventory(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── PR List & Form ────────────────────────
function renderPRList() {
  const el = document.getElementById('inv-pr');
  if (!el) return;
  if (!invPRs.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🛒</div>
      <h3>Belum ada Purchase Request</h3>
      <p>Buat PR untuk permintaan pengadaan barang.</p></div>`; return;
  }
  const stColors = {'Draft':'#94A3B8','Menunggu Approval':'#F59E0B','Approved':'#22C55E','PO Dibuat':'#06B6D4','Rejected':'#EF4444'};
  el.innerHTML = `<table>
    <thead><tr><th>No. PR</th><th>Deskripsi</th><th>Total Est.</th><th>Diminta Oleh</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${invPRs.map(p=>{
      const col = stColors[p.status]||'#94A3B8';
      return `<tr>
        <td style="font-family:monospace;font-size:11px;color:var(--teal)">${p.pr_number||'—'}</td>
        <td><div style="font-weight:600">${p.description||'—'}</div>
          <div style="font-size:11px;color:var(--text3)">${formatDateShort(p.created_at)}</div></td>
        <td style="font-size:12px;font-weight:600">${p.total_estimate?formatCurrency(p.total_estimate):'—'}</td>
        <td style="font-size:11px">${p.requested_by||'—'}</td>
        <td><span style="background:${col}20;color:${col};padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700">${p.status}</span></td>
        <td><div class="act-row">
          <button class="act-btn edit" onclick="openPRForm(${p.id})">✏️</button>
          ${p.status==='Menunggu Approval'&&getUserRole()==='super_admin'?`
            <button class="act-btn" onclick="approvePR(${p.id})" style="color:#22C55E">✅</button>
            <button class="act-btn" onclick="rejectPR(${p.id})" style="color:#EF4444">❌</button>`:'' }
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;
}

async function openPRForm(id=null) {
  let p = {};
  if (id) { const d = await sbGet('purchase_requests',`select=*&id=eq.${id}`); p=d[0]||{}; }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit PR':'🛒 Buat Purchase Request'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Deskripsi Kebutuhan *</label>
      <textarea id="pf-desc" rows="2" placeholder="Kebutuhan pengadaan reagen, APD, dll...">${p.description||''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tanggal Dibutuhkan</label>
        <input type="date" id="pf-needed" value="${p.needed_date||''}">
      </div>
      <div class="form-group">
        <label>Estimasi Total (Rp)</label>
        <input type="number" id="pf-total" value="${p.total_estimate||''}">
      </div>
    </div>
    <div class="form-group">
      <label>Detail Item (satu per baris: Nama | Qty | Satuan | Harga)</label>
      <textarea id="pf-items" rows="5"
        placeholder="Reagen HbA1c | 10 | box | 500000&#10;APD Level 2 | 50 | pcs | 25000">${p.items_detail||''}</textarea>
    </div>
    <div class="form-group">
      <label>Alasan / Justifikasi</label>
      <textarea id="pf-reason" rows="2" placeholder="Alasan pengadaan...">${p.reason||''}</textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="savePR(${id||'null'})">📤 Submit PR</button>
    </div>`);
}

async function savePR(id) {
  const desc = document.getElementById('pf-desc').value.trim();
  if (!desc) { toast('Deskripsi wajib diisi','err'); return; }
  const payload = {
    pr_number: id ? undefined : `PR/${new Date().getFullYear()}/${Date.now().toString().slice(-5)}`,
    description: desc,
    needed_date: document.getElementById('pf-needed').value||null,
    total_estimate: parseFloat(document.getElementById('pf-total').value)||0,
    items_detail: document.getElementById('pf-items').value.trim(),
    reason: document.getElementById('pf-reason').value.trim(),
    status: 'Menunggu Approval',
    requested_by: getUserName(),
    updated_at: new Date().toISOString(),
  };
  if (id) delete payload.pr_number;
  try {
    if (id) { await sbPatch('purchase_requests',id,payload); toast('✅ PR diupdate','ok'); }
    else { await sbPost('purchase_requests',payload); toast('✅ PR disubmit untuk approval','ok'); }
    closeModalForce(); await loadInventory();
    switchInvTab('pr', document.querySelector('#inv-tabs .tab-btn:nth-child(2)'));
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function approvePR(id) {
  if (!confirm('Approve PR ini?')) return;
  try { await sbPatch('purchase_requests',id,{status:'Approved',approved_by:getUserName(),updated_at:new Date().toISOString()}); toast('✅ PR Approved','ok'); await loadInventory(); renderPRList(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}
async function rejectPR(id) {
  const reason = prompt('Alasan penolakan:');
  if (!reason) return;
  try { await sbPatch('purchase_requests',id,{status:'Rejected',reject_reason:reason,updated_at:new Date().toISOString()}); toast('❌ PR Rejected','info'); await loadInventory(); renderPRList(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Supplier ──────────────────────────────
function renderSupplierList() {
  const el = document.getElementById('inv-supplier');
  if (!el) return;
  if (!invSuppliers.length) {
    el.innerHTML = `<div class="empty-state"><div class="ico">🏭</div>
      <h3>Belum ada supplier</h3></div>`; return;
  }
  el.innerHTML = `<table>
    <thead><tr><th>Nama Supplier</th><th>Kontak</th><th>Kategori Item</th><th>Rating</th><th>Aksi</th></tr></thead>
    <tbody>${invSuppliers.map(s=>`<tr>
      <td><div style="font-weight:600;color:var(--text)">${s.supplier_name}</div><div style="font-size:11px;color:var(--text3)">${s.address||''}</div></td>
      <td><div style="font-size:12px">${s.contact_name||'—'}</div><div style="font-size:11px;color:var(--text3)">${s.phone||''}</div></td>
      <td style="font-size:12px">${s.item_categories||'—'}</td>
      <td>${'⭐'.repeat(Math.min(5,parseInt(s.rating)||0))||'—'}</td>
      <td><div class="act-row">
        <button class="act-btn edit" onclick="openSupplierForm(${s.id})">✏️</button>
        <button class="act-btn del" onclick="deleteSupplier(${s.id})">🗑</button>
      </div></td>
    </tr>`).join('')}</tbody></table>`;
}

async function openSupplierForm(id=null) {
  let s = {};
  if (id) { const d = await sbGet('suppliers',`select=*&id=eq.${id}`); s=d[0]||{}; }
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${id?'✏️ Edit Supplier':'🏭 Tambah Supplier'}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group" style="grid-column:1/-1">
        <label>Nama Supplier *</label>
        <input type="text" id="sf2-name" value="${s.supplier_name||''}" placeholder="PT. Supplier ABC">
      </div>
      <div class="form-group"><label>Nama Kontak</label><input type="text" id="sf2-contact" value="${s.contact_name||''}"></div>
      <div class="form-group"><label>No. HP / WA</label><input type="text" id="sf2-phone" value="${s.phone||''}"></div>
      <div class="form-group"><label>Email</label><input type="email" id="sf2-email" value="${s.email||''}"></div>
      <div class="form-group"><label>Rating (1-5)</label><input type="number" id="sf2-rating" value="${s.rating||''}" min="1" max="5"></div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Alamat</label><input type="text" id="sf2-addr" value="${s.address||''}">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Kategori Item yang Disupply</label>
        <input type="text" id="sf2-cats" value="${s.item_categories||''}" placeholder="Reagen, APD, Alkes">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>Catatan</label>
        <textarea id="sf2-notes" rows="2">${s.notes||''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveSupplier(${id||'null'})">💾 Simpan</button>
    </div>`);
}

async function saveSupplier(id) {
  const name = document.getElementById('sf2-name').value.trim();
  if (!name) { toast('Nama supplier wajib diisi','err'); return; }
  const payload = {
    supplier_name: name,
    contact_name: document.getElementById('sf2-contact').value.trim(),
    phone: document.getElementById('sf2-phone').value.trim(),
    email: document.getElementById('sf2-email').value.trim(),
    rating: parseFloat(document.getElementById('sf2-rating').value)||null,
    address: document.getElementById('sf2-addr').value.trim(),
    item_categories: document.getElementById('sf2-cats').value.trim(),
    notes: document.getElementById('sf2-notes').value.trim(),
    updated_at: new Date().toISOString(),
  };
  try {
    if (id) { await sbPatch('suppliers',id,payload); toast('✅ Supplier diupdate','ok'); }
    else { await sbPost('suppliers',payload); toast('✅ Supplier ditambahkan','ok'); }
    closeModalForce(); await loadInventory(); renderSupplierList();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
async function deleteSupplier(id) {
  if (!confirm('Hapus supplier?')) return;
  try { await sbDelete('suppliers',id); toast('🗑 Dihapus','info'); await loadInventory(); renderSupplierList(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}
