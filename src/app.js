import express from "express"
import cors from "cookie-parser"
import cookieParser from "cookie-parser"

const app = express()

//app.use() for middlewares and configs

// CORS USAGE

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// CONFIG setup using app.js

app.use(express.json({limit: "18Kb"}))
app.use(express.urlencoded({extended: true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



export { app } 