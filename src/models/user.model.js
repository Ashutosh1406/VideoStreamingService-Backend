import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";  //bearer token  
import bcrypt from "bcrypt";

const userSchema  = new mongoose.Schema(
    {
        username: {
            type:String,
            required:true,
            lowercase:true,
            unique:true,
            trim:true,
            index:true //for searching optimally in db
        },
        email: {
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName: {
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar: {
            type:String,  //cloudinary url
            required:true,
        },
        coverImage: {
            type:String,  //cloudinary url
        },
        watchHistory: [ //array 
            {
                type:mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required:[true,'Password is required']
        },
        refreshToken: {
            type:String
        }
    },
    // {  //version key false
    //     collection:'users',
    //     versionKey:false
    // },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {

    //if password not changed
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

//BRCRYPT USE

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

//JWT USE 
// userSchema.methods.generateAccessToken = function(){
//     return jwt.sign( //async might be used use case dependant
//         {
//             _id:this._id,  //rhs from db
//             email:this.email,
//             username:this.username,
//             fullname:this.fullName
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         { //expiry in object type
//             expiresIn:process.env.ACCESS_TOKEN_EXPIRY
//         }
//     )
// }
// userSchema.methods.generateRefreshoken = async function(){
//     return jwt.sign( //async might be used use case dependant
//     { //less payload
//         _id:this.id,  //rhs from db
//     },
//     process.env.REFRESH_TOKEN_SECRET,
//     { //expiry in object type
//         expiresIn:process.env.REFRESH_TOKEN_EXPIRY
//     }
//   )
// }

userSchema.methods.generateAccessToken = function(){
    //console.log("Sub 1")
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username:this.username,
            fullname:this.fullname //right side things are coming from database
        },
        process.env.ACCESS_TOKEN_SECRET, //This is the secret key which is used to encrypt the data
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,//This is the secret key which is used to encrypt the data
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema);

