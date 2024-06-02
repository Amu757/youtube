import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { User } from "../model/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(`MongoDB connected: ${connectionInstance.connection.host}, Database: ${connectionInstance.connection.name}`);

  // // Drop the old index if it exists
  // await User.collection.dropIndex("username_1").catch(err => {
  //   if (err.code === 27) {
  //     console.log("Index not found, skipping drop.");
  //   } else {
  //     console.error("Error dropping index:", err);
  //   }
  // });

  // // Create the new unique index
  // await User.collection.createIndex({ userName: 1 }, { unique: true });

  // console.log("Indexes updated successfully");


  } catch (error) {
    console.log(`error in mongodb connection ${error}`);
    process.exit(1);
  }
};

export default connectDB;
