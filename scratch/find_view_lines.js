const fs = require('fs');
const path = require('path');
const htmlPath = path.join(__dirname, '..', 'ava-platform', 'apps', 'index.html');
const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.includes('class="view-panel') || line.includes('id="ava-') || line.includes('id="toko-') || line.includes('id="medrec-')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
