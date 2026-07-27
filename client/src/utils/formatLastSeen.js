import { formatDistanceToNow } from "date-fns";

export function formatLastSeen(timestamp) {
  if (!timestamp) return "Offline";

  return `Last seen ${formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  })}`;
}