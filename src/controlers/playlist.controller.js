import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../model/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name && !description)
    throw new ApiError(401, "name and description is required");
  //TODO: create playlist
  const playlistExist = await Playlist.findOne({ name: name });

  if (playlistExist) throw new ApiError(401, "Playlist exist with this name");

  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!newPlaylist)
    throw new ApiError(500, "issue while creating new playlist on server");

  return res
    .status(201)
    .json(new ApiResponse(200, newPlaylist, "New playlist is created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) throw new ApiError(401, "userId is required");

  const playlistExists = await Playlist.find({ owner: userId });

  if (!playlistExists)
    throw new ApiError(401, "No Playlist exist for current user");

  return res
    .status(201)
    .json(
      new ApiResponse(200, playlistExists, "playlists is fetched successfuly")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) throw new ApiError(401, "playlistID is required");

  const playlistExist = await Playlist.findOne({ _id: playlistId });

  if (!playlistExist)
    throw new ApiError(401, "No Playlist exist for this playlist id");

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistExist, "playlist is fetched successfuly")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId,playlistId } = req.params;

  if (!playlistId || !videoId)
    throw new ApiError(401, "playlistId and videoId are required ");

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $project: {
        videos: 1,
        videoExists: { $in: [new mongoose.Types.ObjectId(videoId), "$videos"] ,
        },
      },
    },
  ]);

  if (playlist.length === 0) throw new ApiError(401, "playlist not found");

  if (playlist[0].videoExists)
    throw new ApiError(401, "Video is already present in playlist");

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    { new: true }
  );

  if(!updatePlaylist) throw new ApiError(500,"failed to update playlist")

  return res.status(201).json(new ApiResponse(200,"video is added to playlist"))
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!playlistId || !videoId)
    throw new ApiError(401, "playlistId and videoId are required ");

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $project: {
        videos: 1,
        videoExists: { $in: [new mongoose.Types.ObjectId(videoId), "$videos"] ,
        },
      },
    },
  ]);

  if (playlist.length === 0) throw new ApiError(401, "playlist not found");

  if (!playlist[0].videoExists)
    throw new ApiError(401, "Video is not present in playlist");

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  if(!updatePlaylist) throw new ApiError(500,"failed to delete video from playlist")

  return res.status(201).json(new ApiResponse(200,"video is deleted to playlist"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId) throw new ApiError(401, "playlistID is required");

  const myPlaylistId = new mongoose.Types.ObjectId(playlistId);

  const playlistExist = await Playlist.findOneAndDelete(myPlaylistId, {
    new: true,
  });

  if (!playlistExist)
    throw new ApiError(401, "No Playlist exist for this playlist id");

  return res
    .status(201)
    .json(
      new ApiResponse(200, playlistExist, "playlist is deleted successfuly")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId) throw new ApiError(401, "playlistID is required");

  const myPlaylistId = new mongoose.Types.ObjectId(playlistId);

  const playlistExist = await Playlist.findOneAndUpdate(
    myPlaylistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  if (!playlistExist)
    throw new ApiError(401, "No Playlist exist for this playlist id");

  return res
    .status(201)
    .json(
      new ApiResponse(200, playlistExist, "playlist is updated successfuly")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
