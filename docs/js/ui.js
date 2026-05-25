// SmartLife SPA Toasts Utility Module

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-900',
    error: 'bg-rose-500/20 border-rose-500/40 text-rose-900',
    info: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-900',
    warning: 'bg-orange-500/20 border-orange-500/40 text-orange-900'
  };

  const toast = document.createElement('div');
  toast.className = `notification-toast flex items-center gap-3 px-4 py-3 rounded-xl border glass-panel shadow-2xl ${colors[type]}`;
  toast.innerHTML = `
    <div class="text-sm font-semibold">${message}</div>
    <button class="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px) scale(0.95)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
