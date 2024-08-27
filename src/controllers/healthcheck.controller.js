import {ApiError} from "../utils/ApiError.js"
import { Apiresponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
   
   
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const showstatus = {
        status: "OK",
        message: "Server is up and running"
    }
    return res.status(200).json(
        new Apiresponse(201,showstatus,"show healcheck Status successfullly" )  
    );
})

export {
    healthcheck
    }
    