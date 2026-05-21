// SmartLife SPA Settings Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';
import { sha256 } from '../crypto.js';

export function renderSettingsComponent() {
  return `
    <div class="space-y-6 max-w-xl">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <i data-lucide="settings" class="text-purple-400"></i>
          <span>ตั้งค่าข้อมูลทั่วไป (Settings Panel)</span>
        </h1>
        <p class="text-slate-400 text-xs mt-1">แก้ไขข้อมูลส่วนตัว รหัสผ่าน และปรับเป้าหมายรายวันของคุณได้ตลอดเวลา</p>
      </div>

      <div class="glass-panel p-6 rounded-3xl border border-slate-800/40">
        <form onsubmit="handleSettingsUpdate(event)" class="space-y-4">
          <div>
            <label class="block text-slate-300 text-xs font-semibold mb-1.5">ชื่อแสดงผลของคุณ (Display Name)</label>
            <input type="text" id="set-name" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.name}">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายการออมเงิน (฿)</label>
              <input type="number" id="set-savings" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.savingsGoal}">
            </div>
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายน้ำต่อวัน (มล.)</label>
              <input type="number" id="set-water" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.waterGoal}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายออกกำลังกาย (นาที)</label>
              <input type="number" id="set-exercise" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.exerciseGoal}">
            </div>
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายบริโภคแคลอรี่ (Kcal)</label>
              <input type="number" id="set-cal" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.calGoal}">
            </div>
          </div>

          <hr class="border-slate-800/60 my-4">

          <div class="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onclick="openUsernameModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-1.5 shadow-md">
              <i data-lucide="user-cog" class="w-4 h-4"></i> เปลี่ยนชื่อผู้ใช้ (Username)
            </button>
            <button type="button" onclick="openPasswordModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5 shadow-md">
              <i data-lucide="key-round" class="w-4 h-4"></i> เปลี่ยนรหัสผ่านความปลอดภัย
            </button>
          </div>

          <button type="submit" class="w-full py-3 mt-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md flex justify-center items-center gap-1.5">
            <i data-lucide="save" class="w-4 h-4"></i> บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>

      <!-- Change Password Modal overlay -->
      ${AppState.passwordModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closePasswordModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 class="text-md font-bold mb-4 flex items-center gap-2 text-rose-400">
              <i data-lucide="shield-alert" class="w-5 h-5"></i>
              <span>เปลี่ยนรหัสผ่านความปลอดภัย</span>
            </h3>

            <form onsubmit="handlePasswordChange(event)" class="space-y-4">
              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">รหัสผ่านปัจจุบัน</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-current" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันตน">
                  <button type="button" onclick="togglePasswordVisibility('pw-current')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-current" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">รหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="รหัสผ่านใหม่ที่ต้องการใช้">
                  <button type="button" onclick="togglePasswordVisibility('pw-new')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new-confirm" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง">
                  <button type="button" onclick="togglePasswordVisibility('pw-new-confirm')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new-confirm" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md">
                  ยืนยันการเปลี่ยนรหัสผ่าน
                </button>
                <button type="button" onclick="closePasswordModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Change Username Modal overlay -->
      ${AppState.usernameModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeUsernameModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 class="text-md font-bold mb-4 flex items-center gap-2 text-purple-400">
              <i data-lucide="user-cog" class="w-5 h-5"></i>
              <span>เปลี่ยนชื่อผู้ใช้ (Username)</span>
            </h3>

            <form onsubmit="handleUsernameChange(event)" class="space-y-4">
              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ชื่อผู้ใช้เดิม</label>
                <input type="text" disabled class="glass-input w-full px-3 py-2 rounded-lg text-xs opacity-60 cursor-not-allowed" value="@${AppState.currentUser.username}">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ชื่อผู้ใช้ใหม่</label>
                <input type="text" id="uname-new" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="กรอกชื่อผู้ใช้ใหม่ (เช่น somchai_new)">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ยืนยันรหัสผ่านของคุณ</label>
                <div class="relative flex items-center">
                  <input type="password" id="uname-password" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยน">
                  <button type="button" onclick="togglePasswordVisibility('uname-password')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-uname-password" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md">
                  ยืนยันการเปลี่ยนชื่อผู้ใช้
                </button>
                <button type="button" onclick="closeUsernameModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function handleSettingsUpdate(event) {
  event.preventDefault();

  const name = document.getElementById('set-name').value.trim();
  const savings = parseFloat(document.getElementById('set-savings').value) || 0;
  const water = parseInt(document.getElementById('set-water').value) || 0;
  const exercise = parseInt(document.getElementById('set-exercise').value) || 0;
  const cal = parseInt(document.getElementById('set-cal').value) || 0;

  AppState.currentUser.name = name;
  AppState.currentUser.savingsGoal = savings;
  AppState.currentUser.waterGoal = water;
  AppState.currentUser.exerciseGoal = exercise;
  AppState.currentUser.calGoal = cal;

  AppState.saveProfile();
  showToast('บันทึกการปรับปรุงข้อมูลเรียบร้อยแล้วครับ!');
  renderPage();
}

export function openPasswordModal() {
  AppState.passwordModalOpen = true;
  renderPage();
}

export function closePasswordModal() {
  AppState.passwordModalOpen = false;
  renderPage();
}

export function openUsernameModal() {
  AppState.usernameModalOpen = true;
  renderPage();
}

export function closeUsernameModal() {
  AppState.usernameModalOpen = false;
  renderPage();
}

export function handleUsernameChange(event) {
  event.preventDefault();

  const newUsername = document.getElementById('uname-new').value.trim().toLowerCase();
  const password = document.getElementById('uname-password').value;

  if (!newUsername) {
    showToast('กรุณากรอกชื่อผู้ใช้ใหม่', 'error');
    return;
  }

  const oldUsername = AppState.currentUser.username;
  if (newUsername === oldUsername) {
    showToast('ชื่อผู้ใช้ใหม่ต้องไม่ซ้ำกับชื่อผู้ใช้เดิม', 'warning');
    return;
  }

  // Validate password
  const hashedCurrent = sha256(password);
  let currentPasswordValid = false;
  if (AppState.currentUser.password === hashedCurrent) {
    currentPasswordValid = true;
  } else if (AppState.currentUser.password === password) {
    currentPasswordValid = true;
  }

  if (!currentPasswordValid) {
    showToast('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
    return;
  }

  // Check if new username is already taken
  const users = JSON.parse(localStorage.getItem('smart_users') || '[]');
  if (users.some(u => u.username === newUsername)) {
    showToast('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 'error');
    return;
  }

  // Perform migration of localStorage keys
  const profileData = localStorage.getItem(`smart_profile_${oldUsername}`);
  const txData = localStorage.getItem(`smart_tx_${oldUsername}`);
  const plansData = localStorage.getItem(`smart_plans_${oldUsername}`);
  const healthData = localStorage.getItem(`smart_daily_health_${oldUsername}`);

  // Set new keys
  if (profileData) {
    const parsedProfile = JSON.parse(profileData);
    parsedProfile.username = newUsername;
    localStorage.setItem(`smart_profile_${newUsername}`, JSON.stringify(parsedProfile));
    AppState.currentUser = parsedProfile;
  } else {
    AppState.currentUser.username = newUsername;
    localStorage.setItem(`smart_profile_${newUsername}`, JSON.stringify(AppState.currentUser));
  }

  if (txData) localStorage.setItem(`smart_tx_${newUsername}`, txData);
  if (plansData) localStorage.setItem(`smart_plans_${newUsername}`, plansData);
  if (healthData) localStorage.setItem(`smart_daily_health_${newUsername}`, healthData);

  // Remove old keys
  localStorage.removeItem(`smart_profile_${oldUsername}`);
  localStorage.removeItem(`smart_tx_${oldUsername}`);
  localStorage.removeItem(`smart_plans_${oldUsername}`);
  localStorage.removeItem(`smart_daily_health_${oldUsername}`);

  // Update catalog (smart_users)
  const index = users.findIndex(u => u.username === oldUsername);
  if (index !== -1) {
    users[index].username = newUsername;
    users[index].name = AppState.currentUser.name;
    localStorage.setItem('smart_users', JSON.stringify(users));
  }

  // Update active user key
  localStorage.setItem('smart_active_user', newUsername);

  // Reload data into AppState
  AppState.loadUserData();

  AppState.usernameModalOpen = false;
  showToast('เปลี่ยนชื่อผู้ใช้เรียบร้อยแล้ว! 🎉', 'success');
  renderPage();
}

export function handlePasswordChange(event) {
  event.preventDefault();

  const current = document.getElementById('pw-current').value;
  const newPass = document.getElementById('pw-new').value;
  const confirmPass = document.getElementById('pw-new-confirm').value;

  // 1. Verify old password (supporting both hashed and legacy plain text comparisons)
  const hashedCurrent = sha256(current);
  let currentPasswordValid = false;
  if (AppState.currentUser.password === hashedCurrent) {
    currentPasswordValid = true;
  } else if (AppState.currentUser.password === current) {
    currentPasswordValid = true;
  }

  if (!currentPasswordValid) {
    showToast('รหัสผ่านเดิมไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
    return;
  }

  // 2. Validate new password length or strength
  if (newPass.length < 4) {
    showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'warning');
    return;
  }

  // 3. Verify new passwords match
  if (newPass !== confirmPass) {
    showToast('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', 'error');
    return;
  }

  // 4. Update password securely using SHA-256 hash
  const hashedNewPass = sha256(newPass);
  AppState.currentUser.password = hashedNewPass;
  AppState.saveProfile();
  AppState.passwordModalOpen = false;
  
  showToast('เปลี่ยนรหัสผ่านความปลอดภัยเรียบร้อยแล้ว! 🔒', 'success');
  renderPage();
}

// Expose settings updates & password/username modal triggers to window globally
window.handleSettingsUpdate = handleSettingsUpdate;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.openUsernameModal = openUsernameModal;
window.closeUsernameModal = closeUsernameModal;
window.handleUsernameChange = handleUsernameChange;
window.handlePasswordChange = handlePasswordChange;


