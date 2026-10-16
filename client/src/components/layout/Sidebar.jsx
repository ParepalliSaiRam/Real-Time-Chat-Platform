import {
  MessageSquare,
  Users,
  UsersRound,
  CircleDot,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";

const navItems = [
  {
    label: "Conversations",
    icon: MessageSquare,
    path: "/conversations",
  },
  {
    label: "Status",
    icon: CircleDot,
    path: "/status",
  },
  {
    label: "Friends",
    icon: Users,
    path: "/friends",
  },
  {
    label: "Groups",
    icon: UsersRound,
    path: "/groups",
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(17rem,86vw)] shrink-0 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:w-[15.5rem] lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-5 py-4">
          <img src="/brand-mark.svg" alt="" className="h-9 w-9 shrink-0" />

          <h1 className="flex-1 text-xl font-bold text-blue-600">
            ChatPlatform
          </h1>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <Icon size={20} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 border-t border-slate-200 p-4">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-gray-50"
          >
            {user?.username && (
              <Avatar name={user.username} src={user.avatarUrl} size="sm" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.username}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email}
              </p>
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            title="Log out"
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
