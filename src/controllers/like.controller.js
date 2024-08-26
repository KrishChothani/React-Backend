import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!videoId){
        throw new ApiError(404 , "Missing videoId")
    }

    const existingVideoLike = await Video.findOne({
        LikedBy : req.user._id
    })
    if(existingVideoLike){
        await existingVideoLike.deleteOne()

        return res.status(200).json(
            new Apiresponse(201,0,"Remove Like Successful")
        )
    }
    else{
        await Like.create({
            LikedBy : req.user._id
        })

        return res.status(200).json(
            new Apiresponse(201,1,"Add Like Successful")
        )
    }


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}