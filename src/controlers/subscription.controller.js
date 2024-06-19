import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../model/user.model.js";
import { Subscription } from "../model/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  console.log(channelId);
  // TODO: toggle subscription
  if (!channelId) throw new ApiError(401, "channelId is required");

  const alreadySubscribed = await Subscription.findOne({channel:channelId,subscriber:req.user._id})

  let toggeled,msg;
  if (alreadySubscribed){
    msg = "Un-Subscribed "
    toggeled = await Subscription.findOneAndUpdate({
        channel:channelId
    },
    {
        $pull:{
            subscriber:req.user._id
        }
    },{
        new:true
    }
)
  }else{
    console.log("inside else clouse")
    msg = "Subscribed "
    toggeled = await Subscription.findOneAndUpdate({
        channel:channelId
    },
    {
        $addToSet:{
            subscriber: req.user._id,
        }
    },{
        new:true,
        upsert:true
    })
  }
    
  console.log("value of toggeled: ",toggeled)
    
    if(!toggeled)throw new ApiError(500, "something wrong in server toggele subscription api");


    return res
    .status(201)
    .json(
      new ApiResponse(201, toggeled, "subscription is toggeled successfuly: "+msg)
    );
  });

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(401, "channelId is required ");

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId, //will find all subscribers where channel id is present
      },
    },
    {
      $project: {
        channel: 0,
      },
    },
  ]);

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

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId, //will find all channels that i have subscribed
      },
    },
    {
      $project: {
        subscriber: 0,
      },
    },
  ]);

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
