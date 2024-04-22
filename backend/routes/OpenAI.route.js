import express from "express"
import { openAICtrl } from "../controllers/OpenAI.controller.js"
import { isAuthenticated } from "../middlewares/isAuthenticated.js"
import { checkApiRequestLimit } from "../middlewares/checkApiRequestLimit.js"

const router = express.Router()

router.post("/generate-content", isAuthenticated, checkApiRequestLimit, openAICtrl)

export default router