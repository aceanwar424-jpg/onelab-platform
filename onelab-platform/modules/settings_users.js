// ═══════════════════════════════════════════
// MODULE: User Management & Role/Permission v3
// ═══════════════════════════════════════════

const ALL_PAGES = [
  'dashboard','partners','maps','marketing','voucher','surat',
  'mou','leads','okr','finance','finance-report','finance-comm',
  'inventory','hrd','homecare','settings','users'
];

const ROLES = {
  super_admin: {
    label:'Super Admin', color:'#7B1FA2',
    desc:'Akses penuh semua modul + kelola user',
    pages: ALL_PAGES,
    canDelete:true, canBulkDelete:true, canExport:true, canManageUsers:true,
  },
  direktur: {
    label:'Direktur', color:'#0A2342',
    desc:'Semua modul, approval, laporan keuangan',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:true, canBulkDelete:false, canExport:true, canManageUsers:false,
  },
  manager: {
    label:'Manager', color:'#00897B',
    desc:'Semua operasional kecuali user management',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:true, canBulkDelete:false, canExport:true, canManageUsers:false,
  },
  sales: {
    label:'Sales', color:'#1565C0',
    desc:'Partner, maps, marketing, voucher, leads',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:false, canBulkDelete:false, canExport:false, canManageUsers:false,
  },
  operasional: {
    label:'Operasional Lab', color:'#2E7D32',
    desc:'Surat, inventory, home care, lab',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:false, canBulkDelete:false, canExport:false, canManageUsers:false,
  },
  hrd_staff: {
    label:'HRD Staff', color:'#E65100',
    desc:'HRD & SDM modul',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:false, canBulkDelete:false, canExport:false, canManageUsers:false,
  },
  finance_staff: {
    label:'Finance Staff', color:'#00838F',
    desc:'Finance & billing modul',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:false, canBulkDelete:false, canExport:true, canManageUsers:false,
  },
  spv: {
    label:'SPV / Supervisor', color:'#0E7490',
    desc:'Supervisi tim, approve logbook, assign task, lihat semua laporan',
    pages: ALL_PAGES,
    canDelete:false, canBulkDelete:false, canExport:true, canManageUsers:false,
    canApproveLogbook:true, canAssignTask:true, canSeeTeamBoard:true,
  },
  viewer: {
    label:'Viewer', color:'#546E7A',
    desc:'Hanya lihat dashboard & laporan',
    pages: ALL_PAGES.filter(p=>p!=='users'),
    canDelete:false, canBulkDelete:false, canExport:false, canManageUsers:false,
  },
};

// ── Apply menu visibility ─────────────────
// Semua role dapat akses semua menu (visibility)
// Perbedaan role hanya pada permission aksi (delete, edit, export)
function applyRoleMenu() {
  const role = getUserRole();
  // super_admin = semua role gabungan (termasuk spv + manager)
  const rc = ROLES[role] || ROLES.sales;
  window.roleConfig = rc;
  // Inject helper methods ke roleConfig
  window.roleConfig.isSpv     = ['super_admin','spv','manager','direktur'].includes(role);
  window.roleConfig.isManager = ['super_admin','manager','direktur'].includes(role);
  window.roleConfig.isSuperAdmin = role === 'super_admin';

  // Tampilkan SEMUA nav item
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    if (btn.classList.contains('nav-item-soon')) return;
    if (btn.id === 'nav-users') return;
    btn.style.display = '';
  });

  // User Management — super_admin + manager
  const navUsers = document.getElementById('nav-users');
  if (navUsers) {
    navUsers.style.display = ['super_admin','manager','direktur'].includes(role) ? '' : 'none';
  }

  // Update role badge
  const roleEl = document.getElementById('user-role-sidebar');
  if (roleEl) roleEl.textContent = rc.label;
}

// ── Helper: isSpv() shortcut ──────────────
function isSpv() {
  return ['super_admin','spv','manager','direktur'].includes(getUserRole ? getUserRole() : '');
}
function isManager() {
  return ['super_admin','manager','direktur'].includes(getUserRole ? getUserRole() : '');
}

// ── Render User Management ────────────────
async function renderUsers() {
  if (getUserRole() !== 'super_admin') {
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state" style="min-height:60vh">
        <div class="ico">🔒</div><h3>Akses Ditolak</h3>
        <p>Hanya Super Admin yang bisa mengelola user.</p>
      </div>`; return;
  }

  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>User Management</h1>
        <p>Kelola akses dan role setiap pengguna platform</p></div>
      <div class="btn-row">
        <button class="btn btn-teal" onclick="openInviteUserForm()">+ Tambah User</button>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
      ${Object.entries(ROLES).map(([k,r])=>`
        <div style="padding:5px 10px;background:#fff;border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;gap:6px">
          <div style="width:8px;height:8px;border-radius:2px;background:${r.color}"></div>
          <span style="font-size:11px;font-weight:600;color:var(--navy)">${r.label}</span>
          <span style="font-size:10px;color:var(--gray)">— ${r.desc}</span>
        </div>`).join('')}
    </div>
    <div class="table-wrap">
      <div id="users-tbody"><div class="loading-row"><div class="spinner"></div></div></div>
    </div>`;

  await loadUsers();
}

async function loadUsers() {
  try {
    const data = await sbGet('user_profiles','select=*&order=created_at.asc');
    renderUsersTable(Array.isArray(data) ? data : []);
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
        <div class="ico">👤</div><h3>Belum ada user</h3>
        <p>User muncul di sini setelah login pertama kali.</p>
      </div>`; return;
  }
  el.innerHTML = `
    <table><thead><tr>
      <th>User</th><th>Role</th><th>No. HP</th><th>Terdaftar</th><th>Aksi</th>
    </tr></thead><tbody>
    ${users.map(u => {
      const role = u.role||'sales';
      const rc   = ROLES[role]||ROLES.sales;
      const isMe = u.id === window.currentUser?.id;
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:50%;background:${rc.color};color:#fff;
              display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">
              ${(u.full_name||'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--navy)">
                ${u.full_name||'—'}
                ${isMe?'<span style="font-size:10px;color:var(--teal);margin-left:4px">(Saya)</span>':''}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span style="background:${rc.color}20;color:${rc.color};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700">
            ${rc.label}
          </span>
        </td>
        <td style="font-size:12px;color:var(--gray)">${u.phone||'—'}</td>
        <td style="font-size:11px;color:var(--gray)">
          ${u.created_at?new Date(u.created_at).toLocaleDateString('id-ID'):'—'}
        </td>
        <td>
          <button class="act-btn edit"
            onclick="openEditUserRole('${u.id}','${(u.full_name||'').replace(/'/g,"\\'")}','${role}')">
            ✏️ Role
          </button>
        </td>
      </tr>`;
    }).join('')}
    </tbody></table>`;
}

function openEditUserRole(userId, userName, currentRole) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">✏️ Edit Role — ${userName}</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="ur-role" onchange="previewRole(this.value)">
        ${Object.entries(ROLES).map(([k,r])=>`
          <option value="${k}" ${k===currentRole?'selected':''}>${r.label} — ${r.desc}</option>
        `).join('')}
      </select>
    </div>
    <div id="ur-preview" style="margin-top:10px"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="saveUserRole('${userId}')">💾 Simpan</button>
    </div>`);
  previewRole(currentRole);
}

function previewRole(role) {
  const rc = ROLES[role]||ROLES.sales;
  const el = document.getElementById('ur-preview');
  if (!el) return;
  el.innerHTML = `
    <div style="background:var(--lgray);border-radius:8px;padding:10px 12px">
      <div style="font-size:11px;color:var(--gray)">
        ${rc.canDelete?'✅ Bisa hapus data':'❌ Tidak bisa hapus'} &nbsp;·&nbsp;
        ${rc.canExport?'✅ Bisa export CSV':'❌ Tidak bisa export'} &nbsp;·&nbsp;
        ${rc.canManageUsers?'✅ Bisa kelola user':'❌ Tidak bisa kelola user'}
      </div>
    </div>`;
}

async function saveUserRole(userId) {
  const role = document.getElementById('ur-role').value;
  try {
    await sbPatch('user_profiles', userId, {role, updated_at:new Date().toISOString()});
    toast('✅ Role diupdate','ok');
    closeModalForce();
    await loadUsers();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function openInviteUserForm() {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">➕ Tambah User Profile</div>
      <button class="modal-close" onclick="closeModalForce()">✕</button>
    </div>
    <div style="background:#FFF8E1;border-radius:8px;padding:10px 12px;font-size:12px;color:#5D4037;margin-bottom:12px">
      ℹ️ User mendaftar sendiri di halaman login. Setelah login pertama, role diatur di sini.
    </div>
    <div class="form-group">
      <label>Nama Lengkap *</label>
      <input type="text" id="inv-name" placeholder="Nama karyawan">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Role</label>
        <select id="inv-role">
          ${Object.entries(ROLES).map(([k,r])=>`
            <option value="${k}" ${k==='sales'?'selected':''}>${r.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>No. HP / WA</label>
        <input type="text" id="inv-phone" placeholder="08xxxxxxxxxx">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModalForce()">Batal</button>
      <button class="btn btn-teal" onclick="createUserProfile()">➕ Simpan</button>
    </div>`);
}

async function createUserProfile() {
  const name  = document.getElementById('inv-name').value.trim();
  const role  = document.getElementById('inv-role').value;
  const phone = document.getElementById('inv-phone').value.trim();
  if (!name) { toast('Nama wajib diisi','err'); return; }
  try {
    await sbPost('user_profiles', {
      full_name:name, role, phone,
      created_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    });
    toast('✅ User profile dibuat','ok');
    closeModalForce();
    await loadUsers();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
