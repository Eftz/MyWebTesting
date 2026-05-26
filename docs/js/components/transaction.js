// SmartLife SPA Transaction Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { renderPage } from '../router.js';

export function renderTransactionComponent() {
  // Sort transactions: date descending (newest date first), then by id descending
  const sortedTransactions = [...AppState.transactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateB - dateA !== 0) {
      return dateB - dateA;
    }
    return b.id.localeCompare(a.id);
  });

  // Render search filtering (supporting Note, Category, and bilingual Types)
  const query = document.getElementById('tx-search')?.value.toLowerCase() || '';
  const filtered = sortedTransactions.filter(t => {
    const matchesNote = t.note.toLowerCase().includes(query);
    const matchesCategory = t.category.toLowerCase().includes(query);

    let typeText = '';
    if (t.type === 'income') {
      typeText = 'รายรับ income';
    } else if (t.type === 'expense') {
      typeText = 'รายจ่าย expense';
    } else if (t.type === 'savings') {
      typeText = 'เงินออม savings';
    }
    const matchesType = typeText.toLowerCase().includes(query);

    return matchesNote || matchesCategory || matchesType;
  });

  return `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="wallet" class="text-[#007a7a]"></i>
            <span>ธุรกรรมส่วนบุคคล (Transaction_$$)</span>
          </h1>
          <p class="text-slate-500 text-xs mt-1">บันทึกรายรับ รายจ่าย หรือเงินออมของคุณ เพื่อการจัดสรรกระเป๋าเงินอย่างเป็นระบบ</p>
        </div>

        <div class="flex gap-2">
          ${AppState.txEditMode ? `
            <button onclick="confirmTxBulkDelete()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-50 transition-all shadow-md">
              ลบรายการที่เลือก (${AppState.selectedTxIds.length})
            </button>
            <button onclick="toggleTxEditMode()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-100 bg-[#007a7a] hover:bg-[#006363] transition-all flex items-center gap-1.5 shadow-md">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> เสร็จสิ้น
            </button>
          ` : `
            <button onclick="openTxModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#007a7a] hover:bg-[#006363] transition-all flex items-center gap-1.5 shadow-md">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> เพิ่มธุรกรรมใหม่
            </button>
            <button onclick="toggleTxEditMode()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-650 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-850 transition-all flex items-center gap-1.5">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i> จัดการรายการ 
            </button>
          `}
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl border border-slate-200 w-full">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h3 class="text-sm font-bold text-slate-800">
            รายการประวัติการเงินทั้งหมด (${filtered.length} รายการ)
          </h3>
          
          <div class="relative w-full sm:w-72 flex gap-2">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4"></i>
              <input type="text" id="tx-search" onkeydown="if(event.key === 'Enter') renderPage()" value="${query}" class="glass-input w-full pl-9 pr-3 py-1.5 rounded-xl text-xs" placeholder="ค้นหาบันทึก, ประเภท, หมวดหมู่... (กด Enter)">
            </div>
            <button onclick="renderPage()" class="px-3 py-1.5 rounded-xl bg-[#007a7a] hover:bg-[#006363] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center shrink-0">
              ค้นหา
            </button>
          </div>
        </div>

        <div class="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] font-bold text-slate-500 border-b border-slate-200 mb-1 select-none">
          <div class="col-span-5 pl-14">รายการ / บันทึกย่อ</div>
          <div class="col-span-2 text-center">ประเภท</div>
          <div class="col-span-2 text-center">หมวดหมู่</div>
          <div class="col-span-3 text-right pr-2">จำนวนเงิน</div>
        </div>

        <div class="custom-scroll max-h-[480px] pr-2 space-y-2">
          ${filtered.length === 0 ? `
            <div class="text-center py-16 text-slate-500 text-sm italic">ไม่มีประวัติธุรกรรมตามที่กำหนด</div>
          ` : filtered.map(t => {
    const isSelected = AppState.selectedTxIds.includes(t.id);

    // Styling depends on transaction type
    let typeColor = 'text-rose-600';
    let prefix = '-฿';
    if (t.type === 'income') {
      typeColor = 'text-emerald-600';
      prefix = '+฿';
    } else if (t.type === 'savings') {
      typeColor = 'text-sky-700';
      prefix = 'ออม ฿';
    }

    // ไฮไลท์สไตล์สีแถบตามสถานะโหมดจัดการ
    let rowStyleClass = 'bg-white border-slate-200 hover:bg-slate-50';
    if (AppState.txEditMode) {
      if (isSelected) {
        rowStyleClass = 'bg-teal-50/70 border-dashed border-[#007a7a] ring-1 ring-[#007a7a]/20';
      } else {
        rowStyleClass = 'bg-slate-50/80 border-dashed border-slate-200 opacity-85';
      }
    }

    return `
              <div class="shopee-item p-3 px-4 rounded-xl ${rowStyleClass} ${AppState.txEditMode ? 'edit-mode' : ''} border transition-all duration-150 flex items-center justify-between gap-3 shadow-sm relative overflow-hidden">
                
                ${AppState.txEditMode ? `
                  <div onclick="toggleTxSelection('${t.id}')" class="absolute inset-0 cursor-pointer z-0"></div>
                ` : ''}

                <div class="shopee-checkbox-container shrink-0 z-10">
                  <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleTxSelection('${t.id}')" class="w-4 h-4 rounded border-slate-350 bg-white accent-[#007a7a] text-[#007a7a] focus:ring-[#007a7a] cursor-pointer">
                </div>

                <div class="shrink-0 p-2 rounded-lg bg-slate-100 text-slate-500 z-10 pointer-events-none">
                  <i data-lucide="${t.type === 'income' ? 'trending-up' : t.type === 'savings' ? 'piggy-bank' : 'trending-down'}" class="w-4 h-4"></i>
                </div>

                <div onclick="${!AppState.txEditMode ? `editTx('${t.id}')` : ''}" class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center min-w-0 z-10 ${!AppState.txEditMode ? 'cursor-pointer' : 'pointer-events-none'}">
                  
                  <div class="col-span-5 truncate">
                    <h4 class="text-xs font-bold text-slate-800 truncate ${!AppState.txEditMode ? 'hover:underline hover:text-[#007a7a]' : ''}">
                      ${t.note}
                    </h4>
                    <span class="text-[9px] text-slate-500 font-mono">${t.date}</span>
                  </div>

                  <div class="col-span-2 text-left sm:text-center shrink-0">
                    ${t.type === 'income' ? `
                      <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shrink-0">รายรับ</span>
                    ` : t.type === 'expense' ? `
                      <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm shrink-0">รายจ่าย</span>
                    ` : `
                      <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-sm shrink-0">เงินออม</span>
                    `}
                  </div>

                  <div class="col-span-2 text-left sm:text-center shrink-0">
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-650 border border-slate-200">${t.category}</span>
                  </div>

                  <div class="col-span-3 text-left sm:text-right shrink-0">
                    <span class="text-xs font-extrabold ${typeColor}">
                      ${prefix}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                </div>

                ${!AppState.txEditMode ? `
                  <div class="shopee-actions shrink-0 z-10 relative">
                    <button onclick="editTx('${t.id}')" class="p-1.5 rounded-lg bg-[#007a7a]/10 text-[#007a7a] hover:bg-[#007a7a]/20 transition-colors" title="แก้ไขรายการ">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                ` : ''}

              </div>
            `;
  }).join('')}
        </div>
      </div>

      ${AppState.txModalOpen ? `
        <div class="modal-overlay-safe fixed inset-0 top-[68px] md:top-0 landscape:top-[60px] md:landscape:top-0 ${AppState.sidebarCollapsed ? 'md:left-20' : 'md:left-64'} z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-md bg-white p-5 landscape:p-4 rounded-3xl border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[85vh] landscape:max-h-[85vh] animate-scale-up">
            
            <button type="button" onclick="closeTxModal()" class="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <h3 id="tx-form-title" class="text-md font-bold mb-4 flex items-center gap-2 text-slate-800">
              <i data-lucide="plus-circle" class="text-[#007a7a]"></i>
              <span>เพิ่มรายการธุรกรรม</span>
            </h3>

            <form id="tx-form" onsubmit="handleTxSubmit(event)" class="space-y-4">
              <input type="hidden" id="tx-id">
              
              <div>
                <label class="block text-slate-650 text-xs font-semibold mb-1">หัวข้อกิจกรรม / บันทึกย่อ</label>
                <input type="text" id="tx-note" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="เช่น เงินเดือน, ซื้อข้าวเย็น, ออมเงินสำรอง">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-650 text-xs font-semibold mb-1">ประเภทธุรกรรม</label>
                  <select id="tx-type" required class="glass-input w-full px-3 py-2 rounded-lg text-xs">
                    <option value="expense">รายจ่าย</option>
                    <option value="income">รายรับ</option>
                    <option value="savings">เงินออม</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-650 text-xs font-semibold mb-1">จำนวนเงิน (฿)</label>
                  <input type="number" id="tx-amount" min="0.01" step="any" required class="glass-input w-full px-3 py-2 rounded-lg text-xs" placeholder="0.00">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-650 text-xs font-semibold mb-1">หมวดหมู่</label>
                  <select id="tx-category" required class="glass-input w-full px-3 py-2 rounded-lg text-xs">
                    <option value="อาหาร">อาหาร</option>
                    <option value="การเดินทาง">การเดินทาง</option>
                    <option value="ที่พัก/ค่าเช่า">ที่พัก/ค่าเช่า</option>
                    <option value="บันเทิง">บันเทิง</option>
                    <option value="ช้อปปิ้ง">ช้อปปิ้ง</option>
                    <option value="สุขภาพ">สุขภาพ</option>
                    <option value="อเนกประสงค์">อเนกประสงค์</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-650 text-xs font-semibold mb-1">เวลาบันทึก</label>
                  <input type="date" id="tx-date" value="${AppState.getTodayString()}" onclick="this.showPicker()" required class="glass-input w-full px-3 py-2 rounded-lg text-xs">
                  
                  <div class="flex gap-2 mt-1">
                    <button type="button" onclick="addTxQuickDate('today')" class="quick-btn">วันนี้</button>
                    <button type="button" onclick="addTxQuickDate('yesterday')" class="quick-btn">เมื่อวาน</button>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#007a7a] hover:bg-[#006363] shadow-md">
                  บันทึกข้อมูล
                </button>
                <button type="button" onclick="closeTxModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}

      ${AppState.txBulkDeleteConfirmOpen ? `
        <div class="modal-overlay-safe fixed inset-0 top-[68px] md:top-0 landscape:top-[60px] md:landscape:top-0 ${AppState.sidebarCollapsed ? 'md:left-20' : 'md:left-64'} z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-sm bg-white p-5 landscape:p-4 rounded-3xl border border-slate-100 shadow-2xl text-center relative overflow-y-auto max-h-[85vh] landscape:max-h-[85vh] animate-scale-up">
            <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="trash-2" class="w-5 h-5"></i>
            </div>
            <h3 class="text-sm font-black text-slate-800">ยืนยันลบข้อมูลธุรกรรม?</h3>
            <p class="text-xs text-slate-500 mt-1">คุณกำลังลบรายการประวัติการเงินจำนวน:</p>
            <div class="my-3 py-2 px-4 rounded-lg bg-slate-50 text-slate-700 text-xs font-black inline-block">
              รวมทั้งหมด ${AppState.selectedTxIds.length} รายการ
            </div>
            <p class="text-[10px] text-slate-400 mb-4">ข้อมูลที่ถูกลบจะไม่สามารถนำกลับมาคำนวณใหม่ได้อีก</p>
            <div class="flex gap-2.5 mt-2">
              <button onclick="executeTxBulkDelete()" class="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-colors">
                ใช่, ลบถาวร
              </button>
              <button onclick="cancelTxBulkDelete()" class="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Transaction operations controllers
export function openTxModal() {
  AppState.txModalOpen = true;
  renderPage();
  resetTxForm();
}

export function closeTxModal() {
  AppState.txModalOpen = false;
  renderPage();
}

export function toggleTxEditMode() {
  AppState.txEditMode = !AppState.txEditMode;
  AppState.selectedTxIds = [];
  renderPage();
}

export function toggleTxSelection(id) {
  const index = AppState.selectedTxIds.indexOf(id);
  if (index === -1) {
    AppState.selectedTxIds.push(id);
  } else {
    AppState.selectedTxIds.splice(index, 1);
  }
  renderPage();
}

export function handleTxSubmit(event) {
  event.preventDefault();

  const idField = document.getElementById('tx-id').value;
  const note = document.getElementById('tx-note').value.trim();
  const type = document.getElementById('tx-type').value;
  const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value || AppState.getTodayString();

  if (amount <= 0) {
    showToast('กรุณากรอกยอดเงินให้ถูกต้อง', 'error');
    return;
  }

  // Calculate projected balance to prevent expense/savings exceeding income
  let tempTransactions = [...AppState.transactions];
  if (idField) {
    const index = tempTransactions.findIndex(t => t.id === idField);
    if (index !== -1) {
      tempTransactions[index] = { id: idField, note, type, amount, category, date };
    }
  } else {
    tempTransactions.unshift({ id: 'temp', note, type, amount, category, date });
  }

  const projIncome = tempTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const projExpense = tempTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const projSavings = tempTransactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
  const projBalance = projIncome - projExpense - projSavings;

  if (projBalance < 0) {
    showToast('ยอดเงินคงเหลือในกระเป๋าไม่เพียงพอ (ไม่สามารถให้ยอดรวมติดลบได้)', 'error');
    return;
  }

  if (idField) {
    // Edit Mode
    const index = AppState.transactions.findIndex(t => t.id === idField);
    if (index !== -1) {
      AppState.transactions[index] = { id: idField, note, type, amount, category, date };
      showToast('แก้ไขธุรกรรมเสร็จสิ้น');
    }
  } else {
    // Add Mode
    const newTx = {
      id: String(Date.now()),
      note,
      type,
      amount,
      category,
      date
    };
    AppState.transactions.unshift(newTx);
    showToast('เพิ่มรายการธุรกรรมสำเร็จ');
  }

  // Close modal and clear bulk edit selection states on submit to refresh clean
  AppState.txEditMode = false;
  AppState.selectedTxIds = [];
  AppState.txModalOpen = false;

  AppState.saveTransactions();
  resetTxForm();
  renderPage();
}

export function resetTxForm() {
  document.getElementById('tx-form')?.reset();
  const idField = document.getElementById('tx-id');
  if (idField) idField.value = '';

  // Clear search filter so the newly updated/added transaction is always visible
  const searchField = document.getElementById('tx-search');
  if (searchField) searchField.value = '';

  const title = document.getElementById('tx-form-title');
  if (title) title.innerHTML = `<i data-lucide="plus-circle" class="text-[#007a7a]"></i><span>เพิ่มรายการธุรกรรม</span>`;
  if (window.lucide) window.lucide.createIcons();
}

export function editTx(id) {
  const tx = AppState.transactions.find(t => t.id === id);
  if (!tx) return;

  AppState.txModalOpen = true;
  renderPage();

  document.getElementById('tx-id').value = tx.id;
  document.getElementById('tx-note').value = tx.note;
  document.getElementById('tx-type').value = tx.type;
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-category').value = tx.category;
  document.getElementById('tx-date').value = tx.date;

  const title = document.getElementById('tx-form-title');
  if (title) title.innerHTML = `<i data-lucide="edit-3" class="text-amber-500"></i><span>แก้ไขรายการธุรกรรม</span>`;
  if (window.lucide) window.lucide.createIcons();

  showToast('โหลดข้อมูลเข้าฟอร์มสำเร็จ', 'info');
}

export function deleteTx(id) {
  AppState.transactions = AppState.transactions.filter(t => t.id !== id);
  AppState.saveTransactions();
  showToast('ลบรายการธุรกรรมเรียบร้อยแล้ว');
  renderPage();
}

export function confirmTxBulkDelete() {
  if (AppState.selectedTxIds.length === 0) {
    showToast('กรุณาเลือกรายการที่ต้องการลบก่อน', 'warning');
    return;
  }
  AppState.txBulkDeleteConfirmOpen = true;
  renderPage();
}

export function executeTxBulkDelete() {
  AppState.transactions = AppState.transactions.filter(t => !AppState.selectedTxIds.includes(t.id));
  AppState.saveTransactions();
  showToast(`ลบรายการสำเร็จ ${AppState.selectedTxIds.length} รายการ`);
  AppState.selectedTxIds = [];
  AppState.txBulkDeleteConfirmOpen = false;
  renderPage();
}

export function cancelTxBulkDelete() {
  AppState.txBulkDeleteConfirmOpen = false;
  renderPage();
}

// Quick Date filler requested by user
export function addTxQuickDate(day) {
  const dateEl = document.getElementById('tx-date');
  if (!dateEl) return;

  const d = new Date();
  if (day === 'yesterday') {
    d.setDate(d.getDate() - 1);
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  dateEl.value = `${yyyy}-${mm}-${dd}`;
}

// Expose all operations to window globally
window.openTxModal = openTxModal;
window.closeTxModal = closeTxModal;
window.toggleTxEditMode = toggleTxEditMode;
window.toggleTxSelection = toggleTxSelection;
window.handleTxSubmit = handleTxSubmit;
window.resetTxForm = resetTxForm;
window.editTx = editTx;
window.deleteTx = deleteTx;
window.confirmTxBulkDelete = confirmTxBulkDelete;
window.executeTxBulkDelete = executeTxBulkDelete;
window.cancelTxBulkDelete = cancelTxBulkDelete;
window.addTxQuickDate = addTxQuickDate;