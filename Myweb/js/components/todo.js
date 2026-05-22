// SmartLife SPA Todo Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';
import { NotificationEngine } from '../notification.js';
import { AudioEngine } from '../audio.js';

function renderTodoRow(t) {
  const isSelected = AppState.selectedTodoIds.includes(t.id);
  return `
    <div class="shopee-item p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/30 hover:bg-slate-900/60 ${t.completed ? 'opacity-70' : ''} ${AppState.todoEditMode ? 'edit-mode' : ''} transition-all">
      
      <!-- Shopee checkbox -->
      <div class="shopee-checkbox-container">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleTodoSelection('${t.id}')" class="w-4 h-4 rounded border-slate-800 bg-slate-950 accent-pink text-pink-600 focus:ring-pink-600">
      </div>

      <!-- Quick check completed status -->
      <button onclick="toggleTodoCompleted('${t.id}')" class="shrink-0 mr-3 text-slate-500 hover:text-pink-400 transition-colors">
        ${t.completed ? `
          <div class="w-5 h-5 rounded-full border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">✓</div>
        ` : `
          <div class="w-5 h-5 rounded-full border border-slate-700 bg-slate-950"></div>
        `}
      </button>

      <!-- Details -->
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'} truncate">${t.task}</h4>
        <div class="flex flex-wrap gap-2 items-center mt-1">
          <span class="text-[9px] text-slate-500 font-mono">${t.date}</span>
          
          <!-- Priority Badge -->
          ${t.priority === 'high' ? `
            <span class="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold shrink-0">ด่วนสูง</span>
          ` : t.priority === 'low' ? `
            <span class="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-bold shrink-0">ปกติ/ต่ำ</span>
          ` : `
            <span class="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-450 font-bold shrink-0">ปานกลาง</span>
          `}
          
          <!-- Consolidated Alert badge: Orange for pending, Green for alerted/completed -->
          ${t.alertTime ? (t.notified ? `
            <span class="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono flex items-center gap-1 shadow-sm">
              <i data-lucide="check" class="w-3 h-3"></i> เตือนเวลา ${t.alertTime} น. (เตือนสำเร็จ)
            </span>
          ` : `
            <span class="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono flex items-center gap-1 shadow-sm animate-pulse">
              <i data-lucide="clock" class="w-3 h-3"></i> เตือนเวลา ${t.alertTime} น. (รอเตือน)
            </span>
          `) : ''}
        </div>
      </div>

      <!-- Shopee actions (Action controls displayed cleanly on each row) -->
      <div class="shopee-actions">
        <button onclick="editTodo('${t.id}')" class="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
        </button>
      </div>

    </div>
  `;
}

export function renderTodoComponent() {
  const query = document.getElementById('todo-search')?.value.toLowerCase() || '';
  const filtered = AppState.todos.filter(t => {
    const matchesTask = t.task.toLowerCase().includes(query);
    
    // Status alarm search terms
    const notifyText = t.alertTime 
      ? (t.notified ? 'เตือนแล้ว เตือนสำเร็จ notified alerted' : 'รอเตือน ยังไม่เตือน pending') 
      : 'ไม่มีแจ้งเตือน none';
    const matchesNotify = notifyText.toLowerCase().includes(query);
    
    // Status completed search terms
    const completedText = t.completed 
      ? 'เสร็จแล้ว done completed สำเร็จ' 
      : 'ยังไม่เสร็จ pending ค้าง';
    const matchesCompleted = completedText.toLowerCase().includes(query);

    return matchesTask || matchesNotify || matchesCompleted;
  });

  const pendingFiltered = filtered.filter(t => !t.completed);
  const completedFiltered = filtered.filter(t => t.completed);

  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="check-square" class="text-pink-400"></i>
            <span>ตารางงานและเป้าหมายเร่งด่วน (Do the &lt; list &gt;)</span>
          </h1>
          <p class="text-slate-400 text-xs mt-1">วางแผนภารกิจรายวัน พร้อมระบบเสียงแจ้งเตือนและระบบ Push Notification ในตัว</p>
        </div>

        <!-- Shopee Bucket toggle controller & Add task button -->
        <div class="flex gap-2">
          ${AppState.todoEditMode ? `
            <button onclick="handleTodoBulkDelete()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md">
              ลบรายการที่เลือก (${AppState.selectedTodoIds.length})
            </button>
            <button onclick="toggleTodoEditMode()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-100 bg-pink-700 hover:bg-pink-600 transition-all flex items-center gap-1.5 shadow-md">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> เสร็จสิ้น
            </button>
          ` : `
            <button onclick="openTodoModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 transition-all flex items-center gap-1.5 shadow-md">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> เพิ่มเป้าหมายใหม่
            </button>
            <button onclick="toggleTodoEditMode()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-200 transition-all flex items-center gap-1.5">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i> จัดการรายการ 
            </button>
          `}
        </div>
      </div>

      <!-- Quick Setup Alert Audio context trigger wrapper -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-purple-500/10 text-purple-300">
            <i data-lucide="bell-ring" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-200">ตรวจสอบสิทธิ์การส่งข้อความแจ้งเตือนเดสก์ท็อป</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">ระบบต้องการสิทธิ์เพื่อเตือนความจำจริงนอกหน้าเบราว์เซอร์</p>
          </div>
        </div>
        <button onclick="initializeNotificationPermission()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-md">
          เปิดใช้งานระบบเตือน
        </button>
      </div>

      <!-- Task List Container - Spans full width layout -->
      <div class="glass-panel p-6 rounded-2xl border border-slate-800/40 w-full">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h3 class="text-sm font-bold text-slate-200">
            แผนงานทั้งหมดประจำวัน (${filtered.length} รายการ)
          </h3>
          
          <div class="relative w-full sm:w-72 flex gap-2">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute left-2.5 top-2.5 text-slate-500 w-4 h-4"></i>
              <input type="text" id="todo-search" onkeydown="if(event.key === 'Enter') renderPage()" value="${query}" class="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs" placeholder="ค้นหาภารกิจ... (กด Enter)">
            </div>
            <button onclick="renderPage()" class="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center shrink-0">
              ค้นหา
            </button>
          </div>
        </div>

        <!-- Split lists: Uncompleted and Completed columns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Column 1: Uncompleted -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-amber-400 flex items-center gap-1.5 pb-2 border-b border-slate-800/40 uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>ยังไม่เสร็จ (${pendingFiltered.length})</span>
            </h4>
            <div class="custom-scroll max-h-[380px] pr-1 space-y-2">
              ${pendingFiltered.length === 0 ? `
                <div class="text-center py-12 text-slate-500 text-xs italic">ไม่มีภารกิจค้างสำหรับวันนี้</div>
              ` : pendingFiltered.map(t => renderTodoRow(t)).join('')}
            </div>
          </div>

          <!-- Column 2: Completed -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-slate-800/40 uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>เสร็จแล้ว (${completedFiltered.length})</span>
            </h4>
            <div class="custom-scroll max-h-[380px] pr-1 space-y-2">
              ${completedFiltered.length === 0 ? `
                <div class="text-center py-12 text-slate-500 text-xs italic">ไม่มีภารกิจเสร็จสิ้น</div>
              ` : completedFiltered.map(t => renderTodoRow(t)).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Popup Modal overlay -->
      ${AppState.todoModalOpen ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800/60 shadow-2xl relative overflow-hidden animate-scale-up">
            
            <!-- Close button -->
            <button type="button" onclick="closeTodoModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-slate-800 text-slate-450 hover:text-slate-200 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 id="todo-form-title" class="text-md font-bold mb-4 flex items-center gap-2">
              <i data-lucide="plus-circle" class="text-pink-400"></i>
              <span>เพิ่มแผนงานเป้าหมาย</span>
            </h3>

            <form id="todo-form" onsubmit="handleTodoSubmit(event)" class="space-y-4">
              <input type="hidden" id="todo-id">

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">รายละเอียดงาน / ภารกิจ</label>
                <input type="text" id="todo-task" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="เช่น วิ่งรอบสวนธารณะ, ดื่มน้ำแก้วที่ 4">
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">วันที่ต้องการทำ</label>
                <input type="date" id="todo-date" value="${AppState.getTodayString()}" onclick="this.showPicker()" required class="glass-input w-full px-3 py-2 rounded-lg text-xs">
                
                <!-- Quick Date Selectors requested by user -->
                <div class="flex gap-2 mt-1">
                  <button type="button" onclick="addTodoQuickDate('today')" class="quick-btn">วันนี้</button>
                  <button type="button" onclick="addTodoQuickDate('tomorrow')" class="quick-btn">พรุ่งนี้</button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">เวลาที่จะแจ้งเตือนเสียง (Alert Time - HH:MM)</label>
                <input type="time" id="todo-alert-time" value="${currentHHMM}" onclick="this.showPicker()" required class="glass-input w-full px-3 py-2 rounded-lg text-xs">
                
                <!-- Quick Time Selectors requested by user -->
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <button type="button" onclick="addTodoQuickTime('now')" class="quick-btn">ตอนนี้</button>
                  <button type="button" onclick="addTodoQuickTime('15m')" class="quick-btn">+15 นาที</button>
                  <button type="button" onclick="addTodoQuickTime('30m')" class="quick-btn">+30 นาที</button>
                  <button type="button" onclick="addTodoQuickTime('1h')" class="quick-btn">+1 ชม.</button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 text-xs font-semibold mb-1">ระดับความสำคัญ (Priority)</label>
                <select id="todo-priority" class="glass-input w-full px-3 py-2 rounded-lg text-xs cursor-pointer">
                  <option value="high">🔴 สูง (High)</option>
                  <option value="medium" selected>🟡 กลาง (Medium)</option>
                  <option value="low">🟢 ต่ำ (Low)</option>
                </select>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-md">
                  บันทึกงาน
                </button>
                <button type="button" onclick="closeTodoModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-slate-800 hover:bg-white/10 text-slate-300">
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

// Actions logic for Do the list
export async function initializeNotificationPermission() {
  await NotificationEngine.requestPermission();
  AudioEngine.playChime();
  showToast('เปิดใช้ระบบเตือนและทดสอบเสียงเรียบร้อยแล้ว!', 'success');
}

export function toggleTodoEditMode() {
  AppState.todoEditMode = !AppState.todoEditMode;
  AppState.selectedTodoIds = [];
  renderPage();
}

export function toggleTodoSelection(id) {
  const index = AppState.selectedTodoIds.indexOf(id);
  if (index === -1) {
    AppState.selectedTodoIds.push(id);
  } else {
    AppState.selectedTodoIds.splice(index, 1);
  }
  renderPage();
}

export function openTodoModal() {
  AppState.todoModalOpen = true;
  renderPage();
  resetTodoForm();
}

export function closeTodoModal() {
  AppState.todoModalOpen = false;
  renderPage();
}

export function handleTodoSubmit(event) {
  event.preventDefault();

  const idField = document.getElementById('todo-id').value;
  const task = document.getElementById('todo-task').value.trim();
  const date = document.getElementById('todo-date').value || AppState.getTodayString();
  const alertTime = document.getElementById('todo-alert-time').value;
  const priority = document.getElementById('todo-priority').value || 'medium';

  if (idField) {
    // Edit Mode
    const index = AppState.todos.findIndex(t => t.id === idField);
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
      showToast('แก้ไขภารกิจเสร็จสิ้น');
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
    showToast('เพิ่มเป้าหมายงานสำเร็จ');
  }

  // Close modal and clear bulk edit selection states on submit
  AppState.todoEditMode = false;
  AppState.selectedTodoIds = [];
  AppState.todoModalOpen = false;

  AppState.saveTodos();
  resetTodoForm();
  renderPage();
}

export function resetTodoForm() {
  document.getElementById('todo-form')?.reset();
  const idField = document.getElementById('todo-id');
  if (idField) idField.value = '';

  if (document.getElementById('todo-priority')) {
    document.getElementById('todo-priority').value = 'medium';
  }

  // Clear search filter so the newly updated/added todo is always visible
  const searchField = document.getElementById('todo-search');
  if (searchField) searchField.value = '';

  const title = document.getElementById('todo-form-title');
  if (title) title.innerHTML = `<i data-lucide="plus-circle" class="text-pink-400"></i><span>เพิ่มแผนงานเป้าหมาย</span>`;
  if (window.lucide) window.lucide.createIcons();
}

export function toggleTodoCompleted(id) {
  const index = AppState.todos.findIndex(t => t.id === id);
  if (index !== -1) {
    AppState.todos[index].completed = !AppState.todos[index].completed;
    AppState.saveTodos();
    showToast(AppState.todos[index].completed ? 'เสร็จสิ้นภารกิจ! 🎉' : 'ย้อนเวลากลับมาค้างภารกิจ', 'info');
    renderPage();
  }
}

export function editTodo(id) {
  const todo = AppState.todos.find(t => t.id === id);
  if (!todo) return;

  AppState.todoModalOpen = true;
  renderPage();

  document.getElementById('todo-id').value = todo.id;
  document.getElementById('todo-task').value = todo.task;
  document.getElementById('todo-date').value = todo.date;
  document.getElementById('todo-alert-time').value = todo.alertTime;

  if (document.getElementById('todo-priority')) {
    document.getElementById('todo-priority').value = todo.priority || 'medium';
  }

  const title = document.getElementById('todo-form-title');
  if (title) title.innerHTML = `<i data-lucide="edit-3" class="text-amber-400"></i><span>แก้ไขแผนงานเป้าหมาย</span>`;
  if (window.lucide) window.lucide.createIcons();

  showToast('โหลดข้อมูลเข้าฟอร์มสำเร็จ', 'info');
}

export function deleteTodo(id) {
  AppState.todos = AppState.todos.filter(t => t.id !== id);
  AppState.saveTodos();
  showToast('ลบเป้าหมายงานเรียบร้อยแล้ว');
  renderPage();
}

export function handleTodoBulkDelete() {
  if (AppState.selectedTodoIds.length === 0) {
    showToast('กรุณาเลือกรายการที่ต้องการลบก่อน', 'warning');
    return;
  }

  AppState.todos = AppState.todos.filter(t => !AppState.selectedTodoIds.includes(t.id));
  AppState.saveTodos();
  showToast(`ลบเป้าหมายสำเร็จ ${AppState.selectedTodoIds.length} รายการ`);
  AppState.selectedTodoIds = [];
  renderPage();
}

// Quick Date selector
export function addTodoQuickDate(day) {
  const el = document.getElementById('todo-date');
  if (!el) return;
  const d = new Date();
  if (day === 'tomorrow') {
    d.setDate(d.getDate() + 1);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  el.value = `${yyyy}-${mm}-${dd}`;
}

// Quick Time selector
export function addTodoQuickTime(type) {
  const el = document.getElementById('todo-alert-time');
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
}

// Expose actions to global window
window.initializeNotificationPermission = initializeNotificationPermission;
window.toggleTodoEditMode = toggleTodoEditMode;
window.toggleTodoSelection = toggleTodoSelection;
window.openTodoModal = openTodoModal;
window.closeTodoModal = closeTodoModal;
window.handleTodoSubmit = handleTodoSubmit;
window.resetTodoForm = resetTodoForm;
window.toggleTodoCompleted = toggleTodoCompleted;
window.editTodo = editTodo;
window.deleteTodo = deleteTodo;
window.handleTodoBulkDelete = handleTodoBulkDelete;
window.addTodoQuickDate = addTodoQuickDate;
window.addTodoQuickTime = addTodoQuickTime;
