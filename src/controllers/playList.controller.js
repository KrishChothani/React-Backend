import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name && !description){
        throw new ApiError(404, "Missing name or description")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })
    if(!playlist){
        throw new ApiError(404, "something went wrong while creating playlist ")
    }

    return res.status(200).json(
        new Apiresponse(201 , playlist, "playlist created successfully")
    )
    //TODO: create playlist
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(404, "Missing userId")
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match :{
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if(!userPlaylist){
        throw new ApiError("something went wrong while generating userplaylist");
    }

    return res.status(200).json(
        new Apiresponse(201,userPlaylist, "User playlist fetch successfully")
    )
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(404, "Missing playlistId")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")
    if(!playlist){
        throw new ApiError(404,"something went wrong while fetching playlist");
    }

    return res.status(200).json(
        new Apiresponse(201, playlist, "Playlist fetching successfully")
    )
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {videoId,playlistId } = req.params
    console.log(req.params);
    

    if(!playlistId && !videoId){
        throw new ApiError(404, "playlistId and videoId not found")
    }
    
        const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos :videoId
            }
        },
        {
            $lookup: {
                from: "Video",
                localField : "videoId",
                foreignField : "_id",
                as: "videoData"
            }
        },
        {new: true}
    ).populate("videos")

    if(!playlist){
        throw new ApiError(400, "Something went wrong while add video to playlist") 
    }

    return res.status(200).json(
        new Apiresponse(200,playlist,"add video Successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { videoId,playlistId} = req.params
    // TODO: remove video from playlist

    if(!playlistId && !videoId){
        throw new ApiError(404, "Missing playlist and videoid")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId } // Removes the videoId from the videos array
        },
        { new: true } // Returns the updated document
    );

    return res.status(200).json((
        new Apiresponse(200, updatedPlaylist,"remove video Successfully")
    ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400 , "Missing playlist");
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new Apiresponse(200, deletedPlaylist, "Delete playlist successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId && !name && !description){
        throw new ApiError(400, "Missing playlist or name or description"); 
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name :name,
                description:description
            }
        }
    )
    updatedPlaylist.save()

    return res.status(200).json(
        new Apiresponse(200, updatedPlaylist, "Update playlist successFully")
    )
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}