import { useEffect, useRef, useState } from "react";
import { Bell, Camera, Download } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { updateProfile, uploadAvatar } from "../api/user.api";
import Avatar from "../components/ui/Avatar";
import Button from "../components/common/Button";
import {
  getNotificationPreference,
  enablePushNotifications,
  disablePushNotifications,
  saveNotificationPreference,
} from "../utils/notifications";

const BIO_MAX_LENGTH = 150;

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [bio, setBio] = useState(user?.bio ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(() =>
    getNotificationPreference(user?.id)
  );
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

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

      const data = await updateProfile({ bio: bio.trim() });

      updateUser({ bio: data.user.bio });
      toast.success("Bio updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update bio.");
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const data = await updateProfile({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      updateUser(data.user);
      setUsername(data.user.username);
      setEmail(data.user.email);
      setPhone(data.user.phone ?? "");
      toast.success("Account details updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update account details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const bioChanged = bio.trim() !== (user?.bio ?? "");

  const handleNotificationChange = async (enabled) => {
    if (!enabled) {
      try {
        await disablePushNotifications();
        saveNotificationPreference(user?.id, false);
        setDesktopNotifications(false);
        toast.success("Push notifications turned off.");
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Could not turn notifications off.");
      }
      return;
    }

    try {
      await enablePushNotifications();
      saveNotificationPreference(user?.id, true);
      setDesktopNotifications(true);
      toast.success("Push notifications turned on.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not turn notifications on.");
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      toast.error("Could not open the install prompt. Try your browser menu instead.");
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  };

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div className="page-shell max-w-2xl">
      <header className="page-heading">
        <span className="page-eyebrow">Account</span>
        <h1 className="page-title">Your profile</h1>
        <p className="page-description">Manage how you appear to friends and groups.</p>
      </header>

      <section className="surface flex flex-col items-center gap-4 p-6 sm:p-8">
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

      <form onSubmit={handleSaveAccount} className="surface flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900">Account details</h2>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Username
          <input required minLength={3} maxLength={30} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
          <span className="text-xs font-normal text-gray-500">Must be unique. Letters, numbers, dots, dashes, and underscores are allowed.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Email
          <input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
          <span className="text-xs font-normal text-gray-500">Must be unique.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Phone number
          <input required type="tel" minLength={7} maxLength={25} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+1 555 123 4567" className="rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
          <span className="text-xs font-normal text-gray-500">Must be unique.</span>
        </label>
        <div className="flex justify-end">
          <Button className="w-auto px-4" disabled={savingProfile || !username.trim() || !email.trim() || !phone.trim()}>
            {savingProfile ? "Saving..." : "Save account details"}
          </Button>
        </div>
      </form>

      <section className="surface flex flex-col gap-3 p-5 sm:p-6">
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
            disabled={savingBio || savingProfile || !bioChanged}
            onClick={handleSaveBio}
          >
            {savingBio ? "Saving..." : "Save"}
          </Button>
        </div>
      </section>

      <section className="surface flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Bell size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Receive new message alerts even when ChatPlatform is closed. Allow notifications in your browser when prompted.
            </p>
          </div>
          <input
            type="checkbox"
            checked={desktopNotifications}
            onChange={(e) => handleNotificationChange(e.target.checked)}
            aria-label="Enable push notifications"
            className="mt-1 h-5 w-5 accent-blue-600"
          />
        </div>
        {isIos && (
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
            On iPhone or iPad, first add ChatPlatform to your Home Screen using Safari’s Share menu. Open it from the Home Screen, then enable notifications here.
          </p>
        )}
        {installPrompt && (
          <Button className="flex w-full items-center justify-center gap-2 sm:w-auto sm:self-start" onClick={handleInstall} disabled={installing}>
            <Download size={16} /> {installing ? "Opening install prompt…" : "Install ChatPlatform"}
          </Button>
        )}
        {!isIos && !installPrompt && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            On Android, open your browser menu and choose “Install app” or “Add to Home Screen” to use ChatPlatform like an app.
          </p>
        )}
        {typeof Notification !== "undefined" && Notification.permission === "denied" && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            Notifications are blocked by your browser. Change this site’s notification permission in browser settings to enable them.
          </p>
        )}
      </section>
    </div>
  );
}
