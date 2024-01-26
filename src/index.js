
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
/*

// **** APPROACH 1 ******


// ;( async()=>{})()  iffy's  "semicolon for better practice as during the runtime ";" is required"

import express from "express"
const app = express()


( async () => {
    try{ //a
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("error",error);
            throw error
        })

        app.listen()
    } catch(error){
        console.error("ERROR:",error)
        throw err
    }
})()

*/






