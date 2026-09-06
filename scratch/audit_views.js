const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'ava-platform', 'apps', 'index.html');
const jsPath = path.join(__dirname, '..', 'ava-platform', 'apps', 'app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// Find all showView calls in JS
const showViewRegex = /showView\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g;
let match;
const jsViews = new Map();
while ((match = showViewRegex.exec(js)) !== null) {
  jsViews.set(match[1], match[2]);
}

console.log('--- VIEWS REFERENCED IN APP.JS ---');
for (const [viewId, title] of jsViews.entries()) {
  const hasIdInHtml = html.includes(`id="${viewId}"`);
  console.log(`View ID: ${viewId} | Title: "${title}" | Exists in index.html: ${hasIdInHtml}`);
}

// Find view contents in index.html
console.log('\n--- CHECKING CONTENT OF VIEWS IN INDEX.HTML ---');
for (const [viewId, title] of jsViews.entries()) {
  const idx = html.indexOf(`id="${viewId}"`);
  if (idx !== -1) {
    const snippet = html.substring(idx, idx + 400).replace(/\s+/g, ' ');
    console.log(`[${viewId}]: ${snippet.substring(0, 150)}...`);
  } else {
    console.log(`[${viewId}]: MISSING ENTIRELY FROM HTML!`);
  }
}
