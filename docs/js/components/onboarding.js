// SmartLife SPA Onboarding Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { navigate } from '../router.js';

export function renderOnboarding(app) {
  app.className = "flex items-center justify-center min-h-screen bg-[#f2f7f7] p-4";
  app.innerHTML = `
    <div class="w-full max-w-lg glass-panel p-8 rounded-3xl border border-slate-200 shadow-2xl relative page-fade-in bg-white">
      <div class="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-teal-600/5 blur-2xl"></div>

      <div class="text-center mb-6">
        <h2 class="text-2xl font-extrabold text-slate-800">ยินดีต้อนรับสู่ SmartLife! 👋</h2>
        <p class="text-slate-500 text-sm mt-2">กรุณาตั้งเป้าหมายส่วนตัวครั้งแรกเพื่อขับเคลื่อนระบบให้เหมาะสมกับคุณ</p>
      </div>

      <form onsubmit="handleOnboardingSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">ชื่อแสดงผล (Display Name)</label>
          <input type="text" id="ob-name" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="${AppState.currentUser.name}">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">เป้าหมายเงินออมประจำเดือน (฿)</label>
            <input type="number" id="ob-savings" min="0" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="5000">
          </div>
          <div>
            <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">เป้าหมายดื่มน้ำต่อวัน (มล.)</label>
            <input type="number" id="ob-water" min="0" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="2000">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">เป้าหมายออกกำลังกายต่อวัน (นาที)</label>
            <input type="number" id="ob-exercise" min="0" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="30">
          </div>
          <div>
            <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">เป้าหมายบริโภคแคลอรี่ต่อวัน (Kcal)</label>
            <input type="number" id="ob-cal" min="0" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="2000">
          </div>
          <div class="md:col-span-2">
            <label class="block text-slate-650 text-xs font-semibold uppercase mb-1.5">เป้าหมายเผาผลาญต่อวัน (Kcal)</label>
            <input type="number" id="ob-burn" min="0" required class="glass-input w-full px-4 py-2.5 rounded-xl text-sm" value="500">
          </div>
        </div>

        <button type="submit" class="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#005f5f] to-[#007a7a] hover:from-[#004d4d] hover:to-[#006363] shadow-md shadow-[#007a7a]/15 transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>เริ่มต้นใช้งานเว็บไซต์</span>
          <i data-lucide="check" class="w-5 h-5"></i>
        </button>
      </form>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

export async function handleOnboardingSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('ob-name').value.trim();
  const savings = parseFloat(document.getElementById('ob-savings').value) || 0;
  const water = parseInt(document.getElementById('ob-water').value) || 0;
  const exercise = parseInt(document.getElementById('ob-exercise').value) || 0;
  const cal = parseInt(document.getElementById('ob-cal').value) || 0;
  const burn = parseInt(document.getElementById('ob-burn').value) || 0;

  AppState.currentUser.name = name;
  AppState.currentUser.savingsGoal = savings;
  AppState.currentUser.waterGoal = water;
  AppState.currentUser.exerciseGoal = exercise;
  AppState.currentUser.calGoal = cal;
  AppState.currentUser.burnGoal = burn;
  AppState.currentUser.onboarded = true;

  showToast('กำลังบันทึกข้อมูล...', 'info');
  await AppState.saveProfile();

  showToast('ตั้งเป้าหมายส่วนตัวสำเร็จ ยินดีต้อนรับครับ!', 'success');
  navigate('dashboard');
}

window.handleOnboardingSubmit = handleOnboardingSubmit;
