// SmartLife SPA Settings Component Module
import { AppState, notifyStateChange } from '../state.js';
import { showToast } from '../ui.js';
import { navigate, renderPage } from '../router.js';

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

  let fileId = null;
  let match = url.match(regD);
  if (match && match[1]) {
    fileId = match[1];
  } else {
    match = url.match(regId);
    if (match && match[1]) {
      fileId = match[1];
    }
  }

  if (fileId) {
    // Use lh3 CDN with cache-busting timestamp to force reload on image change
    return `https://lh3.googleusercontent.com/d/${fileId}?t=${Date.now()}`;
  }
  return url;
}

// Local avatar select trigger
export function triggerLocalAvatarSelect() {
  const fileInput = document.getElementById('local-avatar-input');
  if (fileInput) fileInput.click();
}

// Local profile image upload handler
export async function handleLocalProfileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ', 'error');
    return;
  }

  showToast('กำลังประมวลผลและอัพโหลดรูปภาพ...', 'info');

  // compressImage shrinks the image to 128x128 JPEG at 70% quality (under ~10KB).
  // We can safely store this tiny Base64 string directly in Firestore to sync across all devices!
  compressImage(file, async (base64Data) => {
    try {
      AppState.currentUser.profileImage = base64Data;
      AppState.saveProfile();

      showToast('อัพโหลดและซิงค์รูปภาพโปรไฟล์สำเร็จ! 📸', 'success');
      renderPage();
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ', 'error');
    }
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

  // Test that the image actually loads before saving
  const testImg = new Image();
  testImg.crossOrigin = 'anonymous';
  testImg.referrerPolicy = 'no-referrer';
  testImg.onload = () => {
    AppState.currentUser.profileImage = directUrl;
    AppState.saveProfile();
    showToast('ซิงค์รูปโปรไฟล์จาก Google Drive สำเร็จ! ☁️', 'success');
    closeGoogleDriveModal();
  };
  testImg.onerror = () => {
    showToast('ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบสิทธิ์การแชร์ไฟล์ใน Drive (ต้องเป็น Anyone with the link)', 'error');
  };
  testImg.src = directUrl;
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
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i data-lucide="settings" class="text-[#007a7a]"></i>
          <span>ตั้งค่าข้อมูลทั่วไป (Settings Panel)</span>
        </h1>
        <p class="text-slate-500 text-xs mt-1">แก้ไขข้อมูลส่วนตัว รหัสผ่าน และปรับเป้าหมายรายวันของคุณได้ตลอดเวลา</p>
      </div>

      <div class="glass-panel p-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <!-- Premium Profile Picture customization area -->
        <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-4 border-b border-slate-100">
          <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-tr from-[#005f5f] to-[#007a7a] rounded-full blur opacity-35 group-hover:opacity-60 transition-opacity"></div>
            <div class="relative w-24 h-24 rounded-full bg-slate-50 border-2 border-[#007a7a]/30 overflow-hidden shadow-lg flex items-center justify-center">
              ${AppState.currentUser.profileImage ? `
                <img src="${AppState.currentUser.profileImage}" referrerpolicy="no-referrer" crossorigin="anonymous" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="w-full h-full bg-gradient-to-tr from-[#005f5f] to-[#007a7a] flex items-center justify-center font-extrabold text-3xl text-white" style="display:none">
                  ${AppState.currentUser.name.charAt(0).toUpperCase()}
                </div>
              ` : `
                <div class="w-full h-full bg-gradient-to-tr from-[#005f5f] to-[#007a7a] flex items-center justify-center font-extrabold text-3xl text-white">
                  ${AppState.currentUser.name.charAt(0).toUpperCase()}
                </div>
              `}
            </div>
          </div>
          
          <div class="flex-1 text-center sm:text-left space-y-2">
            <h3 class="text-sm font-bold text-slate-700">รูปภาพโปรไฟล์ของคุณ</h3>
            <p class="text-[10px] text-slate-500 leading-normal">รองรับไฟล์ภาพ JPEG/PNG จากเครื่อง หรือดึงภาพผ่าน Google Drive เพื่อแชร์ร่วมกันในคลาวด์</p>
            
            <div class="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <button type="button" onclick="triggerLocalAvatarSelect()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#007a7a] bg-[#007a7a]/10 border border-[#007a7a]/25 hover:bg-[#007a7a]/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i> อัพโหลดรูปภาพ
              </button>
              <button type="button" onclick="openGoogleDriveModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="cloud" class="w-3.5 h-3.5"></i> ซิงค์ Google Drive
              </button>
              ${AppState.currentUser.profileImage ? `
                <button type="button" onclick="removeProfileImage()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer">
                  ลบรูปภาพ
                </button>
              ` : ''}
            </div>
            <input type="file" id="local-avatar-input" accept="image/*" class="hidden" onchange="handleLocalProfileUpload(event)">
          </div>
        </div>

        <form onsubmit="handleSettingsUpdate(event)" class="space-y-4">
          <div>
            <label class="block text-slate-650 text-xs font-semibold mb-1.5">ชื่อแสดงผลของคุณ (Display Name)</label>
            <input type="text" id="set-name" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.name}">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-650 text-xs font-semibold mb-1.5">เป้าหมายการออมเงิน (฿)</label>
              <input type="number" id="set-savings" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.savingsGoal}">
            </div>
            <div>
              <label class="block text-slate-650 text-xs font-semibold mb-1.5">เป้าหมายน้ำต่อวัน (มล.)</label>
              <input type="number" id="set-water" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.waterGoal}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-slate-650 text-xs font-semibold mb-1.5">เป้าหมายออกกำลังกาย (นาที)</label>
              <input type="number" id="set-exercise" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.exerciseGoal}">
            </div>
            <div>
              <label class="block text-slate-650 text-xs font-semibold mb-1.5">เป้าหมายบริโภคแคลอรี่ (Kcal)</label>
              <input type="number" id="set-cal" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.calGoal}">
            </div>
            <div>
              <label class="block text-slate-650 text-xs font-semibold mb-1.5">เป้าหมายเผาผลาญ (Kcal)</label>
              <input type="number" id="set-burn" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.burnGoal || 500}">
            </div>
          </div>

          <hr class="border-slate-100 my-4">

          <div class="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onclick="openUsernameModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-[#007a7a] bg-[#007a7a]/10 border border-[#007a7a]/20 hover:bg-[#007a7a]/20 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <i data-lucide="user-cog" class="w-4 h-4"></i> เปลี่ยนชื่อผู้ใช้ (Username)
            </button>
            <button type="button" onclick="openPasswordModal()" class="w-full py-2.5 rounded-xl text-xs font-bold text-rose-650 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <i data-lucide="key-round" class="w-4 h-4"></i> เปลี่ยนรหัสผ่านความปลอดภัย
            </button>
          </div>

          <button type="submit" class="w-full py-3 mt-4 rounded-xl font-bold text-white bg-[#007a7a] hover:bg-[#006363] transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
            <i data-lucide="save" class="w-4 h-4"></i> บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>

      <!-- Change Password Modal overlay -->
      ${AppState.passwordModalOpen ? `
        <div class="modal-overlay-safe fixed inset-0 top-[68px] md:top-0 landscape:top-[60px] md:landscape:top-0 ${AppState.sidebarCollapsed ? 'md:left-20' : 'md:left-64'} z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-md bg-white p-5 landscape:p-4 rounded-3xl border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[85vh] landscape:max-h-[85vh] animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closePasswordModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-750 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
 
            <h3 class="text-md font-bold mb-4 flex items-center gap-2 text-rose-650">
              <i data-lucide="shield-alert" class="w-5 h-5"></i>
              <span>เปลี่ยนรหัสผ่านความปลอดภัย</span>
            </h3>

            <form onsubmit="handlePasswordChange(event)" class="space-y-4">
              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">รหัสผ่านปัจจุบัน</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-current" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันตน">
                  <button type="button" onclick="togglePasswordVisibility('pw-current')" class="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-current" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">รหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="รหัสผ่านใหม่ที่ต้องการใช้">
                  <button type="button" onclick="togglePasswordVisibility('pw-new')" class="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div class="relative flex items-center">
                  <input type="password" id="pw-new-confirm" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง">
                  <button type="button" onclick="togglePasswordVisibility('pw-new-confirm')" class="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-pw-new-confirm" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer">
                  ยืนยันการเปลี่ยนรหัสผ่าน
                </button>
                <button type="button" onclick="closePasswordModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 cursor-pointer">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Change Username Modal overlay -->
      ${AppState.usernameModalOpen ? `
        <div class="modal-overlay-safe fixed inset-0 top-[68px] md:top-0 landscape:top-[60px] md:landscape:top-0 ${AppState.sidebarCollapsed ? 'md:left-20' : 'md:left-64'} z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-md bg-white p-5 landscape:p-4 rounded-3xl border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[85vh] landscape:max-h-[85vh] animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeUsernameModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-750 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 class="text-md font-bold mb-4 flex items-center gap-2 text-[#007a7a]">
              <i data-lucide="user-cog" class="w-5 h-5"></i>
              <span>เปลี่ยนชื่อผู้ใช้ (Username)</span>
            </h3>

            <form onsubmit="handleUsernameChange(event)" class="space-y-4">
              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">ชื่อผู้ใช้เดิม</label>
                <input type="text" disabled class="glass-input w-full px-3 py-2 rounded-lg text-xs opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed" value="@${AppState.currentUser.username}">
              </div>

              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">ชื่อผู้ใช้ใหม่</label>
                <input type="text" id="uname-new" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="กรอกชื่อผู้ใช้ใหม่ (เช่น somchai_new)">
              </div>

              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">ยืนยันรหัสผ่านของคุณ</label>
                <div class="relative flex items-center">
                  <input type="password" id="uname-password" required class="glass-input w-full pl-3 pr-10 py-2 rounded-lg text-xs" placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยน">
                  <button type="button" onclick="togglePasswordVisibility('uname-password')" class="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
                    <i id="eye-uname-password" data-lucide="eye" class="w-4.5 h-4.5"></i>
                  </button>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#007a7a] hover:bg-[#006363] shadow-md cursor-pointer">
                  ยืนยันการเปลี่ยนชื่อผู้ใช้
                </button>
                <button type="button" onclick="closeUsernameModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 cursor-pointer">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- Google Drive Synchronization Modal Overlay -->
      ${isDriveModalOpen ? `
        <div class="modal-overlay-safe fixed inset-0 top-[68px] md:top-0 landscape:top-[60px] md:landscape:top-0 ${AppState.sidebarCollapsed ? 'md:left-20' : 'md:left-64'} z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-md bg-white p-5 landscape:p-4 rounded-3xl border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[85vh] landscape:max-h-[85vh] animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeGoogleDriveModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-550 hover:text-slate-750 transition-colors cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Step 0: Initial Screen -->
            ${driveAuthStep === 0 ? `
              <div class="space-y-4">
                <div class="text-center pt-2">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 mb-3 shadow-sm">
                    <i data-lucide="cloud" class="w-6 h-6 animate-pulse"></i>
                  </div>
                  <h3 class="text-md font-bold text-slate-800">เชื่อมโยงกับ Google Drive</h3>
                  <p class="text-xs text-slate-500 mt-1">อัพเดตรูปภาพโปรไฟล์ผ่าน Cloud Storage ส่วนตัวของคุณ</p>
                </div>

                <form onsubmit="handleGoogleDriveLinkSubmit(event)" class="space-y-3">
                  <div>
                    <label class="block text-slate-650 text-xs font-semibold mb-1">ลิงก์แชร์รูปภาพบน Google Drive ของคุณ</label>
                    <input type="url" id="drive-link-input" required class="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono" placeholder="https://drive.google.com/file/d/.../view">
                    <span class="text-[9px] text-slate-500 mt-1 block leading-normal">* หมายเหตุ: โปรดตั้งค่าเปิดสิทธิ์ไฟล์ใน Drive เป็น "ทุกคนที่มีลิงก์แชร์สามารถเข้าดูได้ (Anyone with link)" เพื่อให้อ่านรูปได้ครับ</span>
                  </div>

                  <button type="submit" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
                    <i data-lucide="link" class="w-4 h-4"></i> เชื่อมโยงและดึงรูปโปรไฟล์
                  </button>
                </form>

                <div class="relative flex items-center justify-center py-2">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-100"></div></div>
                  <span class="relative px-3 text-[10px] text-slate-500 bg-white font-bold uppercase tracking-wider">ตัวเลือกอื่นๆ</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button type="button" onclick="startGoogleDriveSyncSimulate()" class="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer flex justify-center items-center gap-1.5">
                    <i data-lucide="zap" class="w-3.5 h-3.5"></i> ซิงค์เสมือนจริง (Demo)
                  </button>
                  <a href="https://drive.google.com/" target="_blank" class="w-full py-2.5 rounded-xl text-xs font-bold text-[#007a7a] bg-[#007a7a]/10 border border-[#007a7a]/20 hover:bg-[#007a7a]/20 transition-all cursor-pointer flex justify-center items-center gap-1.5 no-underline">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i> เปิด Google Drive จริง
                  </a>
                </div>
              </div>
            ` : ''}

            <!-- Step 1: Google Account Chooser Simulation -->
            ${driveAuthStep === 1 ? `
              <div class="space-y-4">
                <div class="text-center pt-2">
                  <!-- Muted Google Brand color svg -->
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-200 mb-2">
                    <svg class="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.91h6.69c-.29 1.5-.1.84-2.43 2.77v2.28h3.91c2.28-2.1 3.57-5.18 3.57-8.89z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.91-3.03c-1.08.72-2.48 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.28v3.13C3.26 20.3 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.57H1.28C.47 8.2.01 10.05.01 12s.46 3.8 1.27 5.43l4.04-3.14z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.33 0 3.26 3.7 1.28 7.64l4.04 3.14c.94-2.82 3.57-4.92 6.68-4.92z"/>
                    </svg>
                  </div>
                  <h3 class="text-md font-bold text-slate-800">เลือกบัญชีเพื่อซิงค์ระบบ</h3>
                  <p class="text-xs text-slate-500 mt-1">การอนุญาตนี้จะเชื่อมโยง API กับบัญชีคลาวด์ของคุณ</p>
                </div>

                <div class="space-y-2 pt-2">
                  <button type="button" onclick="chooseDriveSimulatedAccount('${AppState.currentUser.email || AppState.currentUser.username + '@gmail.com'}')" class="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-350 transition-all flex items-center gap-3 text-left cursor-pointer">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#005f5f] to-[#007a7a] flex items-center justify-center text-xs font-bold text-white uppercase">
                      ${AppState.currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-700">${AppState.currentUser.name}</p>
                      <p class="text-[10px] text-slate-500">${AppState.currentUser.email || AppState.currentUser.username + '@gmail.com'}</p>
                    </div>
                  </button>

                  <button type="button" onclick="chooseDriveSimulatedAccount('smartlife.health.sync@gmail.com')" class="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-350 transition-all flex items-center gap-3 text-left cursor-pointer">
                    <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      S
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-700">SmartLife Sync Center</p>
                      <p class="text-[10px] text-slate-500">smartlife.health.sync@gmail.com</p>
                    </div>
                  </button>
                </div>

                <button type="button" onclick="openGoogleDriveModal()" class="w-full py-2.5 mt-2 rounded-xl text-xs font-semibold text-slate-650 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer">
                  ย้อนกลับ
                </button>
              </div>
            ` : ''}

            <!-- Step 2: Simulated Cloud Upload/Sync Progress -->
            ${driveAuthStep === 2 ? `
              <div class="space-y-6 py-4 text-center">
                <div class="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div class="absolute inset-0 rounded-full border-4 border-cyan-100"></div>
                  <div class="absolute inset-0 rounded-full border-4 border-cyan-600 border-t-transparent animate-spin"></div>
                  <i data-lucide="cloud-lightning" class="w-6 h-6 text-cyan-600 animate-pulse"></i>
                </div>

                <div class="space-y-2">
                  <h4 class="text-sm font-bold text-slate-700">กำลังเชื่อมต่อ & ซิงค์ภาพจาก Drive...</h4>
                  <p class="text-[10px] text-slate-500 h-8 flex items-center justify-center">
                    ${driveSyncProgress < 30 ? 'ขั้นตอนที่ 1: กำลังยืนยันสิทธิ์บัญชี OAuth Tokens...' :
          driveSyncProgress < 70 ? 'ขั้นตอนที่ 2: กำลังเชื่อมต่อโฟลเดอร์ Google Drive Cloud...' :
            driveSyncProgress < 95 ? 'ขั้นตอนที่ 3: กำลังประมวลผลดึงไฟล์ภาพโปรไฟล์ล่าสุด...' :
              'ขั้นตอนที่ 4: ซิงค์เสร็จสมบูรณ์เรียบร้อยแล้ว!'}
                  </p>
                </div>

                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                  <div class="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full transition-all duration-300" style="width: ${driveSyncProgress}%"></div>
                </div>
                <span class="text-xs font-mono font-bold text-cyan-600 block">${driveSyncProgress}%</span>
              </div>
            ` : ''}

            <!-- Step 3: Success Screen -->
            ${driveAuthStep === 3 ? `
              <div class="space-y-5 py-4 text-center">
                <div class="w-14 h-14 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-sm">
                  <i data-lucide="check" class="w-7 h-7"></i>
                </div>

                <div class="space-y-1">
                  <h4 class="text-md font-bold text-slate-700">ระบบลิงก์รูปภาพเรียบร้อยแล้ว!</h4>
                  <p class="text-xs text-slate-500">รูปโปรไฟล์จากระบบ Google Drive ของคุณอัปเดตเรียบร้อยครับ</p>
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

export async function handleUsernameChange(event) {
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

  try {
    const { auth, signInWithEmailAndPassword, updateEmail } = await import('../firebase.js');
    const oldEmail = auth.currentUser.email; // Safely get the exact email they are logged in with
    const newEmail = `${newUsername}@smartlife.app`;

    // Verify password by attempting to sign in
    showToast('กำลังตรวจสอบความปลอดภัย...', 'info');
    await signInWithEmailAndPassword(auth, oldEmail, password);

    // Firebase Security prevents changing email without verification (auth/operation-not-allowed).
    // So we only update the display username in Firestore. The login username (Auth email) remains the original.

    // Update the username in Firestore
    AppState.currentUser.username = newUsername;
    AppState.saveProfile();

    // Save mapping to allow login with new username
    localStorage.setItem('smart_mapping_' + newUsername, AppState.currentUser.email || oldEmail);

    AppState.usernameModalOpen = false;
    showToast('เปลี่ยนชื่อสำเร็จ! (หมายเหตุ: ใช้ชื่อเดิมในการล็อกอินเข้าสู่ระบบ)', 'success');
    showToast('เปลี่ยนชื่อผู้ใช้สำหรับแสดงผลเรียบร้อยแล้ว! 🎉', 'success');
    renderPage();

  } catch (error) {
    console.error("Username Change Error:", error);
    showToast(`เปลี่ยนชื่อไม่ได้: ${error.message}`, 'error');
  }
}

export async function handlePasswordChange(event) {
  event.preventDefault();

  const current = document.getElementById('pw-current').value;
  const newPass = document.getElementById('pw-new').value;
  const confirmPass = document.getElementById('pw-new-confirm').value;

  // 1. Verify new passwords match
  if (newPass !== confirmPass) {
    showToast('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', 'error');
    return;
  }

  if (newPass.length < 6) {
    showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
    return;
  }

  try {
    const { auth, signInWithEmailAndPassword, updatePassword } = await import('../firebase.js');
    const email = auth.currentUser.email; // Safely get the exact email they are logged in with

    // Re-authenticate user with current password
    showToast('กำลังตรวจสอบความปลอดภัย...', 'info');
    await signInWithEmailAndPassword(auth, email, current);

    // Update password
    await updatePassword(auth.currentUser, newPass);

    AppState.passwordModalOpen = false;
    showToast('เปลี่ยนรหัสผ่านความปลอดภัยเรียบร้อยแล้ว! 🔒', 'success');
    renderPage();

  } catch (error) {
    console.error("Password Change Error:", error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      showToast('รหัสผ่านเดิมไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
    } else {
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
    }
  }
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


