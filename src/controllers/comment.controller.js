import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Apiresponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId) {
        throw new ApiError(404, "Invalid videoId")
    }

    const comments = await Comment.find({ video: videoId })

    return res.status(200).json(
        new Apiresponse(201, comments, "Comments fetch successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const {videoId} = req.params

    if(!content && !videoId){
        throw new ApiError(404, "invalid videoId or missing content")
    } 

    const comment = await Comment.create({
        content,
        video : videoId,
        owner: req.user._id
    })

    return res.status(200).json(
        new Apiresponse(200, comment, "Add comment successFully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}  = req.params
    const { content } = req.body
    
    if(!commentId && !content){
        throw new ApiError(404, "Invalid CommentID or missing content")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId, 
        {
            $set:{
                content
            }
        }
    )
    return res.status(200).json(
        new Apiresponse(201 , updatedComment, "Update comment Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}  = req.params
    if(!commentId ){
        throw new ApiError(404, "Invalid CommentId")
    }

    await Comment.findByIdAndDelete(commentId)
    
    res.status(200).json(
        new Apiresponse(201 , null, "Delete comment Successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }