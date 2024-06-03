import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const genAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // this validate just check if all possible required items are passed for change , ex. password
    
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong generating access and refresh tokens "
    );
  }
};

const home = (req, res) => {
  res.send("welcome to homepage..");
};

const registerUser = asyncHandler(async (req, res) => {
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
    new ApiResponse(200, createdUser, "User Registered successfuly ") // return res obj then pass value to apiresponse constructor with code, data, msg
  );
});

const logInUser = asyncHandler(async (req, res) => {
  //get user data - username pass and token
  //validate not empty
  //find user exist : if token match then login else check passmatch then login
  //gen access and refresh token
  //response cookies

  const { email, userName, password } = req.body;

  //validate
  if (!(userName || email)) {
    throw new ApiError(400, "username or password is required ");
  }

  // find user in mongodb
  const userExist = await User.findOne({ $or: [{ email }, { userName }] }); // check one of the fields value in mongodb
  if (!userExist) throw new ApiError(404, "User does not exist");
  //compare password using userdefinded method in user model invoke using above userExist object


  try {
    const isPasswordValid = await userExist.isPasswordCorrect(password);

    if (!isPasswordValid) throw new ApiError(401, "invalid user credentials");
  } catch (error) {
    console.log("issue in password validation code",error)
  }

  //method to update token in db
  const { accessToken, refreshToken } = await genAccessAndRefreshToken(
    userExist._id
  ); //may take time to update the db

  //new ref to user obj and removoe password and token by select method
  const loggedInUser = await User.findById(userExist._id).select(
    "-password -refreshToken"
  );

  //cookies
  const opitons = {
    httpOnly: true,
    secure: true, //only modified by server
  };

  //add cookies in response
  return res
    .status(200)
    .cookie("accessToken", accessToken, opitons)
    .cookie("refreshToken", refreshToken, opitons)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfuly"
      ) //again sending token if user wants handle it by their way
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,  //how to find
    {
      $set: {       
        //update user data
        refreshToken: undefined,
      },
    },
    {
      //it makes the return value to be updated object not the old obj
      new: true,
    }
  );

  const opitons = {
    httpOnly: true,
    secure: true, //only modified by server
  };

  return res
    .status(200)
    .clearCookie("accessToken", opitons)
    .clearCookie("refreshToken", opitons)
    .json(new ApiResponse(200, {}, "User Logged Out Successfuly"));
});

const refreshAccessToken = asyncHandler( async (req,res)=>{
  const incomingRefToken = req.cookies.refreshToken || req.body.refreshToken  //if user is using phone
console.log(incomingRefToken)

  if(!incomingRefToken) throw new ApiError(401,"Unauthorized request")

    try {

      const decodedToken = jwt.verify(incomingRefToken,process.env.REFRESH_TOKEN_SECRET)

      const user = await User.findById(decodedToken?._id)

      if(!user) throw new ApiError(401,"Invalid Refresh Token")
        
        if(incomingRefToken !== user?.refreshToken) throw new ApiError(401,"Refresh token is expired or used")

          const options={
            httpOnly:true,
            secure:true
          }

          const {accessToken,newRefreshToken} = await genAccessAndRefreshToken(user._id)

          return res
          .status(200)
          .cookie("accessToken",accessToken,options)
          .cookie("refreshToken",newRefreshTokenToken,options)
          .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access Token is Refreshed ")
          )
    } catch (error) {
new ApiError(401,error?.message || "invalid Access Token")
    }
})

export { home, registerUser, logInUser, logOutUser ,refreshAccessToken};
