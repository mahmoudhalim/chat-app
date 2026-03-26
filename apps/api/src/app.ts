import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import cookieParser from "cookie-parser";
import userRouter from "@routes/userRouter"
import authRouter from "@routes/authRouter"
import errorHandler from "@middlewares/errorHandler";

dotenv.config({quiet: true});
const app = express()

app.use(morgan("dev"))
app.use(cors())
app.use(cookieParser())
app.use(express.json())

app.use("/api/users", userRouter)
app.use("/api/auth", authRouter)

app.use((req, res) => {
  res.status(404).json({ message: `Unknown endpoint: ${req.method} ${req.originalUrl}` })
})
app.use(errorHandler)


export default app
