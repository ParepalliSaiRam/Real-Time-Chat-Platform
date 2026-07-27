import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import toast from "react-hot-toast";

import { useConversation } from "../../context/ConversationContext";
import { useMessage } from "../../context/MessageContext";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Button from "../common/Button";

export default function ForwardMessageModal({ open, onClose, messageIds, onForwarded }) {
  const { conversations } = useConversation();
  const { forwardMessages } = useMessage();

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIds([]);
    }
  }, [open]);

  const eligible = conversations.filter(
    (c) => c.isGroup ? c.isActive !== false : true
  );

  const trimmedQuery = query.trim().toLowerCase();

  const filtered = trimmedQuery
    ? eligible.filter((c) => {
        const title = c.isGroup ? c.name ?? "" : c.user?.username ?? "";
        return title.toLowerCase().includes(trimmedQuery);
      })
    : eligible;

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) return;

    try {
      setSending(true);
      await forwardMessages(messageIds, selectedIds);
      toast.success(
        selectedIds.length === 1
          ? "Message forwarded."
          : `Forwarded to ${selectedIds.length} conversations.`
      );
      onForwarded?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to forward message."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Forward ${messageIds?.length > 1 ? `${messageIds.length} messages` : "message"}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <Button
            className="w-auto px-4"
            onClick={handleForward}
            disabled={sending || selectedIds.length === 0}
          >
            {sending ? "Forwarding..." : `Forward${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
          <Search size={16} className="shrink-0 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full min-w-0 text-sm outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">
            No conversations found.
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.map((conversation) => {
              const title = conversation.isGroup
                ? conversation.name ?? "Group"
                : conversation.user?.username ?? "Unknown";

              return (
                <label
                  key={conversation.id}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(conversation.id)}
                    onChange={() => toggle(conversation.id)}
                  />

                  {conversation.isGroup ? (
                    <Avatar name={title} src={conversation.avatarUrl} icon={Users} size="sm" />
                  ) : (
                    <Avatar name={title} src={conversation.user?.avatarUrl} size="sm" />
                  )}

                  <span className="min-w-0 flex-1 truncate">{title}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
