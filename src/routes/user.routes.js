import { Router} from "express";
import { home,registerUser } from "../controlers/user.controler.js";
import {upload} from '../middlewares/multer.middleware.js'
const router = Router()

router.route("/home").get(home)

router.route("/register").post(
    upload.fields([
        {
            name:"avatar", //input name in front end should match 
            maxCount:1 // number of fields
        },{
            name:"coverImage", 
            maxCount:1 
        }])
    ,registerUser)    //endpoint is handlled by registerUser controller

export default router;
