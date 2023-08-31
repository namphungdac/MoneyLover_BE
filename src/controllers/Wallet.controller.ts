import {Response} from "express";
import {User} from "../models/entity/User";
import {Wallet} from "../models/entity/Wallet";
import {CustomRequest} from "../middlewares/auth";
import {AppDataSource} from "../models/data-source";
import {Currency} from "../models/entity/Currency";
import {Category} from "../models/entity/Category";
import {IconWallet} from "../models/entity/IconWallet";
import {WalletRole} from "../models/entity/WalletRole";
import {Transaction} from "../models/entity/Transaction";
import WalletRoleController from "./WalletRole.controller";
import TransactionController from "./Transaction.controller";
import {Not} from "typeorm";

class WalletController {
    static userRepository = AppDataSource.getRepository(User);
    static walletRepository = AppDataSource.getRepository(Wallet);
    static currencyRepository = AppDataSource.getRepository(Currency);
    static categoryRepository = AppDataSource.getRepository(Category);
    static iconWalletRepository = AppDataSource.getRepository(IconWallet);
    static walletRoleRepository = AppDataSource.getRepository(WalletRole);
    static transactionRepository = AppDataSource.getRepository(Transaction);

    static async createWallet(req: CustomRequest, res: Response) {
        try {
            const {name, iconID, currencyID, amountOfMoney, date} = req.body;
            let userID: number = req.token.userID;
            let user = await WalletController.userRepository.findOneBy({id: userID});
            let wallet = await WalletController.walletRepository.find({
                where: {
                    name: name,
                    walletRoles: {
                        user: user,
                        role: "owner"
                    }
                }
            });
            if (wallet.length) {
                return res.status(500).json({
                    message: "Name of wallet already exist"
                });
            }
            let currency = await WalletController.currencyRepository.findOneBy({id: +currencyID});
            let iconWallet = await WalletController.iconWalletRepository.findOneBy({id: +iconID});
            if (currency && iconWallet) {
                let newWallet = new Wallet();
                newWallet.name = name;
                newWallet.icon = iconWallet;
                newWallet.currency = currency;
                newWallet.amountOfMoney = +amountOfMoney;
                let savedWallet: Wallet = await WalletController.walletRepository.save(newWallet);

                let newWalletRole = new WalletRole();
                newWalletRole.user = user;
                newWalletRole.wallet = savedWallet;
                const savedWalletRole: WalletRole = await WalletRoleController.walletRoleRepository.save(newWalletRole);

                const category: Category = await WalletController.categoryRepository.findOneBy({id: 13});
                const savedTransaction: Transaction = await TransactionController.addNewTransaction(category, +amountOfMoney, date, 'Initial Balance', savedWalletRole);

                if (savedWallet && savedWalletRole && savedTransaction) {
                    res.status(200).json({
                        message: "Creat wallet success!",
                        newWallet: savedWallet,
                        walletRole: savedWalletRole
                    });
                }
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async getWallet(req: CustomRequest, res: Response) {
        try {
            let walletID: number = +req.params.walletID;
            let userID: number = req.token.userID;
            type userOfTheWalletData = {
                email: string,
                role: string
            }
            let allUsersOfTheWallet: userOfTheWalletData[] | undefined = await WalletRoleController.getAllUsersOfTheWallet(walletID);
            let user = await WalletController.userRepository.findOneBy({id: userID})
            if (user) {
                let wallet = await WalletController.walletRepository.find({
                    relations: {
                        icon: true,
                        currency: true,
                        walletRoles: true
                    },
                    where: {
                        id: walletID,
                        walletRoles: {
                            user: user,
                            role: Not("leaved")
                        }
                    }
                });
                if (wallet.length) {
                    res.status(200).json({
                        message: "Get wallet success!",
                        wallet: wallet[0],
                        allUsersOfTheWallet: allUsersOfTheWallet
                    });
                } else {
                    res.status(200).json({
                        message: "No data!",
                    });
                }
            } else {
                res.status(200).json({
                    message: "No data!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async getWalletList(req: CustomRequest, res: Response) {
        try {
            let userID: number = req.token.userID;
            let user = await WalletController.userRepository.findOneBy({id: userID});
            if (user) {
                let walletList = await WalletController.walletRepository.find({
                    relations: {
                        icon: true,
                        currency: true,
                        walletRoles: {
                            wallet: true,
                            user: true
                        }
                    },
                    where: {
                        walletRoles: {
                            user: user,
                            role: Not("leaved"),
                        }
                    }
                });
                if (walletList.length) {
                    res.status(200).json({
                        message: "Get walletList success",
                        walletList: walletList
                    });
                    return walletList;
                } else {
                    res.status(200).json({
                        message: "No data!",
                        walletList: walletList
                    });
                    return walletList;
                }
            } else {
                res.status(200).json({
                    message: "No data!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async updateWallet(req: CustomRequest, res: Response) {
        try {
            let walletID: number = +req.params.walletID;
            let userID: number = req.token.userID;
            let walletRole = await WalletRoleController.getWalletRole(walletID, userID);
            if ((walletRole.role === 'owner' || walletRole.role === 'using') && walletRole.archived == false) {
                const updatedWallet = await WalletController.walletRepository.find({
                    relations: {
                        icon: true,
                        currency: true,
                        walletRoles: true
                    },
                    where: {
                        id: walletID
                    }
                });
                let {name, iconID, currencyID, amountOfMoney, date} = req.body;
                let oldAmountOfMoney: number = updatedWallet[0].amountOfMoney;
                amountOfMoney = parseInt(amountOfMoney);
                updatedWallet[0].name = name;
                updatedWallet[0].amountOfMoney = amountOfMoney;
                if (updatedWallet[0].currency.id !== +currencyID) {
                    updatedWallet[0].currency = await WalletController.currencyRepository.findOneBy({id: +currencyID});
                }
                if (updatedWallet[0].icon.id !== +iconID) {
                    updatedWallet[0].icon = await WalletController.iconWalletRepository.findOneBy({id: +iconID});
                }
                let savedWallet = await WalletController.walletRepository.save(updatedWallet[0]);
                if (oldAmountOfMoney !== amountOfMoney) {
                    let walletRole: WalletRole = await WalletRoleController.getWalletRole(savedWallet.id, userID);
                    let categoryID: number;
                    let transactionAmount: number;
                    if (oldAmountOfMoney < amountOfMoney) {
                        transactionAmount = -oldAmountOfMoney + amountOfMoney;
                        categoryID = 13;
                    } else {
                        transactionAmount = oldAmountOfMoney - amountOfMoney;
                        categoryID = 5;
                    }
                    let category: Category = await WalletController.categoryRepository.findOneBy({id: categoryID});

                    let savedTransaction: Transaction = await TransactionController.addNewTransaction(category, transactionAmount, date, 'Initial Balance', walletRole);

                    if (savedWallet && savedTransaction) {
                        res.status(200).json({
                            message: "Update wallet success!",
                            updatedWallet: savedWallet
                        });
                    } else {
                        res.json({
                            message: "Update wallet failed!",
                        });
                    }
                } else {
                    if (savedWallet) {
                        res.status(200).json({
                            message: "Update wallet success!",
                            updatedWallet: savedWallet
                        });
                    } else {
                        res.json({
                            message: "Update wallet failed!",
                        });
                    }
                }
            } else {
                res.status(500).json({
                    message: "No permission to update!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async deleteWallet(req: CustomRequest, res: Response) {
        try {
            let walletID: number = +req.params.walletID;
            let userID: number = req.token.userID;
            let walletRole = await WalletRoleController.getWalletRole(walletID, userID);
            if (walletRole.role === 'owner') {
                await TransactionController.deleteTransactionByWalletID(walletID);
                await WalletRoleController.deleteWalletRolesByWalletID(walletID);
                const deletedWallet = await WalletController.walletRepository.delete({id: walletID});
                if (deletedWallet.affected) {
                    res.status(200).json({
                        message: "Delete wallet success!",
                    });
                } else {
                    res.status(404).json({
                        message: 'Wallet not found or not deleted.',
                    });
                }
            } else {
                res.status(500).json({
                    message: "No permission to delete!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async deleteWalletByWalletID(walletID: number) {
        let deletedWallet = await WalletController.walletRepository.delete(walletID);
        return deletedWallet.affected;
    }

    static async transferMoneyToAnotherWallet(req: CustomRequest, res: Response) {
        try {
            let walletID: number = +req.params.walletID;
            let userID: number = req.token.userID;
            let walletRoleTransfer = await WalletRoleController.getWalletRole(walletID, userID);
            if (walletRoleTransfer.role === "owner" && walletRoleTransfer.archived == false) {
                const {money, walletIDReceived, date} = req.body;
                let walletRoleReceived = await WalletRoleController.getWalletRole(walletIDReceived, userID);
                if (walletRoleReceived.role === "owner" && walletRoleReceived.archived == false) {
                    const walletTransfer: Wallet[] = await WalletController.walletRepository.find({
                        relations: {
                            currency: true,
                            icon: true,
                            walletRoles: true
                        }, where: {
                            id: walletID
                        }
                    });
                    const walletReceived: Wallet[] = await WalletController.walletRepository.find({
                        relations: {
                            currency: true,
                            icon: true,
                            walletRoles: true
                        }, where: {
                            id: walletIDReceived
                        }
                    });
                    if (money <= walletTransfer[0].amountOfMoney) {
                        walletTransfer[0].amountOfMoney = walletTransfer[0].amountOfMoney - money;
                        await WalletController.walletRepository.save(walletTransfer[0]);
                        walletReceived[0].amountOfMoney = walletReceived[0].amountOfMoney + money;
                        await WalletController.walletRepository.save(walletReceived[0]);

                        const categoryTransfer: Category = await WalletController.categoryRepository.findOneBy({id: 7});
                        const categoryReceived: Category = await WalletController.categoryRepository.findOneBy({id: 14});

                        await TransactionController.addNewTransaction(categoryTransfer, money, date, "money transferred", walletRoleTransfer);
                        await TransactionController.addNewTransaction(categoryReceived, money, date, "money received", walletRoleReceived);

                        res.status(200).json({
                            message: "Money transfer success!",
                            walletTransfer: walletTransfer[0],
                            walletReceived: walletReceived[0]
                        });
                    } else {
                        res.json({
                            message: "Money not enough!"
                        });
                    }
                } else {
                    res.json({
                        message: "Money transfer failed!"
                    });
                }
            } else {
                res.json({
                    message: "No permission to transfer!"
                });
            }
        } catch (e) {
            console.log(124);
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async archivedWallet(req: CustomRequest, res: Response) {
        try {
            let walletID: number = +req.params.walletID;
            let userID: number = req.token.userID;
            let walletRole = await WalletRoleController.getWalletRole(walletID, userID);
            if (walletRole.role === "owner" || walletRole.role === "using") {
                let walletRoleToArchived = await WalletRoleController.getWalletRoleListByWalletID(walletID);
                for (const walletRoleToArchivedElement of walletRoleToArchived) {
                    await WalletRoleController.archivedWalletRoleByWalletRoleID(walletRoleToArchivedElement.id);
                }
                res.status(200).json({
                    message: "Archived wallet success!"
                });
            } else {
                res.json({
                    message: "No permission to archived!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async adjustAmountOfMoneyOfWallet(walletID: number, money: number) {
        try {
            let wallet = await WalletController.walletRepository.findOneBy({id: walletID});
            wallet.amountOfMoney = wallet.amountOfMoney + money;
            return await WalletController.walletRepository.save(wallet);
        } catch (e) {
            return e.message;
        }
    }
}

export default WalletController;