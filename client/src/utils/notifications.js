import { getFileUrl } from "./fileUrl";
import {
  deletePushSubscription,
  getPushPublicKey,
  savePushSubscription,
} from "../api/push.api";

const preferenceKey = (userId) => `chat-platform:desktop-notifications:${userId}`;

export function getNotificationPreference(userId) {
  if (!userId || typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  const saved = window.localStorage.getItem(preferenceKey(userId));
  return saved === "on";
}

export function saveNotificationPreference(userId, enabled) {
  if (!userId || typeof window === "undefined") return;
  window.localStorage.setItem(preferenceKey(userId), enabled ? "on" : "off");
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission !== "default") return Notification.permission;

  return Notification.requestPermission();
}

function decodeApplicationServerKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function enablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("This browser does not support Web Push notifications.");
  }

  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "unsupported"
        ? "This browser does not support notifications."
        : "Allow notifications in your browser settings to turn them on."
    );
  }

  const publicKey = await getPushPublicKey();
  if (!publicKey) {
    throw new Error("Push notifications are not configured on the server yet.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(publicKey),
    });
  }

  await savePushSubscription(subscription.toJSON());
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await deletePushSubscription(subscription.endpoint);
  } catch {
    // The local browser subscription is still removed; a stale server entry
    // will be cleaned up by the push service when it returns 404/410.
  } finally {
    await subscription.unsubscribe();
  }
}

export function showNotification(title, { body, icon, onClick, userId, conversationId } = {}) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!getNotificationPreference(userId)) return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, {
        body,
        icon: icon ? getFileUrl(icon) : "/brand-mark.svg",
        tag: conversationId ? `conversation-${conversationId}` : "chat-platform",
        data: {
          url: conversationId
            ? `/conversations?conversationId=${encodeURIComponent(conversationId)}`
            : "/conversations",
        },
      }))
      .catch(() => {});
    return;
  }

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
