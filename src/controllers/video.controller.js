
import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { Apiresponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'asc' ? 1 : -1;

    const result = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: query ? { title: new RegExp(query, 'i') } : {}
            },
            {
                 $sort: sortOptions 
            }
        ]),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    )

    res.status(200).json(new Apiresponse(201, result, "Videos fetch Successfully"));
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title && !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const videoUploadResponse = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUploadResponse) {
        throw new ApiError(500, "Failed to upload video file");
    }
    if (!thumbnailUploadResponse) {
        throw new ApiError(500, "Failed to upload thumbnail file");
    }

    const duration = await videoUploadResponse.duration; // Get duration from video upload response

    // const owner = User._id;
    // console.log(owner);

    const video = await Video.create({
        title,
        description,
        videoFile: videoUploadResponse.secure_url, // URL of the uploaded video
        thumbnail: thumbnailUploadResponse.secure_url, // URL of the uploaded thumbnail
         owner: req.user._id ,
        duration,
    });

    return res.status(201).json(
        new Apiresponse(200, video, "Video created successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // console.log(videoId);

    const video = await Video.aggregate([
        {
            $addFields:{
                ownerVideo:await Video.find({ owner: videoId })
            }
        },
        {
            $project: {
                owner: 1,
                ownerVideo:1,
            }
        }
    ]);

    // console.log(video);
    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new Apiresponse(200, video[0], "Video fetched successfully")
    );
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "VideoId not found");
    }
    const { title, description } = req.body;
    const thumbnail = req.file?.path;
    if (!title && !thumbnail && !description) {
        throw new ApiError(400, "At least one field (title, thumbnail, or description) is required to update");
    }
    const thumbnailurl = await uploadOnCloudinary(thumbnail);
    if (!thumbnailurl.url) {
            throw new ApiError(400, "Failed to upload thumbnail");
        }
        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    thumbnail : thumbnailurl.url,
                    title,
                    description
                }
            }
        )
    return res.status(200).json(new Apiresponse(200, video, "Video details updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId) {
        throw new ApiError(400, "missing video id");
    }
    const video = await Video.findByIdAndDelete(videoId);
    return res.status(200).json(new Apiresponse(200, video, "Video delete successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(404, "VideoId not found");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the published status
    video.published = !video.published;
    await video.save();

    return res.status(200).json(
        new Apiresponse(200, video, "Video publish status toggled successfully")
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
