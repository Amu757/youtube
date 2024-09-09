import { Router } from "express";
import {
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
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

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
); 

router.route("/login").post(logInUser);

router.route("/loginbytoken").post(verifyJWT);


// ********  secured routes - user must logged in   ************
router.route("/logout").post(verifyJWT, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changePassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserCannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
