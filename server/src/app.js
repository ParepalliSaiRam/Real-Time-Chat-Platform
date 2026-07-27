import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import attachmentRoutes from "./routes/attachment.routes.js";
import groupRoutes from "./routes/group.routes.js";
import messageRoutes from "./routes/message.routes.js";
import statusRoutes from "./routes/status.routes.js";

dotenv.config();

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: {
        policy: "cross-origin"
    }
}));
app.use(cors({

    origin: process.env.CLIENT_URL,

    credentials: true

}));

app.use(express.json({
    limit: "10mb"
}));

app.use(cookieParser());

app.use(morgan("dev"));

app.use(express.urlencoded({
    extended: true
}));

app.use(
    "/uploads",
    express.static(path.resolve("uploads"))
);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/conversations", attachmentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/statuses", statusRoutes);
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Server is running 🚀"
    });
});
app.use((req,res)=>{
    res.status(404).json({
        success:false,
        message:"Route not found."
    });
});
app.use(errorHandler);

export default app;