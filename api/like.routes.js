import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    getCommentLikes,
    toggleVideoLike,
    toggleTweetLike,
    getVideoLikes
} from "./src/controlers/like.controller.js"
import {verifyJWT} from "./src/middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/c/:commentId").get(getCommentLikes);
router.route("/v/:videoId").get(getVideoLikes);
router.route("/videos/:userId").get(getLikedVideos);

export default router