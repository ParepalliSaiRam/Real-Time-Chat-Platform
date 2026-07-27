import { useState } from "react";
import { MessageSquare, Search } from "lucide-react";

import { useConversation } from "../../context/ConversationContext";
import { useMessage } from "../../context/MessageContext";
import ConversationCard from "./ConversationCard";
import { getSocket } from "../../services/socket";
import { ListRowSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

export default function ConversationList() {
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    markConversationRead,
    loading,
  } = useConversation();

  const { loadMessages, clearMessages } = useMessage();
  const [query, setQuery] = useState("");

  const handleSelect = async (conversation) => {
    if (selectedConversation?.id === conversation.id) {
      return;
    }

    const socket = getSocket();

    if (socket && selectedConversation) {
      socket.emit("leave-conversation", {
        conversationId: selectedConversation.id,
      });
    }

    clearMessages();

    setSelectedConversation(conversation);

    if (socket) {
      socket.emit("join-conversation", {
        conversationId: conversation.id,
      });
    }

    await loadMessages(conversation.id);

if (socket) {
  socket.emit("mark-read", {
    conversationId: conversation.id,
  });
}

    markConversationRead(conversation.id);

  };

  if (loading) {
    return <ListRowSkeleton count={5} />;
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Start chatting with a friend to see it here."
      />
    );
  }

  const trimmedQuery = query.trim().toLowerCase();

  const filteredConversations = trimmedQuery
    ? conversations.filter((conversation) => {
        const title = conversation.isGroup
          ? conversation.name ?? ""
          : conversation.user?.username ?? "";

        return title.toLowerCase().includes(trimmedQuery);
      })
    : conversations;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white p-3">
        <Search size={16} className="shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full min-w-0 text-sm outline-none"
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {filteredConversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">
            No conversations match "{query.trim()}".
          </p>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              active={selectedConversation?.id === conversation.id}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
