import { Router } from "express";
import {  getAllVideos, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router =  Router();
router.use(verifyJWT);

router.route("/").post(
                    upload.fields([
                        {
                            name:"videoFile",
                            maxCount: 1,
                        },
                        {
                            name: "thumbnail",
                            maxCount: 1,
                        }
                    ]),
                    publishAVideo
                )

router.route("/get-all-video").get(getAllVideos)
router.route("/v/:videoId").get(getVideoById)
router.route("/uv/:videoId").options(updateVideo);
export default router;
