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
});

const getUserTweets = asyncHandler(async(req,res) => {
    const tweets = await Tweet.find({owner:req.user._id});

    if(tweets.length === 0){
        throw new ApiError(404,"No Tweets Found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweets.reverse(),"Tweets fetched Successfully"))
});

const updateTweet = asyncHandler(async(req,res) => {

    function checkWordCount(tweetContent){
        const check = tweetContent.split(' ')
        console.log(check)
        return check.length <= 5; //maxcount for tweet words removing spaces from front and back trim
    }

    const {tweetContent} = req.body;
    const trimmedContent = tweetContent.trim();

    if(!trimmedContent || typeof trimmedContent !== "string" || !checkWordCount(trimmedContent)){
        throw new ApiError(400,"Content is Required (string type) and lesser than 2 words");
    }
    
    const tweet = await Tweet.findOneAndUpdate({_id:req.params.id,owner:req.user._id},{
        $set:{
            tweetContent:trimmedContent
        }
    },{new:true})

    if(!tweet){
        throw new ApiError(500,"Something Went Wrong")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet Updated Successfully"))
});

const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    if(!tweetId) throw new ApiError(400,"No such tweet exist - can't be deleted")
    const tweet = await Tweet.findOneAndDelete({_id:tweetId,owner:req.user._id});

    if(!tweet){
        throw new ApiError(500,"Something Went Wrong while deleting the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet Deleted Successfully"))
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

