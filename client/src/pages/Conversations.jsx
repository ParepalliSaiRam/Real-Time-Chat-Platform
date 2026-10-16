import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import InfoPanel from "../components/chat/InfoPanel";
import MessageInput from "../components/chat/MessageInput";
import MessageList from "../components/chat/MessageList";

import { useConversation } from "../context/ConversationContext";
import { useMessage } from "../context/MessageContext";
import { useSocket } from "../context/SocketContext";

export default function Conversations() {
  const {
    selectedConversation,
    restoredConversationId,
    completeConversationRestore,
    markConversationRead,
  } = useConversation();
  const { loadMessages } = useMessage();
  const { socket } = useSocket();
  const [showInfo, setShowInfo] = useState(false);
  const restoringConversationRef = useRef(null);

  useEffect(() => {
    if (
      !restoredConversationId ||
      selectedConversation?.id !== restoredConversationId ||
      !socket ||
      restoringConversationRef.current === restoredConversationId
    ) {
      return undefined;
    }

    const conversationId = restoredConversationId;
    restoringConversationRef.current = conversationId;

    socket.emit("join-conversation", { conversationId });
    loadMessages(conversationId).then(() => {
      socket.emit("mark-read", { conversationId });
      markConversationRead(conversationId);
      completeConversationRestore(conversationId);
    });
  }, [
    restoredConversationId,
    selectedConversation?.id,
    socket,
    loadMessages,
    markConversationRead,
    completeConversationRestore,
  ]);

  useEffect(() => {
    setShowInfo(false);
  }, [selectedConversation?.id]);

  const isRestrictedGroupMember =
    selectedConversation?.isGroup &&
    selectedConversation.onlyAdminsCanMessage &&
    !selectedConversation.isAdmin;

  const canSend =
    selectedConversation &&
    (!selectedConversation.isGroup || selectedConversation.isActive !== false) &&
    !selectedConversation.blockedByMe &&
    !isRestrictedGroupMember;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden bg-white lg:grid-cols-[minmax(18rem,0.32fr)_minmax(0,0.68fr)]">
      <aside
        className={`h-full min-h-0 min-w-0 border-r border-slate-200 lg:block ${
          selectedConversation ? "hidden" : "block"
        }`}
      >
        <ConversationList />
      </aside>

      <section
        className={`h-full min-h-0 min-w-0 flex-col lg:col-start-2 lg:flex ${
          selectedConversation ? "flex" : "hidden"
        }`}
      >
        {showInfo ? (
          <InfoPanel
            conversation={selectedConversation}
            onClose={() => setShowInfo(false)}
          />
        ) : (
          <>
            <ChatHeader
              conversation={selectedConversation}
              onOpenInfo={() => setShowInfo(true)}
            />

            <MessageList />

            {canSend && <MessageInput />}

            {selectedConversation && !canSend && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 p-4 text-sm text-gray-500">
                <Lock size={14} />
                {selectedConversation.blockedByMe
                  ? "You've blocked this user - unblock them from the info panel to send messages."
                  : isRestrictedGroupMember
                  ? "Only admins can send messages in this group."
                  : "You're no longer a member of this group - you can view past messages but can't send new ones."}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
