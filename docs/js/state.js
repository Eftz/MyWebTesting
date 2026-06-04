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

  // Network / Family features
  friends: [],
  friendRequests: [],
  familyTodos: [],
  calendarMode: 'personal', // 'personal' or 'family'

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
            this.friends = [];
            this.friendRequests = [];
            this.familyTodos = [];
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

    await this.loadNetwork();
  },

  async loadNetwork() {
    if (!this.currentUser) return;
    const uid = this.currentUser.uid;
    const fb = await getFirebase();

    try {
      // Load friends
      const friendsSnap = await fb.getDocs(fb.collection(fb.db, `users/${uid}/friends`));
      this.friends = friendsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Listen for friend requests in real-time
      if (this._unsubscribeRequests) this._unsubscribeRequests();
      
      const requestsQuery = fb.query(
        fb.collection(fb.db, 'friendRequests'),
        fb.where('toUid', '==', uid),
        fb.where('status', '==', 'pending')
      );
      
      this._unsubscribeRequests = fb.onSnapshot(requestsQuery, (snap) => {
        this.friendRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notifyStateChange();
        
        // Show notification for new requests
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Optional: Import and show toast or system notification
            import('./ui.js').then(ui => ui.showToast(`คุณมีคำเชิญเป็นเพื่อนใหม่จาก @${data.fromUsername}`));
            import('./audio.js').then(audio => audio.AudioEngine.playChime());
          }
        });
      });

      await this.loadFamilyTodos();
    } catch (e) {
      console.error("Error loading network data:", e);
    }
  },

  async loadFamilyTodos() {
    if (!this.currentUser) return;
    const fb = await getFirebase();
    this.familyTodos = [];

    // Filter only those marked as 'family'
    const familyMembers = this.friends.filter(f => f.role === 'family');

    for (const member of familyMembers) {
      try {
        const todoSnap = await fb.getDocs(fb.collection(fb.db, `users/${member.id}/todos`));
        const todos = todoSnap.docs.map(d => {
          const data = d.data();
          // Inject family member metadata so UI knows whose it is
          data.familyMemberId = member.id;
          data.familyMemberName = member.username || member.name;
          data.isFamilyTodo = true;
          return data;
        });
        this.familyTodos.push(...todos);
      } catch (e) {
        console.error("Error loading todos for family member", member.id, e);
      }
    }

    this.familyTodos.sort((a, b) => new Date(b.date) - new Date(a.date));
    notifyStateChange();
  },

  async sendFriendRequest(targetUsername) {
    if (!this.currentUser) return;
    if (targetUsername.toLowerCase() === this.currentUser.username.toLowerCase()) {
      showToast('ไม่สามารถส่งคำเชิญให้ตัวเองได้', 'warning');
      return false;
    }

    const fb = await getFirebase();
    try {
      // Find user by username
      const usersQuery = fb.query(fb.collection(fb.db, 'users'), fb.where('username', '==', targetUsername.toLowerCase()));
      const userSnap = await fb.getDocs(usersQuery);

      if (userSnap.empty) {
        showToast('ไม่พบบัญชีผู้ใช้นี้', 'error');
        return false;
      }

      const targetUser = userSnap.docs[0].data();
      const targetUid = targetUser.uid;

      // Check if already friends
      if (this.friends.find(f => f.id === targetUid)) {
        showToast('ผู้ใช้นี้เป็นเพื่อนของคุณอยู่แล้ว', 'warning');
        return false;
      }

      // Create request doc
      const requestId = `${this.currentUser.uid}_${targetUid}`;
      const reqRef = fb.doc(fb.db, 'friendRequests', requestId);
      await fb.setDoc(reqRef, {
        fromUid: this.currentUser.uid,
        fromUsername: this.currentUser.username,
        toUid: targetUid,
        toUsername: targetUser.username,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      showToast('ส่งคำเชิญเรียบร้อยแล้ว!', 'success');
      return true;
    } catch (e) {
      console.error("Error sending request:", e);
      showToast('เกิดข้อผิดพลาดในการส่งคำเชิญ', 'error');
      return false;
    }
  },

  async acceptFriendRequest(requestId, friendUid, friendUsername) {
    if (!this.currentUser) return;
    const fb = await getFirebase();
    const uid = this.currentUser.uid;

    try {
      // Update request status
      const reqRef = fb.doc(fb.db, 'friendRequests', requestId);
      await fb.updateDoc(reqRef, { status: 'accepted' });

      // Add to my friends (default role: friend)
      const myFriendRef = fb.doc(fb.db, `users/${uid}/friends`, friendUid);
      await fb.setDoc(myFriendRef, {
        uid: friendUid,
        username: friendUsername,
        role: 'friend',
        timestamp: new Date().toISOString()
      });

      // Add me to their friends
      const theirFriendRef = fb.doc(fb.db, `users/${friendUid}/friends`, uid);
      await fb.setDoc(theirFriendRef, {
        uid: uid,
        username: this.currentUser.username,
        role: 'friend',
        timestamp: new Date().toISOString()
      });

      showToast('ยอมรับคำเชิญเป็นเพื่อนแล้ว!', 'success');
      await this.loadNetwork();
      return true;
    } catch (e) {
      console.error("Error accepting request:", e);
      return false;
    }
  },

  async rejectFriendRequest(requestId) {
    const fb = await getFirebase();
    try {
      const reqRef = fb.doc(fb.db, 'friendRequests', requestId);
      await fb.updateDoc(reqRef, { status: 'rejected' });
      showToast('ปฏิเสธคำเชิญแล้ว');
      await this.loadNetwork();
      return true;
    } catch (e) {
      console.error("Error rejecting request:", e);
      return false;
    }
  },

  async updateFriendRole(friendUid, newRole) {
    if (!this.currentUser) return;
    const fb = await getFirebase();
    try {
      const myFriendRef = fb.doc(fb.db, `users/${this.currentUser.uid}/friends`, friendUid);
      await fb.updateDoc(myFriendRef, { role: newRole });

      showToast(newRole === 'family' ? 'ตั้งค่าให้เป็นครอบครัวแล้ว' : 'เปลี่ยนสถานะเป็นเพื่อนปกติแล้ว', 'success');
      await this.loadNetwork();
    } catch (e) {
      console.error("Error updating role:", e);
    }
  },

  async removeFriend(friendUid) {
    if (!this.currentUser) return;
    const fb = await getFirebase();
    const myUid = this.currentUser.uid;
    
    try {
      // Delete from my friends list
      const myFriendRef = fb.doc(fb.db, `users/${myUid}/friends`, friendUid);
      await fb.deleteDoc(myFriendRef);

      // Delete me from their friends list
      const theirFriendRef = fb.doc(fb.db, `users/${friendUid}/friends`, myUid);
      await fb.deleteDoc(theirFriendRef);
      
      showToast('ลบเพื่อนสำเร็จแล้ว', 'info');
      
      // Reload network state to update UI
      await this.loadNetwork();
      return true;
    } catch (e) {
      console.error("Error removing friend:", e);
      showToast('เกิดข้อผิดพลาดในการลบเพื่อน', 'error');
      return false;
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
