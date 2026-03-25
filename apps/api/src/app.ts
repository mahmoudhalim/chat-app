import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import userRouter from "@routes/userRouter"

dotenv.config({quiet: true});
const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/users", userRouter)


export default app