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