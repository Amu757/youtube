import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import mongoose from "mongoose";

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
  const userInfo = JSON.parse(req.body.userinfo);

  const { fullName, userName, day, month, year, gender,about, email, password } =
    userInfo;

  //validation
  if (
    [fullName, userName, gender,about, email, password].some(
      (field) => field?.trim() === ""
    )
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
    day,
    month,
    year,
    gender,
    about,
    avatar: avatar.url,
    coverImage: coverImage.url || "", //if coverImage is not given then just put it empty
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
  const { email, password } = req.body;

  //validate
  if (!(password || email)) {
    throw new ApiError(400, "username or password is required ");
  }

  // find user in mongodb
  // const userExist = await User.findOne({ $or: [{ email, userName }] }); //check both
  const userExist = await User.findOne({ email: email });
  if (!userExist) throw new ApiError(404, "User does not exist");

  try {
    const isPasswordValid = await userExist.isPasswordCorrect(password);

    if (!isPasswordValid) throw new ApiError(401, "invalid user credentials");
  } catch (error) {
    console.log("issue in password validation code", error);
    throw error;
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
    req.user._id, //how to find
    {
      $unset: {
        refreshToken: 1, //removes token
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefToken = req.cookies.refreshToken || req.body.refreshToken; //if user is using phone

  if (!incomingRefToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decodedToken = jwt.verify(
      incomingRefToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    if (incomingRefToken !== user?.refreshToken) {
      console.log("token expired");
      throw new ApiError(401, "Refresh token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await genAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token is Refreshed "
        )
      );
  } catch (error) {
    new ApiError(401, error?.message || "invalid Access Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    throw new ApiError(401, "newpassword and confirmPassword does not match");

  const user = await User.findById(req.user._id);

  const passwordMatched = user.isPasswordCorrect(oldPassword);

  if (!passwordMatched) throw new ApiError(401, "Old password is not correct");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) throw new ApiError(401, "all fields are necessory");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    },
    { validateBeforeSave: false }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details are updated successfuly"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) throw new ApiError(400, "error while uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfuly"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath)
    throw new ApiError(400, "CoverImage file is missing");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) throw new ApiError(400, "error while uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfuly"));
});

const getUserCannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(401, "username is required");

  //aggregation pipeline to join and get processed output from multiple collections in mongodb
  const channel = await User.aggregate([
    //to use aggregate pipeline returns array
    {
      $match: {
        //use to find a document in collection
        userName: username?.toLowerCase(), //by username
      },
    }, //this filter returns single document
    {
      $lookup: {
        // to join other collection
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", // this will look for channel field in all documents where _id is matched
        as: "subscribers",
      }, //calculate all subscribers for current user - list of subscribers
    },
    {
      $lookup: {
        // to join other collection
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // this will look for subsriber field in all documents where _id is matched
        as: "subscribedTo",
      }, //calculate all subscribedTo channels for current user - list of channels
    },
    {
      // we have data in above fields but they are seperate to add them
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", //calculate size
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            //to check some condition
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, //$in to check(iterate) contains in array or object, and check if _id is present unnder subscribers collection and subscriber field
            then: true, //if true then return true
            else: false,
          },
        },
      },
    },
    {
      $project: {
        //to return only required fields to manage network bandwidth
        username: 1,
        about:1,
        fullName: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError(404, "channel does not exist");

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "User Channel Fetched Sussessfully "));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        //as mongoose did not return mongodb id in _id it returns only string, but while sending db query it internaly converts it unlike in aggreate pipeline
        _id: new mongoose.Types.ObjectId(req.user._id), //this convers a _id string to mongoose obj that helps to fetch db while using aggregation
      }, //got user
    },
    {
      $lookup: {
        //to find all the videos having _id
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // additions sub pipe lines
          {
            $lookup: {
              //to find the owener of the video by looking into user collections _id field
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner", // to make obj from the owner field that is a array, make convenient to frontend
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetch succesfully"
      )
    );
});

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserCannelProfile,
  getWatchHistory,
};
