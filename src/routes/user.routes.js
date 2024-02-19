import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";


const router = Router()

//upload to be used before .post request as a middleware 
router.route("/register").post(
    upload.fields([
        {  //for avatar from frontend
            name : "avatar",
            maxCount : 1
        },
        { //for coverImages from frontend one or many
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
    )


export default router 