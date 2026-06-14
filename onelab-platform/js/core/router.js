// ═══════════════════════════════════════════
// CORE: Router v10
// ═══════════════════════════════════════════

const PAGE_TITLES = {
  dashboard:'Dashboard', partners:'Partner Database', maps:'Maps Prospecting',
  marketing:'Marketing Kit', voucher:'Voucher Builder', surat:'Surat Keluar',
  mou:'MOU / Perjanjian', leads:'Leads Management', okr:'OKR & Target Sales',
  mcu:'Project MCU', finance:'Finance & Billing',
  inventory:'Inventory & Logistik', hrd:'HRD & SDM', homecare:'Home Care',
  admission:'Admission / Registrasi', lab:'Operasional Lab',
  product:'Master Produk & Tes', corporate:'Corporate Management',
  radiology:'Radiology', supportive:'Supportive Examination',
  medrecord:'Rekam Medis', cashier:'Kasir',
  package:'Package Service',
  settings:'Pengaturan', users:'User Management',
};

let currentPage = '';

function navigate(page, params={}) {
  document.querySelectorAll('.nav-item[data-page]').forEach(b => {
    const bp = b.getAttribute('data-page');
    b.classList.toggle('active',
      bp===page || bp===`${page}-checkin` || bp===`${page}-result` ||
      bp===`${page}-validation` || bp===`${page}-approval` || bp===`${page}-medrecord`
    );
  });

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  if (window.innerWidth < 768) {
    document.getElementById('sidebar')?.classList.remove('open');
  }

  currentPage = page;

  switch(page) {
    case 'dashboard':   renderDashboard();              break;
    case 'partners':    renderPartners(params);         break;
    case 'maps':        renderMaps();                   break;
    case 'marketing':   renderMarketing();              break;
    case 'voucher':     renderVoucher();                break;
    case 'surat':       renderSurat();                  break;
    case 'mou':         renderMOU();                    break;
    case 'leads':       renderLeads();                  break;
    case 'okr':         renderOKR();                    break;
    case 'mcu':         renderMCU(params);              break;
    case 'finance':     renderFinance();                break;
    case 'inventory':   renderInventory();              break;
    case 'hrd':         renderHRD();                    break;
    case 'homecare':    renderHomeCare();               break;
    case 'admission':   renderAdmission();              break;
    case 'lab':         renderLab(params.tab||'checkin'); break;
    case 'product':     renderConfigProduct();          break;
    case 'corporate':   renderConfigCorporate();        break;
    case 'radiology':   renderRadiology();              break;
    case 'supportive':  renderSupportive();             break;
    case 'spirometry':  renderSupportive();             break;
    case 'medrecord':   renderMedRecord();              break;
    case 'cashier':     renderCashier();                break;
    case 'package':     renderConfigPackage();          break;
    case 'anamnesa':    renderAdmission();              break;
    case 'settings':    renderSettings();               break;
    case 'users':       renderUsers();                  break;
    default:
      document.getElementById('main-content').innerHTML = `
        <div class="empty-state" style="min-height:70vh">
          <div class="ico">🚧</div>
          <h3>Halaman ini sedang dikembangkan</h3>
          <button class="btn btn-teal" style="margin-top:14px" onclick="navigate('dashboard')">← Dashboard</button>
        </div>`;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}
