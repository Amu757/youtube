import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const allVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "myVideos",
      },
    },
    {
      $project: {
        $myVideos: true,
      },
    },
  ]);

  if (!allVideos) throw new ApiError(401, "no video present for current user");

  console.log(allVideos)

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "user videos fetched successfuly"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if(!title && !description) throw new ApiError(400,"all fields are required")

  let videoFileLocalPath,thumbnailLocalPath;
  if(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) 
    
    videoFileLocalPath = req.files.videoFile[0].path;

if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) 
  thumbnailLocalPath = req.files.thumbnail[0].path;

if(!videoFileLocalPath) throw new ApiError(401,"issue in uploading files to server")

if(!thumbnailLocalPath) throw new ApiError(401,"issue in uploading files to server")
  
  const videoFile = await uploadOnCloudinary(videoFileLocalPath)
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if(!videoFile) throw new ApiError(401,"issue in uploading files with multor")
  
  if(!thumbnail) throw new ApiError(401,"issue in uploading files with multor")

  const newVideo = await Video.create({
    videoFile,
    thumbnail,
    title,
    duration:12,
    description,
    owner:req.user
  })

  if(!newVideo) throw new ApiError(500,"video is not created in mongodb")

  return res.status(200).json(
    new ApiResponse(201,newVideo,"video is created successfuly")
  )
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(400, "no video exist with provide id");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video successfuly fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;

  const thumbnailLocalPath = req.files?.path;

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail file ie required or issue in multor");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnailLocalPath)
    throw new ApiError(
      400,
      "there is a problem in uploading thumbnail file on cloudnary"
    );

  const video = Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail,
      },
    },
    {
      new: true,
    }
  )

  if (!video) throw new ApiError("no video exist with provided id");
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const userVideo = Video.findById(videoId)

  if(!userVideo) throw new ApiError(401,"no video exist with this video id")
  const oldValue = userVideo.isPublished;

  const video = Video.findByIdAndUpdate(
    videoId,
    {
      $set:{
      isPublished: !oldValue
    }
  },{new:true}
  )

  if(!video) throw new ApiError(500,"can not find video of this id")

  res.status(200).json(
    new ApiResponse(201,video,"your video is now updated")
  )
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
