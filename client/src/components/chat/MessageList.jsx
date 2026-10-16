import { useLayoutEffect, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";
import {
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  X,
  Reply,
  Smile,
  ArrowDown,
  Copy,
  Forward,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useMessage } from "../../context/MessageContext";
import { useConversation } from "../../context/ConversationContext";
import { useAvatarPreview } from "../../context/AvatarPreviewContext";

import { getFileUrl } from "../../utils/fileUrl";
import Spinner from "../ui/Spinner";
import { MessageListSkeleton } from "../ui/Skeleton";
import ForwardMessageModal from "./ForwardMessageModal";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const clipboardTextFor = (message) => {
  if (message.isDeleted) return "";
  if (message.type === "TEXT") return message.content ?? "";
  if (message.type === "IMAGE" || message.type === "FILE") {
    return message.content || message.attachment?.fileName || "";
  }
  return "";
};

export default function MessageList() {
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMoreMessages,
    loadMessages,
    jumpToMessage,
    clearHighlight,
    highlightedMessageId,
    editMessage,
    deleteMessage,
    deleteMessageForMe,
    toggleReaction,
    setReplyingTo,
  } = useMessage();
  const { user } = useAuth();
  const { selectedConversation } = useConversation();
  const { previewAvatar } = useAvatarPreview();

  const [selectedIds, setSelectedIds] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const selectionMode = selectedIds.length > 0;

  const containerRef = useRef(null);

  const needsInstantScrollRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    needsInstantScrollRef.current = true;
    setSelectedIds([]);
  }, [selectedConversation?.id]);

  useLayoutEffect(() => {
    const el = containerRef.current;

    if (!el || messages.length === 0) return;

    if (highlightedMessageId) return;

    if (isLoadingOlderRef.current) {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      isLoadingOlderRef.current = false;
      return;
    }

    el.scrollTo({
      top: el.scrollHeight,
      behavior: needsInstantScrollRef.current ? "auto" : "smooth",
    });

    needsInstantScrollRef.current = false;
  }, [messages, highlightedMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    const container = containerRef.current;
    const el = container?.querySelector(
      `[data-message-id="${highlightedMessageId}"]`
    );

    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset =
        elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;

      container.scrollTop += offset;
    }

    const timeout = setTimeout(() => clearHighlight(), 2000);
    return () => clearTimeout(timeout);
  }, [highlightedMessageId, messages, clearHighlight]);

  const handleScroll = () => {
    const el = containerRef.current;

    if (!el || loadingMore || !hasMore) return;

    if (el.scrollTop < 80) {
      prevScrollHeightRef.current = el.scrollHeight;
      isLoadingOlderRef.current = true;
      loadMoreMessages();
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [deleteMenuFor, setDeleteMenuFor] = useState(null);
  const [showBulkDeleteMenu, setShowBulkDeleteMenu] = useState(false);
  const [mobileActionsFor, setMobileActionsFor] = useState(null);

  const startEdit = (message) => {
    setEditingId(message.id);
    setEditText(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (messageId) => {
    if (!editText.trim()) return;

    await editMessage(messageId, editText);

    setEditingId(null);
    setEditText("");
  };

  const handleDelete = async (messageId) => {
    setDeleteMenuFor(null);

    if (window.confirm("Delete this message for everyone?")) {
      await deleteMessage(messageId);
    }
  };

  const handleDeleteForMe = async (messageId) => {
    setDeleteMenuFor(null);
    await deleteMessageForMe(messageId);
  };

  const handleCopy = (message) => {
    const text = clipboardTextFor(message);

    if (!text) return;

    navigator.clipboard.writeText(text);
    toast.success("Message copied.");
  };

  const toggleSelect = (messageId) => {
    setSelectedIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const cancelSelection = () => setSelectedIds([]);

  const selectedMessages = messages.filter((m) => selectedIds.includes(m.id));

  const handleCopySelected = () => {
    const text = selectedMessages
      .map(clipboardTextFor)
      .filter(Boolean)
      .join("\n\n");

    if (!text) {
      toast.error("Nothing to copy in the selected messages.");
      return;
    }

    navigator.clipboard.writeText(text);
    toast.success("Messages copied.");
    cancelSelection();
  };

  const canDeleteSelected =
    selectedMessages.length > 0 &&
    selectedMessages.every(
      (m) => m.sender.id === user.id && !m.isDeleted && m.type !== "SYSTEM"
    );

  const handleDeleteSelectedForEveryone = async () => {
    setShowBulkDeleteMenu(false);

    if (!canDeleteSelected) return;

    if (!window.confirm(`Delete ${selectedMessages.length} message${selectedMessages.length === 1 ? "" : "s"} for everyone?`)) {
      return;
    }

    await Promise.all(selectedMessages.map((m) => deleteMessage(m.id)));
    cancelSelection();
  };

  const handleDeleteSelectedForMe = async () => {
    setShowBulkDeleteMenu(false);
    await Promise.all(selectedMessages.map((m) => deleteMessageForMe(m.id)));
    cancelSelection();
  };

  const handleReact = (messageId, emoji) => {
    toggleReaction(messageId, emoji);
    setReactionPickerFor(null);
  };

  const handleQuoteClick = (replyToId) => {
    if (!selectedConversation) return;
    jumpToMessage(selectedConversation.id, replyToId);
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const canAct =
    selectedConversation &&
    (!selectedConversation.isGroup || selectedConversation.isActive !== false) &&
    !selectedConversation.blockedByMe;

  const messagesWithSeparators = useMemo(() => {
    return messages.map((message, index) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = format(messageDate, "yyyy-MM-dd");

      const previousMessage = messages[index - 1];
      const previousDateKey = previousMessage
        ? format(new Date(previousMessage.createdAt), "yyyy-MM-dd")
        : null;
      const groupedWithPrevious = Boolean(
        previousMessage &&
          message.type !== "SYSTEM" &&
          previousMessage.type !== "SYSTEM" &&
          previousMessage.sender?.id === message.sender?.id &&
          dateKey === previousDateKey &&
          messageDate.getTime() - new Date(previousMessage.createdAt).getTime() <=
            5 * 60 * 1000
      );

      return {
        message,
        messageDate,
        dateKey,
        showDateSeparator: dateKey !== previousDateKey,
        groupedWithPrevious,
      };
    });
  }, [messages]);

  if (loading) {
    return <MessageListSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        No messages yet.
      </div>
    );
  }

  const renderMessageContent = (message) => {
    if (message.isDeleted) {
      return (
        <span className="italic opacity-70">
          This message was deleted.
        </span>
      );
    }

    switch (message.type) {
      case "TEXT":
        return message.content;

      case "IMAGE":
        return (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                previewAvatar({
                  name: message.attachment?.fileName ?? "Photo",
                  src: message.attachment?.url,
                })
              }
              className="block cursor-pointer"
            >
              <img
                src={getFileUrl(message.attachment?.url)}
                alt={message.attachment?.fileName}
                className="max-h-72 max-w-full rounded-lg border border-gray-200 object-cover"
              />
            </button>

            {message.content && (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case "FILE":
        return (
          <div className="flex flex-col gap-1.5">
            <a
              href={getFileUrl(message.attachment?.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="text-2xl">📄</span>

              <div>
                <div className="font-medium">
                  {message.attachment?.fileName}
                </div>

                <div className="text-xs text-gray-500">
                  {Math.round(
                    message.attachment?.size / 1024
                  )} KB
                </div>
              </div>
            </a>

            {message.content && (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      default:
        return (
          <span className="italic text-red-500">
            Unsupported message type
          </span>
        );
    }
  };

  const renderMeta = (message, isMine, isRead) => (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-[11px] ${
        isMine ? "text-blue-100" : "text-gray-400"
      }`}
    >
      {message.isEdited && <span className="italic">edited</span>}
      <span>{format(new Date(message.createdAt), "hh:mm a")}</span>
      {isMine &&
        (isRead ? (
          <CheckCheck size={14} className="text-sky-300" />
        ) : (
          <Check size={14} />
        ))}
    </span>
  );

  const renderQuotedReply = (message) => {
    if (!message.replyTo) return null;

    const replyTo = message.replyTo;

    const snippet = replyTo.isDeleted
      ? "This message was deleted."
      : replyTo.type === "TEXT"
      ? replyTo.content
      : replyTo.type === "IMAGE"
      ? "📷 Photo"
      : "📄 File";

    return (
      <button
        type="button"
        onClick={() => handleQuoteClick(replyTo.id)}
        className={`mb-2 block w-full rounded-lg border-l-4 px-2 py-1 text-left text-xs ${
          message.sender.id === user.id
            ? "border-blue-300 bg-blue-700/30 text-blue-50"
            : "border-gray-300 bg-gray-100 text-gray-600"
        }`}
      >
        <div className="font-semibold">{replyTo.sender?.username}</div>
        <div className="truncate">{snippet}</div>
      </button>
    );
  };

  const renderReactions = (message) => {
    if (message.isDeleted || !message.reactions || message.reactions.length === 0) {
      return null;
    }

    const grouped = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {});

    return (
      <div className="mt-1 flex flex-wrap gap-1">
        {Object.entries(grouped).map(([emoji, reactions]) => {
          const mine = reactions.some((r) => r.userId === user.id);

          return (
            <button
              key={emoji}
              disabled={!canAct}
              onClick={() => handleReact(message.id, emoji)}
              title={reactions.map((r) => r.user.username).join(", ")}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs disabled:cursor-default ${
                mine
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              <span>{emoji}</span>
              <span>{reactions.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {selectionMode && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
          <button
            onClick={cancelSelection}
            title="Cancel selection"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
          >
            <X size={18} />
          </button>

          <span className="flex-1 text-sm font-medium text-gray-700">
            {selectedIds.length} selected
          </span>

          <button
            onClick={handleCopySelected}
            title="Copy"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
          >
            <Copy size={18} />
          </button>

          <button
            onClick={() => setShowForwardModal(true)}
            title="Forward"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
          >
            <Forward size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowBulkDeleteMenu((prev) => !prev)}
              title="Delete"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
            >
              <Trash2 size={18} />
            </button>

            {showBulkDeleteMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleDeleteSelectedForMe}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Delete for me
                </button>
                <button
                  onClick={handleDeleteSelectedForEveryone}
                  disabled={!canDeleteSelected}
                  title={canDeleteSelected ? "" : "You can only delete your own messages for everyone"}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  Delete for everyone
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/60 px-3 py-3 sm:px-7 sm:py-5"
    >
      {loadingMore && (
        <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Spinner size={14} />
          Loading older messages...
        </div>
      )}

      {!hasMore && messages.length > 0 && !highlightedMessageId && (
        <div className="mb-3 text-center text-xs text-gray-400">
          You've reached the beginning of the conversation.
        </div>
      )}

      {highlightedMessageId && (
        <div className="sticky top-0 z-10 mb-3 flex justify-center">
          <button
            onClick={() => selectedConversation && loadMessages(selectedConversation.id)}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs text-white shadow hover:bg-blue-700"
          >
            <ArrowDown size={12} />
            Jump to latest
          </button>
        </div>
      )}

      <div className="space-y-1">
        {messagesWithSeparators.map(
          ({ message, messageDate, dateKey, showDateSeparator, groupedWithPrevious }) => {
            const separator = showDateSeparator && (
              <div
                key={`date-${dateKey}`}
                className="my-2 flex items-center justify-center"
              >
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                  {getDateLabel(messageDate)}
                </span>
              </div>
            );

          if (message.type === "SYSTEM") {
            return (
              <div key={message.id}>
                {separator}
                <div className="flex justify-center">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                    {message.content}
                  </span>
                </div>
              </div>
            );
          }

          const isMine = message.sender.id === user.id;

          const isRead = (message.reads ?? []).length > 0;

          const canEdit =
            isMine &&
            !message.isDeleted &&
            message.type === "TEXT";

          const canDelete =
            isMine &&
            !message.isDeleted &&
            message.type !== "SYSTEM";

          const isEditing = editingId === message.id;

          const isHighlighted = highlightedMessageId === message.id;

          const actionsRow = !isEditing && (
            <div className="relative flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
              {canEdit && (
                <button
                  onClick={() => startEdit(message)}
                  title="Edit message"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                >
                  <Pencil size={14} />
                </button>
              )}

              {!message.isDeleted && message.type !== "SYSTEM" && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setDeleteMenuFor(
                        deleteMenuFor === message.id ? null : message.id
                      )
                    }
                    title="Delete message"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>

                  {deleteMenuFor === message.id && (
                    <div
                      className={`absolute bottom-full z-20 mb-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
                        isMine ? "right-0" : "left-0"
                      }`}
                    >
                      <button
                        onClick={() => handleDeleteForMe(message.id)}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Delete for me
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete for everyone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canAct && !message.isDeleted && (
                <>
                  <button
                    onClick={() => setReplyingTo(message)}
                    title="Reply"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <Reply size={14} />
                  </button>

                  <button
                    onClick={() =>
                      setReactionPickerFor(
                        reactionPickerFor === message.id ? null : message.id
                      )
                    }
                    title="React"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-500"
                  >
                    <Smile size={14} />
                  </button>
                </>
              )}

              {!message.isDeleted && clipboardTextFor(message) && (
                <button
                  onClick={() => handleCopy(message)}
                  title="Copy"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                >
                  <Copy size={14} />
                </button>
              )}

              {!message.isDeleted && (
                <button
                  onClick={() => toggleSelect(message.id)}
                  title="Select"
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                >
                  <CheckSquare size={14} />
                </button>
              )}

              {reactionPickerFor === message.id && (
                <div
                  className={`absolute bottom-full z-10 mb-1 flex gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg ${
                    isMine ? "right-0" : "left-0"
                  }`}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(message.id, emoji)}
                      className="rounded p-1 text-lg hover:bg-gray-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <div key={message.id} className={groupedWithPrevious ? "pt-0.5" : "pt-3"}>
              {separator}
              <div
              data-message-id={message.id}
              className={`group/message-row relative flex items-end gap-2 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(message.id)}
                  onChange={() => toggleSelect(message.id)}
                  className="mb-1 h-4 w-4 shrink-0"
                />
              )}

              <div className={`relative flex min-w-0 max-w-[75%] flex-col ${isMine ? "items-end" : "items-start"}`}>
                {!selectionMode && actionsRow && (
                  <>
                    <div
                      className={`pointer-events-none absolute top-1/2 z-20 hidden -translate-y-1/2 opacity-0 transition-opacity group-hover/message-row:pointer-events-auto group-hover/message-row:opacity-100 group-focus-within/message-row:pointer-events-auto group-focus-within/message-row:opacity-100 md:block ${
                        isMine ? "right-full mr-2" : "left-full ml-2"
                      }`}
                    >
                    {actionsRow}
                    </div>
                    <div className={`absolute top-1/2 z-20 -translate-y-1/2 md:hidden ${isMine ? "right-full mr-1" : "left-full ml-1"}`}>
                      <button
                        type="button"
                        aria-label="Message actions"
                        aria-expanded={mobileActionsFor === message.id}
                        onClick={() => setMobileActionsFor((current) => current === message.id ? null : message.id)}
                        className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {mobileActionsFor === message.id && (
                        <div className={`absolute bottom-full z-30 mb-1 ${isMine ? "right-0" : "left-0"}`}>
                          {actionsRow}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div
                  className={`w-fit max-w-full rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm transition-colors ${
                    isMine
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-gray-200 bg-white"
                  } ${isHighlighted ? "ring-2 ring-amber-400" : ""}`}
                >
                {!isMine && !groupedWithPrevious && (
                  <div className="mb-1 text-xs font-semibold text-gray-500">
                    {message.sender.username}
                  </div>
                )}

                {renderQuotedReply(message)}

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(message.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="rounded-lg border border-blue-300 px-2 py-1 text-sm text-gray-900 outline-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEdit}
                        title="Cancel"
                        className="rounded p-1 hover:bg-white/20"
                      >
                        <X size={14} />
                      </button>

                      <button
                        onClick={() => saveEdit(message.id)}
                        title="Save"
                        className="rounded p-1 hover:bg-white/20"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="break-words">
                    {renderMessageContent(message)}
                  </div>
                )}

                {!message.isDeleted && !isEditing && (
                  <div className="mt-1.5 flex justify-end">
                    {renderMeta(message, isMine, isRead)}
                  </div>
                )}
                </div>

                {renderReactions(message)}
              </div>

              </div>
            </div>
          );
          }
        )}
      </div>
      </div>

      <ForwardMessageModal
        open={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        messageIds={selectedIds}
        onForwarded={cancelSelection}
      />
    </div>
  );
}
