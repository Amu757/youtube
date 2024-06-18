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

//routes declaration
// /api/v1/users is standar prefix
app.use("/api/v1/users",userRouter)  //router is get by middleware and passed to userRouter
app.use("/api/v1/health",healthRouter) 
app.use("/api/v1",videoRouter) 

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack to the console
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  
// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });


export {app}