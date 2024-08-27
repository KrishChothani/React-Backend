import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"; 

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"))
app.use(cookieParser())

//routes import 

import userRouter from "./routes/user.router.js";
import videoRouter from "./routes/video.router.js";
import tweetRouter from "./routes/tweet.router.js";
import subscriptionRouter from "./routes/subscription.router.js"
import playlistRouter from "./routes/playlist.router.js"
import likeRouter from "./routes/like.router.js"
import healthcheckrouter from "./routes/healthcheck.router.js"
import dashboardRouter from "./routes/dashboard.router.js"

app.use("/api/v1/users", userRouter);    
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions" , subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/healthcheck", healthcheckrouter);
app.use("/api/v1/dashboards", dashboardRouter);
 
export { app }