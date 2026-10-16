import api from "./axios";

export async function getPushPublicKey() {
  const { data } = await api.get("/push/public-key");
  return data.publicKey;
}

export async function savePushSubscription(subscription) {
  const { data } = await api.post("/push/subscriptions", subscription);
  return data;
}

export async function deletePushSubscription(endpoint) {
  const token = localStorage.getItem("token");
  const { data } = await api.delete("/push/subscriptions", {
    data: { endpoint },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
}
