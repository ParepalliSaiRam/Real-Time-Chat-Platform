import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UsersRound, Plus, Crown, Lock, Link2 } from "lucide-react";
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Groups</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="w-auto px-4"
            onClick={() => setShowJoin(true)}
          >
            <span className="flex items-center gap-2">
              <Link2 size={18} />
              Join via link
            </span>
          </Button>

          <Button
            className="w-auto px-4"
            onClick={() => setShowCreate(true)}
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              New Group
            </span>
          </Button>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-6 text-gray-500">
            <Spinner size={18} />
            Loading groups...
          </div>
        )}

        {!loading && groups.length === 0 && (
          <EmptyState
            icon={UsersRound}
            title="No groups yet"
            description="Create a group to start chatting with multiple friends at once."
            action={
              <Button
                className="w-auto px-4"
                onClick={() => setShowCreate(true)}
              >
                Create your first group
              </Button>
            }
          />
        )}

        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => openGroup(group)}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition hover:shadow-sm"
            >
              <Avatar name={group.name} src={group.avatarUrl} icon={UsersRound} />

              <div className="min-w-0">
                <h3 className="truncate font-semibold">{group.name}</h3>
                <p className="flex items-center text-sm text-gray-500">
                  {group.isActive === false ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Lock size={12} /> No longer a member
                    </span>
                  ) : (
                    <>
                      {(group.participants?.length ?? 0) + 1} members
                      {group.isAdmin && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                          <Crown size={12} /> admin
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
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
