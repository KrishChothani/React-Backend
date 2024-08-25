import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Apiresponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
// import isPasswordCorrect  from '../routes/user.router.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateREfreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken}

    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating access token and refresh token")
    }

}

const registerUser = asyncHandler(async(req,res)=>{
    // get user details from frontend
    //validation -- not empty
    // check if user already exist :: username, email
    // check for images, avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, userName, password } = req.body;
    // console.log("Email: " + email);

    if(
        [fullName, email, userName, password ].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const  existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if(existedUser){
         throw new ApiError(409, "User already exists")
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverIamge = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({ 
        fullName,
        avatar: avatar.url,
        coverImage: coverIamge?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500 , "something went wrong while register the user");
    }
    // console.log(user.password);
    // console.log(createdUser.password);

    return res.status(201).json(
        new Apiresponse(200, createdUser, "USer registration completed successfully")
    )
})

const loginUser = asyncHandler( async(req, res) => {
    // data from request body
    // username or email
    // find the user
    //  password check
    // access token and refresh token
    // send cookie

    const {email, userName, password} = req.body
    console.log(password);
    if(!email && !userName ) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{userName} , {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    // console.log(user);

    const isPasswordValid =  await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Password is not valid")
    }

    const {accessToken, refreshToken}  = await generateAccessAndRefreshToken(user._id)

    const loggedInUSer =  await User.findById(user._id).select("-password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new Apiresponse(
                        200,
                        {
                            user: loggedInUSer, accessToken, refreshToken
                        },
                        "User logged in successfully"
                    )
                )
})

const logoutUser = asyncHandler( async(req, res) =>{
    User.findByIdAndUpdate(
        req.user._id, 
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure: true
    }

    return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new Apiresponse(200 ,{}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict', // You might also want to add this for security
        };

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new Apiresponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newrefreshToken,
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


const changeCurrentPassword = asyncHandler( async(req, res) => {
    const { oldPassword , newPassword } =  req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect) {
        throw new ApiError(400 , "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200).json(new Apiresponse(200, { } , "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res.status(200).json(new Apiresponse(200, req.user,  "current user fetch successfully")) 
})

const updateaccountDetails = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName && !email) {
        throw new ApiError(400 , "All fields are required")
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id ,
         {
            $set: {
                fullName: fullName,
                email: email // TODO: do right syntex
            }
         },
         {new : true}
    ).select("-password")

    return res.status(200).json(new Apiresponse(200,user, "Account Details"))
})

const updateUserAvatar = asyncHandler( async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    // TODO:delet old image

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

     return res.status(200)
            .json(new Apiresponse(200,user,"Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler( async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing")
    }

    const coverIamge = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverIamge.url){
        throw new ApiError(400, "Error while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverIamge: coverIamge.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
            .json(new Apiresponse(200,user,"cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {userName} =req.params
    // console.log(userName);

    if(!userName?.trim()){
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size : "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    // console.log(channel);

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists"); 
    }

    return res.status(200).json( new Apiresponse(200 , channel[0], "User channel fetch SuccessFully"))
})

const getWatchhistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField : "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as  : "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName: 1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                                owner:{
                                    $first: "$owner"
                                }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new Apiresponse(200 , user[0].watchHistory , "watch history fetch succesfully"));
})



export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    updateaccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchhistory
}

