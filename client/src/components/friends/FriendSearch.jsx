import { useEffect, useState } from "react";
import { searchUsers } from "../../api/friend.api";
import SearchResultCard from "./SearchResultCard";

export default function FriendSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const data = await searchUsers(trimmed);

        setUsers(data.users);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="surface p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
        Search Users
      </h2>

      <input
        type="text"
        placeholder="Search by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      />

      <div className="mt-5 space-y-3">
        {loading && (
          <p className="text-gray-500">
            Searching...
          </p>
        )}

        {!loading &&
          users.map((user) => (
            <SearchResultCard
              key={user.id}
              user={user}
            />
          ))}

        {!loading &&
          query &&
          users.length === 0 && (
            <p className="text-gray-500">
              No users found.
            </p>
          )}
      </div>
    </section>
  );
}
