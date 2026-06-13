async function renderSettings() {
  const role = getUserRole();
  const isSuperAdmin = role === 'super_admin';

  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Pengaturan</h1><p>Konfigurasi sistem, pengguna, dan koneksi</p></div>
    </div>

    <div class="tabs" id="set-tabs">
      <button class="tab-btn active" onclick="switchSetTab('general',this)">⚙️ Umum</button>
      <button class="tab-btn" onclick="switchSetTab('users',this)">👥 Pengguna</button>
      <button class="tab-btn" onclick="switchSetTab('activity',this)">📋 Log Aktivitas</button>
      <button class="tab-btn" onclick="switchSetTab('data',this)">🗄 Data</button>
      ${isSuperAdmin ? `<button class="tab-btn" onclick="switchSetTab('admin',this)">🔐 Super Admin</button>` : ''}
    </div>

    <div id="set-general">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:800px">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">🔗 Supabase</div>
          <div class="form-group">
            <label>Project URL</label>
            <input value="${SUPABASE_URL}" readonly style="background:var(--lgray);font-size:12px">
          </div>
          <div id="set-conn" class="status-box status-info" style="margin-bottom:10px">Memeriksa...</div>
          <button class="btn btn-teal btn-sm" onclick="checkSetConn()">🔄 Cek</button>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">🗺 Google Maps API</div>
          <div class="form-group">
            <label>API Key</label>
            <input type="password" id="set-maps-key" value="${localStorage.getItem('ol_maps_key')||''}" placeholder="AIza...">
          </div>
          <div class="btn-row">
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('set-maps-key').type=document.getElementById('set-maps-key').type==='password'?'text':'password'">👁</button>
            <button class="btn btn-teal btn-sm" onclick="saveSetMapsKey()">💾 Simpan</button>
          </div>
        </div>
        <div class="card" style="grid-column:1/-1">
          <div class="card-title" style="margin-bottom:14px">📊 Statistik Database</div>
          <div id="set-stats" class="loading-row"><div class="spinner"></div></div>
        </div>
      </div>
    </div>

    <div id="set-users" style="display:none">
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 Pengguna Terdaftar</div>
        </div>
        <div id="set-users-list" class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>

    <div id="set-activity" style="display:none">
      <div class="table-wrap">
        <div class="table-toolbar">
          <span style="font-size:13px;font-weight:700;color:var(--navy)">Log Aktivitas</span>
        </div>
        <div id="set-activity-list" class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>

    <div id="set-data" style="display:none">
      <div class="card" style="max-width:500px">
        <div class="card-title" style="margin-bottom:14px;color:var(--danger)">⚠️ Manajemen Data</div>
        <p style="font-size:13px;color:var(--gray);margin-bottom:14px">Tindakan berikut tidak dapat dibatalkan. Lakukan dengan hati-hati.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-danger btn-sm" onclick="exportAllData()">📥 Export Semua Data (Backup)</button>
        </div>
      </div>
    </div>

    <div id="set-admin" style="display:none">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px">

        <!-- User & Role -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">👤 User & Role Management</div>
          <p style="font-size:13px;color:var(--gray);margin-bottom:14px">Kelola akun, role, dan hak akses semua pengguna platform.</p>
          <button class="btn btn-teal" onclick="navigate('users')">🔑 Buka User Management</button>
        </div>

        <!-- Bulk Delete -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px;color:var(--danger)">🗑 Bulk Delete</div>
          <p style="font-size:13px;color:var(--gray);margin-bottom:14px">Hapus massal data untuk reset atau pembersihan. Tidak bisa dibatalkan.</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('partners')">Hapus Semua Partner</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('partner_deals')">Hapus Semua Kerjasama</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('vouchers')">Hapus Semua Voucher</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('voucher_campaigns')">Hapus Semua Campaign</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('marketing_templates')">Hapus Semua Template</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('outgoing_letters')">Hapus Arsip Surat</button>
            <button class="btn btn-danger btn-sm" onclick="bulkDeleteTable('activity_logs')">Bersihkan Activity Log</button>
          </div>
        </div>

        <!-- Reset Password -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">🔒 Keamanan</div>
          <p style="font-size:13px;color:var(--gray);margin-bottom:14px">Info akun aktif dan koneksi Supabase.</p>
          <div style="font-size:12px;background:var(--lgray);border-radius:8px;padding:10px 12px;margin-bottom:10px">
            <div><strong>User ID:</strong> <span id="admin-uid" style="color:var(--teal)">—</span></div>
            <div style="margin-top:4px"><strong>Role:</strong> <span id="admin-role" style="color:var(--navy)">—</span></div>
            <div style="margin-top:4px"><strong>Email:</strong> <span id="admin-email" style="color:var(--gray)">—</span></div>
          </div>
        </div>

        <!-- Email Confirmation Fix -->
        <div class="card">
          <div class="card-title" style="margin-bottom:12px">⚡ Quick Fix SQL</div>
          <p style="font-size:13px;color:var(--gray);margin-bottom:10px">SQL siap pakai untuk fix umum. Copy dan jalankan di Supabase SQL Editor.</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="copyAdminSQL('confirm_email')">📋 Fix Email Confirmation</button>
            <button class="btn btn-outline btn-sm" onclick="copyAdminSQL('disable_rls')">📋 Disable RLS semua tabel</button>
            <button class="btn btn-outline btn-sm" onclick="copyAdminSQL('check_tables')">📋 Check semua tabel</button>
          </div>
        </div>

      </div>
    </div>`;

  checkSetConn();
  loadSetStats();
  if (isSuperAdmin) loadAdminInfo();
}

function switchSetTab(tab, btn) {
  document.querySelectorAll('#set-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['general','users','activity','data','admin'].forEach(t=>{
    const el = document.getElementById(`set-${t}`);
    if (el) el.style.display = t===tab?'block':'none';
  });
  if(tab==='users') loadSetUsers();
  if(tab==='activity') loadSetActivity();
}

async function checkSetConn() {
  const el=document.getElementById('set-conn');
  if(!el)return;
  el.className='status-box status-info'; el.textContent='⏳ Memeriksa...';
  try {
    await sbGet('partners','select=count&limit=1');
    el.className='status-box status-ok'; el.textContent='✅ Supabase terhubung & normal.';
  } catch(e){
    el.className='status-box status-err'; el.textContent='❌ '+e.message;
  }
}

async function loadSetStats() {
  const el=document.getElementById('set-stats');
  if(!el)return;
  const tables=['partners','partner_deals','vouchers','voucher_campaigns','outgoing_letters','marketing_templates','activity_logs'];
  try {
    const counts=await Promise.all(tables.map(t=>sbGet(t,'select=count').catch(()=>[])));
    el.innerHTML=`<div style="display:flex;gap:10px;flex-wrap:wrap">
      ${tables.map((t,i)=>`
        <div style="text-align:center;padding:10px 14px;background:var(--lgray);border-radius:8px;min-width:100px">
          <div style="font-size:20px;font-weight:800;color:var(--navy)">${Array.isArray(counts[i])?counts[i].length:'?'}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px">${t.replace(/_/g,' ')}</div>
        </div>`).join('')}
    </div>`;
  } catch(e){ el.innerHTML='<span style="color:var(--gray);font-size:13px">Gagal load</span>'; }
}

async function loadSetUsers() {
  const el=document.getElementById('set-users-list');
  if(!el)return;
  try {
    const data=await sbGet('user_profiles','select=*&order=created_at.desc');
    el.innerHTML=(data&&data.length)?`
      <table>
        <thead><tr><th>Nama</th><th>Role</th><th>Bergabung</th></tr></thead>
        <tbody>${(data||[]).map(u=>`
          <tr><td><strong>${u.full_name||'—'}</strong></td>
              <td><span class="badge ${u.role==='admin'?'badge-teal':'badge-gray'}">${u.role||'sales'}</span></td>
              <td style="font-size:12px;color:var(--gray)">${formatDateShort(u.created_at)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`:
      '<div class="empty-state"><div class="ico">👥</div><h3>Belum ada pengguna terdaftar</h3></div>';
  } catch(e){ el.innerHTML=`<div class="status-box status-err">❌ ${e.message}</div>`; }
}

async function loadSetActivity() {
  const el=document.getElementById('set-activity-list');
  if(!el)return;
  try {
    const data=await sbGet('activity_logs','select=*&order=created_at.desc&limit=50');
    el.innerHTML=(data&&data.length)?`
      <table>
        <thead><tr><th>Waktu</th><th>Aksi</th><th>Data</th><th>Deskripsi</th><th>User</th></tr></thead>
        <tbody>${(data||[]).map(a=>`
          <tr>
            <td style="font-size:11px;color:var(--gray);white-space:nowrap">${formatDateShort(a.created_at)}</td>
            <td><span class="badge ${a.action==='create'?'badge-green':a.action==='delete'?'badge-red':a.action==='update'?'badge-navy':'badge-gray'}">${a.action}</span></td>
            <td style="font-size:12px"><strong>${a.record_name||'—'}</strong></td>
            <td style="font-size:12px;color:var(--gray)">${a.description||'—'}</td>
            <td style="font-size:11px;color:var(--gray)">${a.user_name||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>`:
      '<div class="empty-state"><div class="ico">📋</div><h3>Belum ada log</h3></div>';
  } catch(e){ el.innerHTML=`<div class="status-box status-err">❌ ${e.message}</div>`; }
}

async function saveSetMapsKey() {
  const k=document.getElementById('set-maps-key')?.value.trim();
  if(!k){toast('API key kosong','err');return;}
  localStorage.setItem('ol_maps_key',k);
  try {
    const ex=await sbGet('settings','select=id&key=eq.maps_api_key');
    if(ex?.length) await sbPatch('settings',ex[0].id,{value:k});
    else await sbPost('settings',{key:'maps_api_key',value:k,label:'Google Maps API Key'});
    toast('✅ API key tersimpan permanen','ok');
  } catch(e){ toast('✅ Tersimpan di browser','warn'); }
}

async function exportAllData() {
  if(!confirm('Export semua data partner sebagai backup CSV?'))return;
  try {
    const data=await sbGet('partners','select=*&order=created_at.desc');
    const h=['id','partner_code','partner_name','category','pic_name','phone','email','address','status','notes','created_at'];
    const rows=(data||[]).map(p=>h.map(k=>`"${String(p[k]||'').replace(/"/g,'""')}"`));
    const csv=[h,...rows].map(r=>r.join(',')).join('\n');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    a.download=`OneLab_Backup_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.csv`;
    a.click(); toast('📥 Backup diunduh','ok');
  } catch(e){ toast('❌ '+e.message,'err'); }
}

// ── Admin helper functions ────────────────
function loadAdminInfo() {
  const u = window.currentUser;
  if (!u) return;
  const uid = document.getElementById('admin-uid');
  const rol = document.getElementById('admin-role');
  const eml = document.getElementById('admin-email');
  if (uid) uid.textContent = u.id?.substring(0,12)+'...';
  if (rol) rol.textContent = getUserRole();
  if (eml) eml.textContent = u.email || '—';
}

async function bulkDeleteTable(table) {
  const labels = {
    partners: 'Semua Partner',
    partner_deals: 'Semua Output Kerjasama',
    vouchers: 'Semua Voucher',
    voucher_campaigns: 'Semua Campaign Voucher',
    marketing_templates: 'Semua Template Marketing',
    outgoing_letters: 'Semua Arsip Surat',
    activity_logs: 'Semua Activity Log',
  };
  const label = labels[table] || table;
  const code = prompt(`⚠️ Hapus ${label}?\n\nKetik "HAPUS" untuk konfirmasi:`);
  if (code !== 'HAPUS') { toast('Dibatalkan','info'); return; }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, {
      method: 'DELETE',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' }
    });
    if (res.ok || res.status === 204) {
      toast(`✅ ${label} berhasil dihapus`,'ok');
      await logActivity('bulk_delete', table, null, `Bulk delete ${table} oleh ${getUserName()}`, '');
    } else {
      const err = await res.text();
      throw new Error(err);
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

const ADMIN_SQL = {
  confirm_email: `-- Fix email confirmation — jalankan di Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;`,

  disable_rls: `-- Disable RLS semua tabel
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mous DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_sequences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;`,

  check_tables: `-- Cek semua tabel dan jumlah kolom
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c 
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') as jumlah_kolom
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;`,
};

function copyAdminSQL(key) {
  const sql = ADMIN_SQL[key];
  if (!sql) return;
  navigator.clipboard.writeText(sql)
    .then(() => toast('📋 SQL tersalin — paste di Supabase SQL Editor','ok'))
    .catch(() => toast('❌ Gagal copy','err'));
}
