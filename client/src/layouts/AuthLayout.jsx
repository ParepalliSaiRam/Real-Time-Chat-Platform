import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Outlet />
    </main>
  );
}