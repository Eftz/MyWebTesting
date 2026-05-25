// OS-level Web Notifications API Module

export const NotificationEngine = {
  granted: false,

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    this.granted = (permission === 'granted');
  },

  show(title, body) {
    this.requestPermission();
    if (this.granted) {
      // ตรวจสอบว่าเบราว์เซอร์เปิดใช้งาน Service Worker ไหม (สำหรับ Android และคอมพิวเตอร์ยุคใหม่)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
            vibrate: [200, 100, 200] // เพิ่มระบบสั่นบนมือถือให้ด้วยครับ
          });
        });
      } else {
        // เผื่อไว้สำหรับเบราว์เซอร์เก่าๆ ที่ไม่รองรับ Service Worker (ให้เด้งแบบเดิม)
        new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
        });
      }
    }
  }
};