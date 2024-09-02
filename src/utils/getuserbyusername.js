import {User} from "../models/user.model.js";
import { ApiError } from "./ApiError.js";
import { asyncHandler } from "./asyncHandler.js";

export const getuserByUsername = async(username) => {
    const getUserByUsername = await User.findOne({username:username});

    if(!username){
        throw new ApiError(404,"User Not Found")
    }
    return getUserByUsername;
}