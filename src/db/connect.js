import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`mongodb connect !! DB host: ${connectionInstance}`)
    } catch (error) {
        console.log(`error in mongodb connection ${error}`)
        process.exit(1)
    }
}

export default connectDB;