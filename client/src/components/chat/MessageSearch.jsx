import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { format } from "date-fns";

import { searchMessages } from "../../api/message.api";
import { useMessage } from "../../context/MessageContext";
import Spinner from "../ui/Spinner";

export default function MessageSearch({ open, onClose, conversationId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { jumpToMessage } = useMessage();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchMessages(conversationId, trimmed);
        setResults(data.results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, open, conversationId]);

  if (!open) return null;

  const handleResultClick = async (messageId) => {
    await jumpToMessage(conversationId, messageId);
    onClose();
  };

  return (
    <div className="absolute inset-x-0 top-full z-20 border-b border-gray-200 bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-gray-200 p-3">
        <Search size={16} className="text-gray-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in this conversation..."
          className="flex-1 outline-none"
        />
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
            <Spinner size={14} />
            Searching...
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No messages found.
          </div>
        )}

        {!loading &&
          results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result.id)}
              className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 p-3 text-left hover:bg-gray-50"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  {result.sender.username}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(result.createdAt), "MMM d, hh:mm a")}
                </span>
              </div>
              <span className="line-clamp-2 text-sm text-gray-600">
                {result.content}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}