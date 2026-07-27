import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1 className="mb-4 text-4xl font-bold">
        Welcome, {user?.username}
      </h1>

      <p className="mb-8 text-gray-600">
        Your real-time collaboration platform is ready.
      </p>

      <button
        onClick={logout}
        className="rounded-lg bg-red-500 px-5 py-3 text-white hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}