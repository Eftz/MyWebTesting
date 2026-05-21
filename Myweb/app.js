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
