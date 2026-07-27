import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, MessageCircle } from "lucide-react";

import Sidebar from "../components/layout/Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
              <MessageCircle size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-blue-600">ChatPlatform</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
