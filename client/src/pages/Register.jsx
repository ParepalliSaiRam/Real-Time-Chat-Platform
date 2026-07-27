import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import { registerUser } from "../api/auth.api";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from;

  const [formData, setFormData] = useState({
    username: "",
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

    if (
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser(formData);

      navigate("/login", { state: from ? { from } : undefined });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          Create Account
        </h1>

        <p className="mt-2 text-gray-500">
          Join the platform and start chatting.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Input
          label="Username"
          name="username"
          placeholder="Choose a username"
          value={formData.username}
          onChange={handleChange}
        />

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
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
        />

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{" "}
        <Link
          to="/login"
          state={from ? { from } : undefined}
          className="font-semibold text-blue-600 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </Card>
  );
}