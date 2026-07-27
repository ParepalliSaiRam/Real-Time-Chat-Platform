import { useState } from "react";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useStatus } from "../context/StatusContext";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import CreateStatusModal from "../components/status/CreateStatusModal";
import StatusViewer from "../components/status/StatusViewer";

export default function Status() {
  const { mine, friends, loading, loadFeed } = useStatus();
  const { user } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [viewerGroups, setViewerGroups] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openMine = () => {
    if (mine?.statuses?.length) {
      setViewerGroups([mine]);
      setViewerIndex(0);
    } else {
      setShowCreate(true);
    }
  };

  const openFriend = (index) => {
    setViewerGroups(friends);
    setViewerIndex(index);
  };

  const recent = friends.filter((g) => g.hasUnviewed);
  const viewed = friends.filter((g) => !g.hasUnviewed);

  const latestTime = (group) =>
    formatDistanceToNow(new Date(group.statuses[group.statuses.length - 1].createdAt), {
      addSuffix: true,
    });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Status</h1>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <button
          onClick={openMine}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-50"
        >
          <div className="relative">
            <Avatar
              name={user?.username}
              src={user?.avatarUrl}
              size="lg"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCreate(true);
              }}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus size={16} />
            </button>
          </div>

          <div>
            <h3 className="font-semibold">My status</h3>
            <p className="text-sm text-gray-500">
              {mine?.statuses?.length
                ? `${mine.statuses.length} update${mine.statuses.length === 1 ? "" : "s"} · ${latestTime(mine)}`
                : "Tap to add a status update"}
            </p>
          </div>
        </button>
      </section>

      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 text-gray-500">
          <Spinner size={18} />
          Loading statuses...
        </div>
      )}

      {!loading && recent.length === 0 && viewed.length === 0 && (
        <EmptyState
          title="No status updates"
          description="When your friends post a status update, it'll show up here."
        />
      )}

      {recent.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">
            Recent updates
          </h2>

          <div className="space-y-1">
            {recent.map((group) => (
              <button
                key={group.user.id}
                onClick={() => openFriend(friends.indexOf(group))}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-50"
              >
                <div className="shrink-0 rounded-full ring-2 ring-blue-500 ring-offset-2">
                  <Avatar
                    name={group.user.username}
                    src={group.user.avatarUrl}
                    size="lg"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{group.user.username}</h3>
                  <p className="text-sm text-gray-500">{latestTime(group)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {viewed.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 px-2 text-sm font-medium text-gray-500">
            Viewed updates
          </h2>

          <div className="space-y-1">
            {viewed.map((group) => (
              <button
                key={group.user.id}
                onClick={() => openFriend(friends.indexOf(group))}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left opacity-70 hover:bg-gray-50 hover:opacity-100"
              >
                <div className="shrink-0 rounded-full ring-2 ring-gray-300 ring-offset-2">
                  <Avatar
                    name={group.user.username}
                    src={group.user.avatarUrl}
                    size="lg"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{group.user.username}</h3>
                  <p className="text-sm text-gray-500">{latestTime(group)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <CreateStatusModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadFeed}
      />

      {viewerGroups && (
        <StatusViewer
          groups={viewerGroups}
          startIndex={viewerIndex}
          onClose={() => setViewerGroups(null)}
        />
      )}
    </div>
  );
}
