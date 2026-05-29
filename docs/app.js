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

window.togglePasswordVisibility = function (id) {
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

// ==========================================
// Firebase Cloud Messaging (FCM) Setup
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js";
import { db, doc, setDoc } from './js/firebase.js';

const firebaseConfig = {
  apiKey: "AIzaSyDcKULD1hSoq1ZigJ1HKZISSO98LZcKhIQ",
  authDomain: "webtumeng.firebaseapp.com",
  projectId: "webtumeng",
  storageBucket: "webtumeng.firebasestorage.app",
  messagingSenderId: "259650513500",
  appId: "1:259650513500:web:653093bf536c2789409499",
  measurementId: "G-69DKY2QRJH"
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then((registration) => {
      console.log('SmartLife Service Worker ลงทะเบียนสำเร็จ!', registration);

      // ถ้ามีการตั้งค่า Firebase แล้ว ให้เปิดใช้งาน Messaging
      if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // ขอ Token ทันที หรืออาจจะไปผูกกับปุ่ม "เปิดการแจ้งเตือน" ก็ได้
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            getToken(messaging, {
              vapidKey: "BHKWaujS0VNU83p2U_nwd5dVz2b0Q4xrTssSMU4qPi9bF7pBBSXfObnit9ecKEW5ebQFSuhhHiRDc2ekR64cyBg",
              serviceWorkerRegistration: registration
            }).then(async (currentToken) => {
              if (currentToken) {
                console.log('FCM Token:', currentToken);
                
                // รอให้ AppState โหลดข้อมูล User ปัจจุบันเสร็จก่อนค่อยเซฟ
                setTimeout(async () => {
                  const email = AppState?.currentUser?.email;
                  if (email) {
                    try {
                      await setDoc(doc(db, 'users', email), {
                        fcmToken: currentToken,
                        lastUpdated: new Date()
                      }, { merge: true });
                      console.log('บันทึก FCM Token ลง Firestore สำเร็จ!');
                    } catch (err) {
                      console.error('ไม่สามารถบันทึก FCM Token ได้:', err);
                    }
                  } else {
                    console.log('ไม่มี Email ล็อกอินข้ามการบันทึก Token (ระบบอาจบันทึกตอน Login แทน)');
                    // หมายเหตุ: อาจต้องเพิ่มโค้ดบันทึก Token อีกทีตอนกด Login ในหน้า auth.js
                  }
                }, 1500); // รอ 1.5 วินาทีให้โหลด State เสร็จ
              } else {
                console.log('No registration token available.');
              }
            }).catch((err) => {
              console.log('An error occurred while retrieving token. ', err);
            });
          }
        });
      }
    })
    .catch((err) => console.error('Service Worker พัง:', err));
}
