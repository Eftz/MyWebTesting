// SmartLife SPA State Manager Module
import { AudioEngine } from './audio.js';
import { NotificationEngine } from './notification.js';
import { showToast } from './ui.js';
import { auth, db, doc, getDoc, setDoc, collection, getDocs, writeBatch, onAuthStateChanged } from './firebase.js';

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
  loading: true, // Start loading

  // Charts instance references cache
  charts: {},

  init() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          this.currentUser = docSnap.data();
          await this.loadUserData();
        } else {
          // This happens if auth succeeds but profile isn't fully created yet.
          // In auth.js we setDoc before navigating, so it should exist.
          this.currentUser = null;
        }
      } else {
        // User is signed out
        this.currentUser = null;
        this.transactions = [];
        this.todos = [];
      }
      this.loading = false;
      notifyStateChange();
    });

    // Set up alert polling ticker (Every 1 second)
    setInterval(() => this.checkTodoAlarms(), 1000);
  },

  async loadUserData() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;

    // Load transactions
    const txSnapshot = await getDocs(collection(db, `users/${uid}/transactions`));
    const loadedTx = txSnapshot.docs.map(doc => doc.data());
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
    const todoSnapshot = await getDocs(collection(db, `users/${uid}/todos`));
    this.todos = todoSnapshot.docs.map(doc => doc.data());
    // Sort todos by date desc as well (optional, but good for UI consistency)
    this.todos.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Load Health (with auto Daily Reset logic)
    const today = this.getTodayString();
    const healthRef = doc(db, `users/${uid}/health`, today);
    const healthSnap = await getDoc(healthRef);
    
    if (healthSnap.exists()) {
      this.health = healthSnap.data();
    } else {
      // Trigger Daily Reset (create new day doc)
      this.health = {
        date: today,
        water: 0,
        exercise: 0,
        cal_consumed: 0,
        cal_burned: 0
      };
      await setDoc(healthRef, this.health);
    }
  },

  async saveTransactions() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;

    // We'll write the entire current transactions array using a Batch Write to overwrite collection.
    // In production, this might be optimized to only update changed docs, but for this SPA migration,
    // we sync the current state to Firestore.
    // Note: To truly sync, we need to handle deletes properly. Since we manage array in memory,
    // we can rewrite the collection by updating existing and writing new. For deleted, it requires
    // deleting docs not in the array. For simplicity, we write all current. (Or update the delete function)
    // Wait, the better way is to update specific docs in the UI handlers!
    // But to keep the `saveTransactions` API the same, we'll iterate and setDoc for each transaction.
    const batch = writeBatch(db);
    this.transactions.forEach(tx => {
      const txRef = doc(db, `users/${uid}/transactions`, tx.id);
      batch.set(txRef, tx);
    });
    // Fire-and-forget for UI speed
    batch.commit().catch(e => console.error("Error saving TX:", e));
    notifyStateChange();
  },

  async saveTodos() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;

    const batch = writeBatch(db);
    this.todos.forEach(todo => {
      const todoRef = doc(db, `users/${uid}/todos`, todo.id);
      batch.set(todoRef, todo);
    });
    batch.commit().catch(e => console.error("Error saving Todos:", e));
    notifyStateChange();
  },

  async saveHealth() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const today = this.getTodayString();
    const healthRef = doc(db, `users/${uid}/health`, today);
    
    setDoc(healthRef, this.health).catch(e => console.error("Error saving health:", e));
    notifyStateChange();
  },

  async saveProfile() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const userRef = doc(db, "users", uid);
    
    setDoc(userRef, this.currentUser).catch(e => console.error("Error saving profile:", e));
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
