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

  async show(title, body) {
    await this.requestPermission();

    if (this.granted) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
            vibrate: [200, 100, 200, 100, 200], // สั่นยาวขึ้นเพื่อให้ระบบตื่นตัว

            // 🔥 เพิ่ม 3 บรรทัดนี้เพื่อดันให้ข้อความเด้ง Popup บน Android
            tag: 'smartlife-alarm', // แยกหมวดหมู่ไม่ให้ส่งซ้ำซ้อน
            renotify: true,         // บังคับให้สั่นและเด้งเตือนใหม่ทุกครั้งแม้ tag เดิม
            requireInteraction: true // บังคับให้แถบค้างอยู่บนจอจนกว่าผู้ใช้จะปัดออก
          });
        });
      } else {
        new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
        });
      }
    } else {
      console.warn('Cannot show notification because permission was denied.');
    }
  }
};