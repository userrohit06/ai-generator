import express from 'express'
import { checkAuth, loginCtrl, logoutCtrl, registerCtrl, userProfileCtrl } from '../controllers/User.controller.js'
import { isAuthenticated } from '../middlewares/isAuthenticated.js'

const router = express.Router()

router.post('/register', registerCtrl)
router.post('/login', loginCtrl)
router.post('/logout', logoutCtrl)
router.get('/user-profile', isAuthenticated, userProfileCtrl)
router.get("/auth/check", isAuthenticated, checkAuth)

export default router