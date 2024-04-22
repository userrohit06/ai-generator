import expressAsyncHandler from "express-async-handler"
import Payment from "../models/Payment.model.js"
import stripe from "stripe"
import calculateNextBillingDate from "../utils/calculateNextBillingDate.utils.js"
import renewSubscriptionPlan from "../utils/renewSubscriptionPlan.utils.js"
import User from "../models/User.model.js"

stripe(process.env.STRIPE_SECRET_KEY)

// STRIPE PAYMENT
export const stripePaymentCtrl = expressAsyncHandler(async (req, res) => {
    const { amount, subscriptionPlan } = req.body

    // get the user
    const user = req?.user

    try {
        // create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(amount) * 100,
            currency: 'usd',
            // add some data - meta data
            metadata: {
                userId: user?._id?.toString(),
                userEmail: user?.email,
                subscriptionPlan
            }
        })

        // send the response
        res.status(200).json({
            clientSecret: paymentIntent?.client_secret,
            paymentId: paymentIntent?.id,
            metadata: paymentIntent?.metadata
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

// VERIFY PAYMENT
export const verifyStripePaymentCtrl = expressAsyncHandler(async (req, res) => {
    const { paymentId } = req.params
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)
        if (paymentIntent.status !== "succeeded") {
            // get the info metadata
            const metadata = paymentIntent?.metadata
            const subscriptionPlan = metadata?.subscriptionPlan
            const userEmail = metadata?.userEmail
            const userId = metadata?.userId

            // find the user
            const userFound = await User.findById(userId)
            if (!userFound) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                })
            }

            // get the payment details
            const amount = paymentIntent?.amount / 100
            const currency = paymentIntent?.currency
            const paymentId = paymentIntent?.id

            // create the payment history
            const newPayment = await Payment.create({
                user: userId,
                email: userEmail,
                subscriptionPlan,
                amount,
                currency,
                status: "success",
                reference: paymentId
            })

            // check for the suscription plan
            if (subscriptionPlan === "Basic") {
                // update the user
                const updatedUser = await User.findByIdAndUpdate(userId, {
                    subscriptionPlan,
                    trialPeriod: 0,
                    nextBillingDate: calculateNextBillingDate(),
                    apiRequestCount: 0,
                    monthlyRequestCount: 50,
                    subscriptionPlan: "Basic",
                    $addToSet: { payments: newPayment?._id }
                })

                res.json({
                    status: true,
                    message: "Payment verified, user updated",
                    updatedUser
                })
            }

            if (subscriptionPlan === "Premium") {
                // update the user
                const updatedUser = await User.findByIdAndUpdate(userId, {
                    subscriptionPlan,
                    trialPeriod: 0,
                    nextBillingDate: calculateNextBillingDate(),
                    apiRequestCount: 0,
                    monthlyRequestCount: 100,
                    subscriptionPlan: "Premium",
                    $addToSet: { payments: newPayment?._id }
                })

                res.json({
                    success: true,
                    message: "Payment verified, user updated",
                    updatedUser
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        })
    }
})

// FREE SUBSCRIPITON
export const freeSubscriptionCtrl = expressAsyncHandler(async (req, res) => {
    // get the login user
    const user = req?.user

    // check if user account should be renewed or not
    try {
        if (renewSubscriptionPlan(user)) {
            // update the user account
            user.subscriptionPlan = "Free"
            user.monthlyRequestCount = 5
            user.apiRequestCount = 0
            user.nextBillingDate = calculateNextBillingDate()

            // create new payment and save into database
            const newPayment = await Payment.create({
                user: user?.id,
                subscriptionPlan: "Free",
                amount: 0,
                status: "success",
                reference: Math.random().toString(36).substring(7),
                monthlyRequestCount: 0,
                currency: "usd"
            })

            // save payment into user
            user.payments.push(newPayment._id)

            // save the user
            await user.save()

            // send the response
            res.json({
                success: true,
                message: "Subscription plan updated successfully"
            })
        } else {
            res.status(403).json({
                error: "Subscription renewal not due yet"
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
})