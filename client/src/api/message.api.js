import api from "./axios";

export async function getMessages(
  conversationId,
  cursor = null,
  limit = 30
) {
  const { data } = await api.get(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        cursor,
        limit,
      },
    }
  );

  return data;
}

export async function getMessagesAround(conversationId, messageId) {
  const { data } = await api.get(
    `/conversations/${conversationId}/messages/around/${messageId}`
  );

  return data;
}

export async function searchMessages(conversationId, query) {
  const { data } = await api.get(
    `/conversations/${conversationId}/messages/search`,
    {
      params: { query },
    }
  );

  return data;
}

export async function sendMessage(
  conversationId,
  content
) {
  const { data } = await api.post(
    `/conversations/${conversationId}/messages`,
    {
      content,
    }
  );

  return data;
}

export async function editMessage(
  messageId,
  content
) {
  const { data } = await api.patch(
    `/conversations/${messageId}`,
    {
      content,
    }
  );

  return data;
}

export async function deleteMessage(messageId) {
  const { data } = await api.delete(
    `/conversations/${messageId}`
  );

  return data;
}

export async function deleteMessageForMe(messageId) {
  const { data } = await api.delete(
    `/conversations/${messageId}/me`
  );

  return data;
}

export async function forwardMessages(messageIds, targetConversationIds) {
  const { data } = await api.post(
    "/conversations/messages/forward",
    { messageIds, targetConversationIds }
  );

  return data;
}

export async function toggleReaction(messageId, emoji) {
  const { data } = await api.post(
    `/conversations/${messageId}/reactions`,
    { emoji }
  );

  return data;
}