import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import InfoPanel from "../components/chat/InfoPanel";
import MessageInput from "../components/chat/MessageInput";
import MessageList from "../components/chat/MessageList";

import { useConversation } from "../context/ConversationContext";

export default function Conversations() {
  const { selectedConversation } = useConversation();
  const [showInfo, setShowInfo] = useState(false);

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
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border bg-white shadow-sm md:grid-cols-3">
      <aside
        className={`h-full min-h-0 border-r border-gray-200 md:block ${
          selectedConversation ? "hidden" : "block"
        }`}
      >
        <ConversationList />
      </aside>

      <section
        className={`h-full min-h-0 flex-col md:col-span-2 md:flex ${
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