
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // Step 1: Authenticate admin
      const loginResponse = await api.post(
        "/auth/login",
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      if (!loginResponse.data?.success) {
        throw new Error(
          loginResponse.data?.message ||
            "Login failed. Please try again."
        );
      }

      // Step 2: Verify the session using the HTTP-only cookie
      const profileResponse = await api.get("/auth/me", {
        withCredentials: true,
      });

      if (!profileResponse.data?.success) {
        throw new Error(
          profileResponse.data?.message ||
            "Login succeeded, but your session could not be verified."
        );
      }

      // Step 3: Navigate only after session verification
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      console.error("Admin authentication error:", {
        status,
        message: serverMessage,
        error: err.message,
      });

      if (status === 401) {
        setError(
          serverMessage ||
            "Authentication failed. Please sign in again."
        );
      } else if (status === 403) {
        setError(
          serverMessage ||
            "You do not have permission to access this page."
        );
      } else if (err.response) {
        setError(
          serverMessage ||
            "The server could not complete your request."
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the server. Please check your connection."
        );
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to access your admin dashboard.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your admin email"
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
