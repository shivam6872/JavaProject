// Basic SPA navigation and animated background + widgets

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

let selectedRole = null;

function showScreen(id) {
  const current = qs('.screen.screen-active');
  const next = qs(`#${id}`);
  if (current === next) return;
  if (current) {
    current.classList.remove('screen-active');
    current.classList.add('screen-exit');
    setTimeout(() => current.classList.remove('screen-exit'), 500);
  }
  if (next) {
    next.classList.add('screen-active','screen-enter');
    setTimeout(() => next.classList.remove('screen-enter'), 650);
  }
}

function initLogin() {
  const roleButtons = qsa('.role-btn');
  if (!roleButtons.length) return; // not on index
  roleButtons.forEach(btn => btn.addEventListener('click', () => {
    selectedRole = btn.dataset.role;
    roleButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }));

  const loginBtn = qs('#loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', () => {
    if (selectedRole === 'manager') {
      window.location.href = 'manager.html';
    } else {
      window.location.href = 'employee.html';
    }
  });
}

// Sidebar sections in Manager
function setActiveSection(name) {
  // Manager sections
  qsa('#screen-manager .nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === name));
  qsa('#screen-manager .content-section').forEach(sec => sec.classList.toggle('active', sec.dataset.section === name));
  
  // Employee sections
  qsa('#screen-employee .menu-item').forEach(n => n.classList.toggle('active', n.dataset.target === name));
  qsa('#screen-employee .content-section').forEach(sec => sec.classList.toggle('active', sec.dataset.section === name));
}

function initSidebar() {
  qsa('#screen-manager .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const t = item.dataset.target;
      if (t) setActiveSection(t);
    });
  });
  qsa('.route-reports').forEach(btn => btn.addEventListener('click', () => window.location.href = 'reports.html'));
}

function initSideMenu() {
  const menuToggle = qs('#menuToggle');
  const sideMenu = qs('#sideMenu');
  const overlay = qs('#menuOverlay');
  
  if (!menuToggle || !sideMenu || !overlay) return;
  
  function toggleMenu() {
    sideMenu.classList.toggle('open');
    overlay.classList.toggle('open');
  }
  
  function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('open');
  }
  
  menuToggle.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);
  
  // Handle menu item clicks
  qsa('.side-menu .menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.target;
      if (target) {
        setActiveSection(target);
        closeMenu();
        
        // Trigger animations for specific sections
        if (target === 'overview' && qs('#screen-employee')) {
          animateRings();
          sequentialTimeline('#screen-employee .timeline .checkpoint');
        }
        if (target === 'progress' && qs('#screen-employee')) {
          // Animate skill bars
          qsa('.skill-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => bar.style.width = width, 100);
          });
        }
      }
    });
  });
}

// Flip cards
function initFlipCards() {
  qsa('.flip-card .flip-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.flip-card');
      card.classList.toggle('active');
    });
  });

  // Stars
  qsa('.stars').forEach(starRow => {
    const icons = qsa('i', starRow);
    icons.forEach((icon, idx) => {
      icon.addEventListener('mouseenter', () => paintStars(icons, idx));
      icon.addEventListener('click', () => selectStars(starRow, icons, idx));
      starRow.addEventListener('mouseleave', () => restoreStars(starRow, icons));
    });
  });

  // 3D tilt
  qsa('.flip-card').forEach(card => {
    const inner = qs('.flip-inner', card);
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0..1
      const y = (e.clientY - r.top) / r.height; // 0..1
      const ry = (x - 0.5) * 16; // deg
      const rx = -(y - 0.5) * 10; // deg
      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--rx', rx + 'deg');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });

  // Slider value bubbles
  qsa('.flip-back').forEach(back => {
    qsa('.slider', back).forEach(slider => {
      const bubble = document.createElement('div');
      bubble.className = 'slider-bubble';
      back.appendChild(bubble);
      const update = () => {
        const min = Number(slider.min), max = Number(slider.max), val = Number(slider.value);
        const pct = (val - min) / (max - min);
        const r = slider.getBoundingClientRect();
        const x = r.left + r.width * pct;
        const y = r.top;
        bubble.textContent = val;
        const parentR = back.getBoundingClientRect();
        bubble.style.left = (x - parentR.left) + 'px';
        bubble.style.top = (y - parentR.top - 30) + 'px';
        bubble.style.display = 'block';
      };
      const hide = () => bubble.style.display = 'none';
      slider.addEventListener('input', update);
      slider.addEventListener('mouseenter', update);
      slider.addEventListener('mouseleave', hide);
      setTimeout(update, 50);
    });
  });
}

function paintStars(icons, idx) {
  icons.forEach((i, k) => i.className = k <= idx ? 'ri-star-fill' : 'ri-star-line');
}
function selectStars(row, icons, idx) {
  row.dataset.value = String(idx + 1);
  paintStars(icons, idx);
}
function restoreStars(row, icons) {
  const val = Number(row.dataset.value || 0) - 1;
  paintStars(icons, val);
}

// Animated background (particles + rotating cubes)
function initBackground() {
  const canvas = qs('#bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], t = 0;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 1 + 0.2,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6
    });
  }

  function drawCube(cx, cy, size, rot) {
    const s = size;
    const c = Math.cos(rot), n = Math.sin(rot);
    const p = [
      {x: -s, y: -s, z: -s}, {x: s, y: -s, z: -s}, {x: s, y: s, z: -s}, {x: -s, y: s, z: -s},
      {x: -s, y: -s, z: s},  {x: s, y: -s, z: s},  {x: s, y: s, z: s},  {x: -s, y: s, z: s}
    ].map(v => ({
      x: v.x * c - v.z * n,
      y: v.y,
      z: v.x * n + v.z * c + 3
    })).map(v => ({
      x: cx + (v.x * 160) / v.z,
      y: cy + (v.y * 160) / v.z,
      z: v.z
    }));
    const faces = [ [0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [1,2,6,5], [0,3,7,4] ];
    faces.forEach((f, idx) => {
      const poly = f.map(i => p[i]);
      const depth = poly.reduce((a, v) => a + v.z, 0) / poly.length;
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i=1;i<poly.length;i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      const hue = 190 + idx * 20;
      ctx.fillStyle = `hsla(${hue}, 90%, 55%, ${0.06 + (4 - depth) * 0.02})`;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.25)`;
      ctx.fill();
      ctx.stroke();
    });
  }

  function loop() {
    t += 0.005;
    ctx.clearRect(0,0,W,H);

    // gradient ambient
    const g = ctx.createRadialGradient(W*0.2, H*0.2, 50, W*0.8, H*0.9, Math.max(W,H));
    g.addColorStop(0, 'rgba(0,229,255,0.05)');
    g.addColorStop(1, 'rgba(168,85,247,0.05)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,229,255,${0.35 * p.z})`;
      ctx.shadowColor = 'rgba(0,229,255,0.4)';
      ctx.shadowBlur = 12;
      ctx.fill();
    });

    // cubes
    drawCube(W*0.75, H*0.35, 0.6 + Math.sin(t)*0.1, t*2);
    drawCube(W*0.25, H*0.7, 0.5 + Math.cos(t*1.1)*0.1, -t*1.6);

    requestAnimationFrame(loop);
  }
  loop();
}

// Charts
let chartsInitRequested = false;
function requestChartInit() {
  if (chartsInitRequested) return; chartsInitRequested = true;
  setTimeout(initCharts, 350);
}
function initCharts() {
  const bar = new Chart(qs('#barChart'), {
    type: 'bar',
    data: { labels: ['Alex','Mia','Sam','Lee','Sara'], datasets: [{
      label: 'Score', data: [82,91,76,84,79], borderRadius: 10,
      backgroundColor: ['#22d3ee','#a855f7','#22d3ee','#a855f7','#22d3ee']
    }]},
    options: { animation: { duration: 900 }, scales: { y: { ticks: { color: '#94a3b8' } , grid: { color: 'rgba(255,255,255,0.08)'} }, x: { ticks: { color: '#94a3b8' } , grid: { display:false } } }, plugins: { legend: { labels: { color: '#94a3b8' } } } }
  });
  const pie = new Chart(qs('#pieChart'), {
    type: 'pie',
    data: { labels: ['UI','Data','Infra','QA'], datasets: [{
      data: [32,28,22,18], backgroundColor: ['#22d3ee','#a855f7','#00e5ff','#7c3aed']
    }]},
    options: { animation: { animateScale: true, duration: 1000 }, plugins: { legend: { labels: { color: '#94a3b8' } } } }
  });
  const radar = new Chart(qs('#radarChart'), {
    type: 'radar',
    data: { labels: ['Prod','Team','Creat','Comm','Accuracy'], datasets: [{
      label: 'Team', data: [80,85,70,78,88], borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.2)'
    }]},
    options: { animation: { duration: 1200 }, scales: { r: { angleLines: { color: 'rgba(255,255,255,0.08)' }, grid: { color: 'rgba(255,255,255,0.08)' }, pointLabels: { color: '#94a3b8' }, ticks: { display: false } } }, plugins: { legend: { labels: { color: '#94a3b8' } } } }
  });
}

// Employee rings percentage animation
function animateRings() {
  qsa('#screen-employee .ring').forEach(ring => {
    const target = Number(ring.dataset.pct || 0);
    const valueEl = qs('.ring-value', ring);
    let v = 0; const step = () => {
      v += Math.max(1, Math.round((target - v) * 0.08));
      if (v > target) v = target;
      valueEl.textContent = v + '%';
      ring.style.setProperty('--pct', v);
      if (v < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// KPI counters
function animateKpis() {
  qsa('#screen-reports .kpi-value').forEach(el => {
    const target = Number(el.dataset.target || 0);
    let v = 0; const inc = Math.ceil(target / 60);
    const tick = () => {
      v += inc; if (v > target) v = target;
      el.textContent = v;
      if (v < target) requestAnimationFrame(tick);
    };
    tick();
  });
}

// Exports (dummy)
function initExport() {
  qsa('.export-btn').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 600);
    alert('Exported! (demo)');
  }));
}

// Theme toggle
function initTheme() {
  const btn = qs('#modeToggle');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
  });
}

// Observe screen changes to trigger animations
const screenObserver = new MutationObserver(() => {});

// Init
window.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initTheme();
  initLogin();
  initSideMenu();
  if (qs('#screen-manager')) {
    initSidebar();
    initFlipCards();
    requestChartInit();
  }
  if (qs('#screen-employee')) {
    animateRings();
    sequentialTimeline('#screen-employee .timeline .checkpoint');
  }
  if (qs('#screen-reports')) {
    animateKpis();
    highlightLeaderboard();
    initExport();
  }
});

function sequentialTimeline(selector) {
  const items = qsa(selector);
  items.forEach((el, i) => {
    setTimeout(() => { el.classList.add('light-up'); el.dataset.active = 'true'; }, i * 220);
  });
}

function highlightLeaderboard() {
  const lb = qsa('#screen-reports .leaderboard li');
  lb.forEach((el, i) => setTimeout(() => el.classList.add('highlight'), i * 120));
}


