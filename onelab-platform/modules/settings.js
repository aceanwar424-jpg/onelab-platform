async function renderSettings() {
  document.getElementById('main-content').innerHTML = `
    <div class="page-header">
      <div><h1>Pengaturan</h1><p>Konfigurasi sistem, pengguna, dan koneksi</p></div>
    </div>

    <div class="tabs" id="set-tabs">
      <button class="tab-btn active" onclick="switchSetTab('general',this)">⚙️ Umum</button>
      <button class="tab-btn" onclick="switchSetTab('users',this)">👥 Pengguna</button>
      <button class="tab-btn" onclick="switchSetTab('activity',this)">📋 Log Aktivitas</button>
      <button class="tab-btn" onclick="switchSetTab('data',this)">🗄 Data</button>
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
    </div>`;

  checkSetConn();
  loadSetStats();
}

function switchSetTab(tab, btn) {
  document.querySelectorAll('#set-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  ['general','users','activity','data'].forEach(t=>{
    document.getElementById(`set-${t}`).style.display = t===tab?'block':'none';
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
