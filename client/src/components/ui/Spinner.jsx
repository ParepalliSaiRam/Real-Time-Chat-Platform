export default function Spinner({ size = 20, className = "" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
