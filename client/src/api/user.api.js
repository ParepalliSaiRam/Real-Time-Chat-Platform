import api from "./axios";

export async function getCurrentUser() {
  const { data } = await api.get("/users/me");
  return data;
}

export async function blockUser(userId) {
  const { data } = await api.post(`/users/${userId}/block`);
  return data;
}

export async function unblockUser(userId) {
  const { data } = await api.delete(`/users/${userId}/block`);
  return data;
}

export async function getBlockedUsers() {
  const { data } = await api.get("/users/blocked");
  return data;
}

export async function updateProfile(profile) {
  const { data } = await api.patch("/users/me", profile);
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
