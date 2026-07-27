import { Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";

import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "./ProtectedRoute";

import Conversations from "../pages/Conversations";
import Friends from "../pages/Friends";
import Groups from "../pages/Groups";
import Profile from "../pages/Profile";
import JoinGroup from "../pages/JoinGroup";
import Status from "../pages/Status";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  <Route path="/" element={<Navigate to="/conversations" replace />} />

  <Route
    path="/conversations"
    element={<Conversations />}
  />

  <Route
    path="/friends"
    element={<Friends />}
  />

  <Route
    path="/groups"
    element={<Groups />}
  />

  <Route
    path="/profile"
    element={<Profile />}
  />

  <Route
    path="/groups/join/:code"
    element={<JoinGroup />}
  />

  <Route
    path="/status"
    element={<Status />}
  />
</Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}