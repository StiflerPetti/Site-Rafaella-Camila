
(() => {
  const KEY = 'rafaella-natal-enabled';
  const colors = [
    ['#e85d75','rgba(232,93,117,.8)'],
    ['#e9c46a','rgba(233,196,106,.85)'],
    ['#70b88a','rgba(112,184,138,.8)'],
    ['#8b78c8','rgba(139,120,200,.8)']
  ];
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let enabled = localStorage.getItem(KEY) !== 'false';
  let canvas, ctx, flakes = [], raf = 0, resizeHandler;

  const lights = document.createElement('div');
  lights.id = 'natal-lights';
  lights.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 34; i++) {
    const bulb = document.createElement('i');
    const color = colors[i % colors.length];
    bulb.className = 'natal-bulb';
    bulb.style.setProperty('--natal-color', color[0]);
    bulb.style.setProperty('--natal-glow', color[1]);
    bulb.style.setProperty('--natal-speed', `${1.1 + (i % 7) * .27}s`);
    bulb.style.animationDelay = `${-(i % 9) * .23}s`;
    lights.appendChild(bulb);
  }

  canvas = document.createElement('canvas');
  canvas.id = 'natal-snow';
  canvas.setAttribute('aria-hidden', 'true');
  const button = document.createElement('button');
  button.id = 'natal-toggle';
  button.type = 'button';
  button.setAttribute('aria-pressed', String(enabled));

  document.body.append(lights, canvas, button);
  ctx = canvas.getContext('2d', { alpha: true });

  function makeFlakes() {
    const count = Math.min(95, Math.max(28, Math.floor(window.innerWidth / 13)));
    flakes = Array.from({length: count}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: .8 + Math.random() * 2.2,
      speed: .35 + Math.random() * 1.05,
      drift: -.35 + Math.random() * .7,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeFlakes();
  }

  function draw() {
    if (!enabled || reduced) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const t = performance.now() / 1000;
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    for (const f of flakes) {
      f.y += f.speed;
      f.x += f.drift + Math.sin(t + f.phase) * .25;
      if (f.y > window.innerHeight + 5) { f.y = -5; f.x = Math.random() * window.innerWidth; }
      if (f.x < -5) f.x = window.innerWidth + 5;
      if (f.x > window.innerWidth + 5) f.x = -5;
      ctx.globalAlpha = .45 + (f.r / 3) * .45;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  function renderState() {
    lights.hidden = !enabled;
    canvas.hidden = !enabled || reduced;
    button.textContent = enabled ? '🎄 Natal ligado' : '🎄 Ativar Natal';
    button.setAttribute('aria-pressed', String(enabled));
    if (raf) cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (enabled && !reduced) raf = requestAnimationFrame(draw);
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    localStorage.setItem(KEY, String(enabled));
    renderState();
  });
  resizeHandler = () => { resize(); renderState(); };
  window.addEventListener('resize', resizeHandler, { passive: true });
  resize();
  renderState();
})();
