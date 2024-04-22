import expressAsyncHandler from "express-async-handler";
import User from "../models/User.model.js";

export const checkApiRequestLimit = expressAsyncHandler(async (req, res, next) => {
    if (!req?.user) {
        return res.status(401).json({ message: "User not authorized" })
    }

    // find user in database
    const user = await User.findById(req?.user?.id)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    // check request limit of user
    let requestLimit = 0

    // check if user is on a trial period
    if (user?.trialActive) {
        requestLimit = user?.monthlyRequestCount
    }

    // check if user has exceeded monthly request limit
    if (user?.apiRequestCount >= requestLimit) {
        throw new Error("API Request Limit Reached")
    }

    next()
})