import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const home = (req,res)=>{
  res.send("welcome to homepage..")
}

const registerUser = asyncHandler(async (req, res) => {
  //collect data from user
  //validate
  // if required data is not avilable from req.body then return client error all fields are necessory
  // else if user already exist : username, email
  // else if profile pic availabe then upload to cloudnary
  // else if check password === cpassword false then return password should match with cpassword
  // create user object - create entry in db
  // remove password and refresh token from res
  // chech user creation
  // return res


  // data extraction
  const { fullName, userName, email, password } = req.body;
  //validation
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    // array of values .some method to check on each item if field is availabe then after triming check not empty  return true
    throw new ApiError(400, "All fields are required");
  }

  //find user exist
  const existedUser = await User.findOne({
    // using user model, find 1st instance and return
    $or: [{ userName }, { email }], //$or operator to check on multiple vlaues via passing a array
  });

  if (existedUser)
    throw new ApiError(409, "user with email or username already exist");


  //handle images with middle ware
  // const avatarLocalPath = req.files?.avatar[0]?.path; // ? use if files has no access, avatar first property or give .path of file
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avtar file is required");


  // upload on cloudinari
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);


  if (!avatar) throw new ApiError(400, "Avtar file is required");


  // create user in mongodb
  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    avatar: avatar,
    coverImage: coverImage || "", //if coverImage is not given then just put it empty
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    //find in db if created then remove fields with select method pass values that has to removed
    "-password -refreshToken"
  );


  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");


  //sending response

  res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered successfuly ")// return res obj then pass value to apiresponse constructor with code, data, msg
  )
});

export {home, registerUser };
