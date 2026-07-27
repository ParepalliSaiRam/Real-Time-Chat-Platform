import { useState } from "react";
import { Users, Lock, Search, ArrowLeft } from "lucide-react";

import { useMessage } from "../../context/MessageContext";
import { usePresence } from "../../context/PresenceContext";
import { useConversation } from "../../context/ConversationContext";
import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";
import MessageSearch from "./MessageSearch";

export default function ChatHeader({
  conversation,
  onOpenInfo,
}) {
  const { typingUsers } = useMessage();
  const { onlineUsers, getLastSeen } = usePresence();
  const { setSelectedConversation } = useConversation();
  const [showSearch, setShowSearch] = useState(false);

  if (!conversation) {
    return (
      <header className="flex h-16 items-center border-b border-gray-200 px-6">
        <h2 className="text-lg font-semibold text-gray-500">
          Select a conversation
        </h2>
      </header>
    );
  }

  const isGroup = conversation.isGroup;
  const isActive = !isGroup || conversation.isActive !== false;

  const title = isGroup
    ? conversation.name ?? "Group"
    : conversation.user?.username ?? "Unknown User";

  const isOtherUserOnline =
    !isGroup && conversation.user && onlineUsers.includes(conversation.user.id);

  const subtitle = (() => {
    if (isGroup && !isActive) {
      return "You're no longer a member";
    }

    if (typingUsers.length > 0) {
      return isGroup
        ? `${typingUsers[0].username} is typing...`
        : "typing...";
    }

    if (isGroup) {
      const count = (conversation.participants?.length ?? 0) + 1;
      return `${count} member${count === 1 ? "" : "s"}`;
    }

    if (isOtherUserOnline) return "Online";

    return formatLastSeen(
      getLastSeen(conversation.user?.id, conversation.user?.lastSeenAt)
    );
  })();

  return (
    <header className="relative flex h-16 items-center gap-1 border-b border-gray-200 px-3 md:px-6">
      <button
        type="button"
        onClick={() => setSelectedConversation(null)}
        title="Back to conversations"
        className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
      >
        <ArrowLeft size={20} />
      </button>

      <button
        type="button"
        onClick={onOpenInfo}
        className="flex flex-1 items-center gap-3 rounded-lg text-left"
      >
        {isGroup ? (
          <Avatar name={title} src={conversation.avatarUrl} icon={Users} />
        ) : (
          <Avatar name={title} src={conversation.user?.avatarUrl} online={isOtherUserOnline} />
        )}

        <div>
          <h2 className="text-lg font-semibold">{title}</h2>

          <p
            className={`flex items-center gap-1 text-sm ${
              isGroup && !isActive ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {isGroup && !isActive && <Lock size={12} />}
            {subtitle}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => setShowSearch((prev) => !prev)}
        title="Search in conversation"
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <Search size={20} />
      </button>

      <MessageSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        conversationId={conversation.id}
      />
    </header>
  );
}
