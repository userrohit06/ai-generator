import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken"
import User from "../models/User.model.js";

// ISAUTHENTICATED MIDDLEWARE
export const isAuthenticated = expressAsyncHandler(async (req, res, next) => {
    if (req.cookies.token) {
        // verify the token
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECURE_KEY)

        // add the user to the req object
        req.user = await User.findById(decoded?.id).select("-password")
        return next()
    } else {
        return res.status(401).json({
            message: "User not authorized"
        })
    }
})