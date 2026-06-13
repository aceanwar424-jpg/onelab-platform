// ═══════════════════════════════════════════
// MODULE: User Management & Role/Permission
// - Super admin kelola semua user
// - Assign role per user
// - Kontrol menu visibility per role
// ═══════════════════════════════════════════

// ── Role definitions ──────────────────────
const ROLES = {
  super_admin: {
    label: 'Super Admin',
    color: '#7B1FA2',
    desc: 'Akses penuh semua modul + kelola user',
    pages: ['dashboard','partners','maps','marketing','voucher','surat','settings','users'],
    canDelete: true,
    canBulkDelete: true,
    canExport: true,
    canManageUsers: true,
  },
  direktur: {
    label: 'Direktur',
    color: '#0A2342',
    desc: 'Semua modul, approval, laporan',
    pages: ['dashboard','partners','maps','marketing','voucher','surat','settings'],
    canDelete: true,
    canBulkDelete: false,
    canExport: true,
    canManageUsers: false,
  },
  manager: {
    label: 'Manager',
    color: '#00897B',
    desc: 'Semua modul kecuali pengaturan sistem',
    pages: ['dashboard','partners','maps','marketing','voucher','surat','settings'],
    canDelete: true,
    canBulkDelete: false,
    canExport: true,
    canManageUsers: false,
  },
  sales: {
    label: 'Sales',
    color: '#1565C0',
    desc: 'Partner, maps, marketing kit, voucher',
    pages: ['dashboard','partners','maps','marketing','voucher','settings'],
    canDelete: false,
    canBulkDelete: false,
    canExport: false,
    canManageUsers: false,
  },
  operasional: {
    label: 'Operasional Lab',
    color: '#2E7D32',
    desc: 'Surat keluar, operasional lab',
    pages: ['dashboard','surat','settings'],
    canDelete: false,
    canBulkDelete: false,
    canExport: false,
    canManageUsers: false,
  },
  viewer: {
    label: 'Viewer',
    color: '#546E7A',
    desc: 'Hanya lihat dashboard',
    pages: ['dashboard','settings'],
    canDelete: false,
    canBulkDelete: false,
    canExport: false,
    canManageUsers: false,
  },
};

// ── Apply menu visibility based on role ───
function applyRoleMenu() {
  const role = getUserRole();
  const roleConfig = ROLES[role] || ROLES.sales;
  const allowedPages = roleConfig.pages;

  // Hide/show nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    const page = btn.getAttribute('data-page');
    if (!btn.classList.contains('nav-item-soon')) {
      btn.style.display = allowedPages.includes(page) ? '' : 'none';
    }
  });

  // Show User Management only for super_admin
  const navUsers = document.getElementById('nav-users');
  if (navUsers) {
    navUsers.style.display = (role === 'super_admin') ? '' : 'none';
  }

  // Store role config globally
  window.roleConfig = roleConfig;
}

// ── Render User Management Page ───────────
async function renderUsers() {
  const myRole = getUserRole();
  if (myRole !== 'super_admin') {
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state" style="min-height:60vh">
        <div class="ico">🔒</div>
        <h3>Akses Ditolak</h3>
        <p>Hanya Super Admin yang bisa mengelola user.</p>
      </div>`;
    return;
  }

  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>User Management</h1>
        <p>Kelola akses dan role setiap pengguna platform</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" onclick="openInviteUserForm()">+ Undang User</button>
      </div>
    </div>

    <!-- Role Legend -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      ${Object.entries(ROLES).map(([key,r])=>`
        <div style="display:flex;align-items:center;gap:6px;padding:5px 10px;background:#fff;border-radius:8px;border:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:2px;background:${r.color}"></div>
          <span style="font-size:11px;font-weight:600;color:var(--navy)">${r.label}</span>
          <span style="font-size:10px;color:var(--gray)">${r.desc}</span>
        </div>`).join('')}
    </div>

    <div class="table-wrap">
      <div id="users-tbody">
        <div class="loading-row"><div class="spinner"></div></div>
      </div>
    </div>`;

  await loadUsers();
}

async function loadUsers() {
  try {
    // Load dari user_profiles
    const profiles = await sbGet('user_profiles','select=*&order=created_at.asc');
    renderUsersTable(Array.isArray(profiles) ? profiles : []);
  } catch(e) {
    document.getElementById('users-tbody').innerHTML =
      `<div class="status-box status-err" style="margin:16px">❌ ${e.message}</div>`;
  }
}

function renderUsersTable(users) {
  const el = document.getElementById('users-tbody');
  if (!users.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="ico">👤</div>
        <h3>Belum ada user terdaftar</h3>
        <p>User akan muncul di sini setelah mendaftar dan login pertama kali.</p>
      </div>`; return;
  }

  el.innerHTML = `
    <table>
      <thead><tr>
        <th>User</th><th>Role</th><th>Akses Modul</th>
        <th>Terdaftar</th><th>Last Login</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${users.map(u => {
          const role = u.role || 'sales';
          const rc = ROLES[role] || ROLES.sales;
          const isMe = u.id === window.currentUser?.id;
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:34px;height:34px;border-radius:50%;background:${rc.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">
                  ${(u.full_name||'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--navy)">${u.full_name||'—'} ${isMe?'<span style="font-size:10px;color:var(--teal)">(Saya)</span>':''}</div>
                  <div style="font-size:11px;color:var(--gray)">${u.phone||'—'}</div>
                </div>
              </div>
            </td>
            <td>
              <span style="background:${rc.color}20;color:${rc.color};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700">${rc.label}</span>
            </td>
            <td>
              <div style="display:flex;gap:3px;flex-wrap:wrap;max-width:200px">
                ${rc.pages.map(p=>`<span style="background:var(--lgray);padding:2px 6px;border-radius:4px;font-size:10px;color:var(--gray)">${p}</span>`).join('')}
              </div>
            </td>
            <td style="font-size:11px;color:var(--gray)">${u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}</td>
            <td style="font-size:11px;color:var(--gray)">${u.updated_at ? timeAgo(u.updated_at) : '—'}</td>
            <td>
              <div class="act-row">
                <button class="act-btn edit" onclick="openEditUserRole('${u.id}','${u.full_name||''}','${role}')">✏️ Role</button>
                ${!isMe ? `<button class="act-btn del" onclick="resetUserPassword('${u.id}','${u.full_name||''}')">🔑</button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Edit User Role ────────────────────────
function openEditUserRole(userId, userName, currentRole) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">✏️ Edit Role — ${userName}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>

    <div class="form-group">
      <label>Role / Jabatan</label>
      <select id="ur-role" style="font-size:14px;padding:12px">
        ${Object.entries(ROLES).map(([key,r])=>`
          <option value="${key}" ${key===currentRole?'selected':''}>${r.label} — ${r.desc}</option>
        `).join('')}
      </select>
    </div>

    <div id="ur-preview" style="margin-top:14px"></div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveUserRole('${userId}')">💾 Simpan Role</button>
    </div>`);

  // Preview on change
  document.getElementById('ur-role').addEventListener('change', function() {
    const rc = ROLES[this.value];
    document.getElementById('ur-preview').innerHTML = `
      <div style="background:var(--lgray);border-radius:8px;padding:12px 14px">
        <div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:6px">Akses yang diberikan:</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
          ${rc.pages.map(p=>`<span style="background:#fff;border:1px solid var(--border);padding:3px 8px;border-radius:6px;font-size:11px">${p}</span>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--gray)">
          ${rc.canDelete?'✅ Bisa hapus data':'❌ Tidak bisa hapus'} &nbsp;·&nbsp;
          ${rc.canExport?'✅ Bisa export CSV':'❌ Tidak bisa export'} &nbsp;·&nbsp;
          ${rc.canManageUsers?'✅ Bisa kelola user':'❌ Tidak bisa kelola user'}
        </div>
      </div>`;
  });
  document.getElementById('ur-role').dispatchEvent(new Event('change'));
}

async function saveUserRole(userId) {
  const role = document.getElementById('ur-role').value;
  try {
    await sbPatch('user_profiles', userId, { role, updated_at: new Date().toISOString() });
    toast('✅ Role diupdate','ok');
    closeModalForce();
    await loadUsers();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function resetUserPassword(userId, userName) {
  if (!confirm(`Reset password untuk "${userName}"?\nUser akan menerima email reset password.`)) return;
  toast('📧 Fitur reset password via email akan segera hadir','info');
}

// ── Invite User ───────────────────────────
function openInviteUserForm() {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">➕ Undang User Baru</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="background:#FFF8E1;border-radius:8px;padding:12px 14px;font-size:12px;color:#5D4037;margin-bottom:14px">
      ⚠️ User baru perlu mendaftar sendiri di halaman login menggunakan email yang sama.
      Setelah mendaftar dan login pertama kali, role bisa diatur di sini.
    </div>
    <div class="form-group">
      <label>Nama Lengkap</label>
      <input type="text" id="inv-name" placeholder="Nama karyawan">
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="inv-role">
        ${Object.entries(ROLES).map(([key,r])=>`
          <option value="${key}" ${key==='sales'?'selected':''}>${r.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>No. HP / WA</label>
      <input type="text" id="inv-phone" placeholder="08xxxxxxxxxx">
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="createUserProfile()">➕ Buat Profil</button>
    </div>`);
}

async function createUserProfile() {
  const name  = document.getElementById('inv-name').value.trim();
  const role  = document.getElementById('inv-role').value;
  const phone = document.getElementById('inv-phone').value.trim();
  if (!name) { toast('Nama wajib diisi','err'); return; }
  try {
    // Create placeholder profile — will be linked when user registers
    await sbPost('user_profiles', {
      full_name: name,
      role,
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    toast('✅ Profil dibuat. User bisa login dengan akun Supabase.','ok');
    closeModalForce();
    await loadUsers();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── Bulk Delete (super admin only) ────────
function openBulkDeletePanel() {
  const role = getUserRole();
  if (role !== 'super_admin') { toast('Hanya Super Admin','err'); return; }

  openModal(`
    <div class="modal-header">
      <div class="modal-title">🗑 Bulk Delete — Super Admin</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="background:#FFEBEE;border-radius:8px;padding:12px 14px;font-size:13px;color:#B71C1C;margin-bottom:14px">
      ⚠️ <strong>Peringatan:</strong> Aksi ini tidak bisa dibatalkan. Data yang dihapus permanen.
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-danger" onclick="bulkDeleteConfirm('partners','Semua Partner?')">
        🗑 Hapus Semua Partner
      </button>
      <button class="btn btn-danger" onclick="bulkDeleteConfirm('partner_deals','Semua Output Kerjasama?')">
        🗑 Hapus Semua Output Kerjasama
      </button>
      <button class="btn btn-danger" onclick="bulkDeleteConfirm('vouchers','Semua Voucher?')">
        🗑 Hapus Semua Voucher
      </button>
      <button class="btn btn-danger" onclick="bulkDeleteConfirm('activity_logs','Semua Activity Log?')">
        🗑 Bersihkan Activity Log
      </button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
    </div>`);
}

async function bulkDeleteConfirm(table, label) {
  const code = prompt(`Ketik "HAPUS" untuk konfirmasi hapus ${label}`);
  if (code !== 'HAPUS') { toast('Dibatalkan','info'); return; }
  try {
    // Delete all — use filter that matches everything
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, {
      method: 'DELETE',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' }
    });
    if (res.ok) {
      toast(`✅ ${label} berhasil dihapus`,'ok');
      await logActivity('bulk_delete', table, null, `Bulk delete ${table} oleh ${getUserName()}`, '');
    } else {
      throw new Error(await res.text());
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}
