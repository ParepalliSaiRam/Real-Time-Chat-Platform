import Avatar from "../ui/Avatar";

export default function FriendRequestCard({
  request,
  loading,
  onAccept,
  onReject,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={request.sender.username} src={request.sender.avatarUrl} />

        <h3 className="font-semibold">
          {request.sender.username}
        </h3>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Accept
        </button>

        <button
          onClick={() => onReject(request.id)}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
