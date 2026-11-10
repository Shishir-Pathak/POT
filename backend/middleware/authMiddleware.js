import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

/**
 * Verify a JWT with the issuer/audience that generateToken.js uses.
 * If you change the constants here, change them in generateToken.js too.
 */
const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "portfolio-api",
    audience: "portfolio-admin",
  });

/** Extract a valid Mongo ObjectId string from a decoded JWT. */
const extractAdminId = (decoded) => {
  const id = decoded?.sub ?? decoded?.id ?? decoded?._id ?? null;
  return id && mongoose.isValidObjectId(id) ? id : null;
};

const authMiddleware = async (req, res, next) => {
  try {
    // 0. Config sanity check.
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    // 1. Collect every available token, in priority order.
    const headerToken = (req.headers.authorization || "").startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : null;

    const cookieToken = req.cookies?.adminToken || null;

    if (!headerToken && !cookieToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // 2. Try each token — first valid one wins.
    //    This is the critical fallback: if the Bearer token in
    //    localStorage is stale/expired but the cookie is valid,
    //    we still authenticate successfully.
    let decoded = null;
    let lastJwtError = null;

    for (const token of [headerToken, cookieToken].filter(Boolean)) {
      try {
        decoded = verifyToken(token);
        break; // ✅ valid token found
      } catch (err) {
        lastJwtError = err;
      }
    }

    if (!decoded) {
      if (
        lastJwtError?.name === "JsonWebTokenError" ||
        lastJwtError?.name === "TokenExpiredError" ||
        lastJwtError?.name === "NotBeforeError"
      ) {
        return res.status(401).json({
          success: false,
          message: "Session expired or invalid. Please log in again.",
        });
      }
      throw lastJwtError || new Error("Token verification failed.");
    }

    // 3. Extract the admin id (supports sub, id, or _id).
    const adminId = extractAdminId(decoded);
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // 4. Role check from the token payload (if provided).
    if (decoded.role && decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    // 5. Load the admin from the DB.
    const admin = await Admin.findById(adminId).select("-password");
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or access denied.",
      });
    }

    // 6. Attach to the request for downstream handlers.
    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;