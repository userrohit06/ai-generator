import express from "express"
import { isAuthenticated } from "../middlewares/isAuthenticated.js"
import { freeSubscriptionCtrl, stripePaymentCtrl, verifyStripePaymentCtrl } from "../controllers/StripePayment.controller.js"

const router = express.Router()

router.post("/checkout", isAuthenticated, stripePaymentCtrl)
router.post("/free-subscription-plan", isAuthenticated, freeSubscriptionCtrl)
router.post("/verify-payment/:paymentId", verifyStripePaymentCtrl)

export default router