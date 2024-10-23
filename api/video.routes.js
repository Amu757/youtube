import { Router } from "express";
import { verifyJWT } from "./src/middlewares/auth.middleware.js";
import { upload } from "./src/middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getSubscribedVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  updateViews,
  getMyVideos
} from "./src/controlers/video.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/getallvideos").get(getAllVideos);
router.route("/getmyvideos").get(getMyVideos);

router.route("/getSubscribedVideos").get(getSubscribedVideos);

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route("/views/:videoId").patch(updateViews);

export default router;
