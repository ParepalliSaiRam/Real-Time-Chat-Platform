import { useState, useRef, useEffect } from "react";
import { X, Send, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useConversation } from "../../context/ConversationContext";
import { useMessage } from "../../context/MessageContext";
import { getSocket } from "../../services/socket";
import { uploadAttachment } from "../../api/attachment.api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function MessageInput() {
  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const { selectedConversation } = useConversation();
  const { sendMessage, replyingTo, setReplyingTo } = useMessage();

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  useEffect(() => {
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setCaption("");
  }, [selectedConversation?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedConversation) return;

    if (!content.trim()) return;

    await sendMessage(
      selectedConversation.id,
      content,
      replyingTo?.id ?? null
    );

    const socket = getSocket();

    if (socket) {
      socket.emit("typing-stop", {
        conversationId: selectedConversation.id,
      });
    }

    setContent("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !selectedConversation) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large (max 10MB).");
      return;
    }

    setPendingFile(file);
    setPendingPreviewUrl(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    );
    setCaption("");
  };

  const handleCancelAttachment = () => {
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setCaption("");
  };

  const handleSendAttachment = async () => {
    if (!pendingFile || !selectedConversation) return;

    try {
      setUploading(true);

      await uploadAttachment(selectedConversation.id, pendingFile, caption.trim());

      handleCancelAttachment();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to upload file."
      );
    } finally {
      setUploading(false);
    }
  };

  if (pendingFile) {
    return (
      <div className="border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
          {pendingPreviewUrl ? (
            <img
              src={pendingPreviewUrl}
              alt={pendingFile.name}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
              <FileText size={24} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">
              {pendingFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {Math.round(pendingFile.size / 1024)} KB
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelAttachment}
            disabled={uploading}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <input
            autoFocus
            type="text"
            aria-label="Attachment caption"
            value={caption}
            maxLength={2000}
            placeholder="Add a caption..."
            disabled={uploading}
            className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-60 sm:px-4 sm:text-base"
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendAttachment();
              }
            }}
          />

          <button
            type="button"
            onClick={handleSendAttachment}
            disabled={uploading}
            aria-label={uploading ? "Sending attachment" : "Send attachment"}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-700 disabled:opacity-60 sm:px-6"
          >
            <Send size={16} />
            <span className="hidden sm:inline">{uploading ? "Sending..." : "Send"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border-l-4 border-blue-500 bg-gray-50 px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-blue-600">
              Replying to {replyingTo.sender?.username}
            </div>
            <div className="truncate text-sm text-gray-600">
              {replyingTo.isDeleted
                ? "This message was deleted."
                : replyingTo.type === "TEXT"
                ? replyingTo.content
                : replyingTo.type === "IMAGE"
                ? "📷 Photo"
                : "📄 File"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf,.doc,.docx,.zip,.rar,.txt"
  className="hidden"
  onChange={handleFileSelect}
/>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 sm:gap-3"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          title="Attach a file"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 hover:bg-gray-100"
        >
          📎
        </button>

        <input
          type="text"
          aria-label="Type a message"
          value={content}
          maxLength={2000}
          placeholder="Type a message..."
          className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 sm:px-4 sm:text-base"
          onChange={(e) => {
            const value = e.target.value;

            setContent(value);

            if (!selectedConversation) return;

            const socket = getSocket();

            if (!socket) return;

            socket.emit("typing-start", {
              conversationId: selectedConversation.id,
            });

            clearTimeout(typingTimeout.current);

            typingTimeout.current = setTimeout(() => {
              socket.emit("typing-stop", {
                conversationId: selectedConversation.id,
              });
            }, 1000);
          }}
        />

        <button
          type="submit"
          aria-label="Send message"
          disabled={!content.trim()}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-700 sm:px-6"
        >
          <Send size={16} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
