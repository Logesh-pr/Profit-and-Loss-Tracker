import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URL);
  } catch (error) {
    process.exit(1);
  }
};

export default connectDb;
