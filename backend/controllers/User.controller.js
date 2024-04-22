import User from "../models/User.model.js"
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import expressAsyncHandler from "express-async-handler"

// REGISTER USER
export const registerCtrl = expressAsyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    // validate
    if (!username || !email || !password) {
        res.status(400)
        throw new Error('All fields are required')
    }

    // check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        res.status(400)
        throw new Error('User already exists')
    }

    // hash user password then save it
    const salt = await bcrypt.genSalt(10)
    const hashedPsd = await bcrypt.hash(password, salt)

    // create new user
    const newUser = new User({
        username,
        password: hashedPsd,
        email
    })

    // add the date trial will end
    newUser.trialExpires = new Date(
        new Date().getTime() + newUser.trialPeriod * 24 * 60 * 60 * 1000
    )

    // save the user
    await newUser.save()

    // send response
    res.status(200).json({
        success: true,
        message: 'User registered successfully',
        user: {
            username,
            email
        }
    })
})

// LOGIN USER
export const loginCtrl = expressAsyncHandler(async (req, res) => {
    // get data from body
    const { email, password } = req.body

    // check if user exists
    const user = await User.findOne({ email })

    // throw error if user does not exist
    if (user === null) {
        res.status(401)
        throw new Error('Invalid email or password')
    }

    // check if password is valid
    const validPassword = await bcrypt.compare(password, user && user?.password)

    // throw error is password is incorrect
    if (!validPassword) {
        res.status(401)
        throw new Error("Invalid email or password")
    }

    // generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECURE_KEY, {
        expiresIn: '30d' // token expires in 30 days
    })

    // set token into cookies (http only - secure)
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "PRODUCTION",
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 1000 // 1 day
    })

    // send response
    res.status(200).json({
        success: true,
        message: "login successful",
        _id: user?._id,
        username: user?.username,
        email: user?.email
    })
})

// LOGOUT USER
export const logoutCtrl = expressAsyncHandler(async (req, res) => {
    res.cookie('token', '', { maxAge: 1 })
    res.status(200).json({
        message: "Logout Successful"
    })
})

// USER PROFILE
export const userProfileCtrl = expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req?.user?.id)
        .select("-password")
        .populate("payments")
        .populate("history")

    if (user) {
        res.status(200).json({
            success: true,
            user
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})

// CHECK USER AUTH STATUS
export const checkAuth = expressAsyncHandler(async (req, res) => {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECURE_KEY)

    if (decoded) {
        res.json({
            isAuthenticated: true
        })
    } else {
        res.json({
            isAuthenticated: false
        })
    }
})