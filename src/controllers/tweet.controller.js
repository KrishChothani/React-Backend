
import mongoose, { isValidObjectId, Schema } from "mongoose"
// import {Tweet} from "../models/tweet.model.js"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    console.log(req.body)

    if(!content){
        throw new ApiError(400, "Empty content")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })
    return res.status(200).json(
        new Apiresponse(201, tweet, "Add tweet successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    console.log(userId);

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const userTweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)  // Correct way to use ObjectId
            }
        }
    ]);



    if (!userTweet.length) {
        throw new ApiError(404, "No tweets found for this user");
    }

    return res.status(200).json(
        new Apiresponse(200, userTweet, "User tweets fetched successfully")
    );
});


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const {content} = req.body;
    
    if(!tweetId){
        throw new ApiError(404, "Invalid tweet Id");
    }
    if(!content){
        throw new ApiError(404, "Invalid content");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
    )
    console.log(updatedTweet);
    res.status(200).json( new Apiresponse(201,updatedTweet, "tweet updated succeessfully") );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if(!tweetId){
        throw new ApiError(404, "Invalid tweet Id");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    res.status(200).json( new Apiresponse(201,deleteTweet, "tweet deleted succeessfully") );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
