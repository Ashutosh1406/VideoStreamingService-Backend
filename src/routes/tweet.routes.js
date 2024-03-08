import { Router } from "express";

import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"

import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); //as for whole tweets functionality JWT middleware is needed


// Tweet routes

router.route("/create-tweet").post(createTweet);
router.route("/user-tweets").get(getUserTweets);
router.route("/update-tweet/:id").post(updateTweet)
router.route("/delete-tweet/:tweetId").delete(deleteTweet);

export default router