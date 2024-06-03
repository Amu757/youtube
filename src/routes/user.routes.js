import { Router } from "express";
import {
  home,
  registerUser,
  logInUser,
  logOutUser,
  refreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  getUserCannelProfile,
  getWatchHistory,
} from "../controlers/user.controler.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
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

router.route("/change-password").post(verifyJwt, changePassword);

router.route("/current-user").get(verifyJwt, getCurrentUser);

router.route("/update-account").patch(verifyJwt, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("/coverImage")
  .patch(verifyJwt, upload.single(), updateUserCoverImage);

router.route("/c/:username").get(verifyJwt, getUserCannelProfile);

router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
