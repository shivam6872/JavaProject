// Basic SPA navigation and animated background + widgets

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

// ============================================
// UI HELPERS (Toasts & Loading)
// ============================================

function showToast(message, type = 'info') {
  let container = qs('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ri-information-line';
  if (type === 'success') icon = 'ri-checkbox-circle-line';
  if (type === 'error') icon = 'ri-error-warning-line';

  toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading(element) {
  if (!element) return;
  element.classList.add('skeleton');
}

function hideLoading(element) {
  if (!element) return;
  element.classList.remove('skeleton');
}

// ============================================
// AUTHENTICATION & API HELPERS
// ============================================

const API_BASE = 'http://localhost:8080/evalx/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearAuth();
  window.location.href = 'index.html';
}

function getAuthHeaders() {
  const token = getToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : { 'Content-Type': 'application/json' };
}

async function checkAuth() {
  const token = getToken();
  const currentPage = window.location.pathname.split('/').pop();

  // Public pages
  if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
    // If logged in on public page, redirect to dashboard
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user.role === 'manager') window.location.href = 'manager.html';
          else if (user && user.role === 'employee') window.location.href = 'employee.html';
        } else {
          clearAuth();
        }
      } catch (e) { clearAuth(); }
    }
    return;
  }

  // Protected pages
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!data.success) {
      clearAuth();
      window.location.href = 'index.html';
      return;
    }

    // Role check
    const user = JSON.parse(localStorage.getItem('user'));
    if (currentPage.includes('manager.html') && user.role !== 'manager') {
      window.location.href = 'employee.html';
    } else if (currentPage.includes('employee.html') && user.role !== 'employee') {
      window.location.href = 'manager.html';
    }

  } catch (err) {
    clearAuth();
    window.location.href = 'index.html';
  }
}

let selectedRole = null;
let allEmployees = [];

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
    next.classList.add('screen-active', 'screen-enter');
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
    console.log('Role selected:', selectedRole);
  }));

  const loginBtn = qs('#loginBtn');
  const registerBtn = qs('#registerBtn');
  const loginForm = qs('#loginForm');
  const registerForm = qs('#registerForm');
  const showRegister = qs('#showRegister');
  const showLogin = qs('#showLogin');


  // Toggle Forms
  if (showRegister) showRegister.addEventListener('click', async (e) => {
    e.preventDefault();

    // Check if a role is selected
    if (!selectedRole) {
      showToast('Please select a role first (Manager or Employee)', 'error');
      return;
    }

    loginForm.style.display = 'none';
    registerForm.style.display = 'grid';
    qs('.login-panel h1').textContent = 'Create Account';

    // Show selected role in subtitle
    const roleText = selectedRole === 'manager' ? 'Manager' : 'Employee';
    qs('.login-panel .subtitle').textContent = `Register as ${roleText}`;

    // Show/Hide role-specific fields
    const deptField = qs('#fieldDepartment');
    const managerField = qs('#fieldManager');

    if (deptField) {
      ensureDepartmentDropdown();
      deptField.style.display = selectedRole === 'manager' ? 'block' : 'none';
    }

    if (managerField) {
      managerField.style.display = selectedRole === 'employee' ? 'block' : 'none';

      // Load managers for employee selection
      if (selectedRole === 'employee') {
        await loadManagers();
      }
    }

    // Initialize avatar selector when registration form is shown
    setTimeout(() => {
      initAvatarSelector();
    }, 100);
  });

  if (showLogin) showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'grid';
    qs('.login-panel h1').textContent = 'Welcome Back';
    qs('.login-panel .subtitle').textContent = 'Select your role to continue';
  });

  // Login Logic
  const performLogin = async () => {
    const usernameInput = qs('#loginEmail');
    const passwordInput = qs('#passwordInput');

    if (!selectedRole) return showToast('Please select a role (Manager or Employee).', 'error');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) return showToast('Please fill in all fields.', 'error');

    try {
      loginBtn.textContent = 'Logging in...';
      loginBtn.disabled = true;

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: selectedRole })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          if (data.user.role === 'manager') {
            window.location.href = 'manager.html';
          } else {
            window.location.href = 'employee.html';
          }
        }, 1000);
      } else {
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Unable to connect to the server.', 'error');
    } finally {
      loginBtn.textContent = 'Login';
      loginBtn.disabled = false;
    }
  };

  // Handle login button click
  if (loginBtn) loginBtn.addEventListener('click', performLogin);

  // Handle form submit (Enter key)
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await performLogin();
  });

  // Registration Logic
  const performRegistration = async () => {
    const name = qs('#regName').value.trim();
    const email = qs('#regEmail').value.trim();
    const password = qs('#regPassword').value.trim();
    const title = qs('#regTitle').value.trim();
    const avatar = qs('#regAvatar').value.trim();
    const department = qs('#regDepartment').value.trim();
    const managerId = qs('#regManager')?.value.trim();

    console.log('Registration attempt - Selected Role:', selectedRole);

    if (!selectedRole) {
      showToast('Please select a role first.', 'error');
      return;
    }
    if (!name || !email || !password || !title) return showToast('Please fill in all required fields.', 'error');

    // Password Validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return showToast('Password must be at least 8 characters long and include at least one number and one special character.', 'error');
    }

    if (selectedRole === 'manager' && !department) return showToast('Please select your department.', 'error');
    if (selectedRole === 'employee' && !managerId) return showToast('Please select your manager.', 'error');

    const payload = {
      name, email, password, role: selectedRole,
      title,
      avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      department: selectedRole === 'manager' ? department : undefined,
      managerId: selectedRole === 'employee' ? managerId : undefined
    };

    try {
      registerBtn.textContent = 'Creating Account...';
      registerBtn.disabled = true;

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Registration successful! Please login.', 'success');
        showLogin.click(); // Switch back to login
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Unable to connect to the server.', 'error');
    } finally {
      registerBtn.textContent = 'Create Account';
      registerBtn.disabled = false;
    }
  };

  // Handle registration button click
  if (registerBtn) registerBtn.addEventListener('click', performRegistration);

  // Handle form submit (Enter key)
  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await performRegistration();
  });


  initPasswordToggle();
  initAvatarSelector();
  ensureDepartmentDropdown();
}

async function loadManagers() {
  try {
    const res = await fetch(`${API_BASE}/auth/managers`);
    if (!res.ok) throw new Error('Failed to load managers');
    const managers = await res.json();

    const managerSelect = qs('#regManager');
    if (managerSelect) {
      managerSelect.innerHTML = '<option value="">Choose your manager</option>';
      managers.forEach(manager => {
        const option = document.createElement('option');
        option.value = manager.id;
        option.textContent = `${manager.name} - ${manager.department || 'N/A'}`;
        managerSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading managers:', err);
  }
}

function initAvatarSelector() {
  const avatarOptions = qsa('.avatar-option');
  const avatarInput = qs('#regAvatar');

  if (!avatarOptions.length || !avatarInput) return;

  // Remove any existing selected class first
  avatarOptions.forEach(opt => opt.classList.remove('selected'));

  // Set first avatar as selected by default
  avatarOptions[0].classList.add('selected');

  avatarOptions.forEach(option => {
    // Remove old listeners by cloning (prevents duplicates)
    const newOption = option.cloneNode(true);
    option.parentNode.replaceChild(newOption, option);

    newOption.addEventListener('click', () => {
      // Remove selected class from all options
      qsa('.avatar-option').forEach(opt => opt.classList.remove('selected'));

      // Add selected class to clicked option
      newOption.classList.add('selected');

      // Update hidden input value
      const avatarUrl = newOption.dataset.avatar;
      qs('#regAvatar').value = avatarUrl;

      console.log('Avatar selected:', avatarUrl);
    });
  });
}

function initPasswordToggle() {
  const togglePassword = qs('#togglePassword');
  const passwordInput = qs('#passwordInput');
  const forgotPassword = qs('.forgot-password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('ri-eye-line');
      this.classList.toggle('ri-eye-off-line');
    });
  }

  if (forgotPassword) {
    forgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Reset password link sent to your email!', 'info');
    });
  }
}

function ensureDepartmentDropdown() {
  const deptField = qs('#fieldDepartment');
  if (!deptField) return;

  // Remove any legacy input fields so only the dropdown remains
  qsa('input#regDepartment', deptField).forEach((input) => input.remove());

  let select = deptField.querySelector('select');
  if (select) return; // already a dropdown

  const existingInput = deptField.querySelector('#regDepartment');

  select = document.createElement('select');
  select.id = 'regDepartment';
  select.innerHTML = `
    <option value="">Choose a department</option>
    <option value="Engineering">Engineering</option>
    <option value="Product">Product</option>
    <option value="Design">Design</option>
    <option value="Marketing">Marketing</option>
    <option value="Sales">Sales</option>
    <option value="Human Resources">Human Resources</option>
    <option value="Finance">Finance</option>
    <option value="Operations">Operations</option>
    <option value="Data">Data</option>
    <option value="Customer Success">Customer Success</option>
  `;

  if (existingInput) {
    existingInput.replaceWith(select);
  } else {
    deptField.appendChild(select);
  }
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
        const sliderR = slider.getBoundingClientRect();
        const backR = back.getBoundingClientRect();
        let xRelative = (sliderR.left - backR.left) + (sliderR.width * pct) - 15;
        let yRelative = (sliderR.top - backR.top) - 30;

        bubble.textContent = val;
        bubble.style.left = xRelative + 'px';
        bubble.style.top = yRelative + 'px';
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
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], t = 0;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 1 + 0.2,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  }

  function drawCube(cx, cy, size, rot) {
    const s = size;
    const c = Math.cos(rot), n = Math.sin(rot);
    const p = [
      { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s }
    ].map(v => ({
      x: v.x * c - v.z * n,
      y: v.y,
      z: v.x * n + v.z * c + 3
    })).map(v => ({
      x: cx + (v.x * 160) / v.z,
      y: cy + (v.y * 160) / v.z,
      z: v.z
    }));
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];
    faces.forEach((f, idx) => {
      const poly = f.map(i => p[i]);
      const depth = poly.reduce((a, v) => a + v.z, 0) / poly.length;
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      // Use new primary/accent colors (Indigo/Cyan)
      const hue = idx % 2 === 0 ? 243 : 189; // Indigo (243) or Cyan (189)
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.05 + (4 - depth) * 0.02})`;
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.2)`;
      ctx.fill();
      ctx.stroke();
    });
  }

  function loop() {
    t += 0.005;
    ctx.clearRect(0, 0, W, H);

    // gradient ambient
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 100, W * 0.8, H * 0.8, Math.max(W, H));
    g.addColorStop(0, 'rgba(99, 102, 241, 0.03)');
    g.addColorStop(1, 'rgba(6, 182, 212, 0.03)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.4 * p.z})`;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fill();
    });

    // cubes
    drawCube(W * 0.8, H * 0.3, 0.6 + Math.sin(t) * 0.1, t * 1.5);
    drawCube(W * 0.2, H * 0.7, 0.5 + Math.cos(t * 1.1) * 0.1, -t * 1.2);

    requestAnimationFrame(loop);
  }
  loop();
}

// Data Loading
async function loadDashboardData() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    if (!window.location.pathname.endsWith('index.html')) {
      window.location.href = 'index.html';
    }
    return;
  }

  const user = JSON.parse(userStr);
  const isManager = user.role === 'manager';

  // Update Profile Info in UI (Common)
  const profileName = qs('.profile-name');
  const profileRole = qs('.profile-role');
  const profileAvatar = qs('.profile-avatar');

  if (profileName) profileName.textContent = user.name;
  if (profileRole) profileRole.textContent = user.title || (isManager ? 'Manager' : 'Employee');
  if (profileAvatar && user.avatar) profileAvatar.src = user.avatar;

  if (window.location.pathname.endsWith('employee.html') && !isManager) {
    await loadEmployeeDashboard(user.id);
  } else if (window.location.pathname.endsWith('manager.html') && isManager) {
    await loadManagerData(user.id);
  } else if (window.location.pathname.endsWith('reports.html')) {
    await loadReportsData();
  }
}

async function loadEmployeeDashboard(employeeId) {
  const dashboardContainer = qs('.screen-active'); // simplified selection
  showLoading(dashboardContainer);

  try {
    const res = await fetch(`${API_BASE}/employees/${employeeId}`, { headers: getAuthHeaders() });
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Failed to load dashboard');

    const data = json.data;

    // Render all sections
    renderEmployeeProfile(data.profile);
    renderEmployeeTasks(data.tasks, employeeId); // Pass ID for toggle action
    renderEmployeeAchievements(data.achievements);
    renderEmployeeReviews(data.reviews);
    renderEmployeeNotifications(data.notifications);

  } catch (err) {
    console.error('Error loading employee dashboard:', err);
    showToast('Failed to load dashboard data', 'error');
  } finally {
    hideLoading(dashboardContainer);
  }
}

function renderEmployeeProfile(profile) {
  if (!profile) return;

  // Update Profile Info
  const nameEl = qs('.profile-info h3');
  const titleEl = qs('.profile-info p');
  const avatarEl = qs('.profile-avatar');
  const badgesEl = qs('.profile-badges');

  if (nameEl) nameEl.textContent = profile.name;
  if (titleEl) titleEl.textContent = profile.title;
  if (avatarEl) avatarEl.src = profile.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  if (badgesEl) {
    badgesEl.innerHTML = `
      <span class="badge">${profile.department || 'General'}</span>
      <span class="badge" style="background: ${profile.workingStatus ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${profile.workingStatus ? '#10b981' : '#ef4444'};">
        ${profile.workingStatus ? 'Active' : 'Inactive'}
      </span>
    `;
  }

  // Update Stats
  const statsEl = qs('.profile-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat">
        <div class="stat-value">${profile.yearsExperience || 0}</div>
        <div class="stat-label">Years Exp</div>
      </div>
      <div class="stat">
        <div class="stat-value">${profile.projectsCompleted || 0}</div>
        <div class="stat-label">Projects</div>
      </div>
      <div class="stat">
        <div class="stat-value">${profile.averageRating || 0}</div>
        <div class="stat-label">Rating</div>
      </div>
    `;
  }

  // Update Overview Rings
  updateStat('productivity', profile.productivity);
  updateStat('teamwork', profile.teamwork);
  updateStat('creativity', profile.creativity);
}

function renderEmployeeTasks(tasks, employeeId) {
  const taskList = qs('#taskList');
  if (taskList) {
    if (tasks && tasks.length > 0) {
      taskList.innerHTML = tasks.map(t => `
        <li>
          <input type="checkbox" id="task-${t.id}" ${t.completed ? 'checked' : ''} onchange="toggleTask(${employeeId}, ${t.id}, this.checked)" />
          <label for="task-${t.id}">${t.description}</label>
        </li>
      `).join('');
    } else {
      taskList.innerHTML = '<li style="color: var(--text-secondary); text-align: center; padding: 10px;">No tasks available</li>';
    }
  }
}

function renderEmployeeAchievements(achievements) {
  const achievementsList = qs('.achievements-grid');
  if (achievementsList) {
    if (achievements && achievements.length > 0) {
      achievementsList.innerHTML = achievements.map(a => `
        <div class="achievement glass">
          <div class="achievement-icon">${a.icon || '🏆'}</div>
          <h3>${a.title}</h3>
          <p>${a.description}</p>
          <div class="achievement-badge ${a.badgeType || 'standard'}">${a.badgeType ? a.badgeType.charAt(0).toUpperCase() + a.badgeType.slice(1) : 'Award'}</div>
        </div>
      `).join('');
    } else {
      achievementsList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; grid-column: 1/-1; padding: 20px;">No achievements yet</div>';
    }
  }
}

function renderEmployeeReviews(reviews) {
  const reviewsList = qs('.reviews-timeline');
  if (reviewsList) {
    if (reviews && reviews.length > 0) {
      reviewsList.innerHTML = reviews.slice(0, 5).map(r => `
        <div class="review-item glass">
          <div class="review-header">
            <h3>${r.period} Review</h3>
            <div class="review-score">${r.score}/100</div>
          </div>
          <div class="review-details">
            <p><strong>Manager:</strong> ${r.reviewer}</p>
            <p><strong>Overall:</strong> ${r.summary}</p>
            <div class="review-highlights">
              ${r.highlights.map(h => `<span class="highlight">${h}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');
    } else {
      reviewsList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No reviews yet</div>';
    }
  }
}

function renderEmployeeNotifications(notifications) {
  const notifList = qs('.notifications-list');
  if (notifList) {
    if (notifications && notifications.length > 0) {
      notifList.innerHTML = notifications.map(n => `
        <div class="notification glass">
          <div class="notification-icon">${n.icon || '📢'}</div>
          <div class="notification-content">
            <h3>${n.title}</h3>
            <p>${n.body}</p>
            <span class="notification-time">${new Date(n.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    } else {
      notifList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No new notifications</div>';
    }
  }
}

async function loadManagerDashboard(managerId) {
  const dashboardContainer = qs('.screen-active');
  showLoading(dashboardContainer);
  try {
    await Promise.all([
      loadCharts(managerId),
      loadTopEmployees(managerId),
      loadGoals(managerId),
      loadFeedback(managerId)
    ]);
  } catch (err) {
    console.error('Error loading manager dashboard:', err);
    showToast('Failed to load dashboard data', 'error');
  } finally {
    hideLoading(dashboardContainer);
  }
}

async function loadCharts(managerId) {
  try {
    const res = await fetch(`${API_BASE}/managers/${managerId}/charts`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load charts');

    initManagerCharts(json.data);
  } catch (err) {
    console.error('Error loading charts:', err);
    showToast('Failed to load charts', 'error');
  }
}

async function loadTopEmployees(managerId) {
  try {
    const res = await fetch(`${API_BASE}/managers/${managerId}/top-employees`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load top employees');

    const topEmployees = json.data;

    const topGrid = qs('#topPerformersGrid');
    if (topGrid) {
      if (topEmployees.length > 0) {
        topGrid.innerHTML = topEmployees.map((emp, i) => `
          <div class="performer-card glass rank-${i + 1}">
            <div class="performer-rank">#${i + 1}</div>
            <img src="${emp.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" alt="${emp.name}" class="performer-avatar" />
            <h3>${emp.name}</h3>
            <p style="color:var(--text-secondary); font-size:14px;">${emp.title}</p>
            <div class="performer-score">${emp.score || 0}</div>
            <div class="performer-stats">
              <div class="performer-stat">
                <span>${emp.productivity || 0}%</span>
                <span>Prod.</span>
              </div>
              <div class="performer-stat">
                <span>${emp.teamwork || 0}%</span>
                <span>Team</span>
              </div>
              <div class="performer-stat">
                <span>${emp.creativity || 0}%</span>
                <span>Creat.</span>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        topGrid.innerHTML = `
          <div class="glass" style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--text-secondary);">
            <i class="ri-user-add-line" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
            <p>No employees found. Add employees to see rankings.</p>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Error loading top employees:', err);
    const topGrid = qs('#topPerformersGrid');
    if (topGrid) {
      topGrid.innerHTML = `<div style="color: var(--danger); text-align: center;">Failed to load top performers.</div>`;
    }
  }
}

async function loadGoals(managerId) {
  try {
    const res = await fetch(`${API_BASE}/managers/${managerId}/goals`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load goals');
    const goals = json.data;

    const timeline = qs('#screen-manager .timeline');
    if (timeline) {
      if (goals.length > 0) {
        timeline.innerHTML = goals.map(g => `
          <div class="checkpoint" data-active="${g.status === 'completed' || g.status === 'in-progress'}">
            <span>${g.title} (${g.employeeName})</span>
          </div>
        `).join('');
      } else {
        timeline.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No active goals found.</div>';
      }
    }
  } catch (err) {
    console.error('Error loading goals:', err);
  }
}

async function loadFeedback(managerId) {
  try {
    const res = await fetch(`${API_BASE}/managers/${managerId}/feedback`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load feedback');
    const feedback = json.data;

    const feedbackGrid = qs('#screen-manager .content-section[data-section="feedback"] .card-grid');
    if (feedbackGrid) {
      if (feedback.length > 0) {
        feedbackGrid.innerHTML = feedback.map(f => `
          <div class="flip-card feedback">
            <div class="flip-inner">
              <div class="flip-front glass">
                <h3>${f.employeeName}</h3>
                <div class="score">${f.score}</div>
              </div>
              <div class="flip-back glass">
                <p>${f.summary}</p>
              </div>
            </div>
          </div>
        `).join('');
        initFlipCards(); // Re-init for new elements
      } else {
        feedbackGrid.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; grid-column: 1 / -1;">No feedback history found.</div>';
      }
    }
  } catch (err) {
    console.error('Error loading feedback:', err);
  }
}

// Replaced loadManagerData with the above modular functions
// loadManagerData is no longer needed as loadManagerDashboard takes over
async function loadManagerData(id) {
  await loadManagerDashboard(id);
}

function initManagerCharts(data) {
  const barCanvas = qs('#barChart');
  if (barCanvas && data.teamScores) {
    new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels: data.teamScores.map(d => d.label),
        datasets: [{
          label: 'Score',
          data: data.teamScores.map(d => d.score),
          borderRadius: 8,
          backgroundColor: ['#6366f1', '#06b6d4', '#6366f1', '#06b6d4', '#6366f1']
        }]
      },
      options: {
        animation: { duration: 900 },
        scales: {
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        },
        plugins: { legend: { labels: { color: '#94a3b8' } } }
      }
    });
  }

  const pieCanvas = qs('#pieChart');
  if (pieCanvas && data.skillDistribution) {
    new Chart(pieCanvas, {
      type: 'pie',
      data: {
        labels: data.skillDistribution.map(d => d.label),
        datasets: [{
          data: data.skillDistribution.map(d => d.value),
          backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981'],
          borderColor: '#0f172a',
          borderWidth: 2
        }]
      },
      options: { animation: { animateScale: true, duration: 1000 }, plugins: { legend: { labels: { color: '#94a3b8' } } } }
    });
  }

  const radarCanvas = qs('#radarChart');
  if (radarCanvas && data.radarMetrics) {
    new Chart(radarCanvas, {
      type: 'radar',
      data: {
        labels: data.radarMetrics.map(d => d.label),
        datasets: [{
          label: 'Team Metrics',
          data: data.radarMetrics.map(d => d.value),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.2)'
        }]
      },
      options: {
        animation: { duration: 1200 },
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#94a3b8' },
            ticks: { display: false, backdropColor: 'transparent' }
          }
        },
        plugins: { legend: { labels: { color: '#94a3b8' } } }
      }
    });
  }
}

function updateStat(type, value) {
  const ring = qs(`.ring[data-type="${type}"]`);
  if (ring) {
    ring.dataset.pct = value;
    const valEl = qs('.ring-value', ring);
    if (valEl) valEl.textContent = value + '%';
    ring.style.setProperty('--pct', value);
  }
}

// Theme Toggle
function initTheme() {
  const modeToggle = qs('#modeToggle');
  if (!modeToggle) return;

  // Check for saved theme preference or default to dark
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  modeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Controls (Logout, etc.)
function initControls() {
  const logoutBtn = qs('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'index.html';
    });
  }
}

// Animate Rings
function animateRings() {
  qsa('.ring').forEach(ring => {
    const pct = ring.dataset.pct || 0;
    ring.style.setProperty('--pct', pct);
    const valueEl = qs('.ring-value', ring);
    if (valueEl) {
      let current = 0;
      const target = parseInt(pct);
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        valueEl.textContent = Math.round(current) + '%';
      }, 20);
    }
  });
}

// Animate KPIs (for reports page)
function animateKpis() {
  qsa('.kpi-value').forEach(el => {
    const target = parseInt(el.textContent);
    let current = 0;
    const increment = target / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current);
    }, 30);
  });
}

// Export functionality (for reports page)
function initExport() {
  const exportBtn = qs('#exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Export functionality coming soon!', 'info');
    });
  }
}

// Map Backend Data to Frontend Format
function mapEmployee(backendData) {
  return {
    empId: backendData.id,
    empName: backendData.name,
    empEmail: backendData.email,
    empPhone: backendData.phone,
    empDepartment: backendData.department,
    empAddress: backendData.address,
    empWorkingStatus: backendData.workingStatus,
    empRole: backendData.role || backendData.title || 'Employee'
  };
}

// Load Employees Data (for Manager view)
async function loadEmployees() {
  try {
    const res = await fetch(`${API_BASE}/employees`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load employees');
    const rawData = await res.json();
    allEmployees = rawData.map(mapEmployee);
    renderEmployees(allEmployees);
    initSearch();
  } catch (err) {
    console.error('Error loading employees:', err);
    alert('Failed to load employees list.');
  }
}

function renderEmployees(employees) {
  const tableBody = qs('#employeesTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (employees.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-secondary);">No employees found</td></tr>';
    return;
  }

  employees.forEach((emp, index) => {
    const row = document.createElement('tr');
    row.dataset.id = emp.empId;
    const displayId = String(emp.empId).startsWith('EMP') ? emp.empId : 'EMP' + String(emp.empId).padStart(4, '0');

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${emp.empName}</td>
      <td>${displayId}</td>
      <td>${emp.empPhone || '-'}</td>
      <td>
        <span class="status-badge ${emp.empWorkingStatus ? 'active' : 'inactive'}" 
              style="background: ${emp.empWorkingStatus ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; 
                     color: ${emp.empWorkingStatus ? '#10b981' : '#ef4444'}; 
                     padding: 4px 8px; border-radius: 12px; font-size: 12px;">
          ${emp.empWorkingStatus ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>${emp.empDepartment || '-'}</td>
      <td>${emp.empAddress || '-'}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button class="action-btn view-details-btn" title="View Details" style="background: #8b5cf6;"><i class="ri-eye-line"></i></button>
          <button class="action-btn view-report-btn" title="View Report" style="background: var(--accent);"><i class="ri-file-chart-line"></i></button>
          <button class="action-btn feedback-btn" title="Give Feedback" style="background: #10b981;"><i class="ri-chat-smile-2-line"></i></button>
          <button class="action-btn update-btn" title="Edit" style="background: #f59e0b;"><i class="ri-pencil-line"></i></button>
          <button class="action-btn delete-btn" title="Delete" style="background: #ef4444;"><i class="ri-delete-bin-line"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
  initTableActions();
}

async function viewEmployeeReport(id) {
  const modal = qs('#employeeReportModal');
  const modalBody = qs('#reportModalBody');
  if (!modal || !modalBody) return;

  modal.classList.add('open');
  modalBody.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:20px;">Loading report...</div>';

  try {
    const res = await fetch(`${API_BASE}/employees/${id}`);
    if (!res.ok) throw new Error('Failed to load report');
    const data = await res.json();

    modalBody.innerHTML = `
      <div class="report-section">
        <h3>Overview</h3>
        <div class="profile-header" style="margin-bottom: 20px;">
          <img src="${data.profile.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
          <div>
            <h4 style="margin:0; font-size: 18px;">${data.profile.name}</h4>
            <p style="margin:0; color: var(--text-secondary);">${data.profile.title}</p>
          </div>
        </div>
        <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div class="glass" style="padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${data.profile.productivity}%</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Productivity</div>
          </div>
          <div class="glass" style="padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${data.profile.teamwork}%</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Teamwork</div>
          </div>
          <div class="glass" style="padding: 16px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #10b981;">${data.profile.creativity}%</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Creativity</div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h3>Active Goals</h3>
        ${data.goals && data.goals.length ? data.goals.map(g => `
          <div class="glass" style="padding: 12px; margin-bottom: 8px; border-left: 3px solid ${g.status === 'completed' ? '#10b981' : '#f59e0b'};">
            <div style="display:flex; justify-content:space-between;">
              <strong>${g.title}</strong>
              <span style="font-size: 12px; padding: 2px 8px; border-radius: 12px; background: rgba(255,255,255,0.1);">${g.status}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${g.description}</div>
            <div style="height: 4px; background: rgba(255,255,255,0.1); margin-top: 8px; border-radius: 2px;">
              <div style="height: 100%; width: ${g.progress}%; background: var(--primary); border-radius: 2px;"></div>
            </div>
          </div>
        `).join('') : '<p style="color: var(--text-secondary);">No active goals.</p>'}
      </div>

      <div class="report-section">
        <h3>Recent Reviews</h3>
        ${data.reviews && data.reviews.length ? data.reviews.map(r => `
          <div class="glass" style="padding: 16px; margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
              <strong>${r.period}</strong>
              <span style="color: var(--accent); font-weight: 700;">${r.score}/100</span>
            </div>
            <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">${r.summary}</p>
          </div>
        `).join('') : '<p style="color: var(--text-secondary);">No reviews yet.</p>'}
      </div>
    `;
  } catch (err) {
    console.error(err);
    modalBody.innerHTML = '<div style="color: var(--danger); text-align: center;">Failed to load report data.</div>';
  }
}

// Close modal logic
document.addEventListener('click', (e) => {
  if (e.target.closest('.close-modal-btn') || e.target.classList.contains('modal-overlay')) {
    const reportModal = qs('#employeeReportModal');
    const feedbackModal = qs('#feedbackModal');
    const detailsModal = qs('#employeeDetailsModal');
    if (reportModal) reportModal.classList.remove('open');
    if (feedbackModal) feedbackModal.classList.remove('open');
    if (detailsModal) detailsModal.classList.remove('open');
  }
});

async function openFeedbackModal(employeeId) {
  const modal = qs('#feedbackModal');
  if (!modal) return;

  try {
    // Fetch employee data
    const res = await fetch(`${API_BASE}/employees/${employeeId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load employee data');
    const data = await res.json();

    // Populate employee info
    qs('#feedbackEmployeeId').value = employeeId;
    qs('#feedbackEmployeeName').textContent = data.profile.name;
    qs('#feedbackEmployeeTitle').textContent = data.profile.title;
    qs('#feedbackEmployeeAvatar').src = data.profile.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    // Reset form
    qs('#feedbackForm').reset();
    qs('#feedbackEmployeeId').value = employeeId; // Restore after reset

    // Set default slider values
    qs('#feedbackProductivity').value = 50;
    qs('#feedbackTeamwork').value = 50;
    qs('#feedbackCreativity').value = 50;
    qs('#feedbackAccuracy').value = 50;
    qs('#productivityValue').textContent = 50;
    qs('#teamworkValue').textContent = 50;
    qs('#creativityValue').textContent = 50;
    qs('#accuracyValue').textContent = 50;

    modal.classList.add('open');
  } catch (err) {
    console.error(err);
    alert('Failed to load employee data');
  }
}

async function viewEmployeeDetails(id) {
  const modal = qs('#employeeDetailsModal');
  const modalBody = qs('#detailsModalBody');
  if (!modal || !modalBody) return;

  modal.classList.add('open');
  modalBody.innerHTML = '<div class="loading-spinner" style="text-align:center; padding:20px;">Loading details...</div>';

  try {
    const res = await fetch(`${API_BASE}/employees/${id}`);
    if (!res.ok) throw new Error('Failed to load employee details');
    const data = await res.json();

    const profile = data.profile;

    modalBody.innerHTML = `
      <div class="employee-details-container" style="padding: 20px;">
        <!-- Header with Avatar -->
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
          <img src="${profile.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" 
               alt="${profile.name}" 
               style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">
          <div>
            <h2 style="margin: 0; font-size: 24px; color: var(--text);">${profile.name}</h2>
            <p style="margin: 4px 0; color: var(--text-secondary); font-size: 16px;">${profile.title || 'Employee'}</p>
            <p style="margin: 4px 0; color: var(--accent); font-size: 14px;">
              <i class="ri-mail-line"></i> ${profile.email || 'N/A'}
            </p>
          </div>
        </div>

        <!-- Personal Information -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
            <i class="ri-user-line"></i> Personal Information
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Employee ID</div>
              <div style="color: var(--text); font-weight: 600;">EMP${String(profile.id).padStart(4, '0')}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Department</div>
              <div style="color: var(--text); font-weight: 600;">${data.profile.department || 'N/A'}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Manager</div>
              <div style="color: var(--text); font-weight: 600;">${profile.managerName || 'N/A'}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 4px;">Experience</div>
              <div style="color: var(--text); font-weight: 600;">${profile.yearsExperience || 0} years</div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
            <i class="ri-bar-chart-line"></i> Performance Metrics
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
            <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Productivity</div>
              <div style="color: var(--primary); font-size: 28px; font-weight: 700;">${profile.productivity || 0}%</div>
            </div>
            <div style="background: rgba(6, 182, 212, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Teamwork</div>
              <div style="color: var(--accent); font-size: 28px; font-weight: 700;">${profile.teamwork || 0}%</div>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Creativity</div>
              <div style="color: #8b5cf6; font-size: 28px; font-weight: 700;">${profile.creativity || 0}%</div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Avg Rating</div>
              <div style="color: #10b981; font-size: 28px; font-weight: 700;">${profile.averageRating || 0}/5</div>
            </div>
          </div>
        </div>

        <!-- Work Statistics -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
            <i class="ri-briefcase-line"></i> Work Statistics
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Projects Completed</div>
              <div style="color: var(--text); font-size: 24px; font-weight: 700;">${profile.projectsCompleted || 0}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Active Goals</div>
              <div style="color: var(--text); font-size: 24px; font-weight: 700;">${data.goals ? data.goals.filter(g => g.status !== 'completed').length : 0}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Skills</div>
              <div style="color: var(--text); font-size: 24px; font-weight: 700;">${data.skills ? data.skills.length : 0}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px;">
              <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 8px;">Achievements</div>
              <div style="color: var(--text); font-size: 24px; font-weight: 700;">${data.achievements ? data.achievements.length : 0}</div>
            </div>
          </div>
        </div>

        <!-- Top Skills -->
        ${data.skills && data.skills.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
              <i class="ri-star-line"></i> Top Skills
            </h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${data.skills.slice(0, 5).map(skill => `
                <div style="background: rgba(99, 102, 241, 0.15); padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px;">
                  <span style="color: var(--text); font-weight: 600;">${skill.skill}</span>
                  <span style="color: var(--primary); font-size: 12px; background: rgba(99, 102, 241, 0.2); padding: 2px 8px; border-radius: 10px;">${skill.proficiency}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Recent Reviews -->
        ${data.reviews && data.reviews.length > 0 ? `
          <div>
            <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
              <i class="ri-feedback-line"></i> Recent Reviews
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${data.reviews.slice(0, 3).map(review => `
                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border-left: 3px solid var(--accent);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: var(--text);">${review.period}</strong>
                    <span style="background: var(--accent); color: #fff; padding: 4px 12px; border-radius: 12px; font-weight: 600;">${review.score}/100</span>
                  </div>
                  <p style="color: var(--text-secondary); margin: 0; font-size: 14px;">${review.summary}</p>
                  <p style="color: var(--text-secondary); margin: 8px 0 0 0; font-size: 12px;">
                    <i class="ri-user-line"></i> Reviewed by: ${review.reviewer}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    console.error(err);
    modalBody.innerHTML = '<div style="color: var(--danger); text-align: center; padding: 20px;">Failed to load employee details.</div>';
  }
}

function initFeedbackForm() {
  const form = qs('#feedbackForm');
  if (!form) return;

  // Update slider value displays
  const sliders = [
    { slider: '#feedbackProductivity', display: '#productivityValue' },
    { slider: '#feedbackTeamwork', display: '#teamworkValue' },
    { slider: '#feedbackCreativity', display: '#creativityValue' },
    { slider: '#feedbackAccuracy', display: '#accuracyValue' }
  ];

  sliders.forEach(({ slider, display }) => {
    const sliderEl = qs(slider);
    const displayEl = qs(display);
    if (sliderEl && displayEl) {
      sliderEl.addEventListener('input', () => {
        displayEl.textContent = sliderEl.value;
      });
    }
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const employeeId = qs('#feedbackEmployeeId').value;
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const manager = JSON.parse(userStr);

    const feedbackData = {
      employeeId: parseInt(employeeId),
      managerId: manager.id,
      period: qs('#feedbackPeriod').value,
      score: parseInt(qs('#feedbackScore').value),
      summary: qs('#feedbackSummary').value,
      highlights: qs('#feedbackHighlights').value.split(',').map(h => h.trim()).filter(h => h),
      productivity: parseInt(qs('#feedbackProductivity').value),
      teamwork: parseInt(qs('#feedbackTeamwork').value),
      creativity: parseInt(qs('#feedbackCreativity').value),
      accuracy: parseInt(qs('#feedbackAccuracy').value),
      notes: qs('#feedbackNotes').value
    };

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const res = await fetch(`${API_BASE}/managers/feedback`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (res.ok) {
        alert('Feedback submitted successfully!');
        qs('#feedbackModal').classList.remove('open');
        form.reset();
      } else {
        const error = await res.json();
        alert('Failed to submit feedback: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit feedback');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    }
  });
}

function initSearch() {
  const searchInput = qs('#employeeSearch');
  if (!searchInput) return;

  const newSearchInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newSearchInput, searchInput);

  newSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allEmployees.filter(emp =>
      (emp.name && emp.name.toLowerCase().includes(term)) ||
      (emp.id && String(emp.id).includes(term)) ||
      (emp.department && emp.department.toLowerCase().includes(term))
    );
    renderEmployees(filtered);
  });

  // Keep focus
  newSearchInput.focus();
}

// Load Reports Data
async function loadReportsData() {
  try {
    const res = await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load reports');
    const data = await res.json();
    console.log('Reports data loaded:', data);
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

// Employee Management System
function initEmployeeManagement() {
  console.log('Initializing Employee Management...');

  // Tab Switching
  const tabBtns = qsa('.tab-btn');
  const tabContents = qsa('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      console.log('Switching to tab:', targetTab);

      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content
      tabContents.forEach(content => {
        if (content.dataset.tabContent === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Clear update mode when switching tabs
      if (targetTab === 'add') {
        const empIdField = qs('#empId');
        if (empIdField && empIdField.dataset.updateId) {
          delete empIdField.dataset.updateId;
          employeeForm.reset();
        }
      }
    });
  });

  // Employee Form Submission
  const employeeForm = qs('#employeeForm');
  if (employeeForm) {
    employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const empIdField = qs('#empId');
      const updateId = empIdField.dataset.updateId;

      // Gather form data
      const name = qs('#empName').value.trim();
      const email = empIdField.value.trim(); // Using ID field as email
      const phone = qs('#empPhone').value.trim();
      const department = qs('#empDepartment').value;
      const address = qs('#empAddress').value.trim();
      const workingStatus = qs('#empWorkingStatus').checked;

      if (!name || !email) {
        alert('Name and Email/ID are required');
        return;
      }

      const payload = {
        name,
        email,
        phone,
        title: 'Employee', // Default title
        department,
        address,
        workingStatus
      };

      try {
        if (updateId) {
          await updateEmployee(updateId, payload);
        } else {
          await addEmployee(payload);
        }

        employeeForm.reset();
        delete empIdField.dataset.updateId;

        // Switch to view tab
        const viewTabBtn = Array.from(qsa('.tab-btn')).find(btn => btn.dataset.tab === 'view');
        if (viewTabBtn) viewTabBtn.click();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Initialize Delete and Update Button Handlers
  initTableActions();
}

async function addEmployee(data) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return alert('You must be logged in');
  const manager = JSON.parse(userStr);

  const payload = {
    ...data,
    managerId: manager.id
  };

  try {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      alert('Employee added successfully!');
      await loadEmployees();
    } else {
      alert('Failed to add employee: ' + (result.message || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error while adding employee');
  }
}

async function updateEmployee(id, data) {
  try {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      alert('Employee updated successfully!');
      await loadEmployees();
    } else {
      alert('Failed to update employee: ' + (result.message || 'Unknown error'));
    }
  } catch (err) {
    console.error(err);
    alert('Network error while updating employee');
  }
}

function renumberTableRows() {
  const tableBody = qs('#employeesTableBody');
  if (!tableBody) return;

  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child');
    if (firstCell) {
      firstCell.textContent = index + 1;
    }
  });
}

function initTableActions() {
  console.log('Initializing table actions...');

  // View Details buttons
  const viewDetailsBtns = qsa('.view-details-btn');
  viewDetailsBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function () {
      const row = this.closest('tr');
      const id = row.dataset.id;
      viewEmployeeDetails(id);
    });
  });

  // View Report buttons
  const viewReportBtns = qsa('.view-report-btn');
  viewReportBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function () {
      const row = this.closest('tr');
      const id = row.dataset.id;
      viewEmployeeReport(id);
    });
  });

  // Feedback buttons
  const feedbackBtns = qsa('.feedback-btn');
  feedbackBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function () {
      const row = this.closest('tr');
      const id = row.dataset.id;
      openFeedbackModal(id);
    });
  });

  // Delete buttons
  const deleteBtns = qsa('.delete-btn');

  deleteBtns.forEach(btn => {
    // Remove old listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async function () {
      if (confirm('Are you sure you want to delete this employee?')) {
        const row = this.closest('tr');
        const id = row.dataset.id;

        try {
          const res = await fetch(`${API_BASE}/employees/${id}`, {
            headers: getAuthHeaders(),
            method: 'DELETE'
          });

          if (res.ok) {
            // Reload employees list
            await loadEmployees();
            alert('Employee deleted successfully');
          } else {
            const error = await res.json();
            alert('Failed to delete employee: ' + (error.message || 'Unknown error'));
          }
        } catch (err) {
          console.error(err);
          alert('Failed to delete employee');
        }
      }
    });
  });

  // Update buttons
  const updateBtns = qsa('.update-btn');

  updateBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async function () {
      const row = this.closest('tr');
      const id = row.dataset.id;

      // Find employee in allEmployees array
      const emp = allEmployees.find(e => String(e.empId) === String(id));
      if (!emp) return;

      // Populate form with employee data
      qs('#empName').value = emp.empName;
      qs('#empId').value = emp.empEmail || '';
      qs('#empPhone').value = emp.empPhone || '';
      qs('#empAddress').value = emp.empAddress || '';
      qs('#empWorkingStatus').checked = emp.empWorkingStatus;
      qs('#empDepartment').value = emp.empDepartment || '';

      // Store the ID for update
      qs('#empId').dataset.updateId = id;

      // Switch to add tab
      const addTabBtn = Array.from(qsa('.tab-btn')).find(btn => btn.dataset.tab === 'add');
      if (addTabBtn) addTabBtn.click();

      alert('Update the employee details and click "Add Employee" to save changes.');
    });
  });
}

async function toggleTask(empId, taskId, completed) {
  try {
    await fetch(`${API_BASE}/employees/${empId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
  } catch (err) {
    console.error(err);
  }
}

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

function initEmployeeTasks() {
  const taskList = qs('#taskList');
  const newTaskInput = qs('#newTask');
  const addTaskBtn = qs('#addTaskBtn');

  if (!taskList || !newTaskInput || !addTaskBtn) return;

  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);

  const addTask = async () => {
    const description = newTaskInput.value.trim();
    if (!description) return;

    try {
      addTaskBtn.disabled = true;
      addTaskBtn.textContent = '...';

      const res = await fetch(`${API_BASE}/employees/${user.id}/tasks`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (res.ok) {
        const task = await res.json();
        const li = document.createElement('li');
        li.innerHTML = `
          <input type="checkbox" id="task-${task.id}" onchange="toggleTask(${user.id}, ${task.id}, this.checked)" />
          <label for="task-${task.id}">${task.description}</label>
        `;
        // Insert at top
        taskList.insertBefore(li, taskList.firstChild);
        newTaskInput.value = '';
      } else {
        alert('Failed to add task');
      }
    } catch (err) {
      console.error(err);
    } finally {
      addTaskBtn.disabled = false;
      addTaskBtn.textContent = 'Add';
    }
  };

  addTaskBtn.addEventListener('click', addTask);
  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initBackground();
  initTheme();
  initLogin();
  initSideMenu();
  initControls();
  loadDashboardData();

  if (qs('#screen-manager')) {
    initSidebar();
    initFlipCards();
    initEmployeeManagement();
    initFeedbackForm();
  }
  if (qs('#screen-employee')) {
    initEmployeeTasks();
  }
  if (qs('#screen-reports')) {
    animateKpis();
    highlightLeaderboard();
    initExport();
  }
});
