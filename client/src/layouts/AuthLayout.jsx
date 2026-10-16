import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-blue-50 via-slate-50 to-slate-100 p-4 sm:p-6">
      <Outlet />
    </main>
  );
}
