import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../model/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../model/playlist.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) throw new ApiError(401, "Video id is required");

  const likes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $project: {
        alreadyLiked: {
          $cond: {
            if: { $isArray: "$video" },
            then: { $in: [videoId, "$video"] },
            else: false
          }
        }
      },
    },
  ]);

  // if (!likes || likes.length === 0) throw new ApiError(401, "no likes found for this videoId");

  console.log("your likes: ", likes);

  let updateLike;

  if (likes.length === 0 || !likes[0].alreadyLiked) {
    console.log("adding the video to the liked video list");

  const existingLike = await Like.findOne({ likedBy: req.user._id });

    if (existingLike) {
      // Add the video ID to the existing Like document
      updateLike = await Like.findByIdAndUpdate(
        existingLike._id,
        { $addToSet: { video: new mongoose.Types.ObjectId(videoId) } },
        { new: true }
      );
    } else {
      // Create a new Like document with the video ID
      updateLike = await Like.create({
        video: [mongoose.Types.ObjectId(videoId)],
        likedBy: mongoose.Types.ObjectId(userId)
      });
    }
  } else {
    console.log("removing the video from the liked video list");

    // Remove the video ID from the Like document
    updateLike = await Like.findOneAndUpdate(
      { likedBy: userId },
      { $pull: { video: mongoose.Types.ObjectId(videoId) } },
      { new: true }
    );
  }

  console.log("your updatelike: ", updateLike);

  if (!updateLike) throw new ApiError(500, "failed to toggle video like");

  return res
    .status(200)
    .json(201, updateLike, "video like is toggeled successfuly ");
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get all liked videos
  if (!userId) throw new ApiError(401, "userId is required");

  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: userId,
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  if (!videos) throw new ApiError(500, "no liked video found");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "all liked videos are fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
