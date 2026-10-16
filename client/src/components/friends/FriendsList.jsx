import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { getFriends } from "../../api/friend.api";
import FriendCard from "./FriendCard";
import { ListRowSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    try {
      const data = await getFriends();

      setFriends(data.friends);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  return (
    <section className="surface p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
        Your Friends
      </h2>

      {loading && <ListRowSkeleton count={4} />}

      {!loading && friends.length === 0 && (
        <EmptyState
          icon={Users}
          title="No friends yet"
          description="Search for people above and send a friend request to get started."
        />
      )}

      <div className="space-y-3">
        {friends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
          />
        ))}
      </div>
    </section>
  );
}
