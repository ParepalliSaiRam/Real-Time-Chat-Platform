import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import { useConversation } from "../context/ConversationContext";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const isConversationPage = pathname === "/conversations";
  const { selectedConversation } = useConversation();
  const hideMobileHeader = isConversationPage && selectedConversation;

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {}
        <header className={`flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden ${hideMobileHeader ? "hidden" : ""}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <img src="/brand-mark.svg" alt="" className="h-7 w-7" />
            <span className="font-bold text-blue-600">ChatPlatform</span>
          </div>
        </header>

        <main className={`flex min-h-0 flex-1 flex-col ${isConversationPage ? "overflow-hidden p-0" : "overflow-y-auto p-4 sm:p-6 lg:p-8"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
