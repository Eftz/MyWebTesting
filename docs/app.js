// SmartLife SPA Entry Bootstrapper Module
import { AppState, subscribeState } from './js/state.js';
import { renderPage } from './js/router.js';

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

