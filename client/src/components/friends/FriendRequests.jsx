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
    <section className="surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserPlus size={18} />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Incoming requests
          </h2>
        </div>
        {!loading && requests.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </span>
        )}
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        {loading ? (
          <ListRowSkeleton count={2} />
        ) : requests.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
              <UserPlus size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">You’re all caught up</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                New friend requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          requests.map((request) => (
            <FriendRequestCard
              key={request.id}
              request={request}
              loading={processingId === request.id}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </section>
  );
}
