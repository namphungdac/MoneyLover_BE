import express from "express";
import UserController from "../controllers/User.controller";

const userRouter = express.Router();

userRouter.get('/users', UserController.getListUser);
userRouter.delete('/users', UserController.deleteUser);
userRouter.put('/users', UserController.updateUser);
userRouter.get('/users/:userID/send-report', UserController.sendReport);

export default userRouter;