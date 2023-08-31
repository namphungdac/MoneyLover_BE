import express from "express";
import userController from "../controllers/User.controller";
import UserController from "../controllers/User.controller";

const authRouter = express.Router();

authRouter.post('/register',userController.createUser);
authRouter.post('/login', userController.login);
// authRouter.post('/sendConfirmEmail', UserController.sendEmail)
authRouter.get('/verify/:token', UserController.verifyEmail)
authRouter.post('/reset-password',UserController.resetPassword)

export default authRouter;