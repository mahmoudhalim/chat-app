import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import userRouter from "@routes/userRouter"
import errorHandler from "./middlewares/errorHandler";

dotenv.config({quiet: true});
const app = express()

app.use(morgan("dev"))
app.use(cors())
app.use(express.json())

app.use("/api/users", userRouter)
app.use(errorHandler)


export default app