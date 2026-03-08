const express = require('express');
const authControllers = require('../controllers/auth.controllers');
const { authMiddleware } = require('../middlewares/auth.middleware');
const authRouter = express.Router();

authRouter.post('/register', authControllers.registerController);
authRouter.post('/login', authControllers.loginController);
authRouter.post('/logout', authControllers.logoutController);
authRouter.patch('/change-password', authMiddleware, authControllers.changePasswordController);
authRouter.post('/google', authControllers.googleAuthController);

module.exports = authRouter;
