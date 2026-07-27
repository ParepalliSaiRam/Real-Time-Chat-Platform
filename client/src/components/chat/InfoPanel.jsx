import { useEffect, useRef, useState } from "react";
import {
  X,
  ArrowLeft,
  Crown,
  LogOut,
  Bell,
  BellOff,
  Ban,
  ShieldCheck,
  Lock,
  Users,
  Camera,
  Share2,
  Copy,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import { useConversation } from "../../context/ConversationContext";
import { usePresence } from "../../context/PresenceContext";
import { getFriends } from "../../api/friend.api";
import {
  renameGroup,
  updateGroupDescription,
  updateGroupAvatar,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  promoteGroupAdmin,
  demoteGroupAdmin,
  updateGroupSettings,
  getGroupInvite,
  generateGroupInvite,
  revokeGroupInvite,
} from "../../api/group.api";
import { muteConversation } from "../../api/conversation.api";
import { blockUser, unblockUser } from "../../api/user.api";

import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";

export default function InfoPanel({ onClose, conversation }) {
  const { loadConversations, patchConversation } = useConversation();
  const { onlineUsers, getLastSeen } = usePresence();

  const [friends, setFriends] = useState([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!conversation?.isGroup) return;

    getFriends()
      .then((data) => setFriends(data.friends))
      .catch((error) => console.error(error));
  }, [conversation?.isGroup]);

  useEffect(() => {
    if (!conversation?.isGroup || !conversation?.isAdmin) return;

    getGroupInvite(conversation.id)
      .then((data) => setInviteCode(data.inviteCode))
      .catch((error) => console.error(error));
  }, [conversation?.isGroup, conversation?.isAdmin, conversation?.id]);

  useEffect(() => {
    setName(conversation?.name ?? "");
  }, [conversation?.id, conversation?.name]);

  useEffect(() => {
    setDescription(conversation?.description ?? "");
  }, [conversation?.id, conversation?.description]);

  if (!conversation) return null;

  const isGroup = conversation.isGroup;
  const isActive = !isGroup || conversation.isActive !== false;
  const isMuted = Boolean(conversation.mutedAt);
  const canEditInfo =
    isGroup && (conversation.isAdmin || !conversation.onlyAdminsCanEditInfo);

  const memberIds = new Set(conversation.participants?.map((p) => p.id) ?? []);
  const addableFriends = friends.filter((f) => !memberIds.has(f.id));

  const inviteLink = inviteCode
    ? `${window.location.origin}/groups/join/${inviteCode}`
    : null;

  const run = async (fn) => {
    try {
      setBusy(true);
      await fn();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleMute = () =>
    run(async () => {
      const data = await muteConversation(conversation.id);
      patchConversation(conversation.id, { mutedAt: data.mutedAt });
      toast.success(data.mutedAt ? "Conversation muted." : "Conversation unmuted.");
    });

  const handleToggleBlock = () =>
    run(async () => {
      if (conversation.blockedByMe) {
        await unblockUser(conversation.user.id);
        patchConversation(conversation.id, { blockedByMe: false });
        toast.success(`Unblocked ${conversation.user.username}.`);
      } else {
        await blockUser(conversation.user.id);
        patchConversation(conversation.id, { blockedByMe: true });
        toast.success(`Blocked ${conversation.user.username}.`);
      }
    });

  const isOtherUserOnline =
    !isGroup && conversation.user && onlineUsers.includes(conversation.user.id);

  const handleToggleSetting = (key) =>
    run(async () => {
      const data = await updateGroupSettings(conversation.id, {
        [key]: !conversation[key],
      });
      patchConversation(conversation.id, {
        onlyAdminsCanEditInfo: data.group.onlyAdminsCanEditInfo,
        onlyAdminsCanMessage: data.group.onlyAdminsCanMessage,
      });
      toast.success("Group settings updated.");
    });

  const handleGenerateInvite = () =>
    run(async () => {
      setInviteLoading(true);
      try {
        const data = await generateGroupInvite(conversation.id);
        setInviteCode(data.inviteCode);
        toast.success("Invite link generated.");
      } finally {
        setInviteLoading(false);
      }
    });

  const handleRevokeInvite = () =>
    run(async () => {
      setInviteLoading(true);
      try {
        await revokeGroupInvite(conversation.id);
        setInviteCode(null);
        toast.success("Invite link revoked.");
      } finally {
        setInviteLoading(false);
      }
    });

  const handleCopyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied.");
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Image is too large (max 5MB).");
      e.target.value = "";
      return;
    }

    try {
      setUploadingAvatar(true);

      await updateGroupAvatar(conversation.id, file);
      await loadConversations();

      toast.success("Group photo updated.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update group photo."
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 p-4">
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-lg font-semibold">
          {isGroup ? "Group info" : "Contact info"}
        </h2>
      </div>

        <div className="flex flex-col items-center gap-2 border-b border-gray-200 p-6">
          <div className="relative inline-block">
            <Avatar
              name={isGroup ? conversation.name : conversation.user?.username}
              src={isGroup ? conversation.avatarUrl : conversation.user?.avatarUrl}
              icon={isGroup ? Users : undefined}
              size="lg"
              online={isGroup ? undefined : isOtherUserOnline}
            />

            {isGroup && isActive && canEditInfo && (
              <>
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  title="Change group photo"
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Camera size={12} />
                </button>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </>
            )}
          </div>

          {isGroup ? (
            <>
              <h3 className="text-xl font-semibold">{conversation.name}</h3>
              <p className="text-sm text-gray-500">
                {(conversation.participants?.length ?? 0) + 1} members
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold">
                {conversation.user?.username}
              </h3>
              <p className="text-sm text-gray-500">
                {isOtherUserOnline
                  ? "Online"
                  : formatLastSeen(
                      getLastSeen(
                        conversation.user?.id,
                        conversation.user?.lastSeenAt
                      )
                    )}
              </p>

              {conversation.user?.bio && (
                <p className="mt-2 max-w-xs text-center text-sm text-gray-600">
                  {conversation.user.bio}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 border-b border-gray-200 p-4">
          <button
            disabled={busy}
            onClick={handleToggleMute}
            className="flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-gray-50 disabled:opacity-60"
          >
            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
            {isMuted ? "Unmute conversation" : "Mute conversation"}
          </button>

          {!isGroup && (
            <button
              disabled={busy}
              onClick={handleToggleBlock}
              className={`flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-red-50 disabled:opacity-60 ${
                conversation.blockedByMe ? "text-gray-700" : "text-red-600"
              }`}
            >
              {conversation.blockedByMe ? (
                <ShieldCheck size={18} />
              ) : (
                <Ban size={18} />
              )}
              {conversation.blockedByMe
                ? `Unblock ${conversation.user?.username}`
                : `Block ${conversation.user?.username}`}
            </button>
          )}
        </div>

        {isGroup && !isActive && (
          <div className="flex items-center gap-2 p-4 text-sm text-gray-400">
            <Lock size={14} />
            You're no longer a member - you can view history but can't manage
            this group.
          </div>
        )}

        {isGroup && isActive && (
          <>
            {canEditInfo && (
              <div className="border-b border-gray-200 p-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Group name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                  <button
                    disabled={busy || name.trim().length < 3}
                    onClick={() =>
                      run(async () => {
                        await renameGroup(conversation.id, name.trim());
                        await loadConversations();
                        toast.success("Group renamed.");
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {canEditInfo ? (
              <div className="border-b border-gray-200 p-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, 500))
                  }
                  placeholder="Add a description for this group..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {description.length}/500
                  </span>
                  <button
                    disabled={busy || description.trim() === (conversation.description ?? "")}
                    onClick={() =>
                      run(async () => {
                        await updateGroupDescription(
                          conversation.id,
                          description.trim()
                        );
                        await loadConversations();
                        toast.success("Group description updated.");
                      })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              conversation.description && (
                <div className="border-b border-gray-200 p-4">
                  <h3 className="mb-1 text-sm font-medium text-gray-700">
                    Description
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {conversation.description}
                  </p>
                </div>
              )
            )}

            <div className="border-b border-gray-200 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                {(conversation.participants?.length ?? 0) + 1} Members
              </h3>

              <div className="space-y-2">
                {(conversation.participants ?? []).map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={member.username} src={member.avatarUrl} size="sm" />
                      <span className="truncate">{member.username}</span>
                      {member.isAdmin && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-amber-600">
                          <Crown size={12} /> admin
                        </span>
                      )}
                    </div>

                    {conversation.isAdmin && (
                      <div className="flex shrink-0 items-center gap-2">
                        {member.isAdmin ? (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await demoteGroupAdmin(conversation.id, member.id);
                                await loadConversations();
                                toast.success(`${member.username} is no longer an admin.`);
                              })
                            }
                            className="text-xs text-gray-600 hover:underline"
                          >
                            Remove admin
                          </button>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await promoteGroupAdmin(conversation.id, member.id);
                                await loadConversations();
                                toast.success(`${member.username} is now an admin.`);
                              })
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Make admin
                          </button>
                        )}

                        {!member.isAdmin && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await removeGroupMember(conversation.id, member.id);
                                await loadConversations();
                                toast.success("Member removed.");
                              })
                            }
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Remove member"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {conversation.isAdmin && (
              <div className="border-b border-gray-200 p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-700">
                  Group settings
                </h3>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        Edit group info
                      </p>
                      <p className="text-xs text-gray-500">
                        Who can change the name, photo, and description
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => handleToggleSetting("onlyAdminsCanEditInfo")}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        conversation.onlyAdminsCanEditInfo
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {conversation.onlyAdminsCanEditInfo ? "Only admins" : "All members"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        Send messages
                      </p>
                      <p className="text-xs text-gray-500">
                        Who can send messages in this group
                      </p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => handleToggleSetting("onlyAdminsCanMessage")}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        conversation.onlyAdminsCanMessage
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {conversation.onlyAdminsCanMessage ? "Only admins" : "All members"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {conversation.isAdmin && (
              <div className="border-b border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Share2 size={14} />
                  Invite via link
                </h3>

                {inviteLink ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={inviteLink}
                        onClick={(e) => e.target.select()}
                        className="flex-1 truncate rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 outline-none"
                      />
                      <button
                        onClick={handleCopyInvite}
                        title="Copy link"
                        className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-100"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={inviteLoading || busy}
                        onClick={handleGenerateInvite}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-60"
                      >
                        <RefreshCw size={12} />
                        Reset link
                      </button>
                      <button
                        disabled={inviteLoading || busy}
                        onClick={handleRevokeInvite}
                        className="text-xs text-red-600 hover:underline disabled:opacity-60"
                      >
                        Revoke link
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={inviteLoading || busy}
                    onClick={handleGenerateInvite}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {inviteLoading ? "Generating..." : "Generate invite link"}
                  </button>
                )}
              </div>
            )}

            {conversation.isAdmin && (
              <div className="border-b border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Add friends
                </h3>

                {addableFriends.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {friends.length === 0
                      ? "You don't have any friends to add yet. Add some from the Friends page first."
                      : "All your friends are already in this group."}
                  </p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {addableFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar name={friend.username} src={friend.avatarUrl} size="sm" />
                          <span className="truncate">{friend.username}</span>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await addGroupMembers(conversation.id, [friend.id]);
                              await loadConversations();
                              toast.success("Member added.");
                            })
                          }
                          className="shrink-0 text-xs text-blue-600 hover:underline"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await leaveGroup(conversation.id);
                    await loadConversations();
                    onClose();
                    toast.success("You left the group.");
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <LogOut size={16} />
                Leave group
              </button>
            </div>
          </>
        )}
      </div>
  );
}

