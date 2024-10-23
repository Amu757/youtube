import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
  getSubscribedStatus,
} from "./src/controlers/subscription.controller.js";
import { verifyJWT } from "./src/middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/status/c/:channelId").get(getSubscribedStatus);

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .patch(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
