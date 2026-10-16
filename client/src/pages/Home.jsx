import { ArrowRight, CircleDot, MessageSquare, Users, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const destinations = [
  { label: "Conversations", description: "Continue a chat with your friends.", to: "/conversations", icon: MessageSquare, iconStyle: "bg-blue-50 text-blue-700" },
  { label: "Friends", description: "Find people and manage requests.", to: "/friends", icon: Users, iconStyle: "bg-violet-50 text-violet-700" },
  { label: "Groups", description: "Bring people together in a group.", to: "/groups", icon: UsersRound, iconStyle: "bg-emerald-50 text-emerald-700" },
  { label: "Status", description: "Share a moment with your circle.", to: "/status", icon: CircleDot, iconStyle: "bg-amber-50 text-amber-700" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-6 py-8 text-white shadow-lg shadow-blue-900/10 sm:px-10 sm:py-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-blue-100">Your space to connect</p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {user?.username}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Catch up with friends, continue a conversation, or share what’s happening today.</p>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Jump back in</h2>
          <p className="mt-1 text-sm text-slate-500">Choose where you’d like to go.</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {destinations.map(({ label, description, to, icon: Icon, iconStyle }) => (
            <Link key={to} to={to} className="group flex min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={20} /></span>
              <span className="flex items-center justify-between font-semibold text-slate-900">
                {label}<ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </span>
              <span className="mt-1 text-sm leading-5 text-slate-500">{description}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
