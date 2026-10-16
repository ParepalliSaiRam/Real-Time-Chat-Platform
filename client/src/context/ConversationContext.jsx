import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getConversations,
  createConversation,
} from "../api/conversation.api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import {
  showNotification,
} from "../utils/notifications";

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [restoredConversationId, setRestoredConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);

  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const previousUserIdRef = useRef(user?.id);

  const loadConversations = async ({ restoreSelection = false } = {}) => {
    try {
      const data = await getConversations();

      setConversations(data.conversations);
      setHasLoadedConversations(true);

      if (restoreSelection && user?.id) {
        const storageKey = `chat-platform:selected-conversation:${user.id}`;
        // Keep the selected chat for a page refresh, but let a fresh app
        // session start at the conversation list after the app is closed.
        const savedConversationId = window.sessionStorage.getItem(storageKey);
        const requestedConversationId = new URLSearchParams(window.location.search).get("conversationId");
        const savedConversation =
          data.conversations.find((conversation) => conversation.id === requestedConversationId) ??
          data.conversations.find((conversation) => conversation.id === savedConversationId);

        if (savedConversation) {
          setSelectedConversation(savedConversation);
          setRestoredConversationId(savedConversation.id);
        } else {
          window.sessionStorage.removeItem(storageKey);
          setSelectedConversation(null);
          setRestoredConversationId(null);
        }
      }

      return data;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setSelectedConversation(null);
      setRestoredConversationId(null);
      setHasLoadedConversations(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasLoadedConversations(false);
    setSelectedConversation(null);
    setRestoredConversationId(null);
    loadConversations({ restoreSelection: true });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    if (previousUserIdRef.current !== user.id) {
      previousUserIdRef.current = user.id;
      return;
    }

    if (loading || !hasLoadedConversations) return;

    const storageKey = `chat-platform:selected-conversation:${user.id}`;
    if (selectedConversation?.id) {
      window.sessionStorage.setItem(storageKey, selectedConversation.id);
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [selectedConversation?.id, user?.id, loading, hasLoadedConversations]);

  const completeConversationRestore = (conversationId) => {
    setRestoredConversationId((current) =>
      current === conversationId ? null : current
    );
  };

  const startConversation = async (userId) => {
    const data = await createConversation(userId);

    const conversationsData = await getConversations();

    setConversations(conversationsData.conversations);

    const selected = conversationsData.conversations.find(
      (c) => c.id === data.conversation.id
    );

    setSelectedConversation(selected ?? null);

    return selected;
  };

  const markConversationRead = (conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const patchConversation = (conversationId, patch) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, ...patch } : c))
    );

    setSelectedConversation((prev) =>
      prev?.id === conversationId ? { ...prev, ...patch } : prev
    );
  };

  const bumpToTop = (conversationId, patch) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === conversationId);

      if (!existing) {
        loadConversations();
        return prev;
      }

      const updated = { ...existing, ...patch };
      const rest = prev.filter((c) => c.id !== conversationId);

      return [updated, ...rest];
    });
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleConversationUpdated = ({
      conversationId,
      lastMessage,
      lastMessageAt,
      senderId,
    }) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);

        if (!existing) {
          loadConversations();
          return prev;
        }

        const isOwnMessage = senderId === user.id;
        const isOpen =
          selectedConversation?.id === conversationId &&
          location.pathname === "/conversations";

        const isMuted = Boolean(
          existing.mutedAt &&
            (!existing.mutedUntil || new Date(existing.mutedUntil) > new Date())
        );

        if (!isOwnMessage && !isMuted && (!isOpen || document.hidden)) {
          const title = existing.isGroup
            ? existing.name ?? "Group"
            : existing.user?.username ?? "New message";

          showNotification(title, {
            body: lastMessage,
            icon: existing.isGroup ? existing.avatarUrl : existing.user?.avatarUrl,
            userId: user.id,
            conversationId,
            onClick: () => {
              setSelectedConversation(existing);
              navigate("/conversations");
            },
          });
        }

        const updated = {
          ...existing,
          lastMessage,
          lastMessageAt,
          hasMessages: true,
          unreadCount:
            isOwnMessage || isOpen
              ? existing.unreadCount ?? 0
              : (existing.unreadCount ?? 0) + 1,
        };

        const rest = prev.filter((c) => c.id !== conversationId);

        return [updated, ...rest];
      });
    };

    const handleGroupRenamed = ({ conversationId, name }) => {
      bumpToTop(conversationId, { name });
    };

    const handleGroupAvatarUpdated = ({ conversationId, avatarUrl }) => {
      patchConversation(conversationId, { avatarUrl });
    };

    const handleGroupDescriptionUpdated = ({ conversationId, description }) => {
      patchConversation(conversationId, { description });
    };

    const handleMemberAdded = ({ conversationId, members }) => {
      const wasSelfReactivated = members.some((m) => m.id === user.id);

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);

        if (!existing) {
          loadConversations();
          return prev;
        }

        return prev.map((c) => {
          if (c.id !== conversationId) return c;

          const existingIds = new Set(
            (c.participants ?? []).map((p) => p.id)
          );

          const newOnes = members
            .filter((m) => !existingIds.has(m.id) && m.id !== user.id)
            .map((m) => ({
              id: m.id,
              username: m.username,
              avatarUrl: m.avatarUrl,
              isAdmin: false,
            }));

          return {
            ...c,
            participants: [...(c.participants ?? []), ...newOnes],
            ...(wasSelfReactivated && { isActive: true }),
          };
        });
      });

      if (wasSelfReactivated) {
        setSelectedConversation((prev) =>
          prev?.id === conversationId ? { ...prev, isActive: true } : prev
        );
      }
    };

    const handleMemberRemoved = ({ conversationId, userId }) => {
      if (userId === user.id) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, isActive: false } : c
          )
        );

        setSelectedConversation((prev) =>
          prev?.id === conversationId ? { ...prev, isActive: false } : prev
        );

        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                participants: (c.participants ?? []).filter(
                  (p) => p.id !== userId
                ),
              }
            : c
        )
      );

      setSelectedConversation((prev) =>
        prev?.id === conversationId
          ? {
              ...prev,
              participants: (prev.participants ?? []).filter(
                (p) => p.id !== userId
              ),
            }
          : prev
      );
    };

    const handleMemberLeft = ({ conversationId, userId }) => {
      if (userId === user.id) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, isActive: false } : c
          )
        );

        setSelectedConversation((prev) =>
          prev?.id === conversationId ? { ...prev, isActive: false } : prev
        );

        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                participants: (c.participants ?? []).filter(
                  (p) => p.id !== userId
                ),
              }
            : c
        )
      );

      setSelectedConversation((prev) =>
        prev?.id === conversationId
          ? {
              ...prev,
              participants: (prev.participants ?? []).filter(
                (p) => p.id !== userId
              ),
            }
          : prev
      );
    };

    const applyAdminChange = (conversationId, targetUserId, isAdmin) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          return {
            ...c,
            isAdmin: targetUserId === user.id ? isAdmin : c.isAdmin,
            participants: (c.participants ?? []).map((p) =>
              p.id === targetUserId ? { ...p, isAdmin } : p
            ),
          };
        })
      );

      setSelectedConversation((prev) => {
        if (prev?.id !== conversationId) return prev;

        return {
          ...prev,
          isAdmin: targetUserId === user.id ? isAdmin : prev.isAdmin,
          participants: (prev.participants ?? []).map((p) =>
            p.id === targetUserId ? { ...p, isAdmin } : p
          ),
        };
      });
    };

    const handleAdminPromoted = ({ conversationId, userId: targetUserId }) => {
      applyAdminChange(conversationId, targetUserId, true);
    };

    const handleAdminDemoted = ({ conversationId, userId: targetUserId }) => {
      applyAdminChange(conversationId, targetUserId, false);
    };

    const handleGroupSettingsUpdated = ({
      conversationId,
      onlyAdminsCanEditInfo,
      onlyAdminsCanMessage,
    }) => {
      patchConversation(conversationId, {
        onlyAdminsCanEditInfo,
        onlyAdminsCanMessage,
      });
    };

    socket.on("conversation-updated", handleConversationUpdated);
    socket.on("group-renamed", handleGroupRenamed);
    socket.on("group-avatar-updated", handleGroupAvatarUpdated);
    socket.on("group-description-updated", handleGroupDescriptionUpdated);
    socket.on("member-added", handleMemberAdded);
    socket.on("member-removed", handleMemberRemoved);
    socket.on("member-left", handleMemberLeft);
    socket.on("admin-promoted", handleAdminPromoted);
    socket.on("admin-demoted", handleAdminDemoted);
    socket.on("group-settings-updated", handleGroupSettingsUpdated);

    return () => {
      socket.off("conversation-updated", handleConversationUpdated);
      socket.off("group-renamed", handleGroupRenamed);
      socket.off("group-avatar-updated", handleGroupAvatarUpdated);
      socket.off("group-description-updated", handleGroupDescriptionUpdated);
      socket.off("member-added", handleMemberAdded);
      socket.off("member-removed", handleMemberRemoved);
      socket.off("member-left", handleMemberLeft);
      socket.off("admin-promoted", handleAdminPromoted);
      socket.off("admin-demoted", handleAdminDemoted);
      socket.off("group-settings-updated", handleGroupSettingsUpdated);
    };
  }, [socket, user, selectedConversation?.id, location.pathname]);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        selectedConversation,
        setSelectedConversation,
        restoredConversationId,
        completeConversationRestore,
        loading,
        loadConversations,
        startConversation,
        markConversationRead,
        patchConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  return useContext(ConversationContext);
}
