import api from "./axios";

export async function loginUser(credentials) {
  const { data } = await api.post("/auth/login", credentials);
  return data;
}

export async function registerUser(userData) {
  const { data } = await api.post("/auth/register", userData);
  return data;
}