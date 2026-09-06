// Public/operational boundary and deploy asset contract regression checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ava-platform/portal.html'), 'utf8');
const domain = JSON.parse(fs.readFileSync(path.join(root,'config/domain.json'), 'utf8'));
const web = domain.situs.find(s => s.kunci === 'web');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
for (const m of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(m[1]), `Missing anchor ${m[1]}`);
for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
  const asset = m[1];
  const file = asset.split('#')[0];
  assert(fs.existsSync(path.join(root,'ava-platform',file)), `Missing asset ${asset}`);
  assert(web.berkas.some(entry => entry === file || (entry.endsWith('/') && file.startsWith(entry))), `Asset excluded from standalone export ${asset}`);
}
assert(!/type="password"|SUPABASE|localStorage|handleSSOLogin|mock_token/i.test(html), 'Public page must not authenticate or store sessions');
assert.equal((html.match(/<form\b/g)||[]).length, 0, 'Homepage is a concise company introduction');
const appLinks = [...html.matchAll(/href="(https:\/\/[^"\s]*avahealth\.sbs[^"\s]*)"/g)].map(m => m[1]);
assert.deepEqual([...new Set(appLinks)].sort(), ['https://apps.avahealth.sbs/', 'https://www.avahealth.sbs/']);
assert((html.match(/<section\b/g)||[]).length <= 4, 'Homepage must stay concise');
const nav = html.match(/<nav id="navigation"[\s\S]*?<\/nav>/)[0];
assert(!/href="#|href="portal\.html#/.test(nav), 'Primary navigation must open separate pages');
for(const file of ['tentang','ekosistem','solusi','jurnal','kontak','kemitraan']) assert(nav.includes(`public/${file}.html`));
assert.equal(web.masuk,'/portal.html');
console.log('PASS: concise homepage, separate menu pages, unique IDs, assets/export, single apps login, no public authentication.');
