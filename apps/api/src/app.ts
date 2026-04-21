import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import userRouter from "@routes/userRouter"
import authRouter from "@routes/authRouter"
import serverRouter from "@routes/serverRouter"
import channelRouter from "@routes/channelRouter"
import errorHandler from "@middlewares/errorHandler";

dotenv.config({quiet: true});
const app = express()
const uploadsDir = fileURLToPath(new URL("../uploads", import.meta.url));

app.use(morgan("dev"))
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use("/api/uploads", express.static(uploadsDir))

app.use("/api/users", userRouter)
app.use("/api/auth", authRouter)
app.use("/api/servers", serverRouter)
app.use("/api/channels", channelRouter)

app.use("/api/up", (req, res) => {
  res.status(200).json({ message: "OK" })
})

app.use((req, res) => {
  res.status(404).json({ message: `Unknown endpoint: ${req.method} ${req.originalUrl}` })
})
app.use(errorHandler)


export default app
