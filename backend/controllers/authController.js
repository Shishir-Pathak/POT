import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import generateToken from "../utils/generateToken.js";

/**
 * Robust production detection.
 * - Uses NODE_ENV when set.
 * - Falls back to detecting an https FRONTEND_URL, so Render deployments
 *   work even if NODE_ENV was forgotten in the dashboard.
 */
const isProd =
  process.env.NODE_ENV === "production" ||
  (process.env.FRONTEND_URL || "").startsWith("https://");

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd,                 // required when sameSite === "none"
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // Not setting `domain` on purpose: onrender.com is a public suffix,
  // so setting .onrender.com breaks the cookie entirely.
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
});

// POST /api/auth/login
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({
      email: normalizedEmail,
    }).select("+password");

    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.password)
      : false;

    if (!admin || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const token = generateToken(admin._id);

    // Set the auth cookie (primary mechanism).
    res.cookie("adminToken", token, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token, // ⭐ kept on purpose — frontend should also send it as
             //   `Authorization: Bearer <token>` as a fallback.
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getAdminProfile = async (req, res, next) => {
  try {
    // req.admin is populated by your auth middleware, which should
    // accept BOTH the cookie and a Bearer token.
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logoutAdmin = (req, res) => {
  res.clearCookie("adminToken", clearCookieOptions());

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};