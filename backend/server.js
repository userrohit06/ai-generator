import express from "express"
import cookieParser from "cookie-parser"
import dotenv from 'dotenv'
import User from "./models/User.model.js"
import connectDB from "./db/connectdb.js"
import cron from "node-cron"
import { errorHandler } from "./middlewares/errorMiddleware.js"

// Routes Imports
import userRouter from "./routes/User.route.js"
import openAIRouter from "./routes/OpenAI.route.js"
import stripeRouter from "./routes/Stripe.route.js"

// instace of express
const app = express()
// PORT NO.
const PORT = process.env.PORT || 8080

// Cron for the trial Period: run every single day
cron.schedule("0 0 * * * *", async () => {
    // console.log("This task run every second");
    try {
        // get the current date
        const today = new Date()

        await User.updateMany({
            trialActive: true,
            trialExpires: { $lt: today }
        }, {
            trialActive: false,
            subscriptionPlan: "Free",
            monthlyRequestCount: 5
        })
    } catch (error) {
        console.log(error)
    }
})

// Cron for the free plan: run at the end of every month
cron.schedule("0 0 1 * * *", async () => {
    try {
        // get the current date
        const today = new Date()

        await User.updateMany({
            subscriptionPlan: "Free",
            nextBillingDate: { $lt: today }
        }, {
            monthlyRequestCount: 0
        })
    } catch (error) {
        console.log(error)
    }
})

// Cron for the basic plan: run at the end of every month
cron.schedule("0 0 1 * * *", async () => {
    try {
        // get the current date
        const today = new Date()

        await User.updateMany({
            subscriptionPlan: "Basic",
            nextBillingDate: { $lt: today }
        }, {
            monthlyRequestCount: 0
        })
    } catch (error) {
        console.log(error)
    }
})

// Cron for the premium plan: run at the end of every month
cron.schedule("0 0 1 * * *", async () => {
    try {
        // get the current date
        const today = new Date()

        await User.updateMany({
            subscriptionPlan: "Premium",
            nextBillingDate: { $lt: today }
        }, {
            monthlyRequestCount: 0
        })
    } catch (error) {
        console.log(error)
    }
})

// middlewares
app.use(express.json()) // parse request body to json format
app.use(cookieParser())   // pass the cookie automatically

// dotenv configuration
dotenv.config()

// ROUTES
app.use("/api/v1/users", userRouter)
app.use("/api/v1/openai", openAIRouter)
app.use("/api/v1/stripe-payment", stripeRouter)

// Error handler middleware
app.use(errorHandler)

// start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        try {
            console.log("Server is running on PORT NO. ", PORT);
        } catch (error) {
            console.log('error: ', error.message);
        }
    })
}).catch(err => {
    console.log(err.message);
})