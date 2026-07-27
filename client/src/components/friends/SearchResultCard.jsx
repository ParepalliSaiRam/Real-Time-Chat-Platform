import { useState } from "react";
import toast from "react-hot-toast";
import { sendFriendRequest } from "../../api/friend.api";
import Avatar from "../ui/Avatar";

export default function SearchResultCard({ user }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendRequest = async () => {
    try {
      setLoading(true);

      await sendFriendRequest(user.id);

      setSent(true);
      toast.success(`Friend request sent to ${user.username}.`);
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Failed to send friend request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={user.username} src={user.avatarUrl} />

        <div>
          <h3 className="font-semibold">
            {user.username}
          </h3>

          <p className="text-sm text-gray-500">
            {user.email}
          </p>
        </div>
      </div>

      <button
        onClick={handleSendRequest}
        disabled={loading || sent}
        className={`rounded-lg px-4 py-2 text-white transition ${
          sent
            ? "bg-green-600"
            : "bg-blue-600 hover:bg-blue-700"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {loading
          ? "Sending..."
          : sent
          ? "Request Sent"
          : "Add Friend"}
      </button>
    </div>
  );
}