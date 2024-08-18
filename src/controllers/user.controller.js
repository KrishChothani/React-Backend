import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Apiresponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";


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
            $set:{
                refreshToken: undefined
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

const refreshAccessToken = asyncHandler( async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthaurized requesst")
    }

  try {
     const decodedToken =  jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
  
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
      throw new Error(401, "Invalid refresh token")
     }
  
     if(incomingRefreshToken !== user?.refreshToken){
          throw new Error(401, "Refresh token is expired or used")
     }
  
     const options = {
          httpOnly: true,
          secure: true
     }
  
     const {accessToken, newrefreshToken}=await generateAccessAndRefreshToken(user._id)
  
     return res.status(200)
              .cookies("accessToken", accessToken, options)
              .cookies("refreshToken", newrefreshToken, options)
              .json(
                  new Apiresponse(
                      200,
                      {
                          accessToken, refreshToken: newrefreshToken
                      },
                      "Access token refreshed successfully"
                  )
              )
  } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
  }


})
export { registerUser, loginUser, logoutUser, refreshAccessToken }

