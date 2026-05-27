/**
 * Ambient floating particle system — Active Theory inspired.
 * No image needed. Creates depth-layered glowing particles
 * that drift naturally and respond to mouse/touch.
 */
function initParticles(canvas, options) {
  options = options || {};
  var ctx = canvas.getContext("2d");
  var W, H;
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var raf;
  var running = false;
  var time = 0;

  // Config
  var count = options.count || 180;
  var mouseRadius = options.mouseRadius || 160;
  var mouseForce = options.mouseForce || 0.3;
  var driftSpeed = options.driftSpeed || 0.15;
  var colors = options.colors || [
    [255, 182, 193],  // pink
    [255, 141, 161],  // rose
    [255, 218, 225],  // light pink
    [255, 255, 240],  // warm white
    [255, 200, 210],  // soft pink
    [245, 200, 220],  // blush
    [255, 170, 180],  // coral pink
    [255, 240, 245],  // lavender blush
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle(layer) {
    // layer: 0=far(big,blurry,slow), 1=mid, 2=near(small,sharp,fast)
    var layerConfig = [
      { sizeMin: 4, sizeMax: 12, alphaMin: 0.08, alphaMax: 0.2, speedMul: 0.4, blur: 6 },
      { sizeMin: 2, sizeMax: 6,  alphaMin: 0.15, alphaMax: 0.45, speedMul: 0.8, blur: 2 },
      { sizeMin: 1, sizeMax: 3,  alphaMin: 0.3,  alphaMax: 0.8,  speedMul: 1.2, blur: 0 }
    ];
    var cfg = layerConfig[layer];
    var c = colors[Math.floor(Math.random() * colors.length)];
    var size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);

    return {
      x: Math.random() * W,
      y: Math.random() * H,
      baseX: 0,
      baseY: 0,
      vx: (Math.random() - 0.5) * driftSpeed * cfg.speedMul,
      vy: (Math.random() - 0.5) * driftSpeed * cfg.speedMul,
      size: size,
      baseSize: size,
      r: c[0], g: c[1], b: c[2],
      alpha: cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin),
      baseAlpha: cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin),
      blur: cfg.blur,
      layer: layer,
      speedMul: cfg.speedMul,
      // Wobble parameters
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.01,
      wobbleAmpX: 0.3 + Math.random() * 0.8,
      wobbleAmpY: 0.2 + Math.random() * 0.6,
      // Pulse
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.015
    };
  }

  function initParticlesArray() {
    particles = [];
    for (var i = 0; i < count; i++) {
      var layer;
      if (i < count * 0.3) layer = 0;
      else if (i < count * 0.7) layer = 1;
      else layer = 2;
      particles.push(createParticle(layer));
    }
  }

  function tick() {
    if (!running) return;
    time++;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Wobble
      p.wobblePhase += p.wobbleSpeed;
      var wobX = Math.sin(p.wobblePhase) * p.wobbleAmpX * p.speedMul;
      var wobY = Math.cos(p.wobblePhase * 0.7) * p.wobbleAmpY * p.speedMul;

      // Base drift
      p.x += p.vx + wobX;
      p.y += p.vy + wobY;

      // Mouse interaction — gentle push
      if (mouse.active) {
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0) {
          var force = (mouseRadius - dist) / mouseRadius;
          var pushX = (dx / dist) * force * mouseForce * (3 - p.layer);
          var pushY = (dy / dist) * force * mouseForce * (3 - p.layer);
          p.x += pushX;
          p.y += pushY;
          // Brighten near mouse
          p.alpha = Math.min(p.baseAlpha * (1 + force * 1.5), 1);
          p.size = p.baseSize * (1 + force * 0.4);
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          p.size += (p.baseSize - p.size) * 0.05;
        }
      } else {
        p.alpha += (p.baseAlpha - p.alpha) * 0.03;
        p.size += (p.baseSize - p.size) * 0.03;
      }

      // Pulse alpha
      p.pulsePhase += p.pulseSpeed;
      var pulse = 0.8 + Math.sin(p.pulsePhase) * 0.2;

      // Wrap around edges
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      if (p.y > H + 20) p.y = -20;

      // Draw particle with glow
      var a = p.alpha * pulse;
      if (p.blur > 0) {
        ctx.shadowBlur = p.blur * 2;
        ctx.shadowColor = "rgba(" + p.r + "," + p.g + "," + p.b + "," + (a * 0.6) + ")";
      }
      ctx.fillStyle = "rgba(" + p.r + "," + p.g + "," + p.b + "," + a + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    raf = requestAnimationFrame(tick);
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
  function onTouchMove(e) {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
    mouse.active = true;
  }
  function onMouseLeave() { mouse.active = false; }
  function onTouchEnd()   { mouse.active = false; }

  return {
    start: function() {
      resize();
      initParticlesArray();
      running = true;
      tick();

      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchstart", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd);
      window.addEventListener("resize", function() {
        resize();
        initParticlesArray();
      });
    },
    destroy: function() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchstart", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    }
  };
}