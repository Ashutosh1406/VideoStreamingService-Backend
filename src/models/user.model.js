import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";  //bearer token  
import bcrypt from "bcrypt";

const UserSchema  = new Schema(
    {
        username: {
            type:String,
            required:true,
            unique:true,
            trim:true,
            index:true //for searching optimally in db
        },
        email: {
            type:String,
            required:true,
            unique:true,
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
                type:Schema.Types.ObjectId,
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
    {
        timestamps: true
    }
)

UserSchema.pre("save", async function (next) {

    //if password not changed
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

//BRCRYPT USE

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

//JWT USE 
UserSchema.methods.generateAccessToken = function(){
    return jwt.sign( //async might be used use case dependant
        {
            _id:this._id,  //rhs from db
            email:this.email,
            username:this.username,
            fullname:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { //expiry in object type
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
UserSchema.methods.generateRefreshoken = function(){
    return jwt.sign( //async might be used use case dependant
    { //less payload
        _id:this._id,  //rhs from db
    },
    process.env.REFRESH_TOKEN_SECRET,
    { //expiry in object type
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}


export const User = mongoose.model("User", UserSchema);

