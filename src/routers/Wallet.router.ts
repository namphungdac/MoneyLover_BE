import express from "express";
import WalletController from "../controllers/Wallet.controller";

const walletRouter = express.Router();

walletRouter.post('/users/wallets', WalletController.createWallet);
walletRouter.get('/users/wallets', WalletController.getWalletList); // Lấy info all ví của user
walletRouter.get('/users/wallets/:walletID', WalletController.getWallet); // Lấy info 1 ví của user
walletRouter.put('/users/wallets/:walletID', WalletController.updateWallet);
walletRouter.delete('/users/wallets/:walletID', WalletController.deleteWallet);
walletRouter.post('/users/wallets/:walletID/transfer', WalletController.transferMoneyToAnotherWallet);
walletRouter.get('/users/wallets/:walletID/archived', WalletController.archivedWallet);

export default walletRouter;