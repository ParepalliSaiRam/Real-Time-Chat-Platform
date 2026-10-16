import { useEffect, useState } from "react";
import { getFileUrl } from "../../utils/fileUrl";
import { colorForName, initialsForName } from "../../utils/avatarColor";
import { useAvatarPreview } from "../../context/AvatarPreviewContext";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const ICON_SIZES = {
  sm: 14,
  md: 18,
  lg: 26,
};

export default function Avatar({ name = "?", size = "md", online, src, icon: Icon }) {
  const avatarPreview = useAvatarPreview();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initials = initialsForName(name);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    avatarPreview?.previewAvatar({ name, src, icon: Icon });
  };

  return (
    <div
      className="relative inline-flex shrink-0 cursor-pointer"
      onClick={handleClick}
    >
      {src && !imageFailed ? (
        <img
          src={getFileUrl(src)}
          alt={name}
          className={`rounded-full object-cover ${SIZES[size]}`}
          onError={() => setImageFailed(true)}
        />
      ) : Icon ? (
        <div
          className={`flex items-center justify-center rounded-full bg-blue-100 text-blue-700 ${SIZES[size]}`}
        >
          <Icon size={ICON_SIZES[size]} />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${colorForName(name)}`}
        >
          {initials}
        </div>
      )}

      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
            online ? "bg-green-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}
