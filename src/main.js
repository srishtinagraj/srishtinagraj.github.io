// --- Theme toggle (single source of truth) ---
(function () {
  const root = document.documentElement;
  const btn  = document.getElementById('themeToggle');

  function apply(theme) {
    // use attribute for both themes; dark falls back to default vars
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else                   root.setAttribute('data-theme', 'dark');

    localStorage.setItem('theme', theme);
    if (btn) {
      btn.textContent = theme === 'light' ? '🌞' : '🌙';
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  // initial theme: saved → system → dark
  const saved = localStorage.getItem('theme');
  if (saved) {
    apply(saved);
  } else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    apply(prefersLight ? 'light' : 'dark');
  }

  // toggle
  btn?.addEventListener('click', () => {
    const now = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(now);
  });
})();


// ---------- Scroll reveal ----------
(function () {
  const els = Array.from(document.querySelectorAll('.fade-up, .project-card, .timeline-item, .section h2'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

// ---------- Gentle parallax background ----------
(function () {
  const parallax = document.querySelector('.bg-parallax');
  if (!parallax) return;
  let latestY = 0, ticking = false;
  function onScroll() {
    latestY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        parallax.style.transform = `translateY(${latestY * 0.03}px)`; // gentler travel
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ---------- Orbital particles canvas ----------
(function () {
  const canvas = document.getElementById('orbitalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, cx = 0, cy = 0;

  const layers = [
    { count: 36, rMin: 60,  rMax: 120, speed: 0.0006, size: 2.2, alpha: 0.85 },
    { count: 28, rMin: 120, rMax: 180, speed: 0.00045, size: 1.8, alpha: 0.7  },
    { count: 18, rMin: 180, rMax: 230, speed: 0.00035, size: 1.4, alpha: 0.6  }
  ];
  const particles = [];

  const gradientStops = [
    { c1: '#7cc8ff', c2: '#bfa6ff' },
    { c1: '#a5e3ff', c2: '#d2c3ff' },
    { c1: '#64d2ff', c2: '#bf5af2' }
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.floor(rect.width * dpr);
    h = Math.floor(rect.height * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = rect.width / 2;
    cy = rect.height / 2;
  }

  function init() {
    particles.length = 0;
    layers.forEach((L, i) => {
      for (let k = 0; k < L.count; k++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = L.rMin + Math.random() * (L.rMax - L.rMin);
        particles.push({
          layer: i,
          angle,
          radius,
          speed: L.speed * (0.7 + Math.random() * 0.6),
          size: L.size * (0.6 + Math.random() * 0.8),
          jitter: (Math.random() - 0.5) * 0.002
        });
      }
    });
  }

  let mx = 0, my = 0;
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left - r.width / 2) / r.width;
    my = (e.clientY - r.top - r.height / 2) / r.height;
  });

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // soft radial haze
    const rad = Math.max(canvas.width, canvas.height) / dpr;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(124,200,255,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    particles.forEach(p => {
      const L = layers[p.layer];
      p.angle += p.speed + p.jitter * Math.sin(t * 0.001 + p.radius);
      const wobble = (p.layer + 1) * 3;
      const r = p.radius + Math.sin(t * 0.0012 + p.angle * 2) * wobble;

      const ox = mx * (6 + p.layer * 3);
      const oy = my * (6 + p.layer * 3);

      const x = cx + Math.cos(p.angle) * r + ox;
      const y = cy + Math.sin(p.angle) * r + oy;

      const gg = ctx.createLinearGradient(x - 10, y - 10, x + 10, y + 10);
      const stops = gradientStops[p.layer % gradientStops.length];
      gg.addColorStop(0, stops.c1);
      gg.addColorStop(1, stops.c2);

      ctx.globalAlpha = layers[p.layer].alpha;
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); });
  resize();
  init();
  requestAnimationFrame(draw);
})();

// ---------- Contact form (mailto fallback) ----------
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('sendBtn');

  // TODO: set your real email here
  const CONTACT_EMAIL = 'srishti@example.com';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('name').value || '').trim();
    const email = (document.getElementById('email').value || '').trim();
    const message = (document.getElementById('message').value || '').trim();

    if (!name || !email || !message) {
      status.textContent = 'Please fill out all fields.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Opening email…';

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— sent from srishti.dev portfolio`
    );

    // Open default mail client with pre-filled message
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    // Inline confirmation (helps if user cancels the email app)
    setTimeout(() => {
      status.textContent = 'If your email app did not open, email me directly at ' + CONTACT_EMAIL + '.';
      btn.disabled = false;
      btn.textContent = 'Send message';
    }, 1200);
  });
})();
