import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js"
import net from "net"

if (net.setDefaultAutoSelectFamily) {     //expression that took 3 days
    net.setDefaultAutoSelectFamily(false);
}

dotenv.config({
    path: './.env'
})

// FIX TRY 1
// const socket = net.createConnection({host:'localhost',port:8006,autoSelectFamily:false},()=> {
//     console.log('connected to server🤲');
// });
connectDB()   //async method return as promises
.then( () => {
    app.listen(process.env.PORT || 8006 , () => {
        console.log(`Server is running at Port: ${process.env.PORT}`);
    }) 
})
.catch((err) =>{
    console.log("MongoDB Connection fatal at src/index.js",err);
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






