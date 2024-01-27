
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()   //async method return as promises
.then( ()=> {
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at Port ${process.env.PORT}`);
    }) 
})
.catch((err) =>{
    console.log("MongoDB Connection Failed")
})
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






