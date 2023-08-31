import express from "express";
import WalletRoleController from "../controllers/WalletRole.controller";

const walletRoleRouter = express.Router();

walletRoleRouter.post('/users/walletRoles', WalletRoleController.createWalletRole);
walletRoleRouter.put('/users/walletRoles/:walletRoleID', WalletRoleController.leaveSharedWallet);

export default walletRoleRouter;