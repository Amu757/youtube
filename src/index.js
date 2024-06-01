import dotenv from "dotenv"; // load all env variables from system not files
import connectDB from "./db/connect.js";
import { app } from "./app.js";

dotenv.config(); // need experimental script in package.json file dev command

connectDB() // its a async function that returns promise
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{  // avialable port on server or hosting system
        console.log("server is running on localhost:" + process.env.PORT);
    }) 
})
  .catch((error) => {
    console.log("mongodb connection failed !!", error);
  });
