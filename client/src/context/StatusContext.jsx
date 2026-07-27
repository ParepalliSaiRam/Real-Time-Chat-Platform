import { createContext, useContext, useEffect, useState } from "react";

import { getStatusFeed } from "../api/status.api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

const StatusContext = createContext();

export function StatusProvider({ children }) {
  const [mine, setMine] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();
  const { user } = useAuth();

  const loadFeed = async () => {
    try {
      const data = await getStatusFeed();
      setMine(data.mine);
      setFriends(data.friends);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadFeed();
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleStatusChange = () => loadFeed();

    socket.on("status-created", handleStatusChange);
    socket.on("status-deleted", handleStatusChange);

    return () => {
      socket.off("status-created", handleStatusChange);
      socket.off("status-deleted", handleStatusChange);
    };
  }, [socket, user]);

  return (
    <StatusContext.Provider
      value={{
        mine,
        friends,
        loading,
        loadFeed,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  return useContext(StatusContext);
}
