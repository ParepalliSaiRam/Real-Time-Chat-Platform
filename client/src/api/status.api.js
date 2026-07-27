import api from "./axios";

export async function createStatus({ type, content, backgroundColor, file }) {
  const formData = new FormData();

  formData.append("type", type);

  if (content) formData.append("content", content);
  if (backgroundColor) formData.append("backgroundColor", backgroundColor);
  if (file) formData.append("file", file);

  const { data } = await api.post("/statuses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function getStatusFeed() {
  const { data } = await api.get("/statuses/feed");
  return data;
}

export async function getUserStatuses(userId) {
  const { data } = await api.get(`/statuses/user/${userId}`);
  return data;
}

export async function viewStatus(statusId) {
  const { data } = await api.post(`/statuses/${statusId}/view`);
  return data;
}

export async function getStatusViewers(statusId) {
  const { data } = await api.get(`/statuses/${statusId}/viewers`);
  return data;
}

export async function deleteStatus(statusId) {
  const { data } = await api.delete(`/statuses/${statusId}`);
  return data;
}
