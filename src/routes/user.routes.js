import { Router } from "express";
import { home, registerUser, logInUser,logOutUser,refreshAccessToken } from "../controlers/user.controler.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/home").get(home);

router.route("/register").post(
  upload.fields([
    {
      name: "avatar", //input name in front end should match
      maxCount: 1, // number of fields
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); //endpoint is handlled by registerUser controller

router.route("/login").post(logInUser);

// ********  secured routes - user must logged in   ************
router.route("/logout").post(verifyJwt, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

export default router;
