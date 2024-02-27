import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import  Jwt  from "jsonwebtoken";
import { User } from "../models/user.model";



export const VerifyJWT = asyncHandler(async(req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer" , "")
    
        if(!token)
        {
            throw new ApiError(401,"Unauthorized Request")
        }
    
        const decodedToken = Jwt.Verify(token,process.env.ACCESS_TOKEN_SECRET)
    
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