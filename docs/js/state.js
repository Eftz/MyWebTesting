// SmartLife SPA State Manager Module
import { AudioEngine } from './audio.js';
import { NotificationEngine } from './notification.js';
import { showToast } from './ui.js';

// Firebase modules loaded dynamically to prevent blocking the UI
let firebaseModules = null;

async function getFirebase() {
  if (!firebaseModules) {
    firebaseModules = await import('./firebase.js');
  }
  return firebaseModules;
}

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
  sidebarCollapsed: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  lastMobileState: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
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
  loading: true,

  // Charts instance references cache
  charts: {},

  init() {
    // Load Firebase in the background - don't block the UI
    this._initFirebase();

    // Set up alert polling ticker (Every 1 second)
    setInterval(() => this.checkTodoAlarms(), 1000);
  },

  async _initFirebase() {
    try {
      const fb = await getFirebase();
      fb.onAuthStateChanged(fb.auth, async (user) => {
        try {
          if (user) {
            const docRef = fb.doc(fb.db, "users", user.uid);
            const docSnap = await fb.getDoc(docRef);

            if (docSnap.exists()) {
              this.currentUser = docSnap.data();
              this.currentUser.email = user.email;
              if (typeof localStorage !== 'undefined' && this.currentUser.username) {
                localStorage.setItem('smart_mapping_' + this.currentUser.username.toLowerCase(), user.email);
              }
              await this.loadUserData();
            } else {
              // Auto-recover missing user document (if signed up before Firestore was ready)
              const emailPrefix = user.email ? user.email.split('@')[0] : 'user';
              const recoveredProfile = {
                uid: user.uid,
                username: emailPrefix,
                name: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
                savingsGoal: 5000,
                waterGoal: 2000,
                exerciseGoal: 30,
                calGoal: 2000,
                burnGoal: 500,
                onboarded: false,
                profileImage: null,
                createdAt: new Date().toISOString()
              };

              await fb.setDoc(docRef, recoveredProfile);
              this.currentUser = recoveredProfile;
              this.currentUser.email = user.email;
              if (typeof localStorage !== 'undefined' && this.currentUser.username) {
                localStorage.setItem('smart_mapping_' + this.currentUser.username.toLowerCase(), user.email);
              }
              await this.loadUserData();
            }
          } else {
            this.currentUser = null;
            this.transactions = [];
            this.todos = [];
          }
        } catch (err) {
          console.error("Error loading user data from Firestore:", err);
          this.currentUser = null;
        } finally {
          this.loading = false;
          notifyStateChange();
        }
      });
    } catch (error) {
      console.error("Firebase init error:", error);
      // Even if Firebase fails, stop loading so the user sees the auth page
      this.loading = false;
      notifyStateChange();
    }
  },

  async loadUserData() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();

    // Load transactions
    const txSnapshot = await fb.getDocs(fb.collection(fb.db, `users/${uid}/transactions`));
    const loadedTx = txSnapshot.docs.map(d => d.data());
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
    const todoSnapshot = await fb.getDocs(fb.collection(fb.db, `users/${uid}/todos`));
    this.todos = todoSnapshot.docs.map(d => d.data());
    this.todos.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Load Health (with auto Daily Reset logic)
    const today = this.getTodayString();
    const healthRef = fb.doc(fb.db, `users/${uid}/health`, today);
    const healthSnap = await fb.getDoc(healthRef);

    if (healthSnap.exists()) {
      this.health = healthSnap.data();
    } else {
      this.health = {
        date: today,
        water: 0,
        exercise: 0,
        cal_consumed: 0,
        cal_burned: 0
      };
      await fb.setDoc(healthRef, this.health);
    }
  },

  async saveTransactions() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();

    const batch = fb.writeBatch(fb.db);
    this.transactions.forEach(tx => {
      const txRef = fb.doc(fb.db, `users/${uid}/transactions`, tx.id);
      batch.set(txRef, tx);
    });
    batch.commit().catch(e => console.error("Error saving TX:", e));
    notifyStateChange();
  },

  async saveTodos() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();

    const batch = fb.writeBatch(fb.db);
    this.todos.forEach(todo => {
      const todoRef = fb.doc(fb.db, `users/${uid}/todos`, todo.id);
      batch.set(todoRef, todo);
    });
    batch.commit().catch(e => console.error("Error saving Todos:", e));
    notifyStateChange();
  },

  async saveHealth() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();
    const today = this.getTodayString();
    const healthRef = fb.doc(fb.db, `users/${uid}/health`, today);

    fb.setDoc(healthRef, this.health).catch(e => console.error("Error saving health:", e));
    notifyStateChange();
  },

  async saveProfile() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();
    const userRef = fb.doc(fb.db, "users", uid);

    fb.setDoc(userRef, this.currentUser).catch(e => console.error("Error saving profile:", e));
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
