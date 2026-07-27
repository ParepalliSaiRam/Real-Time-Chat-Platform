import api from "./axios";

export async function searchUsers(query) {
  const { data } = await api.get("/users/search", {
    params: { query },
  });

  return data;
}

export async function sendFriendRequest(receiverId) {
  const { data } = await api.post("/friends/request", {
    receiverId,
  });

  return data;
}

export async function getFriendRequests() {
  const { data } = await api.get("/friends/requests");
  return data;
}

export async function acceptFriendRequest(requestId) {
  const { data } = await api.post("/friends/accept", {
    requestId,
  });

  return data;
}

export async function rejectFriendRequest(requestId) {
  const { data } = await api.post("/friends/reject", {
    requestId,
  });

  return data;
}

export async function getFriends() {
  const { data } = await api.get("/friends");

  return data;
}