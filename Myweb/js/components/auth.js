// SmartLife SPA Auth Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { navigate, renderPage } from '../router.js';
import { sha256 } from '../crypto.js';

export function renderAuth(app) {
  app.className = "flex items-center justify-center min-h-screen bg-[#0a0715] p-4";
  
  // Decide whether to show Sign In or Sign Up (Default is Sign In when undefined/signin)
  const showSignUp = app.dataset.authMode === 'signup';
  
  app.innerHTML = `
    <div class="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800/50 shadow-2xl relative overflow-hidden page-fade-in">
      <!-- Cyber background decoration -->
      <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-600/10 blur-3xl"></div>

      <div class="text-center mb-8 relative">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl shadow-purple-600/20 mb-4">
          <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">SmartLife Portal</h2>
        <p class="text-slate-400 text-sm mt-2">${showSignUp ? 'สร้างบัญชีผู้ใช้ใหม่เพื่อเริ่มต้น' : 'กรอกชื่อผู้ใช้เพื่อเข้าใช้กระดานข้อมูล'}</p>
      </div>

      <form id="auth-form" onsubmit="handleAuthSubmit(event, ${showSignUp})" class="space-y-5 relative">
        <div>
          <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
          <div class="relative">
            <i data-lucide="user" class="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5"></i>
            <input type="text" id="auth-username" required class="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm" placeholder="เช่น somchai_12">
          </div>
        </div>

        <div>
          <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
          <div class="relative flex items-center">
            <i data-lucide="lock" class="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5"></i>
            <input type="password" id="auth-password" required class="glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm" placeholder="••••••••">
            <button type="button" onclick="togglePasswordVisibility('auth-password')" class="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
              <i id="eye-auth-password" data-lucide="eye" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        ${showSignUp ? `
        <div>
          <label class="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
          <div class="relative flex items-center">
            <i data-lucide="shield-check" class="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5"></i>
            <input type="password" id="auth-confirm" required class="glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm" placeholder="••••••••">
            <button type="button" onclick="togglePasswordVisibility('auth-confirm')" class="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
              <i id="eye-auth-confirm" data-lucide="eye" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
        ` : ''}

        <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-900/40 hover:shadow-cyan-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span>${showSignUp ? 'Sign Up' : 'Sign In'}</span>
          <i data-lucide="arrow-right" class="w-5 h-5"></i>
        </button>
      </form>

      <div class="text-center mt-6 text-sm text-slate-400 relative">
        ${showSignUp ? `
          <span>มีบัญชีอยู่แล้ว? </span>
          <button onclick="toggleAuthMode(false)" class="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">เข้าสู่ระบบ</button>
        ` : `
          <span>ยังไม่มีบัญชีผู้ใช้? </span>
          <button onclick="toggleAuthMode(true)" class="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">สมัครสมาชิกใหม่</button>
        `}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

export function toggleAuthMode(isSignUp) {
  const app = document.getElementById('app');
  if (!app) return;
  app.dataset.authMode = isSignUp ? 'signup' : 'signin';
  renderPage();
}

export function handleAuthSubmit(event, isSignUp) {
  event.preventDefault();
  
  const username = document.getElementById('auth-username').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;

  if (!username || !password) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem('smart_users') || '[]');

  if (isSignUp) {
    const confirm = document.getElementById('auth-confirm').value;
    if (password !== confirm) {
      showToast('รหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    if (users.some(u => u.username === username)) {
      showToast('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 'error');
      return;
    }

    const hashedPassword = sha256(password);
    const newUser = {
      username: username,
      password: hashedPassword,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      savingsGoal: 5000,
      waterGoal: 2000,
      exerciseGoal: 30,
      calGoal: 2000,
      burnGoal: 500,
      onboarded: false
    };

    users.push(newUser);
    localStorage.setItem('smart_users', JSON.stringify(users));
    localStorage.setItem(`smart_profile_${username}`, JSON.stringify(newUser));
    localStorage.setItem('smart_active_user', username);
    
    AppState.currentUser = newUser;
    AppState.loadUserData();
    showToast('สมัครสมาชิกสำเร็จ!');
    navigate('dashboard');
  } else {
    const hashedPassword = sha256(password);
    let user = users.find(u => u.username === username);
    
    let passwordMatched = false;
    if (user) {
      if (user.password === hashedPassword) {
        passwordMatched = true;
      } else if (user.password === password) {
        // Migration of legacy plain-text password account to SHA-256 hashed password
        passwordMatched = true;
        user.password = hashedPassword;
        localStorage.setItem('smart_users', JSON.stringify(users));
        
        // Also update in profile store
        const profile = JSON.parse(localStorage.getItem(`smart_profile_${username}`));
        if (profile) {
          profile.password = hashedPassword;
          localStorage.setItem(`smart_profile_${username}`, JSON.stringify(profile));
        }
      }
    }

    if (!passwordMatched) {
      showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
      return;
    }

    localStorage.setItem('smart_active_user', username);
    AppState.currentUser = JSON.parse(localStorage.getItem(`smart_profile_${username}`));
    AppState.loadUserData();
    showToast('เข้าสู่ระบบสำเร็จ');
    navigate('dashboard');
  }
}

// Bind to window to allow dynamic HTML template calls
window.toggleAuthMode = toggleAuthMode;
window.handleAuthSubmit = handleAuthSubmit;

