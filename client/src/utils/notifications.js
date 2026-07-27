import { getFileUrl } from "./fileUrl";

export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "default") return;

  Notification.requestPermission();
}

export function showNotification(title, { body, icon, onClick } = {}) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: icon ? getFileUrl(icon) : undefined,
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}
