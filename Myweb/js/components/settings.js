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

          <div class="pt-2">
            <button type="button" onclick="openPasswordModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-rose-455 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5 shadow-md">
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
                <input type="password" id="pw-current" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันตน">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">รหัสผ่านใหม่</label>
                <input type="password" id="pw-new" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="รหัสผ่านใหม่ที่ต้องการใช้">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input type="password" id="pw-new-confirm" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง">
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

// Expose settings updates & password modal triggers to window globally
window.handleSettingsUpdate = handleSettingsUpdate;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.handlePasswordChange = handlePasswordChange;

