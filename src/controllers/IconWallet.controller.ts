import {Request, Response} from "express";
import {AppDataSource} from "../models/data-source";
import {IconWallet} from "../models/entity/IconWallet";

class iconWalletController {
    static async getIconWalletList(req: Request, res: Response) {
        try {
            const iconWalletRepository = AppDataSource.getRepository(IconWallet);
            let iconWalletList = await iconWalletRepository.find();
            if (iconWalletList) {
                res.status(200).json({
                    message: "Success",
                    iconWalletList: iconWalletList
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }
}

export default iconWalletController;