import mongoose from "mongoose";
import { Comment } from "../model/comment.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(401, "videoId is required");

  const { page = 1, limit = 10 } = req.query;

  const allComments = await Comment.find({
    video: new mongoose.Types.ObjectId(videoId)
  }).select("-video")

  let userinfo = []
  for(let i=0;i<allComments.length;i++){
    let userfound = await User.findOne({
      _id: new mongoose.Types.ObjectId(allComments[i].owner)
    }).select("-watchHistory -password -refreshToken")

    if(userfound) userinfo.push(userfound)
  }

  if(!allComments) throw new ApiError(500,"No comments found for the videoId")

  const commentsData ={
    userdata: userinfo,
    comments: allComments
  }
 return res.status(200).json(new ApiResponse(200,commentsData,"all comment of the videoId are fetched successfully"))
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(401, "videoid is required");

  const { content } = req.body;
  if (!content) throw new ApiError(401, "content is required");

  const newComment = await Comment.create({
    content,
    video: new mongoose.Types.ObjectId(videoId),
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!newComment) throw new ApiError(500, "issue in creating comment");

  return res
    .status(200)
    .json(new ApiResponse(201, newComment, "comment added successfuly"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) throw ApiError(401, "commentId is required");

  const { content } = req.body;
  if (!content) throw ApiError(401, "content is required");

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(commentId) },
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) throw new ApiError(500, "issue in updatting comment");

  return res
    .status(200)
    .json(new ApiResponse(201, updatedComment, "comment updated successfuly"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) throw ApiError(401, "commentId is required");

  const deletedComment = await Comment.findOneAndDelete(
    { _id: new mongoose.Types.ObjectId(commentId) },
    {
      new: true,
    }
  );

  if (!deletedComment)
    throw new ApiError(500, "issue in deleting comment no comment found");

  return res
    .status(200)
    .json(new ApiResponse(201, deletedComment, "comment deleted successfuly"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
