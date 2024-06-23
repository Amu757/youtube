import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../model/user.model.js";
import { Subscription } from "../model/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // TODO: toggle subscription
  if (!channelId) throw new ApiError(401, "channelId is required");

  const alreadySubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  let toggeled, msg;
  if (alreadySubscribed) {
    msg = "Un-Subscribed ";
    toggeled = await Subscription.findOneAndDelete(
      {
        channel: channelId,
      },
      {
        new: true,
      }
    );
  } else {
    msg = "Subscribed ";
    toggeled = await Subscription.findOneAndUpdate(
      {
        channel: channelId,
      },
      {
        $addToSet: {
          subscriber: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  }

  if (!toggeled)
    throw new ApiError(
      500,
      "something wrong in server toggele subscription api"
    );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        toggeled,
        "subscription is toggeled successfuly: " + msg
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(401, "channelId is required ");

  const subscribers = await Subscription.find({channel:channelId}).select("-channel -__v")

  if (!subscribers)
    throw new ApiError(
      401,
      "no one has yet subsribed to this channel or no data found "
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "all subscriber list of the channel is fetched"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) throw new ApiError(401, "subscriberid is required ");

  const channels = await Subscription.find({ subscriber: subscriberId }).select(
    "-subscriber -__v"
  );

  if (!channels)
    throw new ApiError(
      401,
      "you have not subsribed to any channel yet or no data found "
    );

  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "your subscribed channel list is fetched")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
