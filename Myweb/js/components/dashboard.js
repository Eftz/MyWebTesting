// SmartLife SPA Dashboard Component Module
import { AppState } from '../state.js';
import { navigate } from '../router.js';

export function renderDashboardComponent() {
  // Personalized Greeting depending on time
  const hour = new Date().getHours();
  let greetingText = 'สวัสดีครับ';
  let greetingEmoji = '';
  if (hour >= 5 && hour < 12) {
    greetingText = 'สวัสดีตอนเช้า';
    greetingEmoji = '🌅';
  } else if (hour >= 12 && hour < 17) {
    greetingText = 'สวัสดีตอนกลางวัน';
    greetingEmoji = '☀️';
  } else if (hour >= 17 && hour < 20) {
    greetingText = 'สวัสดีตอนเย็น';
    greetingEmoji = '🌆';
  } else {
    greetingText = 'สวัสดีตอนค่ำ';
    greetingEmoji = '✨';
  }

  // Calculate quick stats with the new "Savings" transaction type
  const totalIncome = AppState.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = AppState.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // New First-Class "Savings" Transaction Aggregates
  const totalSavings = AppState.transactions
    .filter(t => t.type === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  // Formula: Available cash deducts expense and recorded active savings transfers
  const availableBalance = totalIncome - totalExpense - totalSavings;
  const savingsPercent = Math.min(100, Math.max(0, (totalSavings / AppState.currentUser.savingsGoal) * 100));

  // 2. Pending Todos
  const pendingTodos = AppState.todos.filter(t => !t.completed).length;

  return `
    <div class="space-y-8">
      <!-- Custom Header welcome -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-extrabold flex items-center flex-wrap gap-2">
            <span class="bg-gradient-to-r from-[#005d5d] to-[#007a7a] bg-clip-text text-transparent">
              ${greetingText}, ${AppState.currentUser.name}!
            </span>
            <span class="select-none">${greetingEmoji}</span>
          </h1>
          <p class="text-slate-500 text-sm mt-1">นี่คือข้อมูลรายงานความคืบหน้ากิจกรรมโดยรวมประจำวันของคุณ</p>
        </div>
        <div class="text-xs text-slate-500 font-mono bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>วันที่อัปเดต: ${AppState.health.date || AppState.getTodayString()}</span>
        </div>
      </div>

      <!-- Dashboard Interactive Grid Summaries -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <!-- Grid Box 1: Transactions Wallet -->
        <div onclick="navigate('transaction')" class="glass-card rounded-3xl p-6 border border-slate-200 hover:border-[#007a7a]/50 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#007a7a]/5 group-hover:bg-[#007a7a]/10 blur-xl transition-all"></div>
          
          <div class="flex justify-between items-start">
            <div class="p-3 bg-[#007a7a]/10 rounded-2xl text-[#007a7a] group-hover:scale-110 transition-transform">
              <i data-lucide="wallet" class="w-6 h-6"></i>
            </div>
            <span class="text-xs font-bold text-[#007a7a] tracking-wider">กระเป๋าเงินใช้สอย</span>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-slate-500">เงินคงเหลือสำหรับใช้สอย</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1">฿${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
          
          <div class="mt-2 text-xs flex justify-between items-center text-slate-500">
            <span>สะสมเงินออมแล้ว</span>
            <span class="font-semibold text-[#007a7a]">฿${totalSavings.toLocaleString()}</span>
          </div>
        </div>

        <!-- Grid Box 2: Water Hydration -->
        <div onclick="navigate('health')" class="glass-card rounded-3xl p-6 border border-slate-200 hover:border-cyan-500/50 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-cyan-600/5 group-hover:bg-cyan-600/10 blur-xl transition-all"></div>
          
          <div class="flex justify-between items-start">
            <div class="p-3 bg-cyan-100 rounded-2xl text-cyan-700 group-hover:scale-110 transition-transform">
              <i data-lucide="droplet" class="w-6 h-6"></i>
            </div>
            <span class="text-xs font-bold text-cyan-700 tracking-wider">ปริมาณดื่มน้ำ</span>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-slate-500">ดื่มสะสมวันนี้</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1">${AppState.health.water} / ${AppState.currentUser.waterGoal} ml</h3>
          </div>
          
          <div class="mt-2 text-xs flex justify-between items-center text-slate-500">
            <span>คืบหน้า</span>
            <span class="font-semibold text-cyan-700">${Math.min(100, Math.round((AppState.health.water / AppState.currentUser.waterGoal) * 100))}%</span>
          </div>
        </div>

        <!-- Grid Box 3: Exercise Tracker -->
        <div onclick="navigate('health')" class="glass-card rounded-3xl p-6 border border-slate-200 hover:border-emerald-500/50 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-600/5 group-hover:bg-emerald-600/10 blur-xl transition-all"></div>
          
          <div class="flex justify-between items-start">
            <div class="p-3 bg-emerald-100 rounded-2xl text-emerald-700 group-hover:scale-110 transition-transform">
              <i data-lucide="dumbbell" class="w-6 h-6"></i>
            </div>
            <span class="text-xs font-bold text-emerald-700 tracking-wider">เวลาออกกำลังกาย</span>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-slate-500">ระยะเวลารวม</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1">${AppState.health.exercise} / ${AppState.currentUser.exerciseGoal} นาที</h3>
          </div>
          
          <div class="mt-2 text-xs flex justify-between items-center text-slate-500">
            <span>คืบหน้า</span>
            <span class="font-semibold text-emerald-700">${Math.min(100, Math.round((AppState.health.exercise / AppState.currentUser.exerciseGoal) * 100))}%</span>
          </div>
        </div>

        <!-- Grid Box 4: Todo Checklist tasks -->
        <div onclick="navigate('todo')" class="glass-card rounded-3xl p-6 border border-slate-200 hover:border-[#f2994a]/50 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden group">
          <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[#f2994a]/5 group-hover:bg-[#f2994a]/10 blur-xl transition-all"></div>
          
          <div class="flex justify-between items-start">
            <div class="p-3 bg-amber-100 rounded-2xl text-amber-700 group-hover:scale-110 transition-transform">
              <i data-lucide="check-square" class="w-6 h-6"></i>
            </div>
            <span class="text-xs font-bold text-amber-700 tracking-wider">แผนงานที่ต้องทำ</span>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-slate-500">งานที่ค้าง</p>
            <h3 class="text-2xl font-bold text-slate-800 mt-1">${pendingTodos} รายการ</h3>
          </div>
          
          <div class="mt-2 text-xs flex justify-between items-center text-slate-500">
            <span>เสร็จสิ้นทั้งหมด</span>
            <span class="font-semibold text-amber-700">${AppState.todos.length - pendingTodos} / ${AppState.todos.length}</span>
          </div>
        </div>

      </div>

      <!-- Financial overview summary cards and Doughnut Chart moved from Transaction page -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-200 space-y-6">
        <div class="flex justify-between items-center border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="line-chart" class="text-[#007a7a]"></i>
            <span>สรุปผลการวิเคราะห์การเงินและเงินออมประจำเดือน</span>
          </h3>
          <button onclick="navigate('transaction')" class="text-xs text-[#007a7a] hover:text-[#006363] underline font-semibold flex items-center gap-1">
            <span>บันทึกธุรกรรมเพิ่ม</span> <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Quick summary blocks -->
          <div class="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
              <p class="text-[11px] text-slate-500">รายรับทั้งหมด (Income)</p>
              <h3 class="text-lg font-bold text-emerald-600 mt-1">฿${totalIncome.toLocaleString()}</h3>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
              <p class="text-[11px] text-slate-500">รายจ่ายทั้งหมด (Expense)</p>
              <h3 class="text-lg font-bold text-rose-600 mt-1">฿${totalExpense.toLocaleString()}</h3>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center shadow-sm">
              <p class="text-[11px] text-slate-500">เงินออมสะสมทั้งหมด (Savings)</p>
              <h3 class="text-lg font-bold text-[#007a7a] mt-1">฿${totalSavings.toLocaleString()}</h3>
            </div>
          </div>

          <!-- Category Doughnut Chart -->
          <div class="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center">
            <h4 class="text-xs font-bold text-slate-500 mb-3 w-full text-left flex items-center gap-1.5">
              <i data-lucide="pie-chart" class="w-4 h-4 text-[#007a7a]"></i> สัดส่วนรายจ่ายแยกหมวดหมู่
            </h4>
            <div class="w-full h-40 max-w-[200px] flex items-center justify-center">
              <canvas id="tx-doughnut-chart"></canvas>
            </div>
          </div>

          <!-- Monthly Savings Progress Bar -->
          <div class="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-[#007a7a]"></i> แถบความคืบหน้าเป้าหมายเงินออม
              </h4>
              
              <div class="mt-4">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">ออมสะสมจริง</span>
                  <span class="font-bold text-[#007a7a]">฿${totalSavings.toLocaleString()} / ฿${AppState.currentUser.savingsGoal.toLocaleString()}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div class="bg-gradient-to-r from-[#007a7a] to-cyan-500 h-full rounded-full" style="width: ${Math.min(100, Math.max(0, (totalSavings / AppState.currentUser.savingsGoal) * 100))}%"></div>
                </div>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 italic mt-4">
              * คำนวณจากยอดธุรกรรมประเภท "เงินออม" ทั้งหมดในระบบ เทียบกับเป้าหมายการออมเงินประจำเดือนที่คุณตั้งค่าไว้
            </p>
          </div>

        </div>
      </div>

      <!-- Additional visual layouts: Upcoming Todo and Calories tracker -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quick Todo status list -->
        <div class="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-200">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <i data-lucide="calendar" class="text-[#007a7a]"></i>
            <span>ตารางงานและเป้าหมายเร่งด่วนของวัน</span>
          </h3>
          <div class="space-y-3 max-h-52 overflow-y-auto pr-1">
            ${AppState.todos.length === 0 ? `
              <div class="text-center py-8 text-slate-450 text-sm">วันนี้ไม่มีแผนงานของคุณ ลองเพิ่มรายการใหม่ได้ที่แถบ Do the list</div>
            ` : AppState.todos.slice(0, 4).map(todo => `
              <div class="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all duration-150">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-2 h-2 rounded-full ${todo.completed ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'} shrink-0"></div>
                  <div class="min-w-0">
                    <span onclick="editTodo('${todo.id}')" class="text-sm font-semibold ${todo.completed ? 'line-through text-slate-500' : 'text-slate-800'} hover:underline hover:text-[#007a7a] cursor-pointer truncate block">${todo.task}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                      <!-- Priority Badge -->
                      ${todo.priority === 'high' ? `
                        <span class="text-[8px] px-1.5 py-0.2 rounded bg-rose-5 border border-rose-200 text-rose-600 font-bold shrink-0">ด่วนสูง</span>
                      ` : todo.priority === 'low' ? `
                        <span class="text-[8px] px-1.5 py-0.2 rounded bg-emerald-5 border border-emerald-200 text-emerald-600 font-bold shrink-0">ปกติ/ต่ำ</span>
                      ` : `
                        <span class="text-[8px] px-1.5 py-0.2 rounded bg-amber-5 border border-amber-200 text-amber-600 font-bold shrink-0">ปานกลาง</span>
                      `}
                      ${todo.date ? `
                        <span class="text-[9px] text-slate-500 font-mono">${todo.date}</span>
                      ` : ''}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  ${todo.alertTime ? `
                    <span class="text-xs text-[#007a7a] font-mono flex items-center gap-1">
                      <i data-lucide="bell" class="w-3 h-3"></i> ${todo.alertTime} น.
                    </span>
                  ` : ''}
                  <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${todo.completed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-orange-100 text-orange-850 border border-orange-200'}">
                    ${todo.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Calories progress preview card -->
        <div class="glass-panel rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-bold mb-3 flex items-center gap-2 text-slate-800">
              <i data-lucide="flame" class="text-orange-500"></i>
              <span>อัตราแคลอรี่สะสม</span>
            </h3>
            
            <div class="space-y-4 mt-4">
              <!-- Calory Intake progress bar -->
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">บริโภคเข้าไป (Intake)</span>
                  <span class="text-orange-600 font-bold">${AppState.health.cal_consumed} / ${AppState.currentUser.calGoal} Kcal</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" style="width: ${Math.min(100, (AppState.health.cal_consumed / AppState.currentUser.calGoal) * 100)}%"></div>
                </div>
              </div>
              
              <!-- Calory Burned progress bar -->
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">เผาผลาญออก (Burned)</span>
                  <span class="text-pink-600 font-bold">${AppState.health.cal_burned} / ${AppState.currentUser.burnGoal || 500} Kcal</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-gradient-to-r from-pink-500 to-rose-450 h-full rounded-full" style="width: ${Math.min(100, (AppState.health.cal_burned / (AppState.currentUser.burnGoal || 500)) * 100)}%"></div>
                </div>
              </div>
            </div>
          </div>

          <button onclick="navigate('health')" class="w-full mt-6 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-center text-slate-700 shadow-sm">
            ดูรายละเอียดและบันทึกสุขภาพ
          </button>
        </div>
      </div>
    </div>
  `;
}

// Initialise Doughnut Chart.js for dashboard
export function initDashboardCharts() {
  const ctx = document.getElementById('tx-doughnut-chart');
  if (!ctx) return;

  // Process category expenses data
  const expenses = AppState.transactions.filter(t => t.type === 'expense');
  const categoriesMap = {
    'อาหาร': 0,
    'การเดินทาง': 0,
    'ที่พัก/ค่าเช่า': 0,
    'บันเทิง': 0,
    'ช้อปปิ้ง': 0,
    'สุขภาพ': 0,
    'อเนกประสงค์': 0,
    'อื่นๆ': 0
  };

  expenses.forEach(e => {
    if (categoriesMap[e.category] !== undefined) {
      categoriesMap[e.category] += e.amount;
    }
  });

  const labels = Object.keys(categoriesMap);
  const dataValues = Object.values(categoriesMap);
  const total = dataValues.reduce((s, v) => s + v, 0);

  if (AppState.charts.txDoughnut) {
    AppState.charts.txDoughnut.destroy();
  }

  if (total === 0) {
    // Empty State chart representation
    AppState.charts.txDoughnut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['ไม่มีข้อมูลรายจ่าย'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(0, 0, 0, 0.05)'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
    return;
  }

  AppState.charts.txDoughnut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#fbbf24', // อาหาร - Amber
          '#60a5fa', // การเดินทาง - Blue
          '#f43f5e', // ที่พัก - Rose
          '#c084fc', // บันเทิง - Purple
          '#ec4899', // ช้อปปิ้ง - Pink
          '#10b981', // สุขภาพ - Green
          '#f97316', // อเนกประสงค์ - Orange
          '#64748b'  // อื่นๆ - Slate
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { display: false }
      }
    }
  });
}
