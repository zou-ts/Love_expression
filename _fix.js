const fs = require('fs');
let c = fs.readFileSync(String.raw`D:\codex_project\xls\app.js`, 'utf8');

const old = '              <span class="option-text">${escapeHtml(opt)}</span>\r\n            </button>';
const rep = '              <span class="option-text">${escapeHtml(opt)}</span>\r\n              <img class="option-mark" src="dog-heart.png" alt="love">\r\n            </button>';

if (c.includes(old)) {
  c = c.replace(old, rep);
  fs.writeFileSync(String.raw`D:\codex_project\xls\app.js`, c, 'utf8');
  console.log('Done');
} else {
  console.log('Still not found');
}
