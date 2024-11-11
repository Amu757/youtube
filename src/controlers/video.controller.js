import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteResourse } from "../utils/cloudinary.js";
import { Video } from "../model/video.model.js";
import { Subscription } from "../model/subscription.model.js";
import { User } from "../model/user.model.js";
import { response } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy, sortType } = req.query;
  //TODO: get all videos based on sort, pagination
  if ([page, limit, sortBy, sortType].some((field) => field?.trim() === ""))
    throw new ApiError(400, "All fields are required");
  const sortTypeInt = parseInt(sortType, 10);

  if (sortTypeInt !== 1 && sortTypeInt !== -1)
    throw new ApiError(
      401,
      "invalid sortBy value , valid options are 1 for ascending and -1 for descending"
    );

  const sortingBy = { sortType: sortTypeInt };
  const allVideos = await Video.find({
    isPublished: true,
  })
    .limit(limit)
    .sort(sortingBy)
    .select("-coudinary_public_id -__v -isPublished");

  if (!allVideos) throw new ApiError(401, "no video present");
  // Use Promise.all to handle async inside map
  const usersInfo = await Promise.all(
    allVideos.map(async (element) => {
      return await User.findOne({ _id: element.owner }).select(
        "-password -refreshToken -updatedAt"
      );
    })
  );
  const data = {
    usersInfo: usersInfo,
    allVideos: allVideos,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "all videos fetched successfuly"));
});

const getMyVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy, sortType } = req.query;
  //TODO: get all videos based on sort, pagination
  if ([page, limit, sortBy, sortType].some((field) => field?.trim() === ""))
    throw new ApiError(400, "All fields are required");
  const sortTypeInt = parseInt(sortType, 10);

  if (sortTypeInt !== 1 && sortTypeInt !== -1)
    throw new ApiError(
      401,
      "invalid sortBy value , valid options are 1 for ascending and -1 for descending"
    );

  const sortingBy = { sortType: sortTypeInt };
  const allVideos = await Video.find({
    owner: req.user._id,
  })
    .limit(limit)
    .sort(sortingBy)
    .select("-coudinary_public_id -__v -isPublished");

  if (!allVideos) throw new ApiError(401, "no video present");
  

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "all videos fetched successfuly"));
});

// not useful now
const getSubscribedVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortType = -1 } = req.query;
  const { subscriberId } = req.params;

  if (!subscriberId) throw new ApiError(401, "subscriberId is required");

  // Get channels that the user is subscribed to
  const channels = await Subscription.find({ subscriber: subscriberId }).select("channel");

  if (!channels.length) {
    throw new ApiError(401, "No subscriptions found or no data available.");
  }

  const channelIds = channels.map((sub) => sub.channel);

  // Find videos from the subscribed channels and populate owner's userId and avatar
  const allVideos = await Video.find({ owner: { $in: channelIds }, isPublished: true })
    .populate({
      path: 'owner', // Populating the owner field
      select: 'userName avatar', // Selecting only the userName and avatar fields from User model
    })
    .select("title description videoFile thumbnail view createdAt owner")
    .sort({ [sortBy]: parseInt(sortType, 10) })
    .limit(parseInt(limit, 10))

  if (!allVideos.length) {
    throw new ApiError(401, "No videos found for your subscriptions.");
  }

  // Format response
  const responseData = allVideos.map((video) => ({
    title: video.title,
    description: video.description,
    videoFile: video.videoFile,
    thumbnail: video.thumbnail,
    view: video.view,
    createdAt: video.createdAt,
    userName: video.owner.userName, // owner's userId
    avatar: video.owner.avatar, // owner's avatar URL
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        responseData,
        "All subscribed videos fetched successfully"
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title && !description)
    throw new ApiError(400, "all fields are required");

  let videoFileLocalPath, thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  )
    videoFileLocalPath = req.files.videoFile[0].path;

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  )
    thumbnailLocalPath = req.files.thumbnail[0].path;

  if (!videoFileLocalPath)
    throw new ApiError(401, "issue in uploading video to server");

  if (!thumbnailLocalPath)
    throw new ApiError(401, "issue in uploading thumbnail to server");

  let { url, publicId } = await uploadOnCloudinary(videoFileLocalPath);

  const videoUrl = url;
  const videoPublidId = publicId;

  if (!videoUrl)
    throw new ApiError(401, "issue in uploading files with cloudinary");

  ({ url, publicId } = await uploadOnCloudinary(thumbnailLocalPath));

  if (!url) throw new ApiError(401, "issue in uploading files with cloudinary");
  const thumbnailUrl = url;

  const newVideo = await Video.create({
    videoFile: videoUrl,
    coudinary_public_id: videoPublidId,
    thumbnail: thumbnailUrl,
    title,
    duration: 12,
    description,
    owner: req.user._id,
  });

  if (!newVideo) throw new ApiError(500, "video is not created in mongodb");

  const video = newVideo.toObject();
  delete video.owner;

  return res
    .status(200)
    .json(new ApiResponse(201, video, "video is created successfuly"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(
    new mongoose.Types.ObjectId(videoId)
  ).select("-owner");

  if (!video) throw new ApiError(400, "no video exist with provide id");

  console.log(video);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video successfuly fetched "));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "videoId ie required");

  const { title, description } = req.body;

  if (!title || !description)
    throw new ApiError(400, "title and description ie required");

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail file ie required or issue in multor");

  const { url, publicId } = await uploadOnCloudinary(thumbnailLocalPath);
  const thumbnail = url;

  if (!thumbnail)
    throw new ApiError(
      400,
      "there is a problem in uploading thumbnail file on cloudnary"
    );

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail,
      },
    },
    {
      new: true,
    }
  ).select("-owner");

  if (!video) throw ApiError(500, "unable to fetch your video");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "successfuly updated video details"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(401, "videoId is required");
  //delete from mongodb

  const deletedVideo = await Video.findByIdAndDelete({
    _id: new mongoose.Types.ObjectId(videoId),
  });

  console.log(deletedVideo);
  if (!deletedVideo)
    throw new ApiError(
      500,
      "or no video found issue while deleting the video in mongodb"
    );

  //delete from cloudnary
  if (deletedVideo) {
    const deletedOnCloudinary = deleteResourse(
      deletedVideo.coudinary_public_id
    );

    if (!deletedOnCloudinary)
      throw new ApiError(500, "issue while deleting the video on cloudnary");
  } else {
    throw new ApiError(401, "video id not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteVideo, "your video is deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  // working well
  const { videoId } = req.params;

  const userVideo = await Video.findById(videoId);

  if (!userVideo) throw new ApiError(401, "no video exist with this video id");
  const oldValue = userVideo.isPublished;

  let publicUrl;
  if (!oldValue) {
    //meke is public
    const string = userVideo.videoFile;
    publicUrl = string.slice(0, -7);
    console.log(publicUrl);
  }

  const url = oldValue ? userVideo.videoFile + "private" : publicUrl;

  // const toggled = toggleAccess(oldValue,userVideo.coudinary_public_id)
  // if(!toggled || toggled === null) throw new ApiError(501,"issue in cloudinary toggle access api")

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !oldValue,
        videoFile: url,
      },
    },
    { new: true }
  );

  if (!video) throw new ApiError(500, "can not find video of this id");

  res
    .status(200)
    .json(new ApiResponse(201, video, "your video is now updated"));
});

const updateViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(401, "videoId is required");

  const updatedVideo = await Video.findByIdAndUpdate(
    { _id: new mongoose.Types.ObjectId(videoId) },
    {
      $inc: { view: 1 },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo)
    throw new ApiError(500, "issue in updating video vies from server");

  return res
    .status(201)
    .json(
      new ApiResponse(200, updatedVideo, "video views are updated succesfuly")
    );
});

export {
  getAllVideos,
  getSubscribedVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateViews,
  getMyVideos
};
