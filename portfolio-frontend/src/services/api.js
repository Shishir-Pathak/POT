
import axios from "axios";

const PROD_FALLBACK = "https://pot-78ue.onrender.com";
const DEV_FALLBACK = "http://localhost:5000";

const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEV_FALLBACK : PROD_FALLBACK);

const API_ORIGIN = String(rawBase)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// Add Bearer token if your frontend stores one after login.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      config.headers.set
        ? config.headers.set("Authorization", `Bearer ${token}`)
        : (config.headers.Authorization = `Bearer ${token}`);
    }

    // Let the browser set the multipart boundary for FormData.
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (config.headers.delete) {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or missing authentication.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isLoginRequest = url.includes("/auth/login");
      const isMeRequest = url.includes("/auth/me");
      const onLoginPage = window.location.pathname.includes("/login");

      if (!isLoginRequest && !onLoginPage) {
        localStorage.removeItem("adminToken");

        if (!isMeRequest) {
          window.location.href = "/admin/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.log("API base URL:", api.defaults.baseURL);
}

export default api;
