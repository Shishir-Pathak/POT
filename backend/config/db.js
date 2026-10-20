import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${mongoose.connection.name}`);
    console.log("MongoDB host:", mongoose.connection.host);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;