import FriendSearch from "../components/friends/FriendSearch";
import FriendRequests from "../components/friends/FriendRequests";
import FriendsList from "../components/friends/FriendsList";

export default function Friends() {
  return (
    <div className="page-shell max-w-7xl">
      <header className="page-heading">
        <span className="page-eyebrow">Your network</span>
        <h1 className="page-title">Friends</h1>
        <p className="page-description">Find people and keep up with your connections.</p>
      </header>

      <FriendSearch />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <FriendsList />
        <FriendRequests />
      </div>
    </div>
  );
}
