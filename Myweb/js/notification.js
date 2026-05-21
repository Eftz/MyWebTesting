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
      new Notification(title, {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png'
      });
    }
  }
};
