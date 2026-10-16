const APP_ICON = "/brand-mark.svg";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() ?? "You have a new message." };
  }

  const conversationId = payload.conversationId;
  const url = conversationId
    ? `/conversations?conversationId=${encodeURIComponent(conversationId)}`
    : "/conversations";

  event.waitUntil(
    self.registration.showNotification(payload.title || "ChatPlatform", {
      body: payload.body || "You have a new message.",
      icon: APP_ICON,
      badge: APP_ICON,
      tag: conversationId ? `conversation-${conversationId}` : "chat-platform",
      renotify: true,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/conversations", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.navigate(targetUrl);
        return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
