// ============================================================
// Patch: confess button + heart explosion on result screen
// ============================================================

// Replace renderResult to update button text and add explosion
const _origRenderResult = typeof renderResult === "function" ? renderResult : null;

// Helper: burst hearts from center outward
function burstHearts(container, count) {
  const emojis = ["💖","💕","💗","🩷","🤍","✨","🌸","💝","💘","❤️‍🔥","🩷","💓"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "burst-heart";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (Math.random() * 360) * Math.PI / 180;
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
