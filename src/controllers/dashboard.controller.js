import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {getUserChannelSubscribers} from "../controllers/subscription.controller.js"
import { Apiresponse } from "../utils/ApiResponse.js";
import { Subscription} from "../models/subscription.model.js"
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";


const getChannelStats = asyncHandler(async(req, res) => {
     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user._id
    const totalSubscribers = await Subscription.countDocuments({ subscriber: userId });    
    const totalLikes = await Like.countDocuments({
        video: {$in: await Video.find({owner: userId}).select('_id') }
    })
    console.log(totalSubscribers);


    const stats ={
        totalSubscribers: totalSubscribers,
        totalLikes: totalLikes
    }
     return res.status(200).json(
        new Apiresponse(201 , stats, "subscribers fetch successfully")
     )
})

const getChannelvideos = asyncHandler(async(req, res) => {
    
    const userId = req.user._id
    const channelVideo = await Video.find({ owner: userId})
    console.log(channelVideo);
    return res.status(200).json(
        new Apiresponse(201, channelVideo, "ChannelVieo fetch SuccessFully")
    )
});

export {
    getChannelStats,
    getChannelvideos
}