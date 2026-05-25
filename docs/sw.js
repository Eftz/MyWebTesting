// sw.js - Service Worker พื้นฐานสำหรับรองรับ Web Push บน Android
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});