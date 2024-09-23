import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../model/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../model/playlist.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) throw new ApiError(401, "videoId is required");

  const videoIsLiked = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  let toggledVideo, msg;
  if (videoIsLiked) {
    msg = " like removed";
    // delete document
    toggledVideo = await Like.findOneAndDelete(
      {
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        new: true,
      }
    ).select("-likedBy");
  } else {
    msg = " like added";
    // create document
    toggledVideo = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (!toggledVideo)
    throw ApiError(500, "something issue toggeling video like in server");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggledVideo,
        "video like is toggled successfuly " + msg
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on video
  if (!commentId) throw new ApiError(401, "commentId is required");

  const commentIsLiked = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  let toggledComment, msg;
  if (commentIsLiked) {
    msg = "like removed";
    // delete document
    toggledComment = await Like.findOneAndDelete(
      {
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        new: true,
      }
    ).select("-likedBy");
  } else {
    msg = "like added";
    // create document
    toggledComment = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (!toggledComment)
    throw ApiError(500, "something issue toggeling comment like in server");

  // const totleLiked = await Like.find({
  //   comment: new mongoose.Types.ObjectId(commentId)
  // })

  return res.status(200).json(
    new ApiResponse(
      200,
      toggledComment,
      // totleLiked,
      msg
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on video
  if (!tweetId) throw new ApiError(401, "tweetId is required");

  const tweetIsLiked = await Like.findOne({
    tweet: new mongoose.Types.ObjectId(tweetId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  });

  let toggledTweet, msg;
  if (tweetIsLiked) {
    msg = " like removed";
    // delete document
    toggledTweet = await Like.findOneAndDelete(
      {
        tweet: new mongoose.Types.ObjectId(tweetId),
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
      {
        new: true,
      }
    ).select("-likedBy");
  } else {
    msg = " like added";
    // create document
    toggledTweet = await Like.create({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(req.user._id),
    });
  }

  if (!toggledTweet)
    throw ApiError(500, "something issue toggeling tweet like in server");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggledTweet,
        "tweet like is toggled successfuly " + msg
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get all liked videos
  if (!userId) throw new ApiError(401, "userId is required");

  const allLikedVideos = await Like.find({
    likedBy: new mongoose.Types.ObjectId(userId),
  }).select("-likedBy -comment");

  if (!allLikedVideos) throw new ApiError(500, "no liked videos found");

  return res
    .status(200)
    .json(new ApiResponse(200, allLikedVideos, "all liked videos are fetched"));
});

const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: get all liked videos
  if (!commentId) throw new ApiError(401, "userId is required");

  const commentlikes = await Like.find({
    comment: new mongoose.Types.ObjectId(commentId),
  }).select("-video -tweet -createdAt -updatedAt -__v");

  const present = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  }).select("-video -tweet -createdAt -updatedAt -__v");

  if (!commentlikes) throw new ApiError(500, "no liked videos found");
  let userpresent = false;
  if (present) userpresent = true;
  let likesdata = {
    commentlikes: commentlikes,
    userpresent: userpresent,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, likesdata, "all comment likes are fetched"));
});
const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get all liked videos
  if (!videoId) throw new ApiError(401, "videoId is required");

  const videolikes = await Like.find({
    video: new mongoose.Types.ObjectId(videoId),
  }).select("-comment -tweet -createdAt -updatedAt -__v");
  
  const present = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: new mongoose.Types.ObjectId(req.user._id),
  }).select("-video -tweet -createdAt -updatedAt -__v");

  if (!videolikes) throw new ApiError(500, "no liked videos found");
  let userpresent = false;
  if (present) userpresent = true;
  let likesdata = {
    videolikes: videolikes,
    userpresent: userpresent,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, likesdata, "all video likes are fetched"));
});

export {
  toggleCommentLike,
  getCommentLikes,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getVideoLikes
};
