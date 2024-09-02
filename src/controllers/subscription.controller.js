import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription  } from "../models/subscription.model.js";
import { getuserByUsername } from "../utils/getuserbyusername.js";
import mongoose from "mongoose";


const toggleSubscription = asyncHandler(async(req,res) => {
    const channelId = req.params
    if(!channelId){
        throw new ApiError(404,"No such User Channel Exits")
    }
    const user = req.user
    console.log("Getting user",user)

    const subscribed = await Subscription.findOne({channnel: new mongoose.Types.ObjectId(channelId),subscriber:user._id})

    if(subscribed){
        await Subscription.deleteOne({channnel:new mongoose.Types.ObjectId(channelId) , subscriber: user._id})
        return res.status(200).json(new ApiResponse(200,{},"Unsubscribed Successfully"))
    }
    if(!subscribed)
    {
        await Subscription.create({channel: new mongoose.Types.ObjectId(channelId),subscriber:user._id })
        return res.status(200).json(new ApiResponse(200,{},"Subscribed Successfully"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Trail in toggle Subscription"))
})


export {
    toggleSubscription
}

