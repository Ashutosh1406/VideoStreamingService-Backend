import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

import { pipeline } from "stream";



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

    const video = await Video.findById(videoId).populate('owner','username') //this is the change - email later

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

const togglePublishStatus = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"Video id is required")
    }
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    const video = await Video.findOne({_id:videoId,owner:req.user._id}).select('published')

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{  //from publish to unpublish or vice-versa
        isPublished: !video.isPublished
    },{new:true}).populate('owner','username email')

    if(!updatedVideo){
        throw new ApiError(500,"failed to update video status")
    }
    res
    .status(201)
    .json(new ApiResponse(201,{data:updatedVideo},"Video Status Updated Succesfully"))
})

const getAllVideos = asyncHandler(async(req,res) => {
    const {page =1,limit=10,sortBy = "createdAt",sortType = "asc"} = req.query

    let pipeline = [
        {
            $sort: {
                [sortBy]: sortType==='desc' ? -1:1
            }
        },
        {
            $skip: (page-1)*parseInt(limit)
        },
        {
            $limit:parseInt(limit)
        },
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField:"_id",
                as:"users",
                pipeline: [
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]

            }
        },
    ]
    const videos = await Video.aggregate(pipeline)
    if(!videos){
        throw new ApiError(500,"No Videos Found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200 , {videos} , "Videos Fetched Successfully"))
})

const getAllVideosByUserId = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!channelId){
        throw ApiError(400,"User id is required")
    }

    if(!mongoose.isValidObjectId(channelId)){
        throw ApiError(400,"Invalid user id")
    }

    const videos = await Video.find({owner:channelId}).populate('owner','username email')

    if(!videos){
        throw new ApiError(500,"No Videos Found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{videos},"Video Fetched Successfully"))
})

const updateVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const {title,description} = req.body

    if(!title && !description){
        throw new ApiError(400,"Title and Description are required")
    }

    if(!videoId){
        throw new ApiError(400,"Video Id is required")
    }

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id")
    }
    
    const thumbNailLocalPath = req.files?.thumbnail[0].path
    if(!thumbNailLocalPath){
        throw new ApiError(400,"Thumnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbNailLocalPath)
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail is required")
    }

    const updatedVideo = await Video.findOneAndUpdate({_id:videoId,owner:req.user._id},{
        title,
        description,
        thumbnail:thumbnail.url
    }, { new:true}).populate('owner','username email')

    if(!updateVideo){
        throw new ApiError(404,"Video is not found or not Updated")
    }

    res
    .status(200)
    .json(new ApiResponse(200,{data:updatedVideo},"Video Uploaded Successfully"))
})

const getAllVideosByFilter = asyncHandler(async(req,res) => {
    const {page = 1 , limit = 10 , query = "My" , sortBy = "createdAt" , sortType = "asc" , username } = req.query;

    if(page<1){
        throw new ApiError(400,"Invalid Page Number");
    }
    if(limit<1){
        throw new ApiError(400,"Invalid Limit");
    }
    if(sortBy && !["title","createdAt","views"].includes(sortBy)){
        throw new ApiError(400,"Invalid Sort By")
    }
    if(!sortType || ["asc","desc"].indexOf(sortType)===-1){
        throw new ApiError(400,"Invalid sortType")
    }
    if(!query && !username){
        throw new ApiError(400,"Query or Username is Required")
    }

    let pipelineToFindUsingTitleandDescription = [
        {
            $match : {
                $or : [

                ]
            }
        },
        {
            $sort : {
                [sortBy] : sortType === "desc" ? -1 : 1
            }
        },
        {
            $skip : (page-1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "users",
                localField : "owner" , 
                foreignField : "_id",
                as : "users",
                pipeline : [
                    {
                        $project : {
                            username:1,
                            fullname:1,
                            avatar:1,
                            coverImage:1
                        }
                    }
                ]
            }
        },
    ]

    let pipelineToFindUsingUsername = [
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "users",
                pipeline: [
                    {
                        $project: {
                            username:1,
                            fullname:1,
                            avatar:1,
                            coverImage:1,
                        }
                    }
                ]
            }
        },
        {
            $match : {
                $or : [
                    {'users.username' : {regex: new RegExp(username,'i')}},
                ]
            }
        },
        {
            $sort:{
                [sortBy]:sortType === 'desc' ? -1:1
            }
        },
        {
            $skip: (page-1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ]

    if(username){
        pipeline = pipelineToFindUsingUsername;
    }
    else{
        pipeline = pipelineToFindUsingTitleandDescription;
    }

    const videos = await Video.aggregate(pipeline)

    if(!videos){
        throw new ApiError(500,"No Videos Found")
    }

    const totalVideos = videos.length
    const totalPages = Math.ceil(totalVideos/limit)

    res
    .status(200)
    .json(new ApiResponse(200,{videos,totalVideos,totalPages},"Videos Fetched Successfully"))

})


export {publishVideo,getVideoById,deleteVideo,togglePublishStatus,getAllVideos,getAllVideosByUserId,updateVideo,getAllVideosByFilter}