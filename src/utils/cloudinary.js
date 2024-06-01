// get loacal path of file from server temp folder
// put into cloudinary
// delete file - using unlink method

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("file is uploaded on cloudinary", response.url);
    return response.url;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    // remove local file on file upload failed
    console.log("error from file upload on cloudinary ", error);
    return null;
  }
};
export {uploadOnCloudinary}