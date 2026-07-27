import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadAvatar } from "../api/user.api";
import Avatar from "../components/ui/Avatar";
import Button from "../components/common/Button";

const BIO_MAX_LENGTH = 150;

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [bio, setBio] = useState(user?.bio ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
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

      const data = await uploadAvatar(file);

      updateUser({ avatarUrl: data.user.avatarUrl });
      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload profile picture."
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveBio = async () => {
    try {
      setSavingBio(true);

      const data = await updateProfile(bio.trim());

      updateUser({ bio: data.user.bio });
      toast.success("Bio updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bio.");
    } finally {
      setSavingBio(false);
    }
  };

  const bioChanged = bio.trim() !== (user?.bio ?? "");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Your Profile</h1>

      <section className="flex flex-col items-center gap-4 rounded-xl border bg-white p-8 shadow-sm">
        <div className="relative inline-block">
          <Avatar name={user?.username} src={user?.avatarUrl} size="lg" />

          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            title="Change profile picture"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Camera size={14} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <div className="text-center">
          <h2 className="text-lg font-semibold">{user?.username}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-white p-6 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Bio</label>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          placeholder="Tell people a bit about yourself..."
          rows={3}
          className="resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {bio.length}/{BIO_MAX_LENGTH}
          </span>

          <Button
            className="w-auto px-4"
            disabled={savingBio || !bioChanged}
            onClick={handleSaveBio}
          >
            {savingBio ? "Saving..." : "Save"}
          </Button>
        </div>
      </section>
    </div>
  );
}
