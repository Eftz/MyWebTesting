// sw.js - Service Worker พื้นฐานสำหรับรองรับ Web Push บน Android
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// sw.js (เพิ่มโค้ดชุดนี้ต่อท้ายของเดิม)

// ดักจับเหตุการณ์เมื่อผู้ใช้ "คลิก" ที่ตัวกล่องแจ้งเตือนบนมือถือ
self.addEventListener('notificationclick', (event) => {
  // สั่งให้ปิดกล่องแจ้งเตือนทันทีเมื่อถูกคลิก
  event.notification.close();

  // ดึง URL หน้าเว็บของคุณ (ระบบจะดึงจาก Origin ของ GitHub Pages ให้เองอัตโนมัติ)
  const targetUrl = self.location.origin + self.location.pathname.replace('sw.js', '');

  // สั่งให้ Android เปิดเบราว์เซอร์วิ่งเข้าเว็บของคุณ
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // ถ้าหน้าเว็บเปิดค้างไว้อยู่แล้ว ให้โฟกัส (Focus) สลับไปที่หน้านั้นทันที
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // ถ้ายังไม่ได้เปิดเว็บ ให้สั่งเปิดแท็บใหม่ขึ้นมาเลย
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ==========================================
// Firebase Cloud Messaging (FCM) Background
// ==========================================
// นำเข้า Firebase SDK สำหรับ Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDcKULD1hSoq1ZigJ1HKZISSO98LZcKhIQ",
  authDomain: "webtumeng.firebaseapp.com",
  projectId: "webtumeng",
  storageBucket: "webtumeng.firebasestorage.app",
  messagingSenderId: "259650513500",
  appId: "1:259650513500:web:653093bf536c2789409499",
  measurementId: "G-69DKY2QRJH"
};

// เริ่มต้นใช้งาน Firebase ใน Background ถ้ามี config
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] ได้รับข้อความขณะเว็บปิดอยู่ ', payload);
    // สร้างแจ้งเตือนจากข้อมูลที่ได้รับ
    const notificationTitle = payload.notification?.title || 'แจ้งเตือนใหม่ (SmartLife)';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.image || 'https://cdn-icons-png.flaticon.com/512/10003/10003295.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}