import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Crown,
  Link2,
  MessageCircle,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";

import { useConversation } from "../context/ConversationContext";
import { getFriends } from "../api/friend.api";
import { createGroup, joinGroupByInvite } from "../api/group.api";

import Modal from "../components/ui/Modal";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/common/Button";

export default function Groups() {
  const navigate = useNavigate();
  const {
    conversations,
    loading,
    loadConversations,
    setSelectedConversation,
  } = useConversation();

  const groups = conversations.filter((c) => c.isGroup);

  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getFriends()
      .then((data) => setFriends(data.friends))
      .catch((error) => console.error(error));
  }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const openGroup = (group) => {
    setSelectedConversation(group);
    navigate("/conversations");
  };

  const filteredGroups = groups.filter((group) =>
    (group.name ?? "Group").toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="page-shell max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <header className="page-heading">
          <span className="page-eyebrow">Stay connected</span>
          <h1 className="page-title">Groups</h1>
          <p className="page-description">
            Your people, plans, and conversations in one place.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            type="button"
            onClick={() => setShowJoin(true)}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Link2 size={18} />
            Join with link
          </button>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Create group
          </button>
        </div>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Your groups</h2>
              <p className="text-sm text-slate-500">
                {groups.length} {groups.length === 1 ? "group" : "groups"} you belong to
              </p>
            </div>
          </div>

          <label className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-slate-400 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 sm:max-w-xs">
            <Search size={17} className="shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a group"
              aria-label="Find a group"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {loading && (
          <div className="flex min-h-48 items-center justify-center gap-2 p-6 text-gray-500">
            <Spinner size={18} />
            Loading groups...
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="px-4 py-10 sm:py-14">
            <EmptyState
              icon={UsersRound}
              title="Your group chats start here"
              description="Bring friends together to plan, share, and stay in sync."
              action={
                <Button className="w-auto px-4" onClick={() => setShowCreate(true)}>
                  <span className="flex items-center gap-2">
                    <Plus size={17} /> Create a group
                  </span>
                </Button>
              }
            />
          </div>
        )}

        {!loading && groups.length > 0 && filteredGroups.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            No groups match “{query.trim()}”. Try another name.
          </p>
        )}

        {!loading && filteredGroups.length > 0 && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => openGroup(group)}
                className="group flex min-h-40 w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-950/5 focus-visible:outline-blue-500 sm:p-5"
              >
                <div className="flex w-full items-start gap-3">
                  <Avatar
                    name={group.name}
                    src={group.avatarUrl}
                    icon={UsersRound}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold text-slate-900">
                        {group.name || "Untitled group"}
                      </h3>
                      <ArrowUpRight
                        size={17}
                        className="shrink-0 text-slate-300 transition group-hover:text-blue-600"
                      />
                    </div>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                      {group.lastMessage || "Start the conversation with your group."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <UsersRound size={14} />
                    {(group.participants?.length ?? 0) + 1} members
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {group.isAdmin ? (
                      <>
                        <Crown size={12} className="text-amber-500" /> Admin
                      </>
                    ) : (
                      <>
                        <MessageCircle size={12} /> Member
                      </>
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        friends={friends}
        onCreated={async (createdGroup) => {
          setSelectedConversation({
            id: createdGroup.id,
            isGroup: true,
            name: createdGroup.name,
            isAdmin: true,
            participants: createdGroup.participants
              .filter((p) => p.userId !== createdGroup.createdById)
              .map((p) => ({
                id: p.user.id,
                username: p.user.username,
                avatarUrl: p.user.avatarUrl,
                isAdmin: p.isAdmin,
              })),
            lastMessage: "",
            lastMessageAt: null,
          });

          await loadConversations();
          setShowCreate(false);
          toast.success("Group created.");
          navigate("/conversations");
        }}
      />

      <JoinGroupModal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={async (conversationId) => {
          const data = await loadConversations();

          const joined = data?.conversations?.find(
            (c) => c.id === conversationId
          );

          if (joined) setSelectedConversation(joined);

          setShowJoin(false);
          toast.success("Joined the group.");
          navigate("/conversations");
        }}
      />
    </div>
  );
}

function extractInviteCode(input) {
  const trimmed = input.trim();
  const segments = trimmed.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function JoinGroupModal({ open, onClose, onJoined }) {
  const [value, setValue] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const handleJoin = async () => {
    const code = extractInviteCode(value);

    if (!code) {
      toast.error("Paste an invite link or code first.");
      return;
    }

    try {
      setJoining(true);
      const data = await joinGroupByInvite(code);
      await onJoined(data.conversationId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to join this group."
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Join a group"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <Button
            className="w-auto px-4"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? "Joining..." : "Join"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-medium text-gray-700">
          Invite link or code
        </label>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
          placeholder="Paste an invite link or code"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500">
          Ask a group admin for their invite link, then paste it here to join
          directly.
        </p>
      </div>
    </Modal>
  );
}

function CreateGroupModal({ open, onClose, friends, onCreated }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setSelected([]);
    }
  }, [open]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (name.trim().length < 3) {
      toast.error("Group name must be at least 3 characters.");
      return;
    }

    if (selected.length === 0) {
      toast.error("Select at least one friend.");
      return;
    }

    try {
      setSaving(true);
      const data = await createGroup(name.trim(), selected);
      await onCreated(data.group);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create group."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Group"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <Button
            className="w-auto px-4"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Group name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Trip"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Add friends
          </label>

          {friends.length === 0 && (
            <p className="text-sm text-gray-500">
              You need friends to create a group. Add some from the Friends
              page first.
            </p>
          )}

          <div className="max-h-56 space-y-2 overflow-y-auto">
            {friends.map((friend) => (
              <label
                key={friend.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(friend.id)}
                  onChange={() => toggle(friend.id)}
                />
                <Avatar name={friend.username} src={friend.avatarUrl} size="sm" />
                <span>{friend.username}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
