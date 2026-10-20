
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Check the Authorization header first.
    const authorization = req.headers.authorization || "";

    let token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : null;

    // 2. Fall back to the httpOnly cookie.
    if (!token) {
      token = req.cookies?.adminToken || null;
    }

    // 3. Ensure a token exists.
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // 4. Ensure the JWT secret is configured.
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    // 5. Verify the token.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "portfolio-api",
      audience: "portfolio-admin",
    });

    // 6. Validate the admin ID.
    if (
      !decoded.sub ||
      !mongoose.isValidObjectId(decoded.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // 7. Find the admin in MongoDB.
    const admin = await Admin.findById(decoded.sub).select("-password");

    if (!admin || admin.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or access denied.",
      });
    }

    // 8. Validate the token role if one is present.
    if (decoded.role && decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    // 9. Make the authenticated admin available to routes.
    req.admin = admin;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please log in again.",
      });
    }

    next(error);
  }
};

export default authMiddleware;
