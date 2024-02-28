import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  Jwt  from "jsonwebtoken";
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async(req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")
    
        if(!token)
        {
            throw new ApiError(401,"Unauthorized Request")
        }
    
        const decodedToken = Jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")  //from user.model schema
        
        if(!user)
        {
            throw new ApiError(401,"Invalid Access Token")
        }
        
        req.user = user;
        next()  //important for further step in routing

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }

})