import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";

import Avatar from "../ui/Avatar";
import { usePresence } from "../../context/PresenceContext";

export default function ConversationCard({
  conversation,
  active,
  onSelect,
}) {
  const { onlineUsers } = usePresence();

  const isGroup = conversation.isGroup;
  const title = isGroup
    ? conversation.name ?? "Group"
    : conversation.user?.username ?? "Unknown User";

  const isOnline =
    !isGroup && conversation.user && onlineUsers.includes(conversation.user.id);

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full rounded-lg border p-4 text-left transition ${
        active
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {isGroup ? (
          <Avatar name={title} src={conversation.avatarUrl} icon={Users} size="md" />
        ) : (
          <Avatar name={title} src={conversation.user?.avatarUrl} size="md" online={isOnline} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{title}</h3>

            {conversation.lastMessageAt && (
              <span className="shrink-0 text-xs text-gray-500">
                {formatDistanceToNow(
                  new Date(conversation.lastMessageAt),
                  { addSuffix: true }
                )}
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-gray-500">
            {conversation.lastMessage || "Start chatting..."}
          </p>
        </div>

        {conversation.unreadCount > 0 && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}