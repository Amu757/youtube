// get loacal path of file from server temp folder
// put into cloudinary
// delete file - using unlink method

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

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

    // console.log("file is uploaded on cloudinary", response);
    fs.unlinkSync(localFilePath);

    return { url: response.url, publicId: response.public_id };
  } catch (error) {
    // remove local file on file upload failed
    if (localFilePath) fs.unlinkSync(localFilePath);
    return null;
  }
};

const getResourseDetails = async (publicId, isVideo) => {
  try {
    // let resourceType = isVideo ? "video" : "image";
    // console.log("searching for   ", publicId);
    const details = await cloudinary.api.resource(publicId);
    // console.log(details);
    return details;
  } catch (error) {
    // console.log("error fetching resourse info from cloudinary: ", error);
  }
};

const deleteResourse = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    // console.log("error deleting resourse from cloudinary",error)
    return null;
  }
};

// const toggleAccess = async (oldValue,publicId)=>{
//   try {

//   let toggledOnCloudinary;

//   // console.log("my public id ",publicId)
//   let accessMode = oldValue?"authenticated":"public";

//     toggledOnCloudinary = await cloudinary.api.update(
//       publicId,
//       {resource_type:'video', access_mode: accessMode},

//     );

//   console.log("toggled from cloudinary  ",toggledOnCloudinary)

//   return toggledOnCloudinary;
//   } catch (error) {
//     // console.log("issue for toggle access from cloudinary",error)
//     return null
//   }
// }



export { uploadOnCloudinary, getResourseDetails, deleteResourse }; //toggleAccess
