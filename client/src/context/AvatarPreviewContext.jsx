import { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

import { getFileUrl } from "../utils/fileUrl";
import { colorForName, initialsForName } from "../utils/avatarColor";

const AvatarPreviewContext = createContext();

export function AvatarPreviewProvider({ children }) {
  const [preview, setPreview] = useState(null);

  const previewAvatar = ({ name, src, icon }) => {
    setPreview({ name, src, icon });
  };

  const closePreview = () => setPreview(null);

  const Icon = preview?.icon;

  return (
    <AvatarPreviewContext.Provider value={{ previewAvatar }}>
      {children}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={closePreview}
        >
          <button
            onClick={closePreview}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
          >
            <X size={24} />
          </button>

          <figure
            className="flex max-w-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.src ? (
              <img
                src={getFileUrl(preview.src)}
                alt={preview.name}
                className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
              />
            ) : Icon ? (
              <div className="flex h-56 w-56 max-h-[60vw] max-w-[60vw] items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Icon size={96} />
              </div>
            ) : (
              <div
                className={`flex h-56 w-56 max-h-[60vw] max-w-[60vw] items-center justify-center rounded-full text-8xl font-semibold text-white ${colorForName(
                  preview.name
                )}`}
              >
                {initialsForName(preview.name)}
              </div>
            )}

            {preview.name && (
              <figcaption className="text-sm font-medium text-white">
                {preview.name}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </AvatarPreviewContext.Provider>
  );
}

export function useAvatarPreview() {
  return useContext(AvatarPreviewContext);
}
