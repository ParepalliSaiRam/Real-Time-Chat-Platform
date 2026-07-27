import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { loginUser } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(formData);

      login(data.user, data.token);

      navigate(
        from ? `${from.pathname}${from.search ?? ""}` : "/",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>

        <p className="mt-2 text-gray-500">
          Sign in to continue chatting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
        />

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Don't have an account?{" "}
        <Link
          to="/register"
          state={from ? { from } : undefined}
          className="font-semibold text-blue-600 hover:underline"
        >
          Create Account
        </Link>
      </p>
    </Card>
  );
}