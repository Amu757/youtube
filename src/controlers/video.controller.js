import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, getResourseDetails } from "../utils/cloudinary.js";
import { Video } from "../model/video.model.js";
import { User } from "../model/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (
    [page, limit, query, sortBy, sortType, userId].some(
      (field) => field?.trim() === ""
    )
  )
    throw new ApiError(400, "All fields are required");
  //TODO: get all videos based on query, sort, pagination
  const allVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
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

  console.log(allVideos);

  return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "user videos fetched successfuly"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  /*
  video is uploading fine, just return only uploaded video related info dont include userobj 
  */

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
    throw new ApiError(401, "issue in uploading files to server");

  if (!thumbnailLocalPath)
    throw new ApiError(401, "issue in uploading files to server");

  const { videoFile, coudinary_public_id } =
    await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile)
    throw new ApiError(401, "issue in uploading files with multor");

  if (!thumbnail)
    throw new ApiError(401, "issue in uploading files with multor");

  const newVideo = await Video.create({
    videoFile,
    coudinary_public_id,
    thumbnail,
    title,
    duration: 12,
    description,
    owner: req.user,
  });

  if (!newVideo) throw new ApiError(500, "video is not created in mongodb");

  return res
    .status(200)
    .json(new ApiResponse(201, newVideo, "video is created successfuly"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  // working wery well
  const video = await Video.findById(videoId);

  if (!video.coudinary_public_id)
    throw new ApiError(400, "no video exist with provide id");

  const videoDetails = getResourseDetails(video.coudinary_public_id, true);
  console.log(videoDetails.duration);
  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "video successfuly fetched with videoDuration: "+videoDetails.duration));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "videoId ie required");

  const { title, description } = req.body;

  if (!title || !description)
    throw new ApiError(400, "title and description ie required");

  console.log(req.file);
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail file ie required or issue in multor");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

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
  if (!videoId.coudinary_public_id)
    throw new ApiError(401, "videoId is required");
  //delete from mongodb
  const deletedVideo = await Video.deleteOne({
    _id: new mongoose.Types.ObjectId(videoId),
  });

  //delete from cloudnary
  const deletedOnCloudinary = await cloudinary.uploder.destroy(
    deletedVideo.coudinary_public_id
  );

  console.log(deletedVideo);
  if (!deletedVideo)
    throw new ApiError(500, "issue while deleting the video in mongodb");

  console.log(deletedOnCloudinary);
  if (!deletedOnCloudinary)
    throw new ApiError(500, "issue while deleting the video on cloudnary");

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

  let toggledOnCloudinary;
  if (oldValue) {
    toggledOnCloudinary = await cloudinary.api.update(
      userVideo.coudinary_public_id,
      { access_mode: "authenticated" }
    );
  } else {
    toggledOnCloudinary = await cloudinary.api.update(
      userVideo.coudinary_public_id,
      { access_mode: "public" }
    );
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !oldValue,
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
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateViews,
};
