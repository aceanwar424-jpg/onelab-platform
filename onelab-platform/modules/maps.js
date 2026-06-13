// ═══════════════════════════════════════════════════
// Module: Maps Prospecting — v3
// - API key dari Supabase settings table
// - Kategori lengkap semua lini
// - Smart import: update telepon jika sudah ada, tidak duplikat
// - Activity log setiap aksi
// ═══════════════════════════════════════════════════

let mapsState = {
  service: null,
  ready: false,
  results: [],
  selected: new Set(),
  apiKey: '',
};

const MAP_AREAS = [
  { label:'Bintaro & Pd. Aren, Tangsel',  val:'-6.2615,106.7754' },
  { label:'Ciputat & Pamulang, Tangsel',   val:'-6.3306,106.7455' },
  { label:'Serpong & BSD, Tangsel',        val:'-6.3019,106.6659' },
  { label:'Tangerang Kota',               val:'-6.1783,106.6319' },
  { label:'Jakarta Selatan',              val:'-6.2615,106.8106' },
  { label:'Jakarta Pusat',               val:'-6.1744,106.8294' },
  { label:'Jakarta Barat',               val:'-6.1675,106.7637' },
  { label:'Jakarta Utara',               val:'-6.1208,106.9004' },
  { label:'Jakarta Timur',               val:'-6.2251,106.9004' },
  { label:'Depok',                       val:'-6.4025,106.7942' },
  { label:'Bekasi Kota',                 val:'-6.2383,106.9756' },
  { label:'Bogor Kota',                  val:'-6.5971,106.8060' },
  { label:'Sukabumi Kota',               val:'-6.9147,107.0608' },
  { label:'Sukabumi Kabupaten',           val:'-6.9932,107.2200' },
  { label:'Cianjur',                     val:'-6.8172,107.1422' },
  { label:'Serang, Banten',              val:'-6.1351,106.1503' },
  { label:'Cilegon, Banten',             val:'-6.0024,106.0041' },
  { label:'Rangkasbitung, Lebak',        val:'-6.3521,106.2511' },
  { label:'Pandeglang, Banten',          val:'-6.3086,106.1062' },
  { label:'Custom Koordinat',             val:'custom' },
];

const MAP_CATEGORIES = [
  // Medis
  { label:'🏥 Klinik Pratama',     q:'klinik pratama',          group:'Medis' },
  { label:'🏥 Klinik Utama',       q:'klinik utama',            group:'Medis' },
  { label:'👨‍⚕️ Dokter Umum',       q:'dokter praktik umum',     group:'Medis' },
  { label:'🩺 Dokter Spesialis',   q:'dokter spesialis',        group:'Medis' },
  { label:'👶 Dokter Anak',        q:'dokter anak',             group:'Medis' },
  { label:'🫀 Dokter Jantung',     q:'dokter spesialis jantung',group:'Medis' },
  { label:'🧠 Dokter Saraf',       q:'dokter spesialis saraf',  group:'Medis' },
  { label:'🦷 Dokter Gigi',        q:'klinik gigi',             group:'Medis' },
  { label:'👁 Dokter Mata',        q:'klinik mata',             group:'Medis' },
  { label:'🤰 Dokter Kandungan',   q:'dokter kandungan',        group:'Medis' },
  { label:'🏨 Puskesmas',          q:'puskesmas',               group:'Medis' },
  { label:'🏦 Rumah Sakit',        q:'rumah sakit',             group:'Medis' },
  { label:'🔬 Lab Klinik',         q:'laboratorium klinik',     group:'Medis' },
  // Farmasi
  { label:'💊 Apotek',             q:'apotek',                  group:'Farmasi' },
  { label:'💊 Apotek K24',         q:'apotek k24',              group:'Farmasi' },
  { label:'💊 Guardian / Century', q:'guardian apotek',         group:'Farmasi' },
  // Wellness
  { label:'🏋️ Gym & Fitness',      q:'gym fitness center',      group:'Wellness' },
  { label:'🧘 Yoga & Pilates',     q:'yoga pilates studio',     group:'Wellness' },
  { label:'🏊 Kolam Renang',       q:'kolam renang',            group:'Wellness' },
  { label:'⛳ Golf Club',          q:'golf club',               group:'Wellness' },
  { label:'🚴 Cycling Club',       q:'cycling club sepeda',     group:'Wellness' },
  { label:'🏃 Running Club',       q:'running club lari',       group:'Wellness' },
  { label:'💆 Spa & Wellness',     q:'spa wellness center',     group:'Wellness' },
  // Korporat
  { label:'🏢 Perusahaan / Kantor',q:'kantor perusahaan',       group:'Korporat' },
  { label:'🏭 Pabrik / Industri',  q:'pabrik industri',         group:'Korporat' },
  { label:'🏬 Mall / Perbelanjaan',q:'mall pusat perbelanjaan', group:'Korporat' },
  { label:'🏗 Kawasan Industri',   q:'kawasan industri',        group:'Korporat' },
  // Pendidikan
  { label:'🎓 Sekolah SD/SMP/SMA', q:'sekolah',                 group:'Pendidikan' },
  { label:'🎓 Universitas',        q:'universitas kampus',      group:'Pendidikan' },
  { label:'🎓 Pesantren',          q:'pesantren',               group:'Pendidikan' },
  // Komunitas
  { label:'🕌 Masjid / Islamic Center', q:'masjid islamic center', group:'Komunitas' },
  { label:'⛪ Gereja',             q:'gereja',                  group:'Komunitas' },
  { label:'👥 Komunitas RT/RW',    q:'balai warga rw',          group:'Komunitas' },
  { label:'🏘 Perumahan',          q:'perumahan cluster',       group:'Komunitas' },
];

// ─────────────────────────────────────────────────────
async function renderMaps(){
  // Load API key from Supabase settings
  mapsState.apiKey = await loadMapsApiKey();

  const groups = [...new Set(MAP_CATEGORIES.map(c=>c.group))];

  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1>Maps Prospecting</h1>
        <p>Cari mitra potensial via Google Maps → simpan langsung ke Partner Database</p>
      </div>
    </div>

    <!-- Step 1: API Key -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:12px">🔑 Google Maps API Key</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input type="password" id="maps-key" class="table-search" style="flex:1;min-width:200px"
          placeholder="AIza... (Maps JavaScript API + Places API)"
          value="${mapsState.apiKey}">
        <button class="btn btn-ghost btn-sm" onclick="toggleMapsKey()">👁 Lihat</button>
        <button class="btn btn-teal btn-sm" onclick="connectMaps()">⚡ Sambungkan</button>
        <button class="btn btn-outline btn-sm" onclick="saveMapsApiKey()">💾 Simpan Permanen</button>
      </div>
      <div id="maps-conn-status" class="status-box ${mapsState.apiKey?'status-info':'status-warn'}"
        style="margin-top:8px">
        ${mapsState.apiKey ? '⏳ API key ditemukan, klik Sambungkan...' : '⚠️ API key belum diset. Masukkan key lalu klik Simpan Permanen.'}
      </div>
    </div>

    <!-- Step 2: Search Config -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:12px">📍 Area & Kategori</div>
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label>Area / Kota</label>
          <select id="maps-area" onchange="handleMapsArea()">
            ${MAP_AREAS.map(a=>`<option value="${a.val}">${a.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Radius</label>
          <select id="maps-radius">
            <option value="1000">1 km</option>
            <option value="2000">2 km</option>
            <option value="5000" selected>5 km</option>
            <option value="10000">10 km</option>
            <option value="20000">20 km</option>
          </select>
        </div>
        <div class="form-group" id="maps-lat-g" style="display:none">
          <label>Latitude</label><input type="text" id="maps-lat" placeholder="-6.2615">
        </div>
        <div class="form-group" id="maps-lng-g" style="display:none">
          <label>Longitude</label><input type="text" id="maps-lng" placeholder="106.7754">
        </div>
      </div>

      <div class="form-group">
        <label>Kategori Target</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-ghost btn-sm" onclick="selectAllCats(true)">☑ Semua</button>
          <button class="btn btn-ghost btn-sm" onclick="selectAllCats(false)">☐ Hapus Pilihan</button>
          ${groups.map(g=>`<button class="btn btn-ghost btn-sm" onclick="selectGroup('${g}')">${g}</button>`).join('')}
        </div>
        ${groups.map(g=>`
          <div style="margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;color:var(--gray);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">${g}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${MAP_CATEGORIES.filter(c=>c.group===g).map(c=>`
                <span class="chip on" data-q="${c.q}" data-group="${g}"
                  onclick="toggleChip(this)">${c.label}</span>
              `).join('')}
            </div>
          </div>`).join('')}
      </div>

      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-primary" id="maps-search-btn" onclick="startMapsSearch()" disabled>
          🔍 Cari Mitra
        </button>
        <span id="maps-selected-count" style="font-size:12px;color:var(--gray);align-self:center"></span>
      </div>

      <div id="maps-progress-wrap" style="display:none;margin-top:10px">
        <div style="background:var(--mint);border-radius:6px;height:7px;overflow:hidden">
          <div id="maps-prog" style="height:100%;background:var(--teal);width:0;border-radius:6px;transition:width .3s"></div>
        </div>
        <div id="maps-prog-txt" style="font-size:12px;color:var(--gray);margin-top:5px"></div>
      </div>
    </div>

    <!-- Results -->
    <div id="maps-results-section" style="display:none">
      <div class="table-wrap">
        <div class="table-toolbar">
          <div style="font-size:13px;font-weight:700;color:var(--navy)" id="maps-result-count"></div>
          <input class="table-search" id="maps-filter" placeholder="🔍 Filter hasil..." oninput="filterMapsResults(this.value)" style="max-width:220px">
          <div class="btn-row" style="margin-left:auto">
            <button class="btn btn-ghost btn-sm" onclick="toggleAllMapsSelect()">☑ Pilih Semua</button>
            <button class="btn btn-teal btn-sm" id="maps-import-btn" onclick="importSelectedToPartners()" disabled>
              ⬆ Import ke Partner DB
            </button>
          </div>
        </div>
        <div id="maps-results-table"></div>
      </div>
    </div>

    <div id="map-hidden" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></div>`;

  // Auto connect if key exists
  if(mapsState.apiKey){
    document.getElementById('maps-key').value = mapsState.apiKey;
    connectMaps();
  }

  updateCatCount();
}

// ── Chip toggle ───────────────────────────────────
function toggleChip(el){
  const on = el.classList.toggle('on');
  el.style.background = on ? 'var(--teal)' : '#fff';
  el.style.color = on ? '#fff' : 'var(--gray)';
  updateCatCount();
}

function selectAllCats(on){
  document.querySelectorAll('.chip[data-q]').forEach(c=>{
    c.classList.toggle('on', on);
    c.style.background = on ? 'var(--teal)' : '#fff';
    c.style.color = on ? '#fff' : 'var(--gray)';
  });
  updateCatCount();
}

function selectGroup(group){
  const chips = document.querySelectorAll(`.chip[data-group="${group}"]`);
  // Check if all already on
  const allOn = [...chips].every(c=>c.classList.contains('on'));
  chips.forEach(c=>{
    c.classList.toggle('on', !allOn);
    c.style.background = !allOn ? 'var(--teal)' : '#fff';
    c.style.color = !allOn ? '#fff' : 'var(--gray)';
  });
  updateCatCount();
}

function updateCatCount(){
  const count = document.querySelectorAll('.chip.on[data-q]').length;
  const el = document.getElementById('maps-selected-count');
  if(el) el.textContent = count ? `${count} kategori dipilih` : '';
}

// ── API Key management ────────────────────────────
function toggleMapsKey(){
  const i=document.getElementById('maps-key');
  i.type=i.type==='password'?'text':'password';
}

async function loadMapsApiKey(){
  try {
    const data = await sbGet('settings','select=value&key=eq.maps_api_key');
    return (data&&data[0]) ? data[0].value : (localStorage.getItem('ol_maps_key')||'');
  } catch(e){
    return localStorage.getItem('ol_maps_key')||'';
  }
}

async function saveMapsApiKey(){
  const key = document.getElementById('maps-key').value.trim();
  if(!key){ toast('API key kosong','err'); return; }

  localStorage.setItem('ol_maps_key', key);
  mapsState.apiKey = key;

  try {
    // Upsert ke tabel settings
    const existing = await sbGet('settings','select=id&key=eq.maps_api_key');
    if(existing && existing.length > 0){
      await sbPatch('settings', existing[0].id, { value: key, updated_at: new Date().toISOString() });
    } else {
      await sbPost('settings', { key: 'maps_api_key', value: key, label: 'Google Maps API Key' });
    }
    toast('✅ API key tersimpan permanen ke Supabase','ok');
  } catch(e){
    // Fallback to localStorage only
    toast('✅ API key tersimpan di browser (Supabase settings table belum ada)','warn');
  }
}

function handleMapsArea(){
  const c = document.getElementById('maps-area').value==='custom';
  document.getElementById('maps-lat-g').style.display=c?'flex':'none';
  document.getElementById('maps-lng-g').style.display=c?'flex':'none';
}

function getMapsCoords(){
  const v=document.getElementById('maps-area').value;
  if(v==='custom') return [
    parseFloat(document.getElementById('maps-lat').value||'-6.2615'),
    parseFloat(document.getElementById('maps-lng').value||'106.7754')
  ];
  return v.split(',').map(Number);
}

function showMapsStatus(type, msg){
  const el=document.getElementById('maps-conn-status');
  if(!el) return;
  el.style.display='block';
  el.className=`status-box status-${type}`;
  el.textContent=msg;
}

// ── Connect Maps SDK ──────────────────────────────
function connectMaps(){
  const key=(document.getElementById('maps-key')?.value||'').trim();
  if(!key){ showMapsStatus('err','⚠️ API key belum diisi'); return; }

  document.getElementById('gmsdk')?.remove();
  mapsState.ready=false; mapsState.service=null;
  showMapsStatus('info','⏳ Menghubungkan ke Google Maps...');

  const s=document.createElement('script'); s.id='gmsdk';
  s.src=`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=onMapsModuleReady&language=id`;
  s.onerror=()=>showMapsStatus('err','❌ Gagal. Pastikan Maps JavaScript API & Places API aktif, dan billing enabled.');
  document.head.appendChild(s);
}

window.onMapsModuleReady=function(){
  try {
    const [lat,lng]=getMapsCoords();
    const map=new google.maps.Map(document.getElementById('map-hidden'),{center:{lat,lng},zoom:13});
    mapsState.service=new google.maps.places.PlacesService(map);
    mapsState.ready=true;
    showMapsStatus('ok','✅ Google Maps terhubung! Pilih area & kategori lalu klik Cari Mitra.');
    document.getElementById('maps-search-btn').disabled=false;
    toast('✅ Maps terhubung','ok');
  } catch(e){ showMapsStatus('err','❌ '+e.message); }
};

// ── Search ────────────────────────────────────────
async function startMapsSearch(){
  if(!mapsState.ready){ toast('⚠️ Sambungkan Maps dulu','err'); return; }
  const chips=[...document.querySelectorAll('.chip.on[data-q]')];
  if(!chips.length){ toast('⚠️ Pilih minimal 1 kategori','err'); return; }

  mapsState.results=[];
  mapsState.selected=new Set();
  document.getElementById('maps-results-section').style.display='none';
  document.getElementById('maps-search-btn').disabled=true;
  document.getElementById('maps-search-btn').textContent='⏳ Mencari...';
  document.getElementById('maps-progress-wrap').style.display='block';

  const [lat,lng]=getMapsCoords();
  const radius=parseInt(document.getElementById('maps-radius').value);
  const center=new google.maps.LatLng(lat,lng);
  const kws=chips.map(c=>c.dataset.q);

  for(let i=0;i<kws.length;i++){
    document.getElementById('maps-prog-txt').textContent=`Mencari "${kws[i]}"... (${i+1}/${kws.length})`;
    document.getElementById('maps-prog').style.width=Math.round((i/kws.length)*100)+'%';
    await mapsSearchKw(center,radius,kws[i]);
    await delayMs(300);
  }

  document.getElementById('maps-prog').style.width='100%';
  document.getElementById('maps-prog-txt').textContent=`✅ ${mapsState.results.length} lokasi ditemukan`;
  document.getElementById('maps-search-btn').disabled=false;
  document.getElementById('maps-search-btn').textContent='🔍 Cari Mitra';

  renderMapsResults(mapsState.results);
}

function mapsSearchKw(center,radius,kw){
  return new Promise(resolve=>{
    function handle(results,status,pag){
      if(status===google.maps.places.PlacesServiceStatus.OK&&results){
        results.forEach(p=>{
          if(!mapsState.results.find(r=>r.place_id===p.place_id)){
            mapsState.results.push({
              place_id:p.place_id, name:p.name,
              address:p.vicinity||'', category:kw,
              phone:'', rating:p.rating||'', reviews:p.user_ratings_total||0,
              lat:p.geometry?.location?.lat()||'',
              lng:p.geometry?.location?.lng()||'',
              db_id: null,   // akan diisi saat cek duplikat
              in_db: false,  // sudah ada di DB?
            });
          }
        });
        if(pag?.hasNextPage) setTimeout(()=>pag.nextPage(),2000); else resolve();
      } else resolve();
    }
    mapsState.service.nearbySearch({location:center,radius,keyword:kw,language:'id'},handle);
  });
}

// ── Render results dengan status in_db ────────────
async function renderMapsResults(results){
  const section=document.getElementById('maps-results-section');
  section.style.display='block';
  document.getElementById('maps-result-count').textContent=`${results.length} lokasi ditemukan — cek status DB...`;
  document.getElementById('maps-results-table').innerHTML=
    '<div class="loading-row"><div class="spinner"></div> Cek duplikat di database...</div>';

  // Cek semua di DB sekaligus
  try {
    const allNames = results.map(r=>r.name);
    const existing = await sbGet('partners',`select=id,partner_name,phone&partner_name=in.(${allNames.map(n=>`"${n.replace(/"/g,'\\"')}"`).join(',')})`);
    const existMap = {};
    (existing||[]).forEach(p=>{ existMap[p.partner_name]={id:p.id,phone:p.phone}; });
    results.forEach(r=>{
      if(existMap[r.name]){
        r.in_db=true;
        r.db_id=existMap[r.name].id;
        r.db_phone=existMap[r.name].phone;
      }
    });
  } catch(e){ /* continue without db check */ }

  const inDB  = results.filter(r=>r.in_db).length;
  const notDB = results.length - inDB;
  document.getElementById('maps-result-count').innerHTML=
    `<span>${results.length} lokasi</span>
     <span class="badge badge-green" style="margin-left:8px">${notDB} baru</span>
     <span class="badge badge-gray" style="margin-left:4px">${inDB} sudah di DB</span>`;

  if(!results.length){
    document.getElementById('maps-results-table').innerHTML=
      '<div class="empty-state"><div class="ico">🔍</div><h3>Tidak ada hasil</h3></div>';
    return;
  }

  document.getElementById('maps-results-table').innerHTML=`
    <table>
      <thead><tr>
        <th><input type="checkbox" id="chk-all" onchange="toggleAllMapsChk(this.checked)"></th>
        <th>#</th><th>Nama & Status</th><th>Kategori</th><th>Alamat</th>
        <th>Telepon</th><th>Rating</th><th>Aksi</th>
      </tr></thead>
      <tbody>
        ${results.map((r,i)=>`
          <tr id="mrow-${i}" style="${r.in_db?'background:#FAFFF9':''}">
            <td><input type="checkbox" class="maps-chk" data-idx="${i}"
              onchange="toggleMapsSelect(${i},this.checked)"
              ${r.in_db&&r.db_phone?'disabled title="Sudah ada & punya telepon"':''}></td>
            <td style="color:#bbb;font-size:11px">${i+1}</td>
            <td>
              <div class="td-name">${r.name}</div>
              ${r.in_db
                ? `<span class="badge badge-green" style="font-size:10px">✓ Ada di DB${!r.db_phone?' · belum ada telepon':''}</span>`
                : `<span class="badge badge-gold" style="font-size:10px">Baru</span>`}
            </td>
            <td><span class="badge badge-gray" style="font-size:11px">${catIcon(r.category)} ${r.category}</span></td>
            <td style="font-size:12px;color:var(--gray);max-width:200px">${r.address}</td>
            <td id="mphone-${i}" class="td-phone">
              ${r.phone ? r.phone
                : r.in_db && r.db_phone ? `<span style="color:var(--gray)">${r.db_phone} (DB)</span>`
                : `<button class="act-btn" onclick="fetchMapsPhone(${i})" style="font-size:11px">📞 Ambil</button>`}
            </td>
            <td>${r.rating?`⭐${r.rating} <span style="color:#ccc;font-size:11px">(${r.reviews})</span>`:'—'}</td>
            <td>
              <div class="act-row">
                <button class="act-btn maps" onclick="window.open('https://www.google.com/maps/place/?q=place_id:${r.place_id}','_blank')" title="Buka Maps">🗺</button>
                ${r.in_db
                  ? `<button class="act-btn edit" onclick="openPartnerForm(${r.db_id})" title="Edit di DB">✏️</button>`
                  : `<button class="act-btn" onclick="importOne(${i})" title="Import satu">⬆</button>`}
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function filterMapsResults(q){
  const rows=document.querySelectorAll('#maps-results-table tbody tr');
  rows.forEach(row=>{
    const text=row.textContent.toLowerCase();
    row.style.display=!q||text.includes(q.toLowerCase())?'':'none';
  });
}

// ── Phone fetch with smart update ─────────────────
function fetchMapsPhone(idx){
  if(!mapsState.ready){ toast('Maps belum tersambung','err'); return; }
  const r=mapsState.results[idx];
  const btn=document.querySelector(`#mrow-${idx} .act-btn`);
  if(btn){ btn.textContent='⏳'; btn.disabled=true; }

  mapsState.service.getDetails({placeId:r.place_id,fields:['formatted_phone_number']},(result,status)=>{
    if(status===google.maps.places.PlacesServiceStatus.OK){
      const ph=result.formatted_phone_number||'';
      if(!ph){ toast('Nomor tidak tersedia di Google','warn'); if(btn){btn.textContent='📞 Ambil';btn.disabled=false;} return; }

      mapsState.results[idx].phone=ph;
      const cell=document.getElementById(`mphone-${idx}`);
      if(cell) cell.innerHTML=`<span class="td-phone">${ph}</span>`;

      // Jika sudah di DB → update langsung
      if(r.in_db && r.db_id){
        updatePartnerPhone(r.db_id, ph, r.name);
      } else {
        toast('📞 '+ph+' — klik Import untuk simpan ke DB','info');
      }
    } else {
      toast('Nomor tidak tersedia','warn');
      if(btn){btn.textContent='📞 Ambil';btn.disabled=false;}
    }
  });
}

async function updatePartnerPhone(id, phone, name){
  try {
    await sbPatch('partners', id, { phone, updated_at: new Date().toISOString() });
    await logActivity('update', 'partners', id, `Telepon diupdate dari Maps: ${phone}`, name);
    toast(`✅ Telepon ${name} diupdate ke DB`,'ok');
  } catch(e){ toast('❌ Gagal update telepon: '+e.message,'err'); }
}

// ── Select / Import ───────────────────────────────
function toggleMapsSelect(idx,checked){
  if(checked) mapsState.selected.add(idx); else mapsState.selected.delete(idx);
  updateImportBtn();
}

function toggleAllMapsChk(checked){
  document.querySelectorAll('.maps-chk:not(:disabled)').forEach(chk=>{
    chk.checked=checked;
    const idx=parseInt(chk.dataset.idx);
    if(checked) mapsState.selected.add(idx); else mapsState.selected.delete(idx);
  });
  updateImportBtn();
}

function toggleAllMapsSelect(){
  const chks=[...document.querySelectorAll('.maps-chk:not(:disabled)')];
  const allOn=chks.every(c=>c.checked);
  chks.forEach(c=>{ c.checked=!allOn; toggleMapsSelect(parseInt(c.dataset.idx),!allOn); });
  const allChk=document.getElementById('chk-all');
  if(allChk) allChk.checked=!allOn;
}

function updateImportBtn(){
  const btn=document.getElementById('maps-import-btn');
  if(!btn) return;
  const n=mapsState.selected.size;
  btn.disabled=n===0;
  btn.textContent=n ? `⬆ Import ${n} ke Partner DB` : '⬆ Import ke Partner DB';
}

async function importOne(idx){
  mapsState.selected=new Set([idx]);
  await importSelectedToPartners();
}

async function importSelectedToPartners(){
  if(!mapsState.selected.size){ toast('Pilih minimal 1 lokasi','warn'); return; }
  const btn=document.getElementById('maps-import-btn');
  if(btn){ btn.disabled=true; btn.textContent='⏳ Mengimport...'; }

  const toImport=[...mapsState.selected].map(i=>mapsState.results[i]);
  let added=0, updated=0, skipped=0;

  for(const r of toImport){
    try {
      if(r.in_db){
        // Sudah ada → skip (telepon sudah dihandle oleh fetchMapsPhone)
        skipped++; continue;
      }

      const catMapped = mapCategoryFromQuery(r.category||'');
      const payload = {
        partner_code: autoCode(catMapped),
        partner_name: r.name||'',
        category:     catMapped,
        phone:        r.phone||'',
        address:      r.address||'',
        latitude:     r.lat ? String(r.lat) : '',
        longitude:    r.lng ? String(r.lng) : '',
        rating:       r.rating||null,
        total_reviews:r.reviews||0,
        status:       'Prospect',
        notes:        `Import dari Google Maps ${new Date().toLocaleDateString('id-ID')}`,
      };

      const result = await sbPost('partners', payload);
      if(result && result[0]){
        await logActivity('create','partners', result[0].id,
          `Import dari Maps Prospecting`, r.name);
        // Update status di UI
        mapsState.results.findIndex((x,i)=>i===[...mapsState.selected].find(s=>mapsState.results[s]===r));
        r.in_db=true;
        r.db_id=result[0].id;
        added++;
      }
    } catch(e){ skipped++; console.error(e); }
  }

  if(btn){ btn.disabled=false; btn.textContent='⬆ Import ke Partner DB'; }
  mapsState.selected=new Set();

  if(added>0 || updated>0){
    toast(`✅ ${added} ditambahkan, ${updated} diupdate, ${skipped} dilewati`,'ok');
    await loadPartners(); // refresh partner list
    // Re-render results to update badges
    renderMapsResults(mapsState.results);
  } else {
    toast(`ℹ️ ${skipped} sudah ada di database`,'info');
  }
}

// ── Activity Log helper ───────────────────────────
async function logActivity(action, table, recordId, description, name=''){
  try {
    await sbPost('activity_logs',{
      action,
      table_name: table,
      record_id:  String(recordId),
      description,
      record_name: name,
      created_at: new Date().toISOString(),
    });
  } catch(e){ /* log silently */ }
}

// ── Helpers ───────────────────────────────────────
function mapCategoryFromQuery(q){
  if(!q) return 'Lainnya';
  q=q.toLowerCase();
  if(q.includes('apotek')||q.includes('farmasi')||q.includes('guardian')||q.includes('century')) return 'Apotek';
  if(q.includes('klinik utama'))   return 'Klinik Utama';
  if(q.includes('klinik'))         return 'Klinik Pratama';
  if(q.includes('spesialis jantung')) return 'Dokter Spesialis';
  if(q.includes('spesialis saraf'))   return 'Dokter Spesialis';
  if(q.includes('spesialis')||q.includes('kandungan')) return 'Dokter Spesialis';
  if(q.includes('anak'))           return 'Dokter Spesialis';
  if(q.includes('gigi'))           return 'Klinik Gigi';
  if(q.includes('mata'))           return 'Klinik Mata';
  if(q.includes('dokter'))         return 'Dokter Praktik';
  if(q.includes('puskesmas'))      return 'Puskesmas';
  if(q.includes('rumah sakit')||q.includes('hospital')) return 'Rumah Sakit';
  if(q.includes('laboratorium')||q.includes('lab'))     return 'Lab Klinik';
  if(q.includes('gym')||q.includes('fitness'))  return 'Gym & Sport Club';
  if(q.includes('yoga')||q.includes('pilates')) return 'Gym & Sport Club';
  if(q.includes('kolam renang'))   return 'Gym & Sport Club';
  if(q.includes('golf'))           return 'Gym & Sport Club';
  if(q.includes('cycling')||q.includes('sepeda')) return 'Komunitas';
  if(q.includes('running')||q.includes('lari'))   return 'Komunitas';
  if(q.includes('spa')||q.includes('wellness'))   return 'Gym & Sport Club';
  if(q.includes('universitas')||q.includes('kampus')) return 'Sekolah / Kampus';
  if(q.includes('sekolah')||q.includes('pesantren'))  return 'Sekolah / Kampus';
  if(q.includes('masjid')||q.includes('gereja'))  return 'Komunitas';
  if(q.includes('perumahan')||q.includes('balai')) return 'Komunitas';
  if(q.includes('pabrik')||q.includes('industri')) return 'Perusahaan SME';
  if(q.includes('kantor')||q.includes('mall'))     return 'Perusahaan SME';
  return 'Lainnya';
}

function autoCode(cat){
  const prefix={
    'Apotek':'APT','Klinik Pratama':'KLN','Klinik Utama':'KLU',
    'Dokter Praktik':'DKT','Dokter Spesialis':'DSP',
    'Klinik Gigi':'KGG','Klinik Mata':'KMT',
    'Puskesmas':'PKM','Rumah Sakit':'RSK','Lab Klinik':'LAB',
    'Perusahaan SME':'PRS','Komunitas':'KOM',
    'Sekolah / Kampus':'SKL','Gym & Sport Club':'GYM','Lainnya':'LNY'
  };
  return `${prefix[cat]||'PTN'}-${Date.now().toString().slice(-5)}`;
}

function delayMs(ms){ return new Promise(r=>setTimeout(r,ms)); }
