import re

with open(r'D:\codex_project\xls\app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add burstHearts function before Welcome screen
burst_func = """
// --- Heart burst explosion effect ---
function burstHearts(container, count) {
  const emojis = ["\u2764\ufe0f\ud83d\udd25","\ud83d\udc96","\ud83d\udc97","\ud83e\ude77","\ud83e\udde1","\u2728","\ud83c\udf38","\ud83d\udc9d","\ud83d\udc98","\ud83d\udc93"];
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
}
"""
marker = "// ============================================================\n// Welcome screen"
content = content.replace(marker, burst_func.strip() + "\n\n" + marker)

# 2. Replace result screen template
old_tpl_marker1 = 'root.innerHTML = `'
old_tpl_marker2 = '`;'
idx1 = content.find(old_tpl_marker1)
idx1 = content.find('<section class="screen result-screen"', idx1)
idx2 = content.find('</section>', idx1)
idx2 = content.find(old_tpl_marker2, idx2)
old_tpl = content[idx1 - 14:idx2 + 2]

new_tpl = """root.innerHTML = `
    <section class="screen result-screen" data-testid="result">
      <canvas class="welcome-canvas" data-testid="result-canvas"></canvas>
      <div class="hearts-container" data-testid="hearts"></div>
      <div class="score-appear" style="z-index:2; position:relative;">
        <p class="name-title">${APP_CONTENT.name}</p>
        <p class="score-label">${APP_CONTENT.scoreLabel}</p>
        <p class="score-number" data-testid="score">${score}</p>
      </div>
      <div class="confession-list" style="z-index:2; position:relative;">
        ${confession.map(l => `<p class="confession-line">${escapeHtml(l)}</p>`).join("")}
        <p class="closing-line">${APP_CONTENT.closingLine}</p>
      </div>
      <p class="confess-question" style="z-index:2; position:relative;">\u4f60\u613f\u610f\u505a\u6211\u5973\u670b\u53cb\u5417\uff1f</p>
      <button type="button" class="btn primary confess-btn" data-testid="play-music">\u6211\u613f\u610f \ud83d\udc96</button>
    </section>
  `;"""

content = content.replace(old_tpl, new_tpl)

# 3. Replace Love Story audio with Baby MP3
content = content.replace(
    '// Love Story audio\n  if (!resultAudio) {\n    resultAudio = new Audio("Taylor Swift - Love Story.mp3");',
    '// Baby MP3 audio\n  if (!resultAudio) {\n    resultAudio = new Audio("Baby-Justin Bieber%23sNjcY.mp3");'
)

# 4. Replace auto-play + click handler block
old_handler_start = content.find('// Auto-play Love Story')
# Find the closing }); of the last addEventListener in this block
# Look for the pattern: the handler ends before the closing "}" of renderResult
old_handler_end = content.find('\n}\n', old_handler_start)
old_handler = content[old_handler_start:old_handler_end]

new_handler = """playBtn.addEventListener("click", () => {
    playBtn.textContent = "\ud83d\udc96 \u6211\u613f\u610f\uff01";
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
  });"""

content = content.replace(old_handler, new_handler)

# 5. Remove resultAudio pause in visibilitychange
content = content.replace(
    '    RomanticBGM.stop();\n    if (resultAudio && !resultAudio.paused) {\n      resultAudio.pause();\n    }',
    '    RomanticBGM.stop();'
)

# 6. Remove old playBtn sync in visibilitychange  
old_sync = '''  updateMusicBtn();
  const playBtn = document.querySelector("[data-testid='play-music']");
  if (playBtn && resultAudio) {
    playBtn.textContent = resultAudio.paused ? "\ud83c\udfb5 \u64ad\u653e Love Story" : "\u6682\u505c Love Story \u23f8";
  }'''
content = content.replace(old_sync, '  updateMusicBtn();')

with open(r'D:\codex_project\xls\app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - all changes applied')
