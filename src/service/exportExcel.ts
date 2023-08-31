import * as fs from "fs";
import ExcelJS from "exceljs";
import {Response} from "express";
import {CustomRequest} from "../middlewares/auth";
import {WalletRole} from "../models/entity/WalletRole";
import WalletRoleController from "../controllers/WalletRole.controller";
import TransactionController from "../controllers/Transaction.controller";
import {Between} from "typeorm";

class ExportExcel {

    static async exportTransactionOfWalletByMonth(req: CustomRequest, res: Response) {
        try {
            const userID: number = +req.token.userID;
            const walletID: number = +req.params.walletID;
            const {startDate, endDate} = req.query;
            let walletRole: WalletRole | undefined = await WalletRoleController.getWalletRole(walletID, userID);
            if (!walletRole) {
                return res.status(200).json({
                    message: "No permission to get transaction list!"
                });
            }
            const userName: string = walletRole.user.email;
            const walletName: string = walletRole.wallet.name;
            let transactionList = await TransactionController.transactionRepository.find({
                relations: {
                    category: true,
                    walletRole: {
                        user: true,
                        wallet: true
                    }
                },
                where: {
                    walletRole: {
                        wallet: {
                            id: walletID
                        }
                    },
                    date: Between(
                        new Date(parseDate(startDate)),
                        new Date(parseDate(endDate))
                    )
                }
            });
            const data = [];
            for (const [index, transaction] of transactionList.entries()) {
                data.push([index + 1, transaction.date, transaction.category.name, transaction.category.type, transaction.amount, transaction.note]);
            }
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet 1');
            worksheet.addRow(['STT', 'Date', 'Category', 'Type', 'Money', 'Note']);
            data.forEach(row => {
                worksheet.addRow(row);
            });

            const excelFilePath = `./export/${userName}_${walletName}.xlsx`;
            workbook.xlsx.writeFile(`./export/${userName}_${walletName}.xlsx`)
                .then(() => {
                    console.log("Excel file has been created!");
                    res.download(excelFilePath, `${userName}_${walletName}_allTransaction.xlsx`, (err) => {
                        if (err) {
                            console.error("Error when exporting file:", err);
                        } else {
                            console.log("File has been exported successfully!");
                            fs.unlinkSync(excelFilePath);
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error when creating Excel file:", error);
                    res.status(500).json({
                        message: error.message
                    });
                });
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }
}

function parseDate(input: any) {
    let parts = input.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

export default ExportExcel;
