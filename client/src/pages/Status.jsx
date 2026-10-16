import { useState } from "react";
import { ChevronDown, Clock3, Eye, Plus, UsersRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useStatus } from "../context/StatusContext";
import { useAuth } from "../context/AuthContext";
import { getFileUrl } from "../utils/fileUrl";
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

  const openFriend = (group) => {
    setViewerGroups(friends);
    setViewerIndex(friends.indexOf(group));
  };

  const recent = friends.filter((group) => group.hasUnviewed);
  const viewed = friends.filter((group) => !group.hasUnviewed);

  const latestTime = (group) =>
    formatDistanceToNow(
      new Date(group.statuses[group.statuses.length - 1].createdAt),
      { addSuffix: true }
    );

  return (
    <div className="page-shell max-w-6xl">
      <header className="page-heading">
        <span className="page-eyebrow">A moment from your circle</span>
        <h1 className="page-title">Status</h1>
        <p className="page-description">
          Share a quick update or see what your friends are up to.
        </p>
      </header>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={openMine}
              aria-label={mine?.statuses?.length ? "View your statuses" : "Create a status"}
              className="relative shrink-0 rounded-full p-1 transition hover:bg-blue-50 focus-visible:outline-blue-500"
            >
              <span className="block rounded-full ring-2 ring-dashed ring-blue-300 ring-offset-2">
                <Avatar name={user?.username} src={user?.avatarUrl} size="lg" />
              </span>
              {!mine?.statuses?.length && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm">
                  <Plus size={14} />
                </span>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900">Your status</h2>
                {mine?.statuses?.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {mine.statuses.length} {mine.statuses.length === 1 ? "update" : "updates"}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-slate-500">
                {mine?.statuses?.length
                  ? `Updated ${latestTime(mine)} · expires after 24 hours`
                  : "Share a photo or a thought with your friends."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add status
          </button>
        </div>

        {mine?.statuses?.length > 0 && (
          <button
            type="button"
            onClick={openMine}
            className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-left text-sm transition hover:bg-slate-50 sm:px-6"
          >
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Eye size={15} /> View your updates
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 size={13} /> 24 hour lifetime
            </span>
          </button>
        )}
      </section>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
          <Spinner size={18} /> Loading statuses...
        </div>
      ) : friends.length === 0 ? (
        <section className="surface px-4 py-8 sm:py-10">
          <EmptyState
            icon={UsersRound}
            title="No friend updates yet"
            description="When your friends share a status, it’ll show up here. You can post yours in the meantime."
            action={
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Create a status
              </button>
            }
          />
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {recent.length > 0 && (
            <section className="surface overflow-hidden">
              <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="font-semibold text-slate-900">Recent updates</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    New stories from your friends
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {recent.length} new
                </span>
              </header>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
                {recent.map((group) => (
                  <StoryCard
                    key={group.user.id}
                    group={group}
                    time={latestTime(group)}
                    onClick={() => openFriend(group)}
                  />
                ))}
              </div>
            </section>
          )}

          {viewed.length > 0 && (
            <details className="surface group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Eye size={17} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-800">Viewed updates</h2>
                    <p className="text-sm text-slate-500">
                      {viewed.length} {viewed.length === 1 ? "friend" : "friends"} · tap to expand
                    </p>
                  </div>
                </div>
                <ChevronDown className="text-slate-400 transition group-open:rotate-180" size={18} />
              </summary>

              <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
                {viewed.map((group) => (
                  <StoryCard
                    key={group.user.id}
                    group={group}
                    time={latestTime(group)}
                    onClick={() => openFriend(group)}
                    viewed
                  />
                ))}
              </div>
            </details>
          )}
        </div>
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

function StoryCard({ group, time, onClick, viewed = false }) {
  const latest = group.statuses[group.statuses.length - 1];
  const isImage = latest.type === "IMAGE" && latest.mediaUrl;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/story relative flex min-h-52 w-full flex-col overflow-hidden rounded-2xl border text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-blue-500 ${
        viewed
          ? "border-slate-200 bg-slate-100"
          : "border-blue-200 bg-blue-50 shadow-sm shadow-blue-950/5"
      }`}
    >
      {isImage ? (
        <img
          src={getFileUrl(latest.mediaUrl)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover/story:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: latest.backgroundColor || "#1e88e5" }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/70" />

      <div className="relative flex items-center gap-3 p-3.5">
        <span
          className={`rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-transparent ${
            viewed ? "ring-slate-300" : "ring-sky-300"
          }`}
        >
          <Avatar
            name={group.user.username}
            src={group.user.avatarUrl}
            size="md"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {group.user.username}
          </span>
          <span className="mt-0.5 block text-xs text-white/75">{time}</span>
        </span>
        {group.statuses.length > 1 && (
          <span className="rounded-full bg-black/25 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {group.statuses.length}
          </span>
        )}
      </div>

      <span className="relative mt-auto line-clamp-3 p-3.5 pt-8 text-sm font-medium leading-5 text-white">
        {latest.content || (isImage ? "Shared a photo" : "Tap to view status")}
      </span>
    </button>
  );
}
