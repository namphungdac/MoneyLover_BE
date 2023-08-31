import {Request, Response} from "express";
import {AppDataSource} from "../models/data-source";
import {Currency} from "../models/entity/Currency";

class currencyController {
    static async getCurrencyList(req: Request, res: Response) {
        try {
            const currencyRepository = AppDataSource.getRepository(Currency);
            let currencyList = await currencyRepository.find();
            if (currencyList) {
                res.status(200).json({
                    message: "Success",
                    currencyList: currencyList
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }
}

export default currencyController;