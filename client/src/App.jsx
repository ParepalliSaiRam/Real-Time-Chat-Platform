import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import { ConversationProvider } from "./context/ConversationContext";
import { MessageProvider } from "./context/MessageContext";
import { PresenceProvider } from "./context/PresenceContext";
import { AvatarPreviewProvider } from "./context/AvatarPreviewContext";
import { StatusProvider } from "./context/StatusContext";

import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AvatarPreviewProvider>
        <SocketProvider>
          <AuthProvider>
            <PresenceProvider>
              <ConversationProvider>
                <MessageProvider>
                  <StatusProvider>
                    <AppRoutes />
                  </StatusProvider>
                </MessageProvider>
              </ConversationProvider>
            </PresenceProvider>
          </AuthProvider>
        </SocketProvider>
      </AvatarPreviewProvider>

      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </BrowserRouter>
  );
}
