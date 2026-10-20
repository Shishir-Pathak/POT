
// backend/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import aboutRoutes from "./routes/aboutRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error(
    "MONGO_URI and JWT_SECRET must be configured."
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long."
  );
}

// Basic security
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// Request logger
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    console.log(
      `${res.statusCode} ${req.method} ${req.originalUrl} - ${
        Date.now() - startedAt
      }ms`
    );
  });

  next();
});

// CORS configuration
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",

  "https://loopin-rho.vercel.app",
  "https://loopin-indol.vercel.app",
  "https://loopin.vercel.app",

  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
]);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, such as server-to-server.
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/+$/, "");

    // Allow configured origins and Vercel deployment subdomains.
    const isVercel =
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(cleanOrigin);

    if (allowedOrigins.has(cleanOrigin) || isVercel) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", cleanOrigin);

    return callback(new Error("Origin not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// Register CORS before API routes.
app.use(cors(corsOptions));

// Parse request bodies and cookies.
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio API is running.",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/products", productRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/settings", siteSettingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Global error handler
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("======================================");
      console.log(`Portfolio API running on port ${PORT}`);
      console.log("Allowed frontend origins:");

      allowedOrigins.forEach((origin) => {
        console.log(`  ${origin}`);
      });

      console.log("Vercel subdomains: allowed");
      console.log("======================================");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
