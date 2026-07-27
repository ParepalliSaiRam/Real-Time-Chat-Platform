import { io } from "socket.io-client";
import toast from "react-hot-toast";

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: {
      token,
    },
    withCredentials: true,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error(error.message);
    toast.error("Connection lost. Reconnecting...");
  });

  socket.on("error-message", (data) => {
    console.error(data.message);
    toast.error(data.message || "Something went wrong.");
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;

  socket.disconnect();

  socket = null;
}

export function getSocket() {
  return socket;
}