const fs = require('fs');
const path = 'D:\\codex_project\\xls\\app.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add burstHearts function before Welcome screen
const burstFunc = `
// --- Heart burst explosion effect ---
function burstHearts(container, count) {
  const emojis = ["\u2764\uFE0F\u200D\u{1F525}","\u{1F496}","\u{1F497}","\u{1FA77}","\u{1FAE1}","\u2728","\u{1F338}","\u{1F49D}","\u{1F498}","\u{1F493}"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "burst-heart";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.fontSize = (14 + Math.random() * 24) + "px";
    el.style.setProperty("--dx", dx + "vw");
    el.style.setProperty("--dy", dy + "vh");
    el.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    const dur = 1.5 + Math.random() * 1.5;
    el.style.animationDuration = dur + "s";
    el.style.animationDelay = (Math.random() * 0.4) + "s";
    container.appendChild(el);
    setTimeout(() => el.remove(), (dur + 0.5) * 1000);
  }
}`;
const marker = '// ============================================================\n// Welcome screen';
content = content.replace(marker, burstFunc.trim() + '\n\n' + marker);

// 2. Replace result screen template
const tplStart = content.indexOf('<section class="screen result-screen"');
const tplEnd = content.indexOf('</section>', tplStart);
const tplEndFull = content.indexOf('`;', tplEnd);
const oldTpl = content.substring(tplStart - 14, tplEndFull + 2);
const newTpl = `root.innerHTML = \`
    <section class="screen result-screen" data-testid="result">
      <canvas class="welcome-canvas" data-testid="result-canvas"></canvas>
      <div class="hearts-container" data-testid="hearts"></div>
      <div class="score-appear" style="z-index:2; position:relative;">
        <p class="name-title">\${APP_CONTENT.name}</p>
        <p class="score-label">\${APP_CONTENT.scoreLabel}</p>
        <p class="score-number" data-testid="score">\${score}</p>
      </div>
      <div class="confession-list" style="z-index:2; position:relative;">
        \${confession.map(l => \`<p class="confession-line">\${escapeHtml(l)}</p>\`).join("")}
        <p class="closing-line">\${APP_CONTENT.closingLine}</p>
      </div>
      <p class="confess-question" style="z-index:2; position:relative;">\u4F60\u613F\u610F\u505A\u6211\u5973\u670B\u53CB\u5417\uFF1F</p>
      <button type="button" class="btn primary confess-btn" data-testid="play-music">\u6211\u613F\u610F \u{1F496}</button>
    </section>
  \`;`;
content = content.replace(oldTpl, newTpl);

// 3. Replace Love Story audio with Baby MP3
content = content.replace(
  '// Love Story audio\n  if (!resultAudio) {\n    resultAudio = new Audio("Taylor Swift - Love Story.mp3");',
  '// Baby MP3 audio\n  if (!resultAudio) {\n    resultAudio = new Audio("Baby-Justin Bieber%23sNjcY.mp3");'
);

// 4. Replace auto-play + click handler
const handlerStart = content.indexOf('// Auto-play Love Story');
const handlerEnd = content.indexOf('\n}\n', handlerStart);
const oldHandler = content.substring(handlerStart, handlerEnd);
const newHandler = `playBtn.addEventListener("click", () => {
    playBtn.textContent = "\u{1F496} \u6211\u613F\u610F\uFF01";
    playBtn.style.background = "linear-gradient(135deg, #ff6b8a, #ff8da1)";
    playBtn.style.color = "#fff";
    playBtn.style.borderColor = "#ff6b8a";
    playBtn.style.animation = "btn-glow 1.5s ease-in-out infinite";
    const heartsContainer = root.querySelector("[data-testid='hearts']");
    if (heartsContainer) {
      burstHearts(heartsContainer, 60);
      setTimeout(() => burstHearts(heartsContainer, 40), 600);
      setTimeout(() => burstHearts(heartsContainer, 30), 1200);
    }
    resultAudio.play().catch(() => {});
    startHearts();
  });`;
content = content.replace(oldHandler, newHandler);

// 5. Remove resultAudio pause in visibilitychange
content = content.replace(
  '    RomanticBGM.stop();\n    if (resultAudio && !resultAudio.paused) {\n      resultAudio.pause();\n    }',
  '    RomanticBGM.stop();'
);

// 6. Remove old playBtn sync in visibilitychange
content = content.replace(
  `  updateMusicBtn();
  const playBtn = document.querySelector("[data-testid='play-music']");
  if (playBtn && resultAudio) {
    playBtn.textContent = resultAudio.paused ? "\ud83c\udfb5 \u64ad\u653e Love Story" : "\u6682\u505c Love Story \u23f8";
  }`,
  '  updateMusicBtn();'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done - all changes applied');
