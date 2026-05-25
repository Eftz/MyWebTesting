// SmartLife SPA State Manager Module
import { AudioEngine } from './audio.js';
import { NotificationEngine } from './notification.js';
import { showToast } from './ui.js';

const stateListeners = [];

export function subscribeState(listener) {
  stateListeners.push(listener);
}

export function notifyStateChange() {
  stateListeners.forEach(listener => listener());
}

export const AppState = {
  currentUser: null,
  activePage: 'dashboard',
  sidebarCollapsed: false,
  transactions: [],
  todos: [],
  health: {
    date: '',
    water: 0,
    exercise: 0,
    cal_consumed: 0,
    cal_burned: 0
  },
  
  // Bulk selection modes (Shopee Bucket)
  txEditMode: false,
  todoEditMode: false,
  selectedTxIds: [],
  selectedTodoIds: [],
  
  // Modal states for popup forms
  txModalOpen: false,
  todoModalOpen: false,
  
  // Transition loading state
  loading: false,
  
  // Charts instance references cache
  charts: {},

  init() {
    const active = localStorage.getItem('smart_active_user');
    if (active) {
      this.currentUser = JSON.parse(localStorage.getItem(`smart_profile_${active}`));
      if (this.currentUser) {
        this.loadUserData();
      }
    }
    
    // Set up alert polling ticker (Every 1 second)
    setInterval(() => this.checkTodoAlarms(), 1000);
  },

  loadUserData() {
    const username = this.currentUser.username;
    
    // Load transactions and sort by date descending
    const rawTx = localStorage.getItem(`smart_tx_${username}`);
    const loadedTx = rawTx ? JSON.parse(rawTx) : [];
    loadedTx.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }
      return b.id.localeCompare(a.id);
    });
    this.transactions = loadedTx;
    
    // Load Todos
    const rawTodos = localStorage.getItem(`smart_plans_${username}`);
    this.todos = rawTodos ? JSON.parse(rawTodos) : [];
    
    // Load Health (with auto Daily Reset logic)
    const today = this.getTodayString();
    const rawHealth = localStorage.getItem(`smart_daily_health_${username}`);
    let healthData = rawHealth ? JSON.parse(rawHealth) : null;
    
    if (!healthData || healthData.date !== today) {
      // Trigger Daily Reset
      healthData = {
        date: today,
        water: 0,
        exercise: 0,
        cal_consumed: 0,
        cal_burned: 0
      };
      localStorage.setItem(`smart_daily_health_${username}`, JSON.stringify(healthData));
    }
    this.health = healthData;
  },

  saveTransactions() {
    if (!this.currentUser) return;
    
    // Ensure sorted before saving
    this.transactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }
      return b.id.localeCompare(a.id);
    });

    localStorage.setItem(`smart_tx_${this.currentUser.username}`, JSON.stringify(this.transactions));
    notifyStateChange();
  },

  saveTodos() {
    if (!this.currentUser) return;
    localStorage.setItem(`smart_plans_${this.currentUser.username}`, JSON.stringify(this.todos));
    notifyStateChange();
  },

  saveHealth() {
    if (!this.currentUser) return;
    localStorage.setItem(`smart_daily_health_${this.currentUser.username}`, JSON.stringify(this.health));
    notifyStateChange();
  },

  saveProfile() {
    if (!this.currentUser) return;
    localStorage.setItem(`smart_profile_${this.currentUser.username}`, JSON.stringify(this.currentUser));
    
    // Update user in catalog
    const users = JSON.parse(localStorage.getItem('smart_users') || '[]');
    const index = users.findIndex(u => u.username === this.currentUser.username);
    if (index !== -1) {
      users[index] = this.currentUser;
      localStorage.setItem('smart_users', JSON.stringify(users));
    }
    notifyStateChange();
  },

  getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  checkTodoAlarms() {
    if (!this.currentUser) return;
    
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = this.getTodayString();
    
    let changed = false;
    this.todos.forEach(todo => {
      if (!todo.completed && !todo.notified && todo.alertTime) {
        if (todo.alertTime === currentTimeStr && todo.date === todayStr) {
          todo.notified = true;
          changed = true;
          
          try {
            // Trigger Web Notification
            NotificationEngine.show(
              `🔔 แจ้งเตือนภารกิจ: ${todo.task}`,
              `ถึงเวลาบันทึกกิจกรรมในแผนของคุณแล้ว (${todo.alertTime} น.)`
            );
          } catch (e) {
            console.error("OS Notification error:", e);
          }
          
          try {
            // Trigger Sound chime
            AudioEngine.playChime();
          } catch (e) {
            console.error("Audio synthesiser error:", e);
          }
          
          // Display toast
          showToast(`🔔 ${todo.task} (${todo.alertTime} น.)`, 'info');
        }
      }
    });

    if (changed) {
      this.saveTodos();
    }
  }
};
