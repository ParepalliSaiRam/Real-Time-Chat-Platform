import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../api/friend.api";
import FriendRequestCard from "./FriendRequestCard";
import { ListRowSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = async () => {
    try {
      const data = await getFriendRequests();
      setRequests(data.requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      setProcessingId(requestId);

      await acceptFriendRequest(requestId);

      setRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );

      toast.success("Friend request accepted.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ??
          "Failed to accept request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);

      await rejectFriendRequest(requestId);

      setRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ??
          "Failed to reject request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">
        Incoming Requests
      </h2>

      {loading && <ListRowSkeleton count={3} />}

      {!loading && requests.length === 0 && (
        <EmptyState
          icon={UserPlus}
          title="No pending requests"
          description="Friend requests you receive will show up here."
        />
      )}

      <div className="space-y-3">
        {requests.map((request) => (
          <FriendRequestCard
            key={request.id}
            request={request}
            loading={processingId === request.id}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))}
      </div>
    </section>
  );
}