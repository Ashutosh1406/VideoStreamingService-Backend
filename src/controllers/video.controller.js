import mongoose , {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import path from "path";

const publishVideo = asyncHandler(async(req,res) => {
    const {title,description} = req.body
    if(!title || !description){
        throw new ApiError(400,"Title and description is needed")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    console.log(videoFileLocalPath)
    const thumbNailLocalPath = req.files?.thumbnail[0]?.path
    console.log(thumbNailLocalPath)

    if(!videoFileLocalPath && !thumbNailLocalPath){
        throw new ApiError(422,"No File Uploaded")
    }

    const videoFileUrl = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailUrl = await uploadOnCloudinary(thumbNailLocalPath)

    if(!thumbnailUrl){
        throw new ApiError(503,"Thumbnail couldn't be uploaded on cloudinary at the moment")
    }

    if(!videoFileUrl){
        throw new ApiError(503,"Video couldn't be uploaded on cloudinary at the moment")
    }

    const publishedVideo = await Video.create({
        title,
        description,
        videoFile : videoFileUrl.url,
        thumbnail : thumbnailUrl.url,
        owner     : req.user._id,
        duration  : videoFileUrl?.duration
    }
    )

    if(!publishedVideo){
        throw new ApiError(500,"Failed to save video on cloud")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , {publishedVideo} , 'Video has been Published'))
});

const getVideoById = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    if(!videoId) throw new ApiError(400,"Video id is required")

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid Video ID')
    }

    const video = await Video.findById(videoId).populate('owner','username','email')

    if(!video){
        throw new ApiError(404,'Video Not Found')
    }

    video.views += 1;

    await video.save()

    return res
    .status(200)
    .json(new ApiResponse(200 , {video} , "Video found Successfully"))
})

const deleteVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params

    if(!videoId) throw new ApiError(400,"video id is required")
    if(mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid Video Id')
    }
    const video  = await Video.findOneAndDelete({_id:videoId , owner:req.user,_id})

    res
    .status(200)
    .json(new ApiResponse(200,{data:video},"video deleted successfully"))
})







export {publishVideo,getVideoById,deleteVideo}