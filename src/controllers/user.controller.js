import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



//generate Token 
const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)       //find by id
        const accessToken = user.generateAccessToken()  //to user
        const refreshToken = user.generateRefreshToken() //to db 

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"Something Went Wrong while generating refresh and access Token")
    }
}

//register

const registerUser = asyncHandler ( async (req,res) => {
    /*STEPS*/

    //1) get user details from frontend
    // 2) validation (basic !empty() )
    // 3) check if user already exist : from username and email field
    // 4) check for images , check for avatar
    // 5) upload them to cloudinary , avatar
    // 6) create user object - create entry in DB for pushing entries using objects
    // 7) remove password and refresh token field from response
    // 8) check for user creation
    // 9) return response (res) else error response

    // STEP 1 
    const {fullName,email,username,password} = req.body
    //console.log("fullname" , fullName);

    //STEP 2 
    if(
        [fullName,email,username,password].some((field) => 
        field?.trim() === "")
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
    
    //const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //console.log(avatarLocalPath);

    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    console.log(avatarLocalPath);

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

    const {email,username,password}  = req.body();

    if(!username && !email)
    {
        throw new ApiError(400,"Username or Email is Required")
    }

    const user = await User.findOne({
        $or: [{username,email}]
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
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken  //data field
            },
            "User logged in SuccessFully"
        )
    )

})

//logout
const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
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


export {registerUser,loginUser,logoutUser}