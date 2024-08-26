import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import { Apiresponse } from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid object ID");
    }

    if(userId.toString()==channelId){
        throw new ApiError(400, "You are not allowed to subscribe");  
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    if(existingSubscription){
        await existingSubscription.deleteOne();

        return res.status(200).json(
            new Apiresponse(201, existingSubscription, "Unsubscribed Successfully" )
        )
    }
    else{
        await Subscription.create   ({
            subscriber: userId,
            channel:channelId
        })

        return res.status(200).json(
            new Apiresponse(201, existingSubscription, "Subscribed Successfully" )
        )
    }
   
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriptionId} = req.params
    console.log(subscriptionId)
    if(!subscriptionId) {
        throw new ApiError(404, "Invalid subscriptionId");
    }

//    const userSubscribers = await Subscription.find({
//         channel: new mongoose.Types.ObjectId(subscriptionId)
//     })
        const userSubscribers = await Subscription.aggregate([
            {
                $match:{
                    channel: new mongoose.Types.ObjectId(subscriptionId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscriberdetails"
                }
            },
            {
                $project:{
                    _id:1,
                    channel:1,
                    subscriberdetails:1
                }
            }
        ])

    return res.status(200).json(
         new Apiresponse(200, userSubscribers, "users's subscribers fetch successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!channelId) {
        throw new ApiError(404, "Invalid channelId");
    }
    // const subscribedChannel = await Subscription.find({
    //     subscriber: new mongoose.Types.ObjectId(channelId)
    // })
    const subscribedChannel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as:"channelDetails"
            }
        },
         {
            $unwind: "$channelDetails" // Flatten the array of channel details
        },
        {
            $project:{
                _id : 1,
                subscriber:1,
                channelDetails:1
            }
        }
    ])

    if(!subscribedChannel) {
        throw new ApiError(404, "Invalid subscribedChannel");
    }

    return res.status(200).json(
        new Apiresponse(200, subscribedChannel, "fetch subscribed channel successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}