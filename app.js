const root = document.getElementById("app");
let selectedAnswers = [];
let resultAudio = null;
let loveStoryAudio = null;

function escapeHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); 
}

// Music toggle removed

// --- Petal effect ---
function spawnPetals() {
  const container = root.querySelector("[data-testid='petals']");
  if (!container) return;
  const petals = ["🌸", "🩷", "💮", "✿", "❀", "🎀", "✨"];
  let count = 0;
  const max = 12;
  function addPetal() {
    if (count >= max) return;
    const el = document.createElement("span");
    el.className = "petal";
    el.textContent = petals[Math.floor(Math.random() * petals.length)];
    el.style.left = Math.random() * 100 + "%";
    el.style.fontSize = (12 + Math.random() * 18) + "px";
    el.style.setProperty("--drift", (Math.random() - 0.5) * 200 + "px");
    el.style.setProperty("--spin", (360 + Math.random() * 360) + "deg");
    el.style.animationDuration = (6 + Math.random() * 6) + "s";
    container.appendChild(el);
    count++;
    setTimeout(addPetal, 600 + Math.random() * 800);
  }
  addPetal();
}



// --- Heart burst explosion effect ---
function burstHearts(container, count) {
  const emojis = ["❤️","💖","💗","🩷","🫡","✨","🌸","💝","💘","💓"];
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

// ============================================================
// Welcome screen
// ============================================================
function renderWelcome() {
  selectedAnswers = [];
  root.innerHTML = `
    <section class="screen welcome" data-testid="welcome">
      <canvas class="welcome-canvas" data-testid="particle-canvas"></canvas>
      <div class="welcome-deco">🐾</div>
      <button type="button" class="btn primary" data-testid="start-button">${APP_CONTENT.startButton}</button>
    </section>
  `;
  var pCanvas = root.querySelector("[data-testid='particle-canvas']");
  if (pCanvas && typeof initParticles === "function") {
    initParticles(pCanvas, {
      count: 180, mouseRadius: 160, mouseForce: 0.3, driftSpeed: 0.15,
      colors: [[255,182,193],[255,141,161],[255,218,225],[255,255,240],[255,200,210],[255,170,180],[255,240,245],[245,200,220]]
    }).start();
  }
  root.querySelector("[data-testid='start-button']").addEventListener("click", () => {
    // Start romantic BGM when quiz begins
    RomanticBGM.start();
    renderQuestion(0);
  });
}

// ============================================================
// Question screen
// ============================================================
function renderQuestion(index, skipAnimation) {
  const question = APP_CONTENT.questions[index];
  const selectedValue = selectedAnswers[index] ?? null;
  const total = APP_CONTENT.questions.length;
  const progress = ((index + 1) / total) * 100;

  root.innerHTML = `
    <section class="screen question${skipAnimation ? ' no-anim' : ''}" data-testid="question">
      <div class="card">
        <p class="question-counter">${index + 1} / ${total}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options" data-testid="options">
          ${question.options.map((opt, i) => `
            <button type="button" class="option${opt === selectedValue ? ' selected' : ''}" data-testid="option" data-index="${i}">
              <span class="option-text">${escapeHtml(opt)}</span>
              <img class="option-mark" src="dog-heart.png" alt="love">
            </button>`).join("")}
        </div>
        <p class="choice-hint hidden" data-testid="choice-hint">${APP_CONTENT.emptyChoiceHint}</p>
        <div class="nav-btns">
          ${index > 0 ? `<button type="button" class="btn secondary prev-btn" data-testid="prev-button">上一题</button>` : ''}
          <button type="button" class="btn primary next-btn" data-testid="next-button">${APP_CONTENT.nextButton}</button>
        </div>
      </div>
    </section>
  `;

  // Floating music toggle

  const buttons = root.querySelectorAll("[data-testid='option']");
  const hint = root.querySelector("[data-testid='choice-hint']");
  const nextBtn = root.querySelector("[data-testid='next-button']");
  const prevBtn = root.querySelector("[data-testid='prev-button']");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedAnswers[index] = question.options[Number(btn.dataset.index)];
      renderQuestion(index, true);
    });
  });

  nextBtn.addEventListener("click", () => {
    if (!selectedValue) { hint.classList.remove("hidden"); return; }
    if (index < APP_CONTENT.questions.length - 1) {
      renderQuestion(index + 1);
    } else {
      renderCatPaw();
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => renderQuestion(index - 1, true));
  }
}

// ============================================================
// Cat paw screen
// ============================================================
function renderCatPaw() {
  root.innerHTML = `
    <section class="screen cat-paw-screen" data-testid="cat-paw">
      <p class="cat-paw-hint">点击小猫爪，看看你的答案～</p>
      <div class="cat-paw-wrap" data-testid="cat-paw-btn">
        <div class="cat-paw">
          <div class="paw-toe paw-toe-1"></div>
          <div class="paw-toe paw-toe-2"></div>
          <div class="paw-toe paw-toe-3"></div>
          <div class="paw-toe paw-toe-4"></div>
          <div class="paw-pad-main"></div>
        </div>
      </div>
    </section>
  `;
  root.querySelector("[data-testid='cat-paw-btn']").addEventListener("click", () => {
    RomanticBGM.stop();
    if (!loveStoryAudio) {
      loveStoryAudio = new Audio("LoveStory.mp3");
      loveStoryAudio.loop = true;
      loveStoryAudio.volume = 0.6;
    }
    loveStoryAudio.currentTime = 0;
    loveStoryAudio.play().catch(function(){});
    renderResult();
  });
}

// ============================================================
// Result screen — switch to Love Story MP3
// ============================================================
function renderResult() {
  // Stop the romantic BGM
  RomanticBGM.stop();

  const score = APP_CONTENT.scoreTotal;
  const confession = APP_CONTENT.confession || [];

  root.innerHTML = `
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
      <p class="confess-question" style="z-index:2; position:relative;">你愿意做我女朋友吗？</p>
      <button type="button" class="btn primary confess-btn" data-testid="play-music">我愿意 💖</button>
    </section>
  `;

  // Particles
  var rCanvas = root.querySelector("[data-testid='result-canvas']");
  if (rCanvas && typeof initParticles === "function") {
    initParticles(rCanvas, {
      count: 100, mouseRadius: 120, mouseForce: 0.2, driftSpeed: 0.12,
      colors: [[255,182,193],[255,141,161],[255,218,225],[255,255,240],[255,200,210],[255,170,180]]
    }).start();
  }

  // Love Story audio - already started in cat paw click handler
  if (!loveStoryAudio) {
    loveStoryAudio = new Audio("LoveStory.mp3");
    loveStoryAudio.loop = true;
    loveStoryAudio.volume = 0.6;
    loveStoryAudio.play().catch(() => {});
  }

  // Baby MP3 audio - played on confession click
  if (!resultAudio) {
    resultAudio = new Audio("Baby.mp3");
    resultAudio.loop = true;
    resultAudio.volume = 0.6;
  }

  const playBtn = root.querySelector("[data-testid='play-music']");
  let heartsTimer = null;
  let heartsActive = false;

  function startHearts() {
    if (heartsActive) return;
    heartsActive = true;
    (function spawnOne() {
      if (!heartsActive) return;
      const container = root.querySelector("[data-testid='hearts']");
      if (!container) return;
      const el = document.createElement("span");
      el.className = "float-heart";
      el.textContent = ["💖","💕","💗","🩷","🤍","✨","🌸","💝"][Math.random() * 8 | 0];
      el.style.left = (5 + Math.random() * 90) + "%";
      el.style.fontSize = (12 + Math.random() * 14) + "px";
      el.style.setProperty("--drift", (Math.random() - 0.5) * 120 + "px");
      el.style.setProperty("--spin", (180 + Math.random() * 360) + "deg");
      const dur = 5 + Math.random() * 5;
      el.style.animationDuration = dur + "s";
      container.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000);
      heartsTimer = setTimeout(spawnOne, 200 + Math.random() * 300);
    })();
  }

  function stopHearts() {
    heartsActive = false;
    if (heartsTimer) clearTimeout(heartsTimer);
  }

  playBtn.addEventListener("click", () => {
    playBtn.textContent = "💖 我愿意！";
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
    // Play Baby - Love Story keeps playing
    resultAudio.play().catch(() => {});
    startHearts();
  });
}


document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    RomanticBGM.stop();
    if (loveStoryAudio && !loveStoryAudio.paused) loveStoryAudio.pause();
    if (resultAudio && !resultAudio.paused) resultAudio.pause();
  }

});
renderWelcome();
