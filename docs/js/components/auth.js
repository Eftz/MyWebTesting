// SmartLife SPA Auth Component Module
import { AppState } from '../state.js';
import { showToast } from '../ui.js';
import { navigate, renderPage } from '../router.js';

export function renderAuth(app) {
  app.className = "flex items-center justify-center min-h-screen bg-[#f2f7f7] p-4";

  // Decide whether to show Sign In or Sign Up (Default is Sign In when undefined/signin)
  const showSignUp = app.dataset.authMode === 'signup';

  app.innerHTML = `
    <div class="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden page-fade-in bg-white">
      <!-- Cyber background decoration -->
      <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-teal-600/5 blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#007a7a]/5 blur-3xl"></div>

      <div class="text-center mb-8 relative">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#005f5f] to-[#007a7a] shadow-xl shadow-[#007a7a]/15 mb-4">
          <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#005f5f] via-[#007a7a] to-[#0d9488] bg-clip-text text-transparent">SmartLife Portal</h2>
        <p class="text-slate-500 text-sm mt-2">${showSignUp ? 'สร้างบัญชีผู้ใช้ใหม่เพื่อเริ่มต้น' : 'กรอกชื่อผู้ใช้เพื่อเข้าใช้กระดานข้อมูล'}</p>
      </div>

      <form id="auth-form" onsubmit="handleAuthSubmit(event, ${showSignUp})" class="space-y-5 relative">
        <div>
          <label class="block text-slate-650 text-xs font-semibold uppercase tracking-wider mb-2">${showSignUp ? 'Username' : 'Email / Username'}</label>
          <div class="relative">
            <i data-lucide="user" class="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5"></i>
            <input type="text" id="auth-username" required class="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm" placeholder="${showSignUp ? 'เช่น somchai_12' : 'เช่น somchai_12 หรือ user@gmail.com'}">
          </div>
        </div>

        ${showSignUp ? `
        <div>
          <label class="block text-slate-650 text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
          <div class="relative flex items-center">
            <i data-lucide="mail" class="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5"></i>
            <input type="text" id="auth-email-prefix" required class="glass-input w-full pl-11 pr-24 py-3 rounded-xl text-sm" placeholder="userconfig">
            <span class="absolute right-3.5 text-slate-500 text-sm font-medium pointer-events-none">@gmail.com</span>
          </div>
        </div>
        ` : ''}

        <div>
          <label class="block text-slate-650 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
          <div class="relative flex items-center">
            <i data-lucide="lock" class="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5"></i>
            <input type="password" id="auth-password" required class="glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm" placeholder="••••••••">
            <button type="button" onclick="togglePasswordVisibility('auth-password')" class="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
              <i id="eye-auth-password" data-lucide="eye" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        ${showSignUp ? `
        <div>
          <label class="block text-slate-650 text-xs font-semibold uppercase tracking-wider mb-2">Confirm Password</label>
          <div class="relative flex items-center">
            <i data-lucide="shield-check" class="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5"></i>
            <input type="password" id="auth-confirm" required class="glass-input w-full pl-11 pr-11 py-3 rounded-xl text-sm" placeholder="••••••••">
            <button type="button" onclick="togglePasswordVisibility('auth-confirm')" class="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none" title="เปิด/ปิดการมองเห็นรหัสผ่าน">
              <i id="eye-auth-confirm" data-lucide="eye" class="w-5 h-5"></i>
            </button>
          </div>
        </div>
        ` : ''}

        <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#005f5f] via-[#007a7a] to-[#0d9488] hover:from-[#004d4d] hover:to-[#007a7a] shadow-lg shadow-[#007a7a]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>${showSignUp ? 'Sign Up' : 'Sign In'}</span>
          <i data-lucide="arrow-right" class="w-5 h-5"></i>
        </button>
      </form>

      <div class="text-center mt-6 text-sm text-slate-500 relative">
        ${showSignUp ? `
          <span>มีบัญชีอยู่แล้ว? </span>
          <button onclick="toggleAuthMode(false)" class="text-[#007a7a] hover:text-[#005f5f] font-bold underline underline-offset-4 cursor-pointer bg-transparent border-none">เข้าสู่ระบบ</button>
        ` : `
          <span>ยังไม่มีบัญชีผู้ใช้? </span>
          <button onclick="toggleAuthMode(true)" class="text-[#007a7a] hover:text-[#005f5f] font-bold underline underline-offset-4 cursor-pointer bg-transparent border-none">สมัครสมาชิกใหม่</button>
        `}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

export function toggleAuthMode(isSignUp) {
  const app = document.getElementById('app');
  if (!app) return;
  app.dataset.authMode = isSignUp ? 'signup' : 'signin';
  renderPage();
}

export async function handleAuthSubmit(event, isSignUp) {
  event.preventDefault();

  const usernameInput = document.getElementById('auth-username').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;

  if (!usernameInput || !password) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  // Dynamically import Firebase logic
  const { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, collection, query, where, getDocs } = await import('../firebase.js');

  if (isSignUp) {
    const emailPrefix = document.getElementById('auth-email-prefix').value.trim().toLowerCase();
    if (!emailPrefix) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    const confirm = document.getElementById('auth-confirm').value;
    if (password !== confirm) {
      showToast('รหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    const email = `${emailPrefix}@gmail.com`;
    const username = usernameInput;

    try {
      showToast('กำลังสร้างบัญชี...', 'info');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Initial user profile
      const newUserProfile = {
        uid: user.uid,
        username: username,
        email: email,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        savingsGoal: 5000,
        waterGoal: 2000,
        exerciseGoal: 30,
        calGoal: 2000,
        burnGoal: 500,
        onboarded: false,
        profileImage: null,
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), newUserProfile);

      // Save local mapping for future logins on this device
      localStorage.setItem('smart_mapping_' + username, email);

      // We don't need to manually navigate here, because state.js will listen to onAuthStateChanged
      // However, we can update AppState just in case
      AppState.currentUser = newUserProfile;
      showToast('สมัครสมาชิกสำเร็จ!');
      navigate('dashboard');
    } catch (error) {
      console.error("SignUp Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        showToast('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
      } else {
        showToast('เกิดข้อผิดพลาดในการสมัครสมาชิก', 'error');
      }
    }
  } else {
    let emailToTry = usernameInput;

    if (!usernameInput.includes('@')) {
      // It's a username or email prefix. 
      // 1. Try local cache first (bypasses Firestore security rules if cached)
      const cachedEmail = localStorage.getItem('smart_mapping_' + usernameInput);

      if (cachedEmail) {
        emailToTry = cachedEmail;
      } else {
        // 2. Query Firestore to find the associated email.
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", usernameInput));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            if (userData.email) {
              emailToTry = userData.email;
              // Cache it for next time
              localStorage.setItem('smart_mapping_' + usernameInput, userData.email);
            }
          }
        } catch (err) {
          console.warn("Could not query username", err);
        }
      }
    }

    try {
      showToast('กำลังเข้าสู่ระบบ...', 'info');
      await signInWithEmailAndPassword(auth, emailToTry, password);
      // Cache successful login mapping
      if (!usernameInput.includes('@')) {
        localStorage.setItem('smart_mapping_' + usernameInput, emailToTry);
      }
      showToast('เข้าสู่ระบบสำเร็จ');
      // Navigation is handled by state.js auth observer, or we can force it:
      navigate('dashboard');
    } catch (error) {
      if (!usernameInput.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, `${usernameInput}@smartlife.app`, password);
          showToast('เข้าสู่ระบบสำเร็จ');
          navigate('dashboard');
          return;
        } catch (e2) {
          console.error("SignIn Fallback Error:", e2);
        }
      }

      console.error("SignIn Error:", error);
      showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  }
}

// Bind to window to allow dynamic HTML template calls
window.toggleAuthMode = toggleAuthMode;
window.handleAuthSubmit = handleAuthSubmit;

