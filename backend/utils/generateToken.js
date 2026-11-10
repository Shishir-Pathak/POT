import jwt from "jsonwebtoken";

const generateToken = (adminId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }
  if (!adminId) {
    throw new Error("generateToken requires a valid adminId.");
  }

  return jwt.sign(
    {
      sub: adminId.toString(),
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "3d",
      issuer: "portfolio-api",
      audience: "portfolio-admin",
    }
  );
};

export default generateToken;