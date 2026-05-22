// SmartLife SPA Settings Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';
import { sha256 } from '../crypto.js';

// Local states for Google Drive modal & simulation sync
let isDriveModalOpen = false;
let isSyncingDrive = false;
let driveSyncProgress = 0;
let driveAuthStep = 0; // 0: Link input / actions, 1: Account Chooser, 2: Upload/Sync Progress, 3: Success

// Image compression helper (keeps storage footprints tiny under 20KB for localStorage compatibility)
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 128;
      const MAX_HEIGHT = 128;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress quality
      callback(dataUrl);
    };
  };
}

// Extract standard Google Drive File ID and convert to direct image stream URL
export function parseGoogleDriveLink(url) {
  if (!url) return '';
  const regD = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const regId = /[?&]id=([a-zA-Z0-9_-]+)/;
  
  let match = url.match(regD);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  
  match = url.match(regId);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

// Local avatar select trigger
export function triggerLocalAvatarSelect() {
  const fileInput = document.getElementById('local-avatar-input');
  if (fileInput) fileInput.click();
}

// Local profile image upload handler
export function handleLocalProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ', 'error');
    return;
  }

  showToast('กำลังประมวลผลรูปภาพ...', 'info');
  compressImage(file, (base64Data) => {
    AppState.currentUser.profileImage = base64Data;
    AppState.saveProfile();
    showToast('อัพโหลดและอัปเดตรูปภาพโปรไฟล์แล้วครับ! 📸', 'success');
    renderPage();
  });
}

// Remove profile image
export function removeProfileImage() {
  if (confirm('คุณต้องการลบรูปภาพโปรไฟล์ของคุณใช่ไหม?')) {
    AppState.currentUser.profileImage = null;
    AppState.saveProfile();
    showToast('ลบรูปภาพโปรไฟล์เรียบร้อยแล้วครับ', 'info');
    renderPage();
  }
}

// Google Drive modal controllers
export function openGoogleDriveModal() {
  isDriveModalOpen = true;
  driveAuthStep = 0;
  driveSyncProgress = 0;
  isSyncingDrive = false;
  renderPage();
}

export function closeGoogleDriveModal() {
  isDriveModalOpen = false;
  renderPage();
}

// Direct URL input submission
export function handleGoogleDriveLinkSubmit(event) {
  event.preventDefault();
  const linkVal = document.getElementById('drive-link-input').value.trim();
  if (!linkVal) {
    showToast('กรุณากรอกลิงก์ Google Drive ก่อนครับ', 'warning');
    return;
  }

  const directUrl = parseGoogleDriveLink(linkVal);
  if (directUrl === linkVal && !linkVal.includes('drive.google.com')) {
    showToast('ลิงก์ไม่ถูกต้อง กรุณาใช้ลิงก์แชร์ของ Google Drive ครับ', 'error');
    return;
  }

  AppState.currentUser.profileImage = directUrl;
  AppState.saveProfile();
  showToast('ซิงค์รูปโปรไฟล์จาก Google Drive สำเร็จ! ☁️', 'success');
  closeGoogleDriveModal();
}

// Simulated sync step 1: Google Account Picker
export function chooseDriveSimulatedAccount(email) {
  driveAuthStep = 2;
  isSyncingDrive = true;
  driveSyncProgress = 0;
  renderPage();

  const interval = setInterval(() => {
    driveSyncProgress += 10;
    renderPage();
    if (driveSyncProgress >= 100) {
      clearInterval(interval);
      isSyncingDrive = false;
      driveAuthStep = 3;

      // Save a beautiful simulated high-end virtual profile avatar
      const avatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
      ];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      AppState.currentUser.profileImage = randomAvatar;
      AppState.saveProfile();
      showToast('ซิงค์ข้อมูลกับ Google Drive จำลองสำเร็จ! 🌟', 'success');
      renderPage();
    }
  }, 150);
}

// Simulate OAuth sequence trigger
export function startGoogleDriveSyncSimulate() {
  driveAuthStep = 1;
  renderPage();
}

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
        <!-- Premium Profile Picture customization area -->
        <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-4 border-b border-slate-800/40">
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full blur opacity-45 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-purple-500/30 overflow-hidden shadow-2xl flex items-center justify-center">
              ${AppState.currentUser.profileImage ? `
                <img src="${AppState.currentUser.profileImage}" class="w-full h-full object-cover">
              ` : `
                <div class="w-full h-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-extrabold text-3xl text-white">
                  ${AppState.currentUser.name.charAt(0).toUpperCase()}
                </div>
              `}
            </div>
          </div>
          
          <div class="flex-1 text-center sm:text-left space-y-2">
            <h3 class="text-sm font-bold text-slate-200">รูปภาพโปรไฟล์ของคุณ</h3>
            <p class="text-[10px] text-slate-400 leading-normal">รองรับไฟล์ภาพ JPEG/PNG จากเครื่อง หรือดึงภาพผ่าน Google Drive เพื่อแชร์ร่วมกันในคลาวด์</p>
            
            <div class="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <button type="button" onclick="triggerLocalAvatarSelect()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i> อัพโหลดรูปภาพ
              </button>
              <button type="button" onclick="openGoogleDriveModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="cloud" class="w-3.5 h-3.5"></i> ซิงค์ Google Drive
              </button>
              ${AppState.currentUser.profileImage ? `
                <button type="button" onclick="removeProfileImage()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer">
                  ลบรูปภาพ
                </button>
              ` : ''}
            </div>
            <input type="file" id="local-avatar-input" accept="image/*" class="hidden" onchange="handleLocalProfileUpload(event)">
          </div>
        </div>

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

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายออกกำลังกาย (นาที)</label>
              <input type="number" id="set-exercise" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.exerciseGoal}">
            </div>
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายบริโภคแคลอรี่ (Kcal)</label>
              <input type="number" id="set-cal" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.calGoal}">
            </div>
            <div>
              <label class="block text-slate-300 text-xs font-semibold mb-1.5">เป้าหมายเผาผลาญ (Kcal)</label>
              <input type="number" id="set-burn" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.burnGoal || 500}">
            </div>
          </div>

          <hr class="border-slate-800/60 my-4">

          <div class="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onclick="openUsernameModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
              <i data-lucide="user-cog" class="w-4 h-4"></i> เปลี่ยนชื่อผู้ใช้ (Username)
            </button>
            <button type="button" onclick="openPasswordModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
              <i data-lucide="key-round" class="w-4 h-4"></i> เปลี่ยนรหัสผ่านความปลอดภัย
            </button>
          </div>

          <button type="submit" class="w-full py-3 mt-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
            <i data-lucide="save" class="w-4 h-4"></i> บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>

      <!-- Change Password Modal overlay -->
      ${AppState.passwordModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closePasswordModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
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
                  <button type="button" onclick="togglePasswordVisibility('pw-current')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-current" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">รหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="รหัสผ่านใหม่ที่ต้องการใช้">
                  <button type="button" onclick="togglePasswordVisibility('pw-new')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new-confirm" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง">
                  <button type="button" onclick="togglePasswordVisibility('pw-new-confirm')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new-confirm" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer">
                  ยืนยันการเปลี่ยนรหัสผ่าน
                </button>
                <button type="button" onclick="closePasswordModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300 cursor-pointer">
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
            <button type="button" onclick="closeUsernameModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
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
                  <button type="button" onclick="togglePasswordVisibility('uname-password')" class="absolute right-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-uname-password" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md cursor-pointer">
                  ยืนยันการเปลี่ยนชื่อผู้ใช้
                </button>
                <button type="button" onclick="closeUsernameModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300 cursor-pointer">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Google Drive Synchronization Modal Overlay -->
      ${isDriveModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeGoogleDriveModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Step 0: Initial Screen -->
            ${driveAuthStep === 0 ? `
              <div class="space-y-4">
                <div class="text-center pt-2">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-3 shadow-lg">
                    <i data-lucide="cloud" class="w-6 h-6 animate-pulse"></i>
                  </div>
                  <h3 class="text-md font-bold text-white">เชื่อมโยงกับ Google Drive</h3>
                  <p class="text-xs text-slate-400 mt-1">อัพเดตรูปภาพโปรไฟล์ผ่าน Cloud Storage ส่วนตัวของคุณ</p>
                </div>

                <form onsubmit="handleGoogleDriveLinkSubmit(event)" class="space-y-3">
                  <div>
                    <label class="block text-slate-400 text-xs font-semibold mb-1">ลิงก์แชร์รูปภาพบน Google Drive ของคุณ</label>
                    <input type="url" id="drive-link-input" required class="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono" placeholder="https://drive.google.com/file/d/.../view">
                    <span class="text-[9px] text-slate-500 mt-1 block leading-normal">* หมายเหตุ: โปรดตั้งค่าเปิดสิทธิ์ไฟล์ใน Drive เป็น "ทุกคนที่มีลิงก์แชร์สามารถเข้าดูได้ (Anyone with link)" เพื่อให้อ่านรูปได้ครับ</span>
                  </div>

                  <button type="submit" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
                    <i data-lucide="link" class="w-4 h-4"></i> เชื่อมโยงและดึงรูปโปรไฟล์
                  </button>
                </form>

                <div class="relative flex items-center justify-center py-2">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800/80"></div></div>
                  <span class="relative px-3 text-[10px] text-slate-500 bg-[#0a0715] font-bold uppercase tracking-wider">หรือซิงค์เสมือนจริง</span>
                </div>

                <button type="button" onclick="startGoogleDriveSyncSimulate()" class="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer">
                  <i data-lucide="chrome" class="w-4 h-4"></i> เชื่อมต่อ Google Account & ซิงค์ข้อมูล
                </button>
              </div>
            ` : ''}

            <!-- Step 1: Google Account Chooser Simulation -->
            ${driveAuthStep === 1 ? `
              <div class="space-y-4">
                <div class="text-center pt-2">
                  <!-- Muted Google Brand color svg -->
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-slate-800 mb-2">
                    <svg class="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.91h6.69c-.29 1.5-.1.84-2.43 2.77v2.28h3.91c2.28-2.1 3.57-5.18 3.57-8.89z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.91-3.03c-1.08.72-2.48 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.28v3.13C3.26 20.3 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.57H1.28C.47 8.2.01 10.05.01 12s.46 3.8 1.27 5.43l4.04-3.14z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.33 0 3.26 3.7 1.28 7.64l4.04 3.14c.94-2.82 3.57-4.92 6.68-4.92z"/>
                    </svg>
                  </div>
                  <h3 class="text-md font-bold text-white">เลือกบัญชีเพื่อซิงค์ระบบ</h3>
                  <p class="text-xs text-slate-400 mt-1">การอนุญาตนี้จะเชื่อมโยง API กับบัญชีคลาวด์ของคุณ</p>
                </div>

                <div class="space-y-2 pt-2">
                  <button type="button" onclick="chooseDriveSimulatedAccount('${AppState.currentUser.username}@gmail.com')" class="w-full p-3 rounded-xl bg-white/5 border border-slate-800/60 hover:bg-white/10 hover:border-slate-700 transition-all flex items-center gap-3 text-left cursor-pointer">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                      ${AppState.currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-200">${AppState.currentUser.name}</p>
                      <p class="text-[10px] text-slate-500">${AppState.currentUser.username}@gmail.com</p>
                    </div>
                  </button>

                  <button type="button" onclick="chooseDriveSimulatedAccount('smartlife.health.sync@gmail.com')" class="w-full p-3 rounded-xl bg-white/5 border border-slate-800/60 hover:bg-white/10 hover:border-slate-700 transition-all flex items-center gap-3 text-left cursor-pointer">
                    <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      S
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-200">SmartLife Sync Center</p>
                      <p class="text-[10px] text-slate-500">smartlife.health.sync@gmail.com</p>
                    </div>
                  </button>
                </div>

                <button type="button" onclick="openGoogleDriveModal()" class="w-full py-2.5 mt-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-slate-800 hover:bg-white/10 transition-colors cursor-pointer">
                  ย้อนกลับ
                </button>
              </div>
            ` : ''}

            <!-- Step 2: Simulated Cloud Upload/Sync Progress -->
            ${driveAuthStep === 2 ? `
              <div class="space-y-6 py-4 text-center">
                <div class="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div class="absolute inset-0 rounded-full border-4 border-cyan-500/10"></div>
                  <div class="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                  <i data-lucide="cloud-lightning" class="w-6 h-6 text-cyan-400 animate-pulse"></i>
                </div>

                <div class="space-y-2">
                  <h4 class="text-sm font-bold text-slate-200">กำลังเชื่อมต่อ & ซิงค์ภาพจาก Drive...</h4>
                  <p class="text-[10px] text-slate-500 h-8 flex items-center justify-center">
                    ${driveSyncProgress < 30 ? 'ขั้นตอนที่ 1: กำลังยืนยันสิทธิ์บัญชี OAuth Tokens...' :
                      driveSyncProgress < 70 ? 'ขั้นตอนที่ 2: กำลังเชื่อมต่อโฟลเดอร์ Google Drive Cloud...' :
                      driveSyncProgress < 95 ? 'ขั้นตอนที่ 3: กำลังประมวลผลดึงไฟล์ภาพโปรไฟล์ล่าสุด...' :
                      'ขั้นตอนที่ 4: ซิงค์เสร็จสมบูรณ์เรียบร้อยแล้ว!'}
                  </p>
                </div>

                <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner">
                  <div class="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-300" style="width: ${driveSyncProgress}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-cyan-400 block">${driveSyncProgress}%</span>
              </div>
            ` : ''}

            <!-- Step 3: Success Screen -->
            ${driveAuthStep === 3 ? `
              <div class="space-y-5 py-4 text-center">
                <div class="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/20">
                  <i data-lucide="check" class="w-7 h-7"></i>
                </div>

                <div class="space-y-1">
                  <h4 class="text-md font-bold text-slate-200">ระบบลิงก์รูปภาพเรียบร้อยแล้ว!</h4>
                  <p class="text-xs text-slate-400">รูปโปรไฟล์จากระบบ Google Drive ของคุณอัปเดตเรียบร้อยครับ</p>
                </div>

                <div class="pt-2">
                  <button type="button" onclick="closeGoogleDriveModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md cursor-pointer">
                    ปิดหน้าต่างการซิงค์
                  </button>
                </div>
              </div>
            ` : ''}

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
  const burn = parseInt(document.getElementById('set-burn').value) || 0;

  AppState.currentUser.name = name;
  AppState.currentUser.savingsGoal = savings;
  AppState.currentUser.waterGoal = water;
  AppState.currentUser.exerciseGoal = exercise;
  AppState.currentUser.calGoal = cal;
  AppState.currentUser.burnGoal = burn;

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

window.triggerLocalAvatarSelect = triggerLocalAvatarSelect;
window.handleLocalProfileUpload = handleLocalProfileUpload;
window.removeProfileImage = removeProfileImage;
window.openGoogleDriveModal = openGoogleDriveModal;
window.closeGoogleDriveModal = closeGoogleDriveModal;
window.handleGoogleDriveLinkSubmit = handleGoogleDriveLinkSubmit;
window.startGoogleDriveSyncSimulate = startGoogleDriveSyncSimulate;
window.chooseDriveSimulatedAccount = chooseDriveSimulatedAccount;
window.parseGoogleDriveLink = parseGoogleDriveLink;


