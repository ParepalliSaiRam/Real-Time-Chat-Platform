const BACKEND_URL =
  import.meta.env.VITE_SOCKET_URL;

export function getFileUrl(path) {
  if (!path) return "";

  if (path.startsWith("http")) {
    return path;
  }

  return `${BACKEND_URL}${path}`;
}