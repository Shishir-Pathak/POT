
// src/services/api.js
import axios from "axios";

const PROD_FALLBACK =
  "https://portfolio-backend.onrender.com";

const DEV_FALLBACK =
  "http://localhost:5000";

const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? DEV_FALLBACK
    : PROD_FALLBACK);

const API_ORIGIN = String(rawBase)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Cookie-based authentication is handled automatically by Axios.
    // Do not read or store the HTTP-only cookie in JavaScript.

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      config.headers.delete?.("Content-Type");

      if (config.headers.set) {
        config.headers.set("Content-Type", undefined);
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isLoginRequest = url.includes("/auth/login");
      const onLoginPage =
        window.location.pathname.includes("/login");

      if (!isLoginRequest && !onLoginPage) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.log(
    "API base URL:",
    api.defaults.baseURL
  );
}

export default api;
