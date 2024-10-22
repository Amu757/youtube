import express from "express"
import cors from 'cors'
import cookieparser from 'cookie-parser'  //to access and set cookies on the server

const app =  express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,   // allow req from the origin mentioned
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))  // to parse url data, extended means can be nested object
app.use(express.static("public"))  // a common accessible folder to store resources
app.use(cookieparser())


// routes import
import userRouter from "./routes/user.routes.js"
import healthRouter from "./routes/healthcheck.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
// /api/v1/users is standard prefix
app.use("/api/v1/users",userRouter)  //router is get by middleware and passed to userRouter
app.use("/api/v1/health",healthRouter) 
app.use("/api/v1/video",videoRouter) 
app.use("/api/v1/subscription",subscriptionRouter) 
app.use("/api/v1/playlist",playlistRouter) 
app.use("/api/v1/like",likeRouter) 
app.use("/api/v1/comment",commentRouter) 
app.use("/api/v1/tweet",tweetRouter) 
app.use("/api/v1/dashboard",dashboardRouter) 

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack to the console
    res.status(err.statuscode || 500).json({ message: err.message || 'Internal Server Error' , errors : err.errors || []});
  });

  
// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });


export {app}