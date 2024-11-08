import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js ";

const router = new Router();
router.use(verifyJWT);

router.route("/c/:channelId").get(getSubscribedChannels)
                             .post(toggleSubscription)
router.route("/u/:subscriptionId").get(getUserChannelSubscribers)

export default router;