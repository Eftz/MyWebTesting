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
import { renderNetworkComponent } from './components/network.js';
import { renderCalendarComponent } from './components/calendar.js';

export function navigate(page) {
  AppState.loading = true;
  AppState.activePage = page;

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('smart_active_page', page);
  }

  // Reset bulk selection modes when switching pages
  AppState.txEditMode = false;
  AppState.todoEditMode = false;
  AppState.selectedTxIds = [];
  AppState.selectedTodoIds = [];

  // Auto-collapse sidebar on navigation on mobile
  if (window.innerWidth < 768) {
    AppState.sidebarCollapsed = true;
  }

  renderPage();

  setTimeout(() => {
    AppState.loading = false;
    renderPage();
  }, 400); // 400ms premium transition delay
}

export async function handleLogout() {
  const { auth, signOut } = await import('./firebase.js');
  try {
    await signOut(auth);
    // Remove legacy local storage user if exists
    localStorage.removeItem('smart_active_user');
    AppState.currentUser = null;
    AppState.activePage = 'dashboard';
    navigate('dashboard');
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  } catch (error) {
    console.error("Logout Error:", error);
    showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
  }
}

export function renderPage() {
  const app = document.getElementById('app');
  if (!app) return;

  // 0. Transition Loading State (Full Skeleton for Initial Boot)
  if (AppState.loading && !AppState.currentUser) {
    app.className = "min-h-screen flex flex-col md:flex-row bg-[#f2f7f7]";
    app.innerHTML = `
      <!-- Sidebar Skeleton -->
      <aside class="fixed md:sticky top-0 left-0 right-0 md:h-screen z-40 w-full md:w-64 bg-[#007a7a] p-5 flex flex-col shrink-0 border-r border-white/10 hidden md:flex">
        <div class="flex items-center gap-3 mb-10">
          <div class="w-12 h-12 rounded-full bg-white/20 animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-white/20 rounded w-3/4 animate-pulse"></div>
            <div class="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="h-10 bg-white/10 rounded-xl w-full animate-pulse"></div>
          <div class="h-10 bg-white/10 rounded-xl w-full animate-pulse"></div>
          <div class="h-10 bg-white/10 rounded-xl w-full animate-pulse"></div>
          <div class="h-10 bg-white/10 rounded-xl w-full animate-pulse"></div>
        </div>
      </aside>

      <!-- Main Content Skeleton -->
      <main class="flex-1 p-6 md:p-10 flex flex-col min-h-screen">
        ${renderMainContentSkeleton()}
      </main>
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
  const isMobile = window.innerWidth < 768;
  const collapseIcon = isMobile
    ? (AppState.sidebarCollapsed ? 'chevron-down' : 'chevron-up')
    : (AppState.sidebarCollapsed ? 'chevrons-right' : 'chevrons-left');

  const asideClasses = AppState.sidebarCollapsed
    ? "fixed md:sticky top-0 left-0 right-0 md:h-screen z-40 w-full md:w-20 sidebar-panel collapsed p-3.5 md:p-3 flex flex-col md:justify-between shrink-0 transition-all duration-300 h-[68px] max-h-[68px] md:max-h-none md:h-screen overflow-hidden shadow-md md:shadow-none bg-[#007a7a]"
    : "fixed md:sticky top-0 left-0 right-0 md:h-screen z-40 w-full md:w-64 sidebar-panel expanded p-3.5 md:p-5 flex flex-col md:justify-between shrink-0 transition-all duration-300 h-auto max-h-[85vh] md:max-h-none md:h-screen overflow-y-auto md:overflow-visible shadow-xl md:shadow-none bg-[#007a7a]";

  const hideTextClass = AppState.sidebarCollapsed ? "block md:hidden" : "";
  const centerIconClass = AppState.sidebarCollapsed ? "md:justify-center" : "";
  const gapClass = AppState.sidebarCollapsed ? "md:gap-0" : "gap-3";

  // Note: We use "flex" instead of "hidden md:flex" on mobile collapsed, so that the options are always rendered
  // in the DOM and can transition/slide up smoothly via the parent container's max-height transition.
  const navCollapseClass = AppState.sidebarCollapsed
    ? "flex flex-col justify-between flex-1 md:w-auto"
    : "flex flex-col justify-between md:flex-1";

  const profileHeaderClass = AppState.sidebarCollapsed
    ? "flex flex-row items-center justify-between md:flex-col md:items-center md:justify-center pb-0 md:pb-6 mb-0 md:mb-6 border-none md:border-b border-white/10 gap-3 w-full flex-nowrap"
    : "flex flex-row items-center justify-between pb-4 md:pb-6 mb-4 md:mb-6 border-b border-white/10 gap-3 w-full flex-nowrap";

  let aside = document.getElementById('app-sidebar');
  let main = document.getElementById('app-main');

  if (!aside || !main) {
    app.className = "min-h-screen flex flex-col md:flex-row bg-[#f2f7f7]";
    app.innerHTML = `
      <!-- Sidebar navigation -->
      <aside id="app-sidebar" class="${asideClasses}"></aside>

      <!-- Main Content Container with Premium transitions -->
      <main id="app-main" class="flex-1 p-6 md:p-10 flex flex-col mt-[68px] md:mt-0" style="animation: pageFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;" onanimationend="this.style.animation='none'">
        <!-- Toggle button top bar breadcrumb -->
        <div id="app-breadcrumb" class="flex items-center gap-4 mb-6"></div>
        
        <div id="app-content" class="flex-1"></div>
      </main>
    `;
    aside = document.getElementById('app-sidebar');
    main = document.getElementById('app-main');

    // First render sidebar
    renderSidebarContent(aside, collapseIcon, hideTextClass, centerIconClass, gapClass, profileHeaderClass);
  } else {
    // Update aside classes if changed
    if (aside.className !== asideClasses) {
      aside.className = asideClasses;
    }

    // Update sidebar state dynamically in-place
    updateSidebarDynamicStates(aside, collapseIcon, hideTextClass, centerIconClass, gapClass, profileHeaderClass);
  }

  // Update breadcrumb
  const breadcrumb = document.getElementById('app-breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <button onclick="toggleSidebar()" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-50 md:flex hidden" title="${AppState.sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}">
        <i data-lucide="${AppState.sidebarCollapsed ? 'menu' : 'menu-fold'}" class="w-5.5 h-5.5"></i>
      </button>
      <div class="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-wider uppercase select-none">
        <span>SmartLife</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        <span class="text-[#007a7a]">${AppState.activePage}</span>
      </div>
    `;
  }

  // Update main content area
  const content = document.getElementById('app-content');
  if (content) {
    content.innerHTML = renderActiveComponent();
  }

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
  if (AppState.loading) {
    return renderMainContentSkeleton();
  }

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
    case 'network':
      return renderNetworkComponent();
    case 'calendar':
      return renderCalendarComponent();
    default:
      return renderDashboardComponent();
  }
}

function renderMainContentSkeleton() {
  const page = AppState.activePage;

  if (page === 'calendar') {
    return `
      <!-- Calendar Skeleton -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <div class="h-8 w-40 bg-slate-200 rounded animate-pulse mb-2"></div>
          <div class="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div class="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <div class="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
          <div class="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="flex-[3] flex flex-col gap-6">
          <div class="h-[88px] bg-white rounded-3xl shadow-sm border border-slate-100 animate-pulse"></div>
          <div class="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden mt-3">
            ${Array.from({ length: 35 }).map(() => `<div class="h-24 bg-white animate-pulse"></div>`).join('')}
          </div>
        </div>
        <div class="flex-1 w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
          <div class="h-[500px] bg-white rounded-3xl shadow-sm border border-slate-100 animate-pulse"></div>
        </div>
      </div>
    `;
  }

  if (page === 'transaction') {
    return `
      <!-- Transaction Skeleton -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div class="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
          <div class="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div class="glass-panel p-6 rounded-2xl border border-slate-200 w-full bg-white shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <div class="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div class="h-9 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div class="h-8 w-full bg-slate-100 rounded mb-3 animate-pulse"></div>
        ${Array.from({ length: 5 }).map(() => `<div class="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl mb-2 animate-pulse"></div>`).join('')}
      </div>
    `;
  }

  if (page === 'todo') {
    return `
      <!-- Todo Skeleton -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div class="h-10 w-80 bg-slate-200 rounded animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
          <div class="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div class="h-16 w-full bg-white border border-slate-200 rounded-xl shadow-sm mb-6 animate-pulse"></div>
      <div class="glass-panel p-6 rounded-2xl border border-slate-200 w-full bg-white shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <div class="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div class="h-9 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <div class="h-6 w-32 bg-slate-200 rounded mb-3 animate-pulse"></div>
            ${Array.from({ length: 3 }).map(() => `<div class="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl animate-pulse"></div>`).join('')}
          </div>
          <div class="space-y-2">
            <div class="h-6 w-32 bg-slate-200 rounded mb-3 animate-pulse"></div>
            ${Array.from({ length: 5 }).map(() => `<div class="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl animate-pulse"></div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (page === 'health') {
    return `
      <!-- Health Skeleton -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div class="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="h-[450px] bg-white rounded-3xl shadow-sm border border-slate-200 animate-pulse"></div>
        <div class="h-[450px] bg-white rounded-3xl shadow-sm border border-slate-200 animate-pulse"></div>
        <div class="h-[450px] bg-white rounded-3xl shadow-sm border border-slate-200 animate-pulse"></div>
      </div>
    `;
  }

  if (page === 'network') {
    return `
      <!-- Network Skeleton -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div class="h-10 w-80 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="h-[300px] bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse"></div>
        <div class="h-[300px] bg-white rounded-2xl shadow-sm border border-slate-200 animate-pulse"></div>
      </div>
    `;
  }

  // Default Dashboard & others Skeleton
  return `
    <!-- Dashboard Skeleton -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
      <div>
        <div class="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2"></div>
        <div class="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div class="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="h-28 rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
      <div class="h-28 rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
      <div class="h-28 rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
      <div class="h-28 rounded-2xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
    </div>
    
    <!-- Analysis Banner -->
    <div class="h-[60px] bg-white rounded-t-2xl shadow-sm border border-slate-100 animate-pulse mb-1"></div>

    <!-- Charts -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="h-[300px] rounded-3xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
      <div class="h-[300px] rounded-3xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
      <div class="h-[300px] rounded-3xl bg-white shadow-sm border border-slate-100 animate-pulse"></div>
    </div>
  `;
}

// Expose navigation to global window so dynamic HTML templates work natively
window.navigate = navigate;
window.handleLogout = handleLogout;
window.renderPage = renderPage;
window.renderActiveComponent = renderActiveComponent;
window.toggleSidebar = toggleSidebar;

// Auto-collapse mobile navbar on scroll down
if (typeof window !== 'undefined') {
  let lastScrollTop = 0;
  window.addEventListener('scroll', (event) => {
    if (window.innerWidth < 768) {
      const target = event.target;

      // Prevent collapsing if the user is actively scrolling inside the navbar itself
      if (target && target.closest && target.closest('.sidebar-panel')) {
        return;
      }

      const scrollTop = target === window || target === document ? window.scrollY : (target.scrollTop || 0);

      // If scrolling down beyond a threshold, collapse the navbar options
      if (scrollTop > lastScrollTop && scrollTop > 20) {
        if (!AppState.sidebarCollapsed) {
          AppState.sidebarCollapsed = true;
          renderPage();
        }
      }
      lastScrollTop = scrollTop;
    }
  }, { capture: true, passive: true });

  window.addEventListener('resize', () => {
    // Re-render when crossing mobile/desktop screen size breakpoint
    const isMobileNow = window.innerWidth < 768;
    if (AppState.lastMobileState !== isMobileNow) {
      AppState.lastMobileState = isMobileNow;
      AppState.sidebarCollapsed = isMobileNow;
      renderPage();
    }
  }, { passive: true });
}

function renderSidebarContent(aside, collapseIcon, hideTextClass, centerIconClass, gapClass, profileHeaderClass) {
  aside.innerHTML = `
    <div class="flex flex-col md:justify-between h-auto md:h-full w-full">
      <div>
        <!-- Profile Header -->
        <div class="${profileHeaderClass}">
          <div onclick="navigate('settings')" class="profile-header-link flex items-center flex-nowrap gap-3 min-w-0 cursor-pointer rounded-xl px-2 py-1.5 -mx-2 transition-all hover:bg-white/10 border border-transparent ${AppState.activePage === 'settings' ? 'bg-white/20 shadow-md !border-white/30' : ''}" title="ตั้งค่าโปรไฟล์">
            ${AppState.currentUser.profileImage ? `
              <img src="${AppState.currentUser.profileImage}" referrerpolicy="no-referrer" crossorigin="anonymous" class="w-10 h-10 rounded-full object-cover border border-white/20 shadow-lg shrink-0 transition-transform group-hover:scale-105">
            ` : `
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-[#f2994a] flex items-center justify-center font-bold text-lg shadow-lg text-white shrink-0 transition-transform group-hover:scale-105">
                ${AppState.currentUser.name.charAt(0).toUpperCase()}
              </div>
            `}
            <div class="${hideTextClass} min-w-0">
              <h4 class="font-bold text-white truncate max-w-[110px]">${AppState.currentUser.name}</h4>
              <p class="text-xs text-teal-200 text-ellipsis truncate max-w-[110px]">@${AppState.currentUser.username}</p>
            </div>
          </div>
          <button onclick="toggleSidebar()" class="p-1.5 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer shrink-0" title="${AppState.sidebarCollapsed ? 'ขยายเมนู' : 'ยุบเมนู'}">
            <i data-lucide="${collapseIcon}" class="w-4 h-4"></i>
          </button>
          <button onclick="handleLogout()" class="logout-btn-landscape p-1.5 rounded-lg bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all items-center justify-center cursor-pointer shrink-0" title="ออกจากระบบ">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="h-px bg-white/10 my-3 block md:hidden sidebar-divider"></div>

        <div class="flex flex-col justify-between flex-1 md:w-auto">
          <!-- Sidebar Navigation Menu -->
          <nav class="space-y-2 mt-4 md:mt-0">
            <button onclick="navigate('dashboard')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'dashboard' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Dashboard">
              <i data-lucide="layout-dashboard" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Dashboard</span>
            </button>
            
            <button onclick="navigate('transaction')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'transaction' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Transaction">
              <i data-lucide="wallet" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Transaction</span>
            </button>
            
            <button onclick="navigate('todo')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'todo' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Do the < list >">
              <i data-lucide="check-square" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Do the &lt; list &gt;</span>
            </button>
            
            <button onclick="navigate('health')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'health' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Healthy Basement">
              <i data-lucide="heart" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Healthy Basement</span>
            </button>
            
            <button onclick="navigate('network')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'network' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Friends & Family">
              <i data-lucide="users" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Friends & Family</span>
            </button>
            
            <button onclick="navigate('calendar')" class="sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${AppState.activePage === 'calendar' ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}" title="Calendar">
              <i data-lucide="calendar" class="w-5 h-5 shrink-0"></i>
              <span class="${hideTextClass}">Calendar</span>
            </button>
            
            <!-- Mini water progress for Mobile Landscape only -->
            <div onclick="navigate('health')" class="mobile-landscape-water items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-sky-200/60 bg-sky-50/50 cursor-pointer shadow-sm hover:bg-sky-100/50 transition-colors" title="เป้าหมายดื่มน้ำวันนี้">
              <i data-lucide="droplet" class="w-4 h-4 text-sky-500"></i>
              <div class="flex flex-col items-start leading-none">
                <span class="text-[9px] font-extrabold text-sky-700">${AppState.health.water}/${AppState.currentUser.waterGoal}</span>
                <div class="w-full bg-sky-200 rounded-full h-0.5 mt-0.5 overflow-hidden">
                  <div class="bg-sky-500 h-full" style="width: ${Math.min(100, (AppState.health.water / AppState.currentUser.waterGoal) * 100)}%"></div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <div class="flex flex-col justify-between md:flex-1 mt-auto">
        <!-- Quick targets visual summary inside sidebar -->
        <div class="mt-8 space-y-3 water-summary-container transition-opacity duration-300 ${AppState.sidebarCollapsed ? 'md:hidden' : ''}">
          <div class="bg-white/10 border border-white/20 rounded-xl p-3 text-xs">
            <div class="flex justify-between text-teal-100 font-semibold mb-1">
              <span>ดื่มน้ำวันนี้</span>
              <span class="water-progress-text">${AppState.health.water}/${AppState.currentUser.waterGoal} ml</span>
            </div>
            <div class="w-full bg-[#004242] rounded-full h-1.5 overflow-hidden">
              <div class="bg-white h-full transition-all duration-500 water-progress-bar" style="width: ${Math.min(100, (AppState.health.water / AppState.currentUser.waterGoal) * 100)}%"></div>
            </div>
          </div>
        </div>
        
        <button onclick="handleLogout()" class="logout-btn-default w-full flex items-center ${gapClass} px-4 py-3 rounded-xl text-sm font-medium text-rose-250 hover:bg-white/10 transition-all ${centerIconClass}" title="Log Out">
          <i data-lucide="log-out" class="w-5 h-5 shrink-0"></i>
          <span class="${hideTextClass}">Log Out</span>
        </button>
      </div>
    </div>
  `;
}

function updateSidebarDynamicStates(aside, collapseIcon, hideTextClass, centerIconClass, gapClass, profileHeaderClass) {
  // 1. Update collapse button icon (using innerHTML to allow fresh conversion by Lucide)
  const toggleBtn = aside.querySelector('button[onclick="toggleSidebar()"]');
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i data-lucide="${collapseIcon}" class="w-4 h-4"></i>`;
  }

  // 2. Update profile header classes
  const profileHeader = aside.querySelector('.profile-header-link')?.parentElement;
  if (profileHeader && profileHeader.className !== profileHeaderClass) {
    profileHeader.className = profileHeaderClass;
  }

  // 3. Update visibility of text spans and profile highlight
  const profileLink = aside.querySelector('.profile-header-link');
  if (profileLink) {
    if (!profileLink.classList.contains('flex-nowrap')) {
      profileLink.classList.add('flex-nowrap');
    }

    // Toggle active state for profile link
    if (AppState.activePage === 'settings') {
      profileLink.classList.add('bg-white/20', 'shadow-md', '!border-white/30');
    } else {
      profileLink.classList.remove('bg-white/20', 'shadow-md', '!border-white/30');
    }
  }

  const profileDetails = aside.querySelector('.profile-header-link > div:last-child');
  if (profileDetails) {
    profileDetails.className = `${hideTextClass} min-w-0`;
  }
  const navSpans = aside.querySelectorAll('nav button span');
  navSpans.forEach(span => {
    span.className = hideTextClass;
  });

  // 4. Update sidebar-links active highlights, gap class, centerIconClass
  const links = aside.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    const onclickAttr = link.getAttribute('onclick');
    if (!onclickAttr) return;
    const match = onclickAttr.match(/'([^']+)'/);
    if (!match) return;
    const page = match[1];

    // Update active highlight
    if (page === AppState.activePage) {
      link.classList.add('bg-white/20', 'shadow-md', 'border-white/30', 'text-white');
      link.classList.remove('border-transparent', 'text-teal-100', 'hover:bg-white/10');
    } else {
      link.classList.remove('bg-white/20', 'shadow-md', 'border-white/30', 'text-white');
      link.classList.add('border-transparent', 'text-teal-100', 'hover:bg-white/10');
    }

    // Update gap and alignment classes without destroying the dynamic Tailwind classes
    link.className = `sidebar-link w-full flex items-center ${gapClass} px-4 py-3 rounded-xl border text-sm font-medium transition-all ${page === AppState.activePage ? 'bg-white/20 shadow-md border-white/30 text-white' : 'border-transparent text-teal-100 hover:bg-white/10'} ${centerIconClass}`;
  });

  // 5. Update water summary container visibility on desktop
  const waterContainer = aside.querySelector('.water-summary-container');
  if (waterContainer) {
    if (AppState.sidebarCollapsed) {
      waterContainer.classList.add('md:hidden');
    } else {
      waterContainer.classList.remove('md:hidden');
    }
  }

  // 5. Update logout button classes
  const logoutBtn = aside.querySelector('.logout-btn-default');
  if (logoutBtn) {
    logoutBtn.className = `logout-btn-default w-full flex items-center ${gapClass} px-4 py-3 rounded-xl text-sm font-medium text-rose-250 hover:bg-white/10 transition-all ${centerIconClass}`;
    const logoutSpan = logoutBtn.querySelector('span');
    if (logoutSpan) {
      logoutSpan.className = hideTextClass;
    }
  }

  // 6. Update water progress
  const waterProgress = aside.querySelector('.water-progress-bar');
  const waterText = aside.querySelector('.water-progress-text');
  if (waterProgress && waterText) {
    waterText.innerText = `${AppState.health.water}/${AppState.currentUser.waterGoal} ml`;
    waterProgress.style.width = `${Math.min(100, (AppState.health.water / AppState.currentUser.waterGoal) * 100)}%`;
  }

  // 7. Update profile image and name
  const profileName = aside.querySelector('.profile-header-link h4');
  const profileUser = aside.querySelector('.profile-header-link p');
  if (profileName) profileName.innerText = AppState.currentUser.name;
  if (profileUser) profileUser.innerText = `@${AppState.currentUser.username}`;

  // Handle profile image update
  const profileImgContainer = aside.querySelector('.profile-header-link');
  if (profileImgContainer) {
    let imgEl = profileImgContainer.querySelector('img');
    let initialsEl = profileImgContainer.querySelector('.rounded-full.bg-gradient-to-tr');

    if (AppState.currentUser.profileImage) {
      if (initialsEl) initialsEl.remove();
      if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.className = "w-10 h-10 rounded-full object-cover border border-white/20 shadow-lg shrink-0 transition-transform group-hover:scale-105";
        imgEl.referrerPolicy = 'no-referrer';
        imgEl.crossOrigin = 'anonymous';
        profileImgContainer.prepend(imgEl);
      }
      imgEl.src = AppState.currentUser.profileImage;
    } else {
      if (imgEl) imgEl.remove();
      if (!initialsEl) {
        initialsEl = document.createElement('div');
        initialsEl.className = "w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-[#f2994a] flex items-center justify-center font-bold text-lg shadow-lg text-white shrink-0 transition-transform group-hover:scale-105";
        profileImgContainer.prepend(initialsEl);
      }
      initialsEl.innerText = AppState.currentUser.name.charAt(0).toUpperCase();
    }
  }

  // Reinitialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
