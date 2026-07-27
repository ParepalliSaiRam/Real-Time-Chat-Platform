import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import {
  connectSocket as connectSocketService,
  disconnectSocket as disconnectSocketService,
} from "../services/socket";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const connectSocket = useCallback((token) => {
    const instance = connectSocketService(token);
    setSocket(instance);
    return instance;
  }, []);

  const disconnectSocket = useCallback(() => {
    disconnectSocketService();
    setSocket(null);
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, connectSocket, disconnectSocket }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
