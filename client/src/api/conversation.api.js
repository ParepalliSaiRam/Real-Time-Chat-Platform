import api from "./axios";

export async function getConversations() {
  const { data } = await api.get("/conversations");
  return data;
}

export async function createConversation(userId) {
  const { data } = await api.post("/conversations", {
    userId,
  });

  return data;
}

export async function muteConversation(conversationId) {
  const { data } = await api.patch(`/conversations/${conversationId}/mute`);
  return data;
}