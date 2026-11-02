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

// ---- Safety nets for misconfigured env vars -------------------------------
if (!API_ORIGIN) {
  console.error(
    "[api] Empty API origin. Set VITE_API_URL in Vercel → Settings → Environment Variables, then redeploy."
  );
}
if (API_ORIGIN && !/^https?:\/\//i.test(API_ORIGIN)) {
  console.error(
    `[api] Invalid API origin "${API_ORIGIN}". It must start with http:// or https://.`
  );
}

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true, // ⭐ send the auth cookie
});

// ---- Attach Bearer token to every outgoing request ------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      if (typeof config.headers?.set === "function") {
        // Axios 1.x (AxiosHeaders class)
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        // Axios 0.x (plain object)
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Let the browser set the multipart boundary for FormData uploads.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: auto-save token + handle 401 -------------------
api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || "";

    // ⭐ Safety net: any auth endpoint that returns a token saves it here.
    // This means the login handler does NOT have to remember to save it.
    if (
      !url.includes("/auth/logout") &&
      response.data &&
      typeof response.data.token === "string" &&
      response.data.token.length > 0
    ) {
      localStorage.setItem("adminToken", response.data.token);
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401) {
      const isLoginRequest = url.includes("/auth/login");
      const isMeRequest = url.includes("/auth/me");
      const onLoginPage = /\/login\/?$/i.test(window.location.pathname);

      // Wrong credentials → don't touch stored tokens.
      if (isLoginRequest) {
        return Promise.reject(error);
      }

      // Any other 401 = the session is dead. Clear the token.
      localStorage.removeItem("adminToken");

      // Redirect away from protected pages. We deliberately skip
      // /auth/me — the app's own auth guard usually handles that
      // to avoid a redirect-then-rerender race.
      if (!onLoginPage && !isMeRequest) {
        const target = `${window.location.pathname}${window.location.search}`;
        window.location.replace(
          `/admin/login?from=${encodeURIComponent(target)}`
        );
      }
    }

    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.log("[api] Base URL:", api.defaults.baseURL);
}

export default api;