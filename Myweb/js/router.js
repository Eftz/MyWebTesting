// SmartLife SPA Router & Shell Module
import { AppState } from './state.js';
import { showToast } from './ui.js';

// Component view renderers (Lazy imported or standard imports)
import { renderAuth } from './components/auth.js';
import { renderOnboarding } from './components/onboarding.js';
import { renderDashboardComponent, initDashboardCharts } from './components/dashboard.js';
import { renderTransactionComponent } from './components/transaction.js';
import { renderTodoComponent } from './components/todo.js';
import { renderHealthComponent } from './components/health.js';
import { renderSettingsComponent } from './components/settings.js';
import { renderCalendarComponent } from './components/calendar.js';

export function navigate(page) {
  AppState.loading = true;
  AppState.activePage = page;
  
  // Reset bulk selection modes when switching pages
  AppState.txEditMode = false;
  AppState.todoEditMode = false;
  AppState.selectedTxIds = [];
  AppState.selectedTodoIds = [];

  renderPage();

  setTimeout(() => {
    AppState.loading = false;
    renderPage();
  }, 400); // 400ms premium transition delay
}

export function handleLogout() {
  localStorage.removeItem('smart_active_user');
  AppState.currentUser = null;
  AppState.activePage = 'dashboard';
  navigate('dashboard');
  showToast('ออกจากระบบเรียบร้อยแล้ว');
}

export function renderPage() {
  const app = document.getElementById('app');
  if (!app) return;

  // 0. Transition Loading State
  if (AppState.loading) {
    app.className = "min-h-screen flex items-center justify-center bg-[#0a0715]";
    app.innerHTML = `
      <div class="flex flex-col items-center gap-4 animate-scale-up">
        <!-- Premium Loading Spinner -->
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
          <div class="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-slate-400 text-xs font-bold tracking-widest uppercase animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    `;
    return;
  }

  // Save focus and cursor selection position to prevent search input losing focus on re-render
  const activeId = document.activeElement?.id;
  const selectionStart = document.activeElement?.selectionStart;
  const selectionEnd = document.activeElement?.selectionEnd;

  // 1. Unauthenticated state
  if (!AppState.currentUser) {
    renderAuth(app);
    return;
  }

  // 2. Authenticated but first-time Onboarding state
  if (!AppState.currentUser.onboarded) {
    renderOnboarding(app);
    return;
  }

  // 3. Normal App Shell (Sidebar + Main Area)
  app.className = "min-h-screen flex flex-col md:flex-row bg-[#0a0715]";

  const asideClasses = AppState.sidebarCollapsed
    ? "hidden md:flex md:w-20 glass-panel border-r border-slate-800/40 p-3 flex-col justify-between shrink-0 transition-all duration-300 overflow-hidden"
    : "w-full md:w-64 glass-panel border-r border-slate-800/40 p-5 flex flex-col justify-between shrink-0 transition-all duration-300";

  const hideTextClass = AppState.sidebarCollapsed ? "md:hidden" : "";
  const centerIconClass = AppState.sidebarCollapsed ? "md:justify-center" : "";
  const gapClass = AppState.sidebarCollapsed ? "md:gap-0" : "gap-3";

  app.innerHTML = `
    <!-- Sidebar navigation -->
    <aside class="${asideClasses}">
      <div>
        <!-- Profile Header -->
        <div class="flex ${AppState.sidebarCollapsed ? 'flex-col items-center justify-center' : 'items-center justify-between'} pb-6 mb-6 border-b border-slate-800/40 gap-3">
          <div onclick="navigate('settings')" class="profile-header-link flex items-center gap-3 min-w-0 cursor-pointer rounded-xl px-2 py-1.5 -mx-2 transition-all hover:bg-white/5" title="ตั้งค่าโปรไฟล์">
            ${AppState.currentUser.profileImage ? `
              <img src="${AppState.currentUser.profileImage}" class="w-10 h-10 rounded-full object-cover border border-purple-500/25 shadow-lg shrink-0 transition-transform group-hover:scale-105">
            ` : `
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-lg shadow-lg text-white shrink-0 transition-transform group-hover:scale-105">
                ${AppState.currentUser.name.charAt(0).toUpperCase()}
              </div>
            `}
            <div class="${hideTextClass} min-w-0">
              <h4 class="font-bold text-slate-100 truncate max-w-[110px]">${AppState.currentUser.name}</h4>
              <p class="text-xs text-purple-400 text-ellipsis truncate max-w-[110px]">@${AppState.currentUser.username}</p>
            </div>
          </div>
          <button onclick="toggleSidebar()" class="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/40 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800/60" title="${AppState.sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}">
            <i data-lucide="${AppState.sidebarCollapsed ? 'chevrons-right' : 'chevrons-left'}" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Sidebar Navigation Menu -->
        <nav class="space-y-2">
          <button onclick="navigate('dashboard')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-slate-200 transition-all ${AppState.activePage === 'dashboard' ? 'active' : ''} ${centerIconClass}" title="Dashboard">
            <i data-lucide="layout-dashboard" class="w-5 h-5 shrink-0"></i>
            <span class="${hideTextClass}">Dashboard</span>
          </button>
          
          <button onclick="navigate('transaction')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-slate-200 transition-all ${AppState.activePage === 'transaction' ? 'active' : ''} ${centerIconClass}" title="Transaction">
            <i data-lucide="wallet" class="w-5 h-5 shrink-0"></i>
            <span class="${hideTextClass}">Transaction</span>
          </button>
          
          <button onclick="navigate('todo')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-slate-200 transition-all ${AppState.activePage === 'todo' ? 'active' : ''} ${centerIconClass}" title="Do the < list >">
            <i data-lucide="check-square" class="w-5 h-5 shrink-0"></i>
            <span class="${hideTextClass}">Do the &lt; list &gt;</span>
          </button>
          
          <button onclick="navigate('health')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-slate-200 transition-all ${AppState.activePage === 'health' ? 'active' : ''} ${centerIconClass}" title="Healthy Basement">
            <i data-lucide="heart" class="w-5 h-5 shrink-0"></i>
            <span class="${hideTextClass}">Healthy Basement</span>
          </button>
          
          <button onclick="navigate('calendar')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-slate-200 transition-all ${AppState.activePage === 'calendar' ? 'active' : ''} ${centerIconClass}" title="Calendar">
            <i data-lucide="calendar" class="w-5 h-5 shrink-0"></i>
            <span class="${hideTextClass}">Calendar</span>
          </button>
          
        </nav>
      </div>

      <!-- Quick targets visual summary inside sidebar -->
      <div class="mt-8 space-y-3">
        ${AppState.sidebarCollapsed ? '' : `
          <div class="bg-purple-950/20 border border-purple-900/40 rounded-xl p-3 text-xs">
            <div class="flex justify-between text-purple-300 font-semibold mb-1">
              <span>ดื่มน้ำวันนี้</span>
              <span>${AppState.health.water}/${AppState.currentUser.waterGoal} ml</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="bg-cyan-500 h-full transition-all duration-500" style="width: ${Math.min(100, (AppState.health.water / AppState.currentUser.waterGoal) * 100)}%"></div>
            </div>
          </div>
        `}

        <button onclick="handleLogout()" class="w-full flex items-center ${gapClass} px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all ${centerIconClass}" title="Log Out">
          <i data-lucide="log-out" class="w-5 h-5 shrink-0"></i>
          <span class="${hideTextClass}">Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Container with Premium transitions -->
    <main class="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen page-fade-in flex flex-col">
      <!-- Toggle button top bar breadcrumb -->
      <div class="flex items-center gap-4 mb-6">
        <button onclick="toggleSidebar()" class="p-2 rounded-xl bg-slate-900/60 border border-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-md hover:bg-slate-800/60" title="${AppState.sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}">
          <i data-lucide="${AppState.sidebarCollapsed ? 'menu' : 'menu-fold'}" class="w-5.5 h-5.5"></i>
        </button>
        <div class="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wider uppercase select-none">
          <span>SmartLife</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <span class="text-purple-400">${AppState.activePage}</span>
        </div>
      </div>
      
      <div class="flex-1">
        ${renderActiveComponent()}
      </div>
    </main>
  `;

  // Draw dashboard Chart.js Doughnut if active
  if (AppState.activePage === 'dashboard') {
    initDashboardCharts();
  }

  // BUG FIX: Always reinitialize Lucide icons on any page redraw!
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Restore focus and cursor selection position
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (typeof selectionStart === 'number' && typeof selectionEnd === 'number') {
        el.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

export function toggleSidebar() {
  AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
  renderPage();
}

function renderActiveComponent() {
  switch (AppState.activePage) {
    case 'dashboard':
      return renderDashboardComponent();
    case 'transaction':
      return renderTransactionComponent();
    case 'todo':
      return renderTodoComponent();
    case 'health':
      return renderHealthComponent();
    case 'settings':
      return renderSettingsComponent();
    case 'calendar':
      return renderCalendarComponent();
    default:
      return renderDashboardComponent();
  }
}

// Expose navigation to global window so dynamic HTML templates work natively
window.navigate = navigate;
window.handleLogout = handleLogout;
window.renderPage = renderPage;
window.renderActiveComponent = renderActiveComponent;
window.toggleSidebar = toggleSidebar;

