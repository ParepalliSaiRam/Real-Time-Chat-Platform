import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCurrentUser } from "../api/user.api";

import { useSocket } from "./SocketContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { connectSocket, disconnectSocket } = useSocket();

  useEffect(() => {
    async function initializeAuth() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        setUser(data.user);

        connectSocket(token);
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");

        disconnectSocket();

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);

    connectSocket(token);

    setUser(user);
  };

  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const logout = () => {
    disconnectSocket();

    localStorage.removeItem("token");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
