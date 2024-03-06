import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  Jwt  from "jsonwebtoken";
import mongoose from "mongoose";


//generate Token 
const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)       //find by id
        //console.log("user",user)
        const accessToken = user.generateAccessToken()  //to user
        const refreshToken = user.generateRefreshToken() //to db 

        user.refreshToken = refreshToken;
        //console.log("*")
        await user.save({ validateBeforeSave : false })

        return { accessToken,refreshToken }

    }catch(error){
        throw new ApiError(500,"Something Went Wrong while generating refresh and access Token")
    }
}

//register

const registerUser = asyncHandler ( async (req,res) => {
    /*STEPS*/

    // 1) get user details from frontend
    // 2) validation (basic !empty() )
    // 3) check if user already exist : from username and email field
    // 4) check for images , check for avatar
    // 5) upload them to cloudinary , avatar
    // 6) create user object - create entry in DB for pushing entries using objects
    // 7) remove password and refresh token field from response
    // 8) check for user creation
    // 9) return response (res) else error response

    //STEP 1 
    const {fullName,email,username,password} = req.body
    //console.log("fullname" , fullName);

    //STEP 2 
    if(
        [fullName,email,username,password].some((field) =>  field?.trim() === "")
    ) {
        throw new ApiError(404,"All Fields are required")
    }

    //STEP 3 
    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User Already exists with this email or username")    //Api error.js useCase
    }

    //STEP 4 
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //console.log(avatarLocalPath);

    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    // let avatarLocalPath;
    // if ( req.files.avatar[0] ) {
    //     avatarLocalPath = req.files.avatar[0].path;
    // }
    // console.log(avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is Required")
    }

    // if(!coverImageLocalPath){
    //     console.warn("Cover Image is Good For Mental Health");
    // }

    //STEP 5  UPLOAD ON CLOUDINARY

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar File is Required step 5");
    }

    //STEP 6 
    const user = await User.create({
        fullName,
        avatar:avatar.url, //always there
        coverImage:coverImage?.url || "", //not always there
        email,
        password,
        username:username.toLowerCase()
    })

    //STEP 7 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  //by default all selected use "-" to exempt those , that are aren't needed
    )
    
    //STEP 8 
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the User")
    }

    //STEP 9 
    return res.status(201).json(  //using ApiResponse.js 
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
    
    /*
        => PRACTICE STEP 1
    if(fullname===""){   
        throw new ApiError(400,"Full name is required")
    }


    const {fullname} = req.body
    let basic_check = fullname;
    if(basic_check == ""){
        console.log("it is empty");
    }
    else{
        console.log("proceed");
    }

   */

} ) 

//login

const loginUser = asyncHandler( async (req,res) => {
    // //todo's
    // 1) username , password from body req.body()
    // 2) basic validation of type of username and password
    // 3) method/fn find for getting access to db and matching it with user entered username and generation of token
    // 4) saving those tokens inside our db with primary as username or send cookies (secure)

    const {email,username,password}  = req.body;
    //console.log(email)

    if(!username && !email)
    {
        throw new ApiError(400,"Username or Email is Required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //excluding field

    //send by cookie

    const options  = {
        httpOnly : true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken", refreshToken , options)
    .json(new ApiResponse(
            200,
            {user: loggedInUser,accessToken,refreshToken},  //data field
            "User logged in SuccessFully"
        ))

})

//logout
const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken:1  //this removes field
            }
        },
        {
            new:true
        }
    )

    const options  = {
        httpOnly : true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200,{}, "User Logged Out"))
})

//refresh Token
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised Access")
    }
    try {
        const decodedToken = Jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401," Invalid Access Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401," Refresh Token is Expired or Used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken:accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }


})

//update password 
const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword , newPassword} = req.body

    req.user?._id
    const user = await User.findById(req.user?._id)
    const passwordCheck = await user.isPasswordCorrect(oldPassword)

    if(!passwordCheck){
        throw new ApiError(400,"Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed SuccessFully"))

})

//getting the current logged in User
const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200,req.user,"user fetched successfully")
})

//update USER details
const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(400,"all fields are required")
    }
    const user = User.findByIdAndUpdate( 

        req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"account details Updated Successfully"))
})

//update profile picture

const updateUserProfileImage = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading this avatar")
    }

    const user =  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path
    
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage File is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading this coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar : coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params  //from url

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username:username?.toLowerCase()
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size:"$subscribers" //subscriber count

                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if:{$in : [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel doesnt exists")
    }
    return res
    .status(200)
    .json(
            new ApiResponse(200,channel[0],"user channel fetched succesfully")
    )
})

// nested lookup for watch history
const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History Fetched Successfully"
        )
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfileImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}