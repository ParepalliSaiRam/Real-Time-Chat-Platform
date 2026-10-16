import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MessageCircle, MessageSquare, Search, Users } from "lucide-react";

import { useConversation } from "../../context/ConversationContext";
import { useMessage } from "../../context/MessageContext";
import ConversationCard from "./ConversationCard";
import { getSocket } from "../../services/socket";
import { searchAllMessages } from "../../api/message.api";
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

  const { loadMessages, clearMessages, jumpToMessage } = useMessage();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("all");
  const [messageResults, setMessageResults] = useState([]);
  const [searchingMessages, setSearchingMessages] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    if (trimmed.length < 2) {
      setMessageResults([]);
      setSearchingMessages(false);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      setSearchingMessages(true);
      try {
        const data = await searchAllMessages(trimmed);
        if (!cancelled) setMessageResults(data.results ?? []);
      } catch (error) {
        if (!cancelled) {
          setMessageResults([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) setSearchingMessages(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

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

  const handleMessageResult = async (result, conversation) => {
    if (!conversation) return;

    const socket = getSocket();
    if (selectedConversation?.id !== conversation.id) {
      if (socket && selectedConversation) {
        socket.emit("leave-conversation", {
          conversationId: selectedConversation.id,
        });
      }

      clearMessages();
      setSelectedConversation(conversation);
      socket?.emit("join-conversation", { conversationId: conversation.id });
    }

    await jumpToMessage(conversation.id, result.id);
    markConversationRead(conversation.id);
    socket?.emit("mark-read", { conversationId: conversation.id });
  };

  const visibleConversations = conversations.filter(
    (conversation) => conversation.isGroup || conversation.hasMessages
  );

  if (loading) {
    return <ListRowSkeleton count={5} />;
  }

  if (visibleConversations.length === 0) {
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
    ? visibleConversations.filter((conversation) => {
        const title = conversation.isGroup
          ? conversation.name ?? ""
          : conversation.user?.username ?? "";

        return title.toLowerCase().includes(trimmedQuery);
      })
    : visibleConversations;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white p-3">
        <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
          <Search size={16} className="shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setSearchMode("all");
            }}
            placeholder="Search chats and messages"
            aria-label="Search chats and messages"
            className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        {trimmedQuery && (
          <div className="mt-2 flex gap-1 rounded-lg bg-slate-100 p-1">
            {[
              { id: "all", label: "All" },
              { id: "chats", label: "Chats" },
              { id: "messages", label: "Messages" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchMode(tab.id)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  searchMode === tab.id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
        {!trimmedQuery ? (
          visibleConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              active={selectedConversation?.id === conversation.id}
              onSelect={handleSelect}
            />
          ))
        ) : (
          <>
            {(searchMode === "all" || searchMode === "chats") && (
              <section>
                <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Users size={13} /> Chats
                </div>
                {filteredConversations.length > 0 ? (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        active={selectedConversation?.id === conversation.id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="px-2 py-2 text-xs text-slate-400">No matching chats.</p>
                )}
              </section>
            )}

            {(searchMode === "all" || searchMode === "messages") && (
              <section className={searchMode === "all" ? "mt-5" : ""}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <MessageCircle size={13} /> Messages
                  </div>
                  {messageResults.length > 0 && (
                    <span className="text-[11px] text-slate-400">{messageResults.length} results</span>
                  )}
                </div>

                {trimmedQuery.length < 2 ? (
                  <p className="px-2 py-2 text-xs text-slate-400">Type at least 2 characters to search messages.</p>
                ) : searchingMessages ? (
                  <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                    Searching messages...
                  </div>
                ) : messageResults.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-slate-400">No matching messages.</p>
                ) : (
                  <div className="space-y-1">
                    {messageResults.map((result) => {
                      const conversation = conversations.find(
                        (item) => item.id === result.conversationId
                      );
                      const title = conversation?.isGroup
                        ? conversation.name || "Group"
                        : conversation?.user?.username || result.sender.username;

                      return (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleMessageResult(result, conversation)}
                          className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-blue-100 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-slate-700">{title}</span>
                            <time className="shrink-0 text-[10px] text-slate-400">
                              {format(new Date(result.createdAt), "MMM d, h:mm a")}
                            </time>
                          </div>
                          <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
                            <span className="font-medium text-slate-600">{result.sender.username}: </span>
                            {result.content}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
