import { useNavigate } from "react-router-dom";
import { useConversation } from "../../context/ConversationContext";
import { usePresence } from "../../context/PresenceContext";
import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";

export default function FriendCard({ friend }) {
  const navigate = useNavigate();

  const { startConversation } = useConversation();
  const { onlineUsers, getLastSeen } = usePresence();

  const isOnline = onlineUsers.includes(friend.id);

  const handleChat = async () => {
    try {
      await startConversation(friend.id);

      navigate("/conversations");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 transition hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={friend.username} src={friend.avatarUrl} online={isOnline} />

        <div className="min-w-0">
          <h3 className="truncate font-semibold">
            {friend.username}
          </h3>

          {!isOnline && (
            <p className="truncate text-xs text-gray-400">
              {formatLastSeen(getLastSeen(friend.id, friend.lastSeenAt))}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 sm:inline-block">
          {isOnline ? "Online" : "Friend"}
        </span>

        <button
          onClick={handleChat}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Chat
        </button>
      </div>
    </div>
  );
}