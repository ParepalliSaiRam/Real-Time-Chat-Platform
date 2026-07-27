import {
  MessageSquare,
  Users,
  UsersRound,
  CircleDot,
  MessageCircle,
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
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 transform flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 p-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <MessageCircle size={20} strokeWidth={2.5} />
          </div>

          <h1 className="flex-1 text-xl font-bold text-blue-600">
            ChatPlatform
          </h1>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
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
                          ? "bg-blue-100 text-blue-700 font-semibold"
                          : "hover:bg-blue-50"
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

        <div className="flex items-center gap-3 border-t border-gray-200 p-4">
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
