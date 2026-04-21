import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "";

    console.log("Working directory:", process.cwd());
    console.log("URI loaded:", uri ? "yes" : "no");
    console.log(
      "URI type:",
      uri.startsWith("mongodb+srv://")
        ? "mongodb+srv"
        : uri.startsWith("mongodb://")
        ? "mongodb"
        : "unknown"
    );

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;