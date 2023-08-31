import express from "express";
import iconWalletController from "../controllers/IconWallet.controller";

const iconWalletRouter = express.Router();

iconWalletRouter.get('/iconWallets', iconWalletController.getIconWalletList);

export default iconWalletRouter;