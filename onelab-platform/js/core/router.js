// ═══════════════════════════════════════════
// CORE: Router & Navigation
// ═══════════════════════════════════════════

let currentPage = 'dashboard';
const PAGE_TITLES = {
  dashboard:'Dashboard', partners:'Partner Database', maps:'Maps Prospecting',
  marketing:'Marketing Kit', voucher:'Voucher Builder',
  surat:'Surat Keluar', settings:'Pengaturan'
};

function navigate(page, params={}) {
  currentPage = page;
  window._routeParams = params;

  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page));

  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;

  const addBtn = document.querySelector('.topbar-add-btn');
  if (addBtn) {
    addBtn.style.display = ['partners','marketing','voucher','surat'].includes(page) ? 'inline-flex' : 'none';
    const labels = {
      partners:'+ Partner', marketing:'+ Template',
      voucher:'+ Campaign', surat:'+ Surat'
    };
    addBtn.textContent = labels[page] || '+';
    addBtn.onclick = () => {
      if (page === 'partners')  openPartnerForm();
      if (page === 'marketing') openMktForm();
      if (page === 'voucher')   openCampaignForm();
      if (page === 'surat')     openSuratForm();
    };
  }

  document.getElementById('main-content').innerHTML =
    `<div class="loading-row" style="min-height:60vh"><div class="spinner"></div></div>`;

  setTimeout(() => {
    switch(page) {
      case 'dashboard': renderDashboard(); break;
      case 'partners':  renderPartners(params); break;
      case 'maps':      renderMaps(); break;
      case 'marketing': renderMarketing(); break;
      case 'voucher':   renderVoucher(); break;
      case 'surat':     renderSurat(); break;
      case 'settings':  renderSettings(); break;
    }
  }, 60);

  if (window.innerWidth < 768)
    document.getElementById('sidebar').classList.remove('open');
}
