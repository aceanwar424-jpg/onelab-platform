// ═══════════════════════════════════════════
// CORE: Router
// ═══════════════════════════════════════════

const PAGE_TITLES = {
  dashboard:'Dashboard', partners:'Partner Database', maps:'Maps Prospecting',
  marketing:'Marketing Kit', voucher:'Voucher Builder', surat:'Surat Keluar',
  mou:'MOU / Perjanjian', leads:'Leads Management', okr:'OKR & Target Sales',
  finance:'Finance & Billing', inventory:'Inventory & Logistik',
  hrd:'HRD & SDM', homecare:'Home Care',
  settings:'Pengaturan', users:'User Management'
};

let currentPage = '';

function navigate(page, params={}) {
  // Update active nav
  document.querySelectorAll('.nav-item[data-page]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-page') === page);
  });

  // Update topbar title
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    document.getElementById('sidebar')?.classList.remove('open');
  }

  currentPage = page;

  switch(page) {
    case 'dashboard':  renderDashboard();      break;
    case 'partners':   renderPartners(params); break;
    case 'maps':       renderMaps();            break;
    case 'marketing':  renderMarketing();      break;
    case 'voucher':    renderVoucher();        break;
    case 'surat':      renderSurat();          break;
    case 'mou':        renderMOU();            break;
    case 'leads':      renderLeads();          break;
    case 'finance':    renderFinance();        break;
    case 'inventory':  renderInventory();      break;
    case 'hrd':        renderHRD();            break;
    case 'homecare':   renderHomeCare();       break;
    case 'settings':   renderSettings();       break;
    case 'users':      renderUsers();          break;
    default:
      document.getElementById('main-content').innerHTML = `
        <div class="empty-state" style="min-height:70vh">
          <div class="ico">🚧</div>
          <h3>Halaman "${page}" belum tersedia</h3>
          <p>Modul ini sedang dalam pengembangan.</p>
          <button class="btn btn-teal" onclick="navigate('dashboard')">← Kembali ke Dashboard</button>
        </div>`;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// Role-based navigation helper
function getUserName() {
  return window.currentUser?.profile?.full_name
    || window.currentUser?.email?.split('@')[0]
    || 'User';
}

function getUserRole() {
  return window.currentUser?.profile?.role || 'sales';
}

function formatCurrency(v) {
  if (!v && v !== 0) return '—';
  return 'Rp ' + Number(v).toLocaleString('id-ID');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'});
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
}

function timeAgo(d) {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return 'Baru saja';
  if (s < 3600) return `${Math.floor(s/60)} menit lalu`;
  if (s < 86400)return `${Math.floor(s/3600)} jam lalu`;
  if (s < 2592000) return `${Math.floor(s/86400)} hari lalu`;
  return formatDateShort(d);
}

function autoCode(cat) {
  const map = {
    'Apotek':'APT','Klinik Pratama':'KLP','Klinik Utama':'KLU','Dokter Praktik':'DKP',
    'Dokter Spesialis':'DKS','Klinik Gigi':'KLG','Klinik Mata':'KLM','Puskesmas':'PKM',
    'Rumah Sakit':'RS','Lab Klinik':'LAB','Perusahaan SME':'PRS','Komunitas':'KOM',
    'Sekolah / Kampus':'SKL','Gym & Sport Club':'GYM','Lainnya':'LNY'
  };
  const prefix = map[cat] || 'PTR';
  return `${prefix}-${Date.now().toString().slice(-5)}`;
}

function catIcon(cat) {
  const m = {
    'Apotek':'💊','Klinik Pratama':'🏥','Klinik Utama':'🏨','Dokter Praktik':'👨‍⚕️',
    'Dokter Spesialis':'🩺','Klinik Gigi':'🦷','Klinik Mata':'👁','Puskesmas':'🏛',
    'Rumah Sakit':'🏥','Lab Klinik':'🔬','Perusahaan SME':'🏢','Komunitas':'👥',
    'Sekolah / Kampus':'🎓','Gym & Sport Club':'💪','Lainnya':'📌'
  };
  return m[cat] || '📌';
}

function catBadge(cat) {
  const m = {
    'Apotek':'badge-teal','Klinik Pratama':'badge-blue','Klinik Utama':'badge-blue',
    'Dokter Praktik':'badge-purple','Dokter Spesialis':'badge-purple',
    'Perusahaan SME':'badge-navy','Komunitas':'badge-green',
    'Sekolah / Kampus':'badge-gold','Gym & Sport Club':'badge-red',
  };
  return m[cat] || 'badge-gray';
}
