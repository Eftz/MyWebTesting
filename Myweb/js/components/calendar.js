// SmartLife SPA Calendar Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';

// Module-level state for Calendar
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
let calendarSearchQuery = '';

// Calendar Add/Edit Modal local state
let isModalOpen = false;
let modalTodoId = '';
let modalTodoTask = '';
let modalTodoDate = '';
let modalTodoAlertTime = '';
let modalTodoPriority = 'medium';

// Day View local state
let isDayViewOpen = false;
let selectedDayDate = '';

// Expose these so standard HTML inline onclick events work
window.prevMonth = function () {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else {
    currentMonth--;
  }
  renderPage();
};

window.nextMonth = function () {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else {
    currentMonth++;
  }
  renderPage();
};

window.goToday = function () {
  const d = new Date();
  currentYear = d.getFullYear();
  currentMonth = d.getMonth();
  renderPage();
};

window.handleCalendarSearch = function (event) {
  if (event.key === 'Enter' || event.type === 'click') {
    calendarSearchQuery = document.getElementById('calendar-search-input')?.value || '';
    renderPage();
  }
};

window.clearCalendarSearch = function () {
  calendarSearchQuery = '';
  const searchInput = document.getElementById('calendar-search-input');
  if (searchInput) searchInput.value = '';
  renderPage();
};

// Modal handlers
window.openCalendarModal = function (dateStr = '', todoId = '') {
  isModalOpen = true;
  modalTodoId = todoId;

  if (todoId) {
    // Edit mode
    const todo = AppState.todos.find(t => t.id === todoId);
    if (todo) {
      modalTodoTask = todo.task;
      modalTodoDate = todo.date;
      modalTodoAlertTime = todo.alertTime || '';
      modalTodoPriority = todo.priority || 'medium';
    }
  } else {
    // Add mode
    modalTodoTask = '';
    modalTodoDate = dateStr || AppState.getTodayString();

    const now = new Date();
    modalTodoAlertTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    modalTodoPriority = 'medium';
  }
  renderPage();
};

window.closeCalendarModal = function () {
  isModalOpen = false;
  modalTodoId = '';
  modalTodoTask = '';
  modalTodoDate = '';
  modalTodoAlertTime = '';
  modalTodoPriority = 'medium';
  renderPage();
};

window.handleCalendarSubmit = function (event) {
  event.preventDefault();

  const task = document.getElementById('cal-todo-task').value.trim();
  const date = document.getElementById('cal-todo-date').value || AppState.getTodayString();
  const alertTime = document.getElementById('cal-todo-alert-time').value;
  const priority = document.getElementById('cal-todo-priority').value || 'medium';

  if (modalTodoId) {
    // Edit Mode
    const index = AppState.todos.findIndex(t => t.id === modalTodoId);
    if (index !== -1) {
      const oldAlert = AppState.todos[index].alertTime;
      const isTimeModified = oldAlert !== alertTime;

      AppState.todos[index] = {
        ...AppState.todos[index],
        task,
        date,
        alertTime,
        priority,
        notified: isTimeModified ? false : AppState.todos[index].notified
      };
      showToast('แก้ไขแผนงานในปฏิทินสำเร็จ');
    }
  } else {
    // Add Mode
    const newTodo = {
      id: String(Date.now()),
      task,
      date,
      alertTime,
      priority,
      completed: false,
      notified: false
    };
    AppState.todos.unshift(newTodo);
    showToast('เพิ่มแผนงานลงปฏิทินสำเร็จ');
  }

  AppState.saveTodos();
  closeCalendarModal();
};

window.deleteCalendarTodo = function (id) {
  if (confirm('คุณต้องการลบแผนงานนี้ใช่หรือไม่?')) {
    AppState.todos = AppState.todos.filter(t => t.id !== id);
    AppState.saveTodos();
    showToast('ลบรายการแผนงานสำเร็จ');
    closeCalendarModal();
  }
};

window.toggleCalendarTodoCompleted = function (event, id) {
  // Prevent click bubbling up to the cell or event modal
  event.stopPropagation();

  const index = AppState.todos.findIndex(t => t.id === id);
  if (index !== -1) {
    AppState.todos[index].completed = !AppState.todos[index].completed;
    AppState.saveTodos();
    showToast(AppState.todos[index].completed ? 'เสร็จสิ้นภารกิจ! 🎉' : 'ย้อนเวลากลับมาค้างภารกิจ', 'info');
    renderPage();
  }
};

window.addCalQuickDate = function (day) {
  const el = document.getElementById('cal-todo-date');
  if (!el) return;
  const d = new Date();
  if (day === 'tomorrow') {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  el.value = `${yyyy}-${mm}-${dd}`;
};

window.addCalQuickTime = function (type) {
  const el = document.getElementById('cal-todo-alert-time');
  if (!el) return;
  const now = new Date();
  if (type === '15m') {
    now.setMinutes(now.getMinutes() + 15);
  } else if (type === '30m') {
    now.setMinutes(now.getMinutes() + 30);
  } else if (type === '1h') {
    now.setHours(now.getHours() + 1);
  }
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  el.value = `${hh}:${mm}`;
};

// Day View window functions
window.openDayView = function (dateStr) {
  isDayViewOpen = true;
  selectedDayDate = dateStr;
  renderPage();
};

window.closeDayView = function () {
  isDayViewOpen = false;
  selectedDayDate = '';
  renderPage();
};

window.editDayViewTodo = function (todoId) {
  isDayViewOpen = false;
  window.openCalendarModal('', todoId);
};

window.addDayViewTodo = function () {
  isDayViewOpen = false;
  window.openCalendarModal(selectedDayDate);
};

const priorityColorMap = {
  high: 'event-pink',
  medium: 'event-purple',
  low: 'event-green'
};

function getPriorityValue(priority) {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 2;
  }
}

export function renderCalendarComponent() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  // Helper date math
  const today = new Date();
  const todayStr = AppState.getTodayString(); // YYYY-MM-DD

  // Start day of week (Monday as 1st column)
  const firstDay = new Date(currentYear, currentMonth, 1);
  const firstDayIndex = firstDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysBefore = (firstDayIndex === 0) ? 6 : firstDayIndex - 1; // shift Sunday to index 6

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Calendar cells collection
  const cells = [];

  // 1. Previous Month Padding
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMon = currentMonth === 0 ? 11 : currentMonth - 1;
  for (let i = daysBefore - 1; i >= 0; i--) {
    const dayVal = daysInPrevMonth - i;
    const dateStr = `${prevYear}-${String(prevMon + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
    cells.push({
      day: dayVal,
      dateStr,
      isOutside: true
    });
  }

  // 2. Current Month Days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    cells.push({
      day: i,
      dateStr,
      isOutside: false
    });
  }

  // 3. Next Month Padding (to fill 42 cells total)
  const totalCells = 42; // standard 6-row layout
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMon = currentMonth === 11 ? 0 : currentMonth + 1;
  let nextDayCounter = 1;
  while (cells.length < totalCells) {
    const dateStr = `${nextYear}-${String(nextMon + 1).padStart(2, '0')}-${String(nextDayCounter).padStart(2, '0')}`;
    cells.push({
      day: nextDayCounter,
      dateStr,
      isOutside: true
    });
    nextDayCounter++;
  }

  // Visual header elements
  const currentMonthName = monthNames[currentMonth];
  const dateRangeStr = `${currentMonthName} 1, ${currentYear} - ${currentMonthName} ${daysInMonth}, ${currentYear}`;

  // Date indicator card (e.g. MAY 22) - reflects selected date/month context beautifully
  const shortMonthStr = shortMonthNames[currentMonth];
  const displayedDayNum = (currentYear === today.getFullYear() && currentMonth === today.getMonth())
    ? today.getDate()
    : 1;

  // Filter AppState.todos using local calendar search query
  const query = calendarSearchQuery.toLowerCase();

  // Map pill color indexes consistently
  const pillColorClasses = ['event-pink', 'event-blue', 'event-green', 'event-purple', 'event-orange'];

  return `
    <div class="space-y-6">
      
      <!-- Top Title & Navigation Tabs row matching Template -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <!-- Title & Breadcrumb -->
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="calendar" class="text-purple-400"></i>
            <span>ปฏิทินแผนงานสะสม (Calendar Schedule)</span>
          </h1>
          <p class="text-slate-400 text-xs mt-1">มุมมองปฏิทินที่รวบรวมภารกิจเป้าหมายทั้งหมดรายเดือนอย่างพรีเมียม</p>
        </div>

        <!-- Custom tabs and search input as in template -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <!-- Custom Navigation Tabs -->
          <div class="flex p-0.5 rounded-xl bg-slate-900/60 border border-slate-800/40 text-[11px] font-semibold text-slate-400 shrink-0">
            <button class="px-3.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">All events</button>
            <button class="px-3.5 py-1.5 rounded-lg hover:text-slate-200 transition-colors">Shared</button>
            <button class="px-3.5 py-1.5 rounded-lg hover:text-slate-200 transition-colors">Public</button>
            <button class="px-3.5 py-1.5 rounded-lg hover:text-slate-200 transition-colors">Archived</button>
          </div>

          <!-- Top Right Search -->
          <div class="relative flex-1 sm:w-60 flex gap-2">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute left-2.5 top-2.5 text-slate-500 w-3.5 h-3.5"></i>
              <input type="text" id="calendar-search-input" onkeydown="handleCalendarSearch(event)" value="${calendarSearchQuery}" class="glass-input w-full pl-9 pr-7 py-1.5 rounded-xl text-xs" placeholder="ค้นหาในปฏิทิน...">
              ${calendarSearchQuery ? `
                <button onclick="clearCalendarSearch()" class="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 flex items-center justify-center">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
            <button onclick="handleCalendarSearch(event)" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md">
              ค้นหา
            </button>
          </div>
        </div>
      </div>

      <!-- Main Calendar Controller Panel -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Date display and title -->
        <div class="flex items-center gap-4">
          <!-- Calendar sheet visual (e.g. JAN 10) -->
          <div class="w-12 h-14 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col shrink-0">
            <div class="bg-purple-600/20 text-purple-400 text-[9px] font-bold py-0.5 text-center tracking-wider uppercase border-b border-slate-850">
              ${shortMonthStr}
            </div>
            <div class="flex-1 flex items-center justify-center text-white text-lg font-black font-sans leading-none">
              ${displayedDayNum}
            </div>
          </div>

          <!-- Date titles -->
          <div>
            <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>${currentMonthName} ${currentYear}</span>
            </h2>
            <p class="text-xs text-slate-400 font-mono mt-0.5">${dateRangeStr}</p>
          </div>
        </div>

        <!-- Navigator controls -->
        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <div class="flex p-0.5 bg-slate-900/60 border border-slate-800/40 rounded-xl">
            <!-- Previous Month -->
            <button onclick="prevMonth()" class="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/5" title="เดือนก่อนหน้า">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            
            <!-- Go Today -->
            <button onclick="goToday()" class="px-3 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all">
              Today
            </button>
            
            <!-- Next Month -->
            <button onclick="nextMonth()" class="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors hover:bg-white/5" title="เดือนถัดไป">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- View selector dropdown matching Template -->
          <div class="relative shrink-0">
            <select onchange="if(this.value === 'todo') navigate('todo')" class="bg-slate-900/60 border border-slate-800/40 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none pr-8">
              <option value="month" selected>Month view</option>
              <option value="todo">List view</option>
            </select>
            <i data-lucide="chevron-down" class="absolute right-2.5 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none"></i>
          </div>

          <!-- Premium Black themed + Add Event button -->
          <button onclick="openCalendarModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-200 hover:scale-105 active:scale-100 transition-all flex items-center gap-1.5 shadow-xl shrink-0">
            <i data-lucide="plus" class="w-4 h-4 stroke-[3]"></i> Add event
          </button>
        </div>
      </div>

      <!-- Calendar Month Grid Board -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800/40 w-full overflow-x-auto">
        <div class="min-w-[700px]">
          <!-- Columns Header Mon-Sun -->
          <div class="grid grid-cols-7 text-center pb-3 border-b border-slate-800/30 text-xs font-bold text-slate-400 select-none">
            <div>Mon</div>
            <div>Tues</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <!-- 6-Row Days Grid Body -->
          <div class="calendar-grid mt-3">
            ${cells.map((cell, idx) => {
    // Find matching events for this cell's date
    const dayTodos = AppState.todos.filter(t => {
      const matchesDate = t.date === cell.dateStr;
      const matchesSearch = query ? t.task.toLowerCase().includes(query) : true;
      return matchesDate && matchesSearch;
    });

    // Sort events by priority (higher priority first)
    dayTodos.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));

    const isToday = cell.dateStr === todayStr;

    // Custom CSS classes
    let cellClass = "calendar-cell";
    if (cell.isOutside) cellClass += " outside-month";
    if (isToday) cellClass += " today-cell";

    return `
                <div class="${cellClass}" onclick="openDayView('${cell.dateStr}')">
                  <!-- Header row within a cell -->
                  <div class="flex justify-between items-center w-full mb-1">
                    <span class="day-number ${isToday ? 'today-number font-sans' : ''}">${cell.day}</span>
                  </div>

                  <!-- Events container -->
                  <div class="w-full flex-1 flex flex-col justify-start overflow-hidden pr-0.5 space-y-1">
                    ${dayTodos.slice(0, 3).map((todo, todoIdx) => {
      const colorClass = priorityColorMap[todo.priority] || 'event-purple';
      return `
                        <div class="event-pill ${colorClass} ${todo.completed ? 'event-completed' : ''}" 
                             onclick="event.stopPropagation(); openDayView('${cell.dateStr}')"
                             title="${todo.task} (${todo.alertTime || 'ไม่มีเวลา'})">
                          
                          <!-- Interactive completion bullet -->
                          <div onclick="toggleCalendarTodoCompleted(event, '${todo.id}')" 
                               class="event-dot w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform ${todo.completed ? 'bg-emerald-400' : ''}"
                               title="${todo.completed ? 'ทำเสร็จแล้ว (คลิกเพื่อยกเลิก)' : 'ค้างอยู่ (คลิกเพื่อเสร็จสิ้น)'}"></div>
                          
                          <span class="event-title font-sans truncate">${todo.task}</span>
                          ${todo.alertTime ? `<span class="event-time">${todo.alertTime}</span>` : ''}
                        </div>
                      `;
    }).join('')}

                    ${dayTodos.length > 3 ? `
                      <div class="text-[8px] font-bold text-purple-400 mt-1 pl-1 italic">
                        + อีก ${dayTodos.length - 3} รายการ...
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        </div>
      </div>

      <!-- Add/Edit Inline Modal for Calendar -->
      ${isModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeCalendarModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 class="text-md font-bold mb-4 flex items-center gap-2">
              <i data-lucide="${modalTodoId ? 'edit-3' : 'plus-circle'}" class="${modalTodoId ? 'text-amber-400' : 'text-purple-400'}"></i>
              <span>${modalTodoId ? 'แก้ไขกิจกรรมปฏิทิน' : 'เพิ่มกิจกรรมลงปฏิทิน'}</span>
            </h3>

            <form id="calendar-event-form" onsubmit="handleCalendarSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ชื่อภารกิจ / กิจกรรม</label>
                <input type="text" id="cal-todo-task" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" 
                       placeholder="เช่น ประชุมเช้า, วิ่งออกกำลังกาย" value="${modalTodoTask}">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">วันที่จัดกิจกรรม</label>
                <input type="date" id="cal-todo-date" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" 
                       value="${modalTodoDate}" onclick="this.showPicker()">
                
                <div class="flex gap-2 mt-1">
                  <button type="button" onclick="addCalQuickDate('today')" class="quick-btn">วันนี้</button>
                  <button type="button" onclick="addCalQuickDate('tomorrow')" class="quick-btn">พรุ่งนี้</button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">เวลาตั้งเตือนความจำ (Alert Time)</label>
                <input type="time" id="cal-todo-alert-time" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" 
                       value="${modalTodoAlertTime}" onclick="this.showPicker()">
                
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <button type="button" onclick="addCalQuickTime('now')" class="quick-btn">ตอนนี้</button>
                  <button type="button" onclick="addCalQuickTime('15m')" class="quick-btn">+15 นาที</button>
                  <button type="button" onclick="addCalQuickTime('30m')" class="quick-btn">+30 นาที</button>
                  <button type="button" onclick="addCalQuickTime('1h')" class="quick-btn">+1 ชม.</button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ระดับความสำคัญ (Priority)</label>
                <select id="cal-todo-priority" class="glass-input w-full px-3 py-2 rounded-lg text-xs cursor-pointer">
                  <option value="high" ${modalTodoPriority === 'high' ? 'selected' : ''}>🔴 สูง (High)</option>
                  <option value="medium" ${modalTodoPriority === 'medium' ? 'selected' : ''}>🟡 กลาง (Medium)</option>
                  <option value="low" ${modalTodoPriority === 'low' ? 'selected' : ''}>🟢 ต่ำ (Low)</option>
                </select>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md">
                  บันทึกกิจกรรม
                </button>
                
                ${modalTodoId ? `
                  <button type="button" onclick="deleteCalendarTodo('${modalTodoId}')" class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md">
                    ลบ
                  </button>
                ` : ''}
                
                <button type="button" onclick="closeCalendarModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300">
                  ยกเลิก
                </button>
              </div>
            </form>
      ` : ''}

      <!-- Day View Modal for Calendar -->
      ${isDayViewOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeDayView()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Title & Subtitle -->
            <div class="mb-5">
              <h3 class="text-md font-bold text-white flex items-center gap-2">
                <i data-lucide="calendar-days" class="text-purple-400"></i>
                <span>แผนงานประจำวันที่ ${selectedDayDate.split('-').reverse().join('/')}</span>
              </h3>
              <p class="text-slate-400 text-[11px] mt-1">รายการกิจกรรมเป้าหมายทั้งหมดสำหรับวันนี้ คลิกรายการเพื่อเข้าสู่การแก้ไข</p>
            </div>

            <!-- Events List -->
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1 mb-6 custom-scroll">
              ${(() => {
        const dayTodos = AppState.todos.filter(t => t.date === selectedDayDate);
        if (dayTodos.length === 0) {
          return `
                    <div class="text-center py-12 text-slate-500 text-xs italic">
                      <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                      ไม่มีแผนงานสำหรับวันนี้
                    </div>
                  `;
        }

        // Sort events by priority (higher priority first)
        dayTodos.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));

        return dayTodos.map((todo) => {
          const colorClass = priorityColorMap[todo.priority] || 'event-purple';
          return `
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/40 hover:bg-slate-800/40 transition-all cursor-pointer group"
                         onclick="editDayViewTodo('${todo.id}')">
                      
                      <!-- Completion bullet -->
                      <button type="button" onclick="toggleCalendarTodoCompleted(event, '${todo.id}')" 
                              class="shrink-0 w-5 h-5 rounded-full border ${todo.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-700 bg-slate-950'} flex items-center justify-center text-[10px] font-bold hover:scale-110 transition-transform">
                        ${todo.completed ? '✓' : ''}
                      </button>

                      <!-- Task Text -->
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="text-xs font-semibold ${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'} truncate group-hover:text-purple-400 transition-colors">
                            ${todo.task}
                          </p>
                          <!-- Priority Badge -->
                          ${todo.priority === 'high' ? `
                            <span class="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold shrink-0">ด่วนสูง</span>
                          ` : todo.priority === 'low' ? `
                            <span class="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-bold shrink-0">ปกติ/ต่ำ</span>
                          ` : `
                            <span class="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-450 font-bold shrink-0">ปานกลาง</span>
                          `}
                        </div>
                        ${todo.alertTime ? `
                          <span class="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <i data-lucide="clock" class="w-3 h-3"></i> เตือนเวลา ${todo.alertTime} น.
                          </span>
                        ` : ''}
                      </div>

                      <!-- Edit indicator icon -->
                      <div class="text-slate-500 group-hover:text-purple-400 transition-colors">
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                      </div>
                    </div>
                  `;
        }).join('');
      })()}
            </div>

            <!-- Footer Action Controls -->
            <div class="flex gap-2 pt-2 border-t border-slate-850">
              <button onclick="addDayViewTodo()" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-md">
                <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มกิจกรรมใหม่
              </button>
              <button type="button" onclick="closeDayView()" class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}
