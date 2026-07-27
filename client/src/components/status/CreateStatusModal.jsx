import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Type } from "lucide-react";
import toast from "react-hot-toast";

import { createStatus } from "../../api/status.api";
import Modal from "../ui/Modal";
import Button from "../common/Button";

const BACKGROUND_COLORS = [
  "#1e88e5",
  "#43a047",
  "#e53935",
  "#8e24aa",
  "#fb8c00",
  "#00897b",
  "#3949ab",
];

const MAX_TEXT_LENGTH = 700;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function CreateStatusModal({ open, onClose, onCreated }) {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [color, setColor] = useState(BACKGROUND_COLORS[0]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setMode("text");
    setText("");
    setColor(BACKGROUND_COLORS[0]);
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = "";

    if (!selected) return;

    if (selected.size > MAX_IMAGE_SIZE) {
      toast.error("Image is too large (max 5MB).");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setMode("photo");
  };

  const handlePost = async () => {
    try {
      setPosting(true);

      if (mode === "text") {
        if (!text.trim()) {
          toast.error("Write something first.");
          return;
        }

        await createStatus({ type: "TEXT", content: text.trim(), backgroundColor: color });
      } else {
        if (!file) {
          toast.error("Choose a photo first.");
          return;
        }

        await createStatus({ type: "IMAGE", content: caption.trim(), file });
      }

      toast.success("Status posted.");
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post status.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New status"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>

          <Button className="w-auto px-4" onClick={handlePost} disabled={posting}>
            {posting ? "Posting..." : "Post"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("text")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm ${
              mode === "text"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            <Type size={16} />
            Text
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm ${
              mode === "photo"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            <ImageIcon size={16} />
            Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {mode === "text" ? (
          <>
            <div
              className="flex h-40 items-center justify-center rounded-xl p-4 text-center text-lg font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {text.trim() || "Type your status..."}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
              placeholder="Type your status..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => setColor(swatch)}
                    style={{ backgroundColor: swatch }}
                    className={`h-7 w-7 rounded-full ${
                      color === swatch ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                  />
                ))}
              </div>

              <span className="text-xs text-gray-400">
                {text.length}/{MAX_TEXT_LENGTH}
              </span>
            </div>
          </>
        ) : (
          <>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Status preview"
                className="max-h-64 w-full rounded-lg object-contain"
              />
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
              >
                Click to choose a photo
              </button>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 700))}
              placeholder="Add a caption..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </>
        )}
      </div>
    </Modal>
  );
}
