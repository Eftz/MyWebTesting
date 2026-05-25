// SmartLife SPA Health Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';

export function renderHealthComponent() {
  const waterPercent = Math.min(100, Math.round((AppState.health.water / AppState.currentUser.waterGoal) * 100));
  const exercisePercent = Math.min(100, Math.round((AppState.health.exercise / AppState.currentUser.exerciseGoal) * 100));
  const calPercent = Math.min(100, Math.round((AppState.health.cal_consumed / AppState.currentUser.calGoal) * 100));

  return `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i data-lucide="heart" class="text-cyan-600"></i>
          <span>ศูนย์ดูแลสุขภาพ (Healthy Basement)</span>
        </h1>
        <p class="text-slate-500 text-xs mt-1">ติดตามเป้าหมายการดื่มน้ำ กายบริหาร และสัดส่วนแคลอรี่เข้าออกประจำวัน</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- CARD 💧: Water Tracker -->
        <div class="glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between items-center relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-cyan-600/5 group-hover:bg-cyan-600/10 blur-xl"></div>
          
          <div class="w-full mb-4">
            <h3 class="text-md font-bold text-cyan-700 flex items-center gap-1.5">
              <i data-lucide="droplet" class="w-5 h-5"></i> บันทึกการดื่มน้ำ
            </h3>
            <p class="text-[10px] text-slate-500 mt-0.5">เป้าหมายรายวัน: ${AppState.currentUser.waterGoal} มล.</p>
          </div>

          <!-- Glass dynamic representation -->
          <div class="water-container my-4">
            <div class="water-fill" style="height: ${waterPercent}%">
              <div class="water-wave"></div>
            </div>
            <div class="absolute inset-0 flex flex-col justify-center items-center text-white font-bold drop-shadow-md z-10">
              <span class="text-2xl">${AppState.health.water}</span>
              <span class="text-[10px] opacity-75">/ ${AppState.currentUser.waterGoal} ml</span>
            </div>
          </div>

          <div class="w-full space-y-3 mt-4">
            <!-- Quick Increment values -->
            <div class="grid grid-cols-3 gap-2">
              <button onclick="addWater(250)" class="py-2.5 rounded-xl text-xs font-bold bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-700 active:scale-95 transition-all">+250ml</button>
              <button onclick="addWater(500)" class="py-2.5 rounded-xl text-xs font-bold bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-700 active:scale-95 transition-all">+500ml</button>
              <button onclick="addWater(750)" class="py-2.5 rounded-xl text-xs font-bold bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-700 active:scale-95 transition-all">+750ml</button>
            </div>

            <!-- Custom Input -->
            <div class="flex gap-2">
              <input type="number" id="custom-water" min="0" placeholder="ระบุเอง..." class="glass-input w-full px-3 py-2 rounded-xl text-xs">
              <button onclick="addCustomWater()" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors">เพิ่ม</button>
            </div>
            
            <button onclick="resetWater()" class="w-full py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-rose-600 border border-transparent hover:border-rose-200 hover:bg-rose-50 transition-all">
              รีเซ็ตค่าวันนี้ใหม่
            </button>
          </div>
        </div>

        <!-- CARD 🏋️: Exercise Fitness -->
        <div class="glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between items-center relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-emerald-600/5 group-hover:bg-emerald-600/10 blur-xl"></div>
          
          <div class="w-full mb-4">
            <h3 class="text-md font-bold text-emerald-700 flex items-center gap-1.5">
              <i data-lucide="dumbbell" class="w-5 h-5"></i> เวลาออกกำลังกาย
            </h3>
            <p class="text-[10px] text-slate-500 mt-0.5">เป้าหมายรายวัน: ${AppState.currentUser.exerciseGoal} นาที</p>
          </div>

          <!-- Circular representation placeholder using Tailwind percentage borders or stats -->
          <div class="my-6 relative flex items-center justify-center">
            <div class="w-32 h-32 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
              <div class="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-500" style="clip-path: polygon(0 0, 100% 0, 100% ${exercisePercent}%, 0 ${exercisePercent}%)"></div>
              <div class="text-center">
                <span class="text-3xl font-extrabold text-slate-800">${AppState.health.exercise}</span>
                <span class="text-[10px] text-slate-550 block font-bold">นาทีสะสม</span>
              </div>
            </div>
          </div>

          <div class="w-full space-y-3">
            <!-- Selector quick additions -->
            <div class="grid grid-cols-2 gap-2">
              <button onclick="addExercise(10)" class="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-all">+10 นาที</button>
              <button onclick="addExercise(30)" class="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition-all">+30 นาที</button>
            </div>

            <!-- Custom Input -->
            <div class="flex gap-2">
              <input type="number" id="custom-exercise" min="0" placeholder="ระบุนาที..." class="glass-input w-full px-3 py-2 rounded-xl text-xs">
              <button onclick="addCustomExercise()" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">เพิ่ม</button>
            </div>
            
            <button onclick="resetExercise()" class="w-full py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-rose-600 border border-transparent hover:border-rose-200 hover:bg-rose-50 transition-all">
              รีเซ็ตค่าวันนี้ใหม่
            </button>
          </div>
        </div>

        <!-- CARD 🔥: Eating Calory (Intake and Burn metrics) -->
        <div class="glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between items-center relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-orange-600/5 group-hover:bg-orange-600/10 blur-xl"></div>
          
          <div class="w-full mb-4">
            <h3 class="text-md font-bold text-orange-600 flex items-center gap-1.5">
              <i data-lucide="flame" class="w-5 h-5"></i> ปริมาณแคลอรี่ (Calories)
            </h3>
            <p class="text-[10px] text-slate-500 mt-0.5">เป้าหมาย: บริโภค ${AppState.currentUser.calGoal} Kcal | เผาผลาญ ${AppState.currentUser.burnGoal || 500} Kcal</p>
          </div>

          <div class="w-full space-y-6 my-4">
            <!-- Calorie Consumed tracking -->
            <div>
              <div class="flex justify-between items-center text-xs mb-1.5">
                <span class="text-slate-700 font-semibold flex items-center gap-1">
                  <i data-lucide="utensils" class="w-3.5 h-3.5 text-orange-500"></i> ทานเข้าไป (Intake)
                </span>
                <span class="text-orange-600 font-bold">${AppState.health.cal_consumed} / ${AppState.currentUser.calGoal} Kcal</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" style="width: ${calPercent}%"></div>
              </div>
            </div>

            <!-- Calorie Burned tracking -->
            <div>
              <div class="flex justify-between items-center text-xs mb-1.5">
                <span class="text-slate-700 font-semibold flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-pink-500"></i> เผาผลาญออก (Burned)
                </span>
                <span class="text-pink-600 font-bold">${AppState.health.cal_burned} / ${AppState.currentUser.burnGoal || 500} Kcal</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full" style="width: ${Math.min(100, (AppState.health.cal_burned / (AppState.currentUser.burnGoal || 500)) * 100)}%"></div>
              </div>
            </div>
          </div>

          <div class="w-full space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- Consumed manual input -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-500 font-bold">เพิ่มปริมาณบริโภc</label>
                <div class="flex gap-1.5">
                  <input type="number" id="cal-intake-input" min="0" placeholder="Kcal" class="glass-input w-full px-2 py-1.5 rounded-lg text-xs">
                  <button onclick="addCalIntake()" class="px-2.5 py-1.5 rounded-lg bg-orange-650 hover:bg-orange-500 text-white font-bold text-xs shadow-sm">+</button>
                </div>
              </div>
              <!-- Burned manual input -->
              <div class="space-y-1.5">
                <label class="text-[10px] text-slate-500 font-bold">เพิ่มปริมาณเผาผลาญ</label>
                <div class="flex gap-1.5">
                  <input type="number" id="cal-burn-input" min="0" placeholder="Kcal" class="glass-input w-full px-2 py-1.5 rounded-lg text-xs">
                  <button onclick="addCalBurn()" class="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-sm">+</button>
                </div>
              </div>
            </div>

            <button onclick="resetCalories()" class="w-full py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-rose-600 border border-transparent hover:border-rose-200 hover:bg-rose-50 transition-all">
              รีเซ็ตค่าวันนี้ใหม่
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

// Actions logic for Healthy Basement
export function addWater(amount) {
  AppState.health.water += amount;
  AppState.saveHealth();
  showToast(`ดื่มน้ำเพิ่มสำเร็จ +${amount} ml 💧`);
  renderPage();
}

export function addCustomWater() {
  const amount = parseInt(document.getElementById('custom-water').value) || 0;
  if (amount <= 0) return;
  AppState.health.water += amount;
  AppState.saveHealth();
  showToast(`ดื่มน้ำเพิ่มสำเร็จ +${amount} ml 💧`);
  renderPage();
}

export function resetWater() {
  AppState.health.water = 0;
  AppState.saveHealth();
  showToast('รีเซ็ตยอดการดื่มน้ำเรียบร้อยแล้ว', 'info');
  renderPage();
}

export function addExercise(minutes) {
  AppState.health.exercise += minutes;
  AppState.saveHealth();
  showToast(`สะสมเวลาออกกำลังกายสำเร็จ +${minutes} นาที 🏋️`);
  renderPage();
}

export function addCustomExercise() {
  const minutes = parseInt(document.getElementById('custom-exercise').value) || 0;
  if (minutes <= 0) return;
  AppState.health.exercise += minutes;
  AppState.saveHealth();
  showToast(`สะสมเวลาออกกำลังกายสำเร็จ +${minutes} นาที 🏋️`);
  renderPage();
}

export function resetExercise() {
  AppState.health.exercise = 0;
  AppState.saveHealth();
  showToast('รีเซ็ตเวลาการออกกำลังกายเรียบร้อยแล้ว', 'info');
  renderPage();
}

export function addCalIntake() {
  const amount = parseInt(document.getElementById('cal-intake-input').value) || 0;
  if (amount <= 0) return;
  AppState.health.cal_consumed += amount;
  AppState.saveHealth();
  showToast(`บันทึกแคลอรี่บริโภคสำเร็จ +${amount} Kcal 🍎`);
  renderPage();
}

export function addCalBurn() {
  const amount = parseInt(document.getElementById('cal-burn-input').value) || 0;
  if (amount <= 0) return;
  AppState.health.cal_burned += amount;
  AppState.saveHealth();
  showToast(`บันทึกแคลอรี่เผาผลาญสำเร็จ +${amount} Kcal 🔥`);
  renderPage();
}

export function resetCalories() {
  AppState.health.cal_consumed = 0;
  AppState.health.cal_burned = 0;
  AppState.saveHealth();
  showToast('รีเซ็ตแคลอรี่เรียบร้อยแล้ว', 'info');
  renderPage();
}

// Expose all operations to window globally
window.addWater = addWater;
window.addCustomWater = addCustomWater;
window.resetWater = resetWater;
window.addExercise = addExercise;
window.addCustomExercise = addCustomExercise;
window.resetExercise = resetExercise;
window.addCalIntake = addCalIntake;
window.addCalBurn = addCalBurn;
window.resetCalories = resetCalories;
