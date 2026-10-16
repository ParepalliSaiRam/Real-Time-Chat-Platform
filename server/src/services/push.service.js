import webpush from "web-push";
import prisma from "../config/prisma.js";
import onlineUsers from "../sockets/presence.store.js";

let vapidConfigured = false;
let missingVapidWarningLogged = false;

function configureVapid() {
  if (vapidConfigured) return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    if (!missingVapidWarningLogged) {
      console.warn("Web Push is disabled: configure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
      missingVapidWarningLogged = true;
    }
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@real-time-chat-platform-app.vercel.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
  return true;
}

export function getPushPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function savePushSubscription(userId, subscription) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
    },
  });
}

export async function deletePushSubscription(userId, endpoint) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export async function notifyConversationPush(conversationId, senderId, message) {
  if (!configureVapid()) return;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        isGroup: true,
        name: true,
        participants: {
          where: { removedAt: null },
          select: { userId: true },
        },
      },
    });
    if (!conversation) return;

    const recipientIds = conversation.participants
      .map(({ userId }) => userId)
      .filter((userId) => userId !== senderId && !onlineUsers.has(userId));
    if (!recipientIds.length) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: recipientIds } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    const payload = JSON.stringify({
      title: conversation.isGroup ? conversation.name || "Group message" : message.sender?.username || "New message",
      body: message.content || message.attachment?.fileName || "Sent an attachment",
      conversationId,
    });

    await Promise.all(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
        } else {
          console.error("Web Push delivery failed:", error.message);
        }
      }
    }));
  } catch (error) {
    // Push delivery must not prevent a message from being sent.
    console.error("Unable to dispatch Web Push notification:", error.message);
  }
}
