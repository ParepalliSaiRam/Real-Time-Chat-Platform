import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useSocket } from "./SocketContext";

const PresenceContext = createContext();

export function PresenceProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [lastSeenMap, setLastSeenMap] = useState({});

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit("get-online-users");

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) =>
        prev.includes(userId)
          ? prev
          : [...prev, userId]
      );
    };

    const handleUserOffline = ({ userId, lastSeenAt }) => {
      setOnlineUsers((prev) =>
        prev.filter((id) => id !== userId)
      );

      setLastSeenMap((prev) => ({
        ...prev,
        [userId]: lastSeenAt,
      }));
    };

    socket.on("online-users", handleOnlineUsers);
    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);

    return () => {
      socket.off("online-users", handleOnlineUsers);
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
    };
  }, [socket]);

  const getLastSeen = (userId, fallback) => {
    return lastSeenMap[userId] ?? fallback ?? null;
  };

  return (
    <PresenceContext.Provider
      value={{ onlineUsers, getLastSeen }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}