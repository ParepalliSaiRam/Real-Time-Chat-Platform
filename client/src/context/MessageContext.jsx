import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";

import {
  getMessages,
  getMessagesAround,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  deleteMessageForMe as deleteMessageForMeApi,
  forwardMessages as forwardMessagesApi,
  toggleReaction as toggleReactionApi,
} from "../api/message.api";
import { useSocket } from "./SocketContext";

const MessageContext = createContext();

export function MessageProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const { socket } = useSocket();

  const loadMessages = async (convId) => {
    try {
      setLoading(true);
      setConversationId(convId);
      setReplyingTo(null);
      setHighlightedMessageId(null);

      const data = await getMessages(convId);

      setMessages(data.messages);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const jumpToMessage = async (convId, messageId) => {
    try {
      setLoading(true);
      setConversationId(convId);

      const data = await getMessagesAround(convId, messageId);

      setMessages(data.messages);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
      setHighlightedMessageId(messageId);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't jump to that message.");
    } finally {
      setLoading(false);
    }
  };

  const clearHighlight = () => setHighlightedMessageId(null);

  const loadMoreMessages = async () => {
    if (!conversationId || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);

      const data = await getMessages(conversationId, nextCursor);

      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = (
    convId,
    content,
    replyToId = null
  ) => {
    if (!socket) return;

    const text = content.trim();

    if (!text) return;

    socket.emit("send-message", {
      conversationId: convId,
      content: text,
      replyToId,
    });

    setReplyingTo(null);
  };

  const toggleReaction = async (messageId, emoji) => {
    try {
      await toggleReactionApi(messageId, emoji);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to react to message."
      );
    }
  };

  const editMessage = async (messageId, content) => {
    const text = content.trim();

    if (!text) return;

    try {
      await editMessageApi(messageId, text);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to edit message."
      );
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteMessageApi(messageId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete message."
      );
    }
  };

  const deleteMessageForMe = async (messageId) => {
    try {
      await deleteMessageForMeApi(messageId);

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete message."
      );
    }
  };

  const forwardMessages = async (messageIds, targetConversationIds) => {
    await forwardMessagesApi(messageIds, targetConversationIds);
  };

  const clearMessages = () => {
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    setConversationId(null);
    setReplyingTo(null);
    setHighlightedMessageId(null);
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });
    };

    const handleMessageEdited = (updated) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === updated.id
            ? updated
            : message
        )
      );
    };

    const handleMessageDeleted = ({
      messageId,
    }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                isDeleted: true,
                content:
                  "This message was deleted.",
              }
            : message
        )
      );
    };

    const handleMessageDeletedForMe = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleTypingStart = (data) => {
      setTypingUsers((prev) => {
        if (
          prev.some(
            (u) => u.userId === data.userId
          )
        ) {
          return prev;
        }

        return [...prev, data];
      });
    };

    const handleTypingStop = ({
      userId,
    }) => {
      setTypingUsers((prev) =>
        prev.filter(
          (u) => u.userId !== userId
        )
      );
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, reactions } : message
        )
      );
    };

    const handleMessagesRead = ({
      userId,
      messageIds,
    }) => {
      setMessages((prev) =>
        prev.map((message) => {
          if (
            !messageIds.includes(message.id)
          ) {
            return message;
          }

          const alreadyRead =
            (message.reads || []).some(
              (read) =>
                read.userId === userId
            );

          if (alreadyRead) {
            return message;
          }

          return {
            ...message,
            reads: [
              ...(message.reads || []),
              { userId },
            ],
          };
        })
      );
    };

    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "message-edited",
      handleMessageEdited
    );

    socket.on(
      "message-deleted",
      handleMessageDeleted
    );

    socket.on(
      "message-deleted-for-me",
      handleMessageDeletedForMe
    );

    socket.on(
      "typing-start",
      handleTypingStart
    );

    socket.on(
      "typing-stop",
      handleTypingStop
    );

    socket.on(
      "messages-read",
      handleMessagesRead
    );

    socket.on(
      "message-reaction-updated",
      handleReactionUpdated
    );

    return () => {
      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "message-edited",
        handleMessageEdited
      );

      socket.off(
        "message-deleted",
        handleMessageDeleted
      );

      socket.off(
        "message-deleted-for-me",
        handleMessageDeletedForMe
      );

      socket.off(
        "typing-start",
        handleTypingStart
      );

      socket.off(
        "typing-stop",
        handleTypingStop
      );

      socket.off(
        "messages-read",
        handleMessagesRead
      );

      socket.off(
        "message-reaction-updated",
        handleReactionUpdated
      );
    };
  }, [socket]);

  return (
    <MessageContext.Provider
      value={{
        messages,
        loading,
        loadingMore,
        hasMore,
        sendMessage,
        editMessage,
        deleteMessage,
        deleteMessageForMe,
        forwardMessages,
        toggleReaction,
        loadMessages,
        loadMoreMessages,
        jumpToMessage,
        clearMessages,
        typingUsers,
        replyingTo,
        setReplyingTo,
        highlightedMessageId,
        clearHighlight,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  return useContext(MessageContext);
}