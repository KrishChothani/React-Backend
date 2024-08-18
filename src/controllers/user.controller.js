import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
// import { upload } from '../middlewares/multer.middleware.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Apiresponse } from '../utils/ApiResponse.js';

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
    console.log("Email: " + email);

    if(
        [fullName, email, userName, password ].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const  existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if(existedUser){
         throw new ApiError(409, "User already exists")
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = reg.files?.coverImage[0]?.path;

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

    return res.status(201).json(
        new Apiresponse(200, createdUser, "USer registration completed successfully")
    )
})

export { registerUser }

