import api from "./axios";

export async function createGroup(name, members) {
  const { data } = await api.post("/groups", { name, members });
  return data;
}

export async function renameGroup(conversationId, name) {
  const { data } = await api.patch(`/groups/${conversationId}`, { name });
  return data;
}

export async function updateGroupDescription(conversationId, description) {
  const { data } = await api.patch(`/groups/${conversationId}/description`, {
    description,
  });
  return data;
}

export async function updateGroupAvatar(conversationId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    `/groups/${conversationId}/avatar`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
}

export async function addGroupMembers(conversationId, members) {
  const { data } = await api.post(`/groups/${conversationId}/members`, {
    members,
  });
  return data;
}

export async function removeGroupMember(conversationId, userId) {
  const { data } = await api.delete(
    `/groups/${conversationId}/members/${userId}`
  );
  return data;
}

export async function leaveGroup(conversationId) {
  const { data } = await api.post(`/groups/${conversationId}/leave`);
  return data;
}

export async function promoteGroupAdmin(conversationId, userId) {
  const { data } = await api.patch(`/groups/${conversationId}/admin/promote`, {
    userId,
  });
  return data;
}

export async function demoteGroupAdmin(conversationId, userId) {
  const { data } = await api.patch(`/groups/${conversationId}/admin/demote`, {
    userId,
  });
  return data;
}

export async function updateGroupSettings(conversationId, settings) {
  const { data } = await api.patch(
    `/groups/${conversationId}/settings`,
    settings
  );
  return data;
}

export async function getGroupInvite(conversationId) {
  const { data } = await api.get(`/groups/${conversationId}/invite`);
  return data;
}

export async function generateGroupInvite(conversationId) {
  const { data } = await api.post(`/groups/${conversationId}/invite`);
  return data;
}

export async function revokeGroupInvite(conversationId) {
  const { data } = await api.delete(`/groups/${conversationId}/invite`);
  return data;
}

export async function joinGroupByInvite(code) {
  const { data } = await api.post(`/groups/join/${code}`);
  return data;
}
