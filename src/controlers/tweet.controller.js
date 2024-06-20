import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../model/tweet.model.js"
import {User} from "../model/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content) throw ApiError(401, "content is required");
  
    const newTweet = await Tweet.create({
      content,
      owner: new mongoose.Types.ObjectId(req.user._id),
    });
  
    if (!newTweet) throw new ApiError(500, "issue in creating tweet");
  
    return res
      .status(200)
      .json(new ApiResponse(201, newTweet, "tweet added successfuly"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
        const { userId } = req.params;
        if (!userId) throw new ApiError(401, "userId is required");
      
        const allTweets = await Tweet.find({
          owner: new mongoose.Types.ObjectId(userId)
        }).select("-owner")
      
        if(!allTweets) throw new ApiError(500,"No tweets found for the userId")
      
       return res.status(200).json(new ApiResponse(200,allTweets,"all tweets of the userId are fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
