import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema ({
    userName: {
        typeof: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        typeof: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        typeof: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        typeof: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "video" // pending 
        }
    ],
    password: {
        type: String,
        required: [true , "Password is required"]
    },
    refreshToken: {
        type: String,
    }
}, { timestamps : true})

userSchema.pre("Save" , async function (next){
    if(!this.isMOdified("password")) return next();
    this.password =  await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateREfreshToken = async function(){
    jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)