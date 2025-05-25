import { showError } from './error-toast';

export async function showDesktopNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      const n = new Notification(title, options);
      setTimeout(() => n.close(), 5000);
    }
  } catch (err) {
    showError(err, 'Notification error');
  }
}
