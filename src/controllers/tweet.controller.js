import mongoose from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Console } from "console"

const createTweet = asyncHandler(async(req,res) => {
    //Create Tweet 

    function checkWordCount(tweetContent){
        const check = tweetContent.split(' ')
        console.log(check)
        return check.length <= 5; //maxcount for tweet words removing spaces from front and back trim
    }

    //get from body
    const {tweetContent} = req.body
    const trimmedContent = tweetContent.trim();

    if(!trimmedContent || typeof trimmedContent !== "string" || !checkWordCount(trimmedContent)){
        throw new ApiError(400,"Content is Required (string type) and lesser than 2 words");
    }
    const tweet = await Tweet.create(
        {
            tweetContent:trimmedContent,
            owner:req.user?._id
        }
    )
    
    if(!tweet) throw new ApiError(500,"Server Error While Creating tweet")

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"tweet created Successfully"))
})

const getUserTweets = asyncHandler(async(req,res) => {

})

const updateTweet = asyncHandler(async(req,res) => {

})

const deleteTweet = asyncHandler(async(req,res) => {

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

