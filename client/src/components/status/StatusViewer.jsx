import { useEffect, useRef, useState } from "react";
import { X, Trash2, Eye, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { useStatus } from "../../context/StatusContext";
import { viewStatus, getStatusViewers, deleteStatus } from "../../api/status.api";
import { getFileUrl } from "../../utils/fileUrl";
import Avatar from "../ui/Avatar";

const DURATION_MS = 5000;

export default function StatusViewer({ groups, startIndex, onClose }) {
  const { user } = useAuth();
  const { loadFeed } = useStatus();

  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);

  const viewedRef = useRef(new Set());
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  const group = groups[groupIndex];
  const status = group?.statuses?.[statusIndex];
  const isMine = status?.user?.id === user?.id;

  const goNext = () => {
    if (!group) return;

    if (statusIndex + 1 < group.statuses.length) {
      setStatusIndex((i) => i + 1);
    } else if (groupIndex + 1 < groups.length) {
      setGroupIndex((i) => i + 1);
      setStatusIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (statusIndex > 0) {
      setStatusIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStatusIndex(prevGroup.statuses.length - 1);
    }
  };

  useEffect(() => {
    setProgress(0);
    setShowViewers(false);
    startTimeRef.current = Date.now();

    if (paused) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);

      if (pct >= 100) {
        goNext();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [groupIndex, statusIndex, paused]);

  useEffect(() => {
    if (!status || isMine || viewedRef.current.has(status.id)) return;

    viewedRef.current.add(status.id);
    viewStatus(status.id).catch(() => {});
  }, [status, isMine]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [groupIndex, statusIndex]);

  const handleShowViewers = async () => {
    setPaused(true);
    setShowViewers(true);

    try {
      const data = await getStatusViewers(status.id);
      setViewers(data.viewers);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load viewers.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this status?")) return;

    try {
      await deleteStatus(status.id);
      toast.success("Status deleted.");
      await loadFeed();

      if (group.statuses.length === 1) {
        onClose();
      } else {
        goNext();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete status.");
    }
  };

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 bg-gradient-to-b from-black/60 to-transparent p-3">
          <div className="flex gap-1">
            {group.statuses.map((s, i) => (
              <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${i < statusIndex ? 100 : i === statusIndex ? progress : 0}%`,
                    transition: i === statusIndex ? "none" : undefined,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-white">
            <Avatar name={group.user.username} src={group.user.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{group.user.username}</p>
              <p className="text-xs text-white/70">
                {formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })}
              </p>
            </div>

            <button
              onClick={() => setPaused((prev) => !prev)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
              title={paused ? "Play" : "Pause"}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>

            {isMine && (
              <button
                onClick={handleDelete}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
                title="Delete status"
              >
                <Trash2 size={18} />
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden">
          {status.type === "IMAGE" ? (
            <img
              src={getFileUrl(status.mediaUrl)}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center p-8 text-center text-2xl font-medium text-white"
              style={{ backgroundColor: status.backgroundColor || "#1e88e5" }}
            >
              {status.content}
            </div>
          )}

          <button
            onClick={goPrev}
            className="absolute left-0 top-0 flex h-full w-1/3 items-center justify-start pl-2 text-white/0 hover:text-white/70"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={goNext}
            className="absolute right-0 top-0 flex h-full w-1/3 items-center justify-end pr-2 text-white/0 hover:text-white/70"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {status.type === "IMAGE" && status.content && (
          <p className="bg-black/50 p-3 text-center text-sm text-white">
            {status.content}
          </p>
        )}

        {isMine && (
          <button
            onClick={handleShowViewers}
            className="flex items-center justify-center gap-2 bg-black/50 p-3 text-sm text-white hover:bg-black/70"
          >
            <Eye size={16} />
            {status.views?.length ?? 0} viewed
          </button>
        )}

        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-20 max-h-64 overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Viewed by</h3>
              <button
                onClick={() => {
                  setShowViewers(false);
                  setPaused(false);
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {viewers.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No views yet.
              </p>
            ) : (
              <div className="space-y-2">
                {viewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center gap-3">
                    <Avatar name={viewer.username} src={viewer.avatarUrl} size="sm" />
                    <span className="flex-1 text-sm">{viewer.username}</span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
