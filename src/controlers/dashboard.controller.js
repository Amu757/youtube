import mongoose from "mongoose";
import { Video } from "../model/video.model.js";
import { Subscription } from "../model/subscription.model.js";
import { Like } from "../model/like.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  //total video views




  //total subscribers
  const totalSubscribers = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "mySubscribers",
      },
    },
    {
      $project: {
        subscribersCount: { $size: "$mySubscribers" },
      },
    },
  ]);

  const mytotalSubscribers = totalSubscribers[0].subscribersCount

  //total videos
  const totalVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
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
        videoCount: { $size: "$myVideos" },
      },
    },
  ]);

  const myTotalVideos = totalVideos[0].videoCount

  //total likes 
  const totalLikes = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "owner",
        as: "myliked",
      },
    },
    {
      $project: {
        likeCount: { $size: "$myliked" },
      },
    },
  ]);

  const myTotalLikes = totalLikes[0].likeCount


  console.log(myTotalLikes,myTotalVideos,mytotalSubscribers)
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const allVideos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
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
        myVideos: true,
      },
    },
  ]);

  if (!allVideos)
    throw new ApiError(
      500,
      "no video present for current user or no data found"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allVideos,
        "all video of this all channel fetched successfuly"
      )
    );
});

export { getChannelStats, getChannelVideos };
