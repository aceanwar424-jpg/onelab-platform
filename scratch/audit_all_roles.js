const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'ava-platform', 'apps', 'index.html');
const jsPath = path.join(__dirname, '..', 'ava-platform', 'apps', 'app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// Regex to capture showView calls
const showViewRegex = /showView\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\)/g;
let match;
const allShowViews = new Set();
while ((match = showViewRegex.exec(js)) !== null) {
  allShowViews.add(match[1]);
}

console.log(`=== AUDITING ALL ${allShowViews.size} VIEW PANELS REFERENCED IN APP.JS ===\n`);

let missingViews = 0;
let emptyViews = 0;

for (const viewId of allShowViews) {
  const idPattern = `id="${viewId}"`;
  if (!html.includes(idPattern)) {
    console.log(`❌ CRITICAL MISSING VIEW IN INDEX.HTML: ${viewId}`);
    missingViews++;
  } else {
    // Check if view has inner content
    const startIdx = html.indexOf(idPattern);
    const endIdx = html.indexOf('</div>', startIdx);
    const snippet = html.substring(startIdx, startIdx + 300);
    
    // Extract inner HTML between > and </div>
    const tagEnd = html.indexOf('>', startIdx);
    const nextDiv = html.indexOf('</div>', tagEnd);
    const innerContent = html.substring(tagEnd + 1, nextDiv).trim();

    if (!innerContent) {
      console.log(`⚠️ EMPTY VIEW CONTAINER: ${viewId}`);
      emptyViews++;
    } else {
      console.log(`✅ OK VIEW: ${viewId}`);
    }
  }
}

console.log(`\nSummary: Missing Views = ${missingViews}, Empty Views = ${emptyViews}`);
