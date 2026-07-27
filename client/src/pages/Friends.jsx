import FriendSearch from "../components/friends/FriendSearch";
import FriendRequests from "../components/friends/FriendRequests";
import FriendsList from "../components/friends/FriendsList";

export default function Friends() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <FriendSearch />

      <FriendRequests />

      <FriendsList />
    </div>
  );
}