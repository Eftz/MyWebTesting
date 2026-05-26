// SmartLife SPA Entry Bootstrapper Module
import { AppState, subscribeState } from './js/state.js?v=3';
import { renderPage } from './js/router.js?v=3';

window.addEventListener('DOMContentLoaded', () => {
  AppState.loading = true;
  AppState.init();
  subscribeState(renderPage);
  renderPage();

  setTimeout(() => {
    AppState.loading = false;
    renderPage();
  }, 600); // 600ms sleek initial transition loader
});

window.togglePasswordVisibility = function(id) {
  const input = document.getElementById(id);
  const eyeIcon = document.getElementById(`eye-${id}`);
  if (input && eyeIcon) {
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      eyeIcon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

// ลงทะเบียนระบบหลังบ้านเพื่อให้ Android ยอมเด้ง Notification ระดับ OS
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then((reg) => console.log('SmartLife Service Worker ลงทะเบียนสำเร็จ!', reg))
    .catch((err) => console.error('Service Worker พัง:', err));
}

