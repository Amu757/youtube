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
  try {
    //total video views
    const totalViews = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: "$title",
          count: { $sum: "$view" },
        },
      },
    ]);

    if (!totalViews) throw new ApiError(500, "some issue fetching total views");

    const totalViewsCount = totalViews[0].count;

    //total subscribers
    const totalSubscribers = await Subscription.find({
      channel: req.user._id,
    }).select("-_id -channel -__v");

    if (!totalSubscribers)
      throw new ApiError(500, "some issue fetching total subscribers");

    const totalSubscribersCount = totalSubscribers.length;

    //total videos
    const totalVideos = await Video.find({ owner: req.user._id });
    if (!totalVideos)
      throw new ApiError(500, "some issue fetching total videos");

    const totalVideosCount = totalVideos.length;
    console.log(totalVideosCount);

    //total likes   ** its incorrect it finds all like by user that inclides comment and tweet likes also **
    const totalLikes = await Like.find({ likedBy: req.user._id }).select(
      "-comment -tweet -likedBy"
    );
    if (!totalLikes) throw new ApiError(500, "some issue fetching total likes");

    const totalLikesCount = totalLikes.length;

    const stats = {
      totalViews: totalViewsCount,
      totalLikes: totalLikesCount,
      totalVideos: totalVideosCount,
      totalSubscribers: totalSubscribersCount,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, stats, "stats fetched sucessfuly"));
  } catch (error) {
    throw new ApiError(501, error);
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const allVideos = await Video.find({ owner: req.user._id }).select(
    "-owner -__v -updatedAt -createdAt"
  );

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
