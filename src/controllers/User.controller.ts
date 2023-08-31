import {Request, Response} from "express";
import {CustomRequest} from "../middlewares/auth";
import {AppDataSource} from "../models/data-source";
import {User} from "../models/entity/User";
import WalletRoleController from "./WalletRole.controller";
import WalletController from "./Wallet.controller";
import config from "../config/config";
import {SECRET_KEY} from "../middlewares/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {WalletRole} from "../models/entity/WalletRole";
import TransactionController from "./Transaction.controller";
import nodemailer from 'nodemailer'
import {OAuth2Client} from 'google-auth-library'
import walletController from "./Wallet.controller";
import transactionController from "./Transaction.controller";
import cron from "node-cron"
import CategoryController from "./Category.controller";
const crypto = require('crypto');

const GOOGLE_MAILER_CLIENT_ID =
    '420362997504-21gqqs491gttfqp41skjbfe2776dq15t.apps.googleusercontent.com';
const GOOGLE_MAILER_CLIENT_SECRET = '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';
const GOOGLE_MAILER_REFRESH_TOKEN =
    // '1//04k5BLOr8_REdCgYIARAAGAQSNwF-L9Irg28V3sQhJPXgiDU3i51Bdymwdh7oTU5xWOhRf4aNWHZVD4mMg1Uaf5W1KPEyMOU1VkI';
    '1//04RSJA_MIFCt5CgYIARAAGAQSNwF-L9IrfGuvMSjkszxeVeoowzVzAj0qEcFXl6cKkeIFHwfVU0bj-0BxIK-bdZOINP-YsP7DEv0';
const ADMIN_EMAIL_ADDRESS = 'tnhieutn@gmail.com';

// Khởi tạo OAuth2Client với Client ID và Client Secret
const myOAuth2Client = new OAuth2Client(
    GOOGLE_MAILER_CLIENT_ID,
    GOOGLE_MAILER_CLIENT_SECRET
);
// Set Refresh Token vào OAuth2Client Credentials
myOAuth2Client.setCredentials({
    refresh_token: GOOGLE_MAILER_REFRESH_TOKEN
});
export const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
let months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

//Ham tinh so du dau ki, cuoi ki
function viewBalance(dataIntime, dataBefore) {
    let totalIncome = 0;
    let totalExpense = 0;
    let openingBalance = 0;
    let endingBalance = 0;
    if (dataBefore.length === 0) openingBalance = 0
    else {
        dataBefore.forEach(trans => {
            if (trans.category.type === 'income') {
                openingBalance += trans.amount
            } else {
                openingBalance -= trans.amount
            }
        });
    }
    dataIntime.forEach(trans => {
        if (trans.category.type === 'income') {
            totalIncome += trans.amount
        } else {
            totalExpense -= trans.amount
        }
    })
    endingBalance = openingBalance + totalIncome + totalExpense;
    return {totalIncome, totalExpense, openingBalance, endingBalance};
}

export interface TokenPayload {
    userID: number;
    email: string;
}

class UserController {
    static userRepository = AppDataSource.getRepository(User);

    static async createUser(req: Request, res: Response) {
        try {
            const {email, password} = req.body;
            let user = await UserController.userRepository.findOneBy({email});
            if (!user) {
                let verifyEmailToken = crypto.randomBytes(20).toString('hex')
                const passwordHash = await bcrypt.hash(password, config.bcryptSalt);
                let newUser = new User();
                newUser.email = email;
                newUser.password = passwordHash;
                newUser.verifyEmailToken = verifyEmailToken;
                let result = await UserController.userRepository.save(newUser);
                if (result) {
                    let content = `<h3>Please <a href="https://money-lover-demo.vercel.app/verify/${verifyEmailToken}">click here</a> to verify your email</h3>`
                    let subject = `Confirmed Email Register`
                    await UserController.sendEmail(email, subject, content).then(() => {
                        res.status(200).json({
                            message: "Creat user success. Please check your email register for verify!",
                            newUser: result
                        });
                    })
                }
            } else {
                res.json({
                    message: "Email already exist"
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const {email, password} = req.body;
            const user = await UserController.userRepository.findOneBy({email});
            if (user) {
                const checkVerify = user.verifyEmail;
                if (checkVerify) {
                    const comparePass: boolean = await bcrypt.compare(password, user.password);
                    if (!comparePass) {
                        return res.json({
                            message: "Password not valid!",
                        })
                    }
                    let payload: TokenPayload = {
                        userID: user.id,
                        email: user.email
                    }
                    const token = jwt.sign(payload, SECRET_KEY, {
                        expiresIn: '365d'
                    });
                    res.status(200).json({
                        message: "Login success!",
                        user: user,
                        token: token
                    });
                } else {
                    res.json({
                        message: "Email is not verify!"
                    })
                }
            } else {
                res.json({
                    message: "Email not valid!"
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async getListUser(req: CustomRequest, res: Response) {
        try {
            const users = await UserController.userRepository.find();
            if (users) {
                res.status(200).json({
                    message: "Get list users successfully",
                    listUser: users
                });
            }
        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }

    static async deleteUser(req: CustomRequest, res: Response) {
        try {
            const userID: number = req.token.userID;
            const walletRoleList: WalletRole[] | [] = await WalletRoleController.getWalletRoleListByUserID(userID);
            if (!walletRoleList.length) {
                await UserController.userRepository.delete(userID);
                res.status(200).json({
                    message: "Delete user success!",
                    numberOfWalletsDeleted: 0
                });
            } else {
                let walletRoleIDsWereShare: number[] = [];
                for (const walletRole of walletRoleList) {
                    if (walletRole.role !== "owner") {
                        walletRoleIDsWereShare.push(walletRole.id);
                    }
                }
                // delete transactions of shared wallets of user
                if (walletRoleIDsWereShare.length) {
                    for (const walletRoleIDWereShare of walletRoleIDsWereShare) {
                        await TransactionController.deleteTransactionByWalletRoleID(walletRoleIDWereShare);
                    }
                }
                // delete the rest transactions of user
                await TransactionController.deleteTransactionByUserID(userID);
                // delete the categories in category table
                await CategoryController.deleteCategoryByUserID(userID);
                // get the walletIDs that have the role of "owner" and belong to the user that needs to be deleted
                let walletIDsHaveOwnerRole: number[] = [];
                for (const walletRole of walletRoleList) {
                    if (walletRole.role === "owner") {
                        walletIDsHaveOwnerRole.push(walletRole.wallet.id);
                    }
                }
                await WalletRoleController.deleteWalletRolesByUserID(userID);
                // delete the wallets in wallet_role table
                for (const walletIDNeedDelete of walletIDsHaveOwnerRole) {
                    await WalletRoleController.deleteWalletRolesByWalletID(walletIDNeedDelete);
                }
                // delete the wallets in wallet table belonging to the user that needs to be deleted
                for (const walletIDNeedDelete of walletIDsHaveOwnerRole) {
                    await WalletController.deleteWalletByWalletID(walletIDNeedDelete);
                }
                // delete the user in user table that needs to be deleted
                await UserController.userRepository.delete(userID);
                res.status(200).json({
                    message: "Delete user success!",
                    numberOfWalletsDeleted: walletIDsHaveOwnerRole.length
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async updateUser(req: CustomRequest, res: Response) {
        try {
            const userID: number = req.token.userID;
            const {currentPassword, newPassword, newPasswordConfirmed} = req.body;
            const userNeedToUpdate = await UserController.userRepository.findOneBy({id: userID});
            if (userNeedToUpdate) {
                const comparePass: boolean = await bcrypt.compare(currentPassword, userNeedToUpdate.password);
                if (!comparePass) {
                    return res.json({
                        messageErrorCurrentPass: "Invalid! Password must be match current password!",
                        successCurrentPass: false
                    })
                } else if (newPassword !== newPasswordConfirmed) {
                    return res.json({
                        messageErrorNewPassword: "Invalid! New confirmed password must be match new password!",
                        successNewPass: false
                    })
                } else {
                    userNeedToUpdate.password = await bcrypt.hash(newPassword, config.bcryptSalt);
                    let result = await UserController.userRepository.save(userNeedToUpdate);
                    if (result) {
                        res.status(200).json({
                            messageUpdatePassword: "Update user password success!",
                            successUpdatePassword: true,
                            updatedUser: result
                        });
                    }
                }
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async getUserIDByEmail(email: string) {
        try {
            let user: User = await UserController.userRepository.findOneBy({email: email});
            return user.id;
        } catch (e) {
            return e.message;
        }
    }

    static async sendEmail(email, subject, content) {
        try {
            if (!email || !content) throw new Error('Please provide email and content!')
            const myAccessTokenObject = await myOAuth2Client.getAccessToken()
            const myAccessToken = myAccessTokenObject?.token
            const transport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: ADMIN_EMAIL_ADDRESS,
                    clientId: GOOGLE_MAILER_CLIENT_ID,
                    clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
                    refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
                    accessToken: myAccessToken
                }
            })
            const mailOptions = {
                to: email,
                subject: `${subject}`,
                html: `${content}`
            }
            await transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error.message)
                } else {
                    console.log('Sent email' + info.response)
                }
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    static async verifyEmail(req: CustomRequest, res: Response) {
        try {
            let user = await UserController.userRepository.findOneBy({verifyEmailToken: req.params.token});
            if (!user) {
                res.json({
                    message: `Email ${user.email} was not existed!`
                })
            } else {
                user.verifyEmail = true;
                let result = await UserController.userRepository.save(user);
                if (result) {
                    res.status(200).json({
                        message: "Verify register successfully!",
                        newUser: user
                    })
                } else {
                    res.json({
                        message: "Error saving user"
                    });
                }
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async resetPassword(req: CustomRequest, res: Response) {
        try {
            let {email} = req.body
            let user = await UserController.userRepository.findOneBy({email})
            if (user) {
                let newPassword = crypto.randomBytes(4).toString('hex')
                user.password = await bcrypt.hash(newPassword, config.bcryptSalt);
                let result = await UserController.userRepository.save(user);
                if (result) {
                    let subjectResetPassword = `Reset password email`;
                    let contentResetPassword = `Your new password is ${newPassword}. Please log in to use! `
                    await UserController.sendEmail(email, subjectResetPassword, contentResetPassword).then(() => {
                        res.status(200).json({
                            message: "The new password was sent! ",
                            user: user
                        });
                    });
                } else {
                    res.json({
                        message: "Error"
                    })
                }
            } else {
                res.json({
                    message: "Email was not existed!"
                })
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async sendReport(req: CustomRequest, res: Response) {
        try {
            let listWallet = await walletController.getWalletList(req, res)
            let currentDate = new Date();//Ngày hiện tại
            let monthIndex = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth()
            let previousMonthIndex = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1
            let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);//Ngày đầu tiên tháng trước
            let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0); //Ngày cuối cùng tháng trước
            // console.log(listWallet[0].name)
            let contentReport = [];
            for (let wallet of listWallet) {
                let transactions = await transactionController.getAllTransactionByTimeRangeBE(req.token.userID, wallet.id, formatDate(firstDay), formatDate(lastDay))
                let balance = viewBalance(transactions.transactionListInTimeBE, transactions.transactionListBeforeBE)
                contentReport.push({
                    name: wallet.name,
                    transInTime: transactions.transactionListInTimeBE,
                    openingBalance: balance.openingBalance,
                    endingBalance: balance.endingBalance
                })
            }
            // console.log(contentReport)
            let email = req.token.email
            let subject = `Monthly report in ${months[previousMonthIndex]}`
            let contentReportInMail = "";
            let data = ""
            for (let content of contentReport) {
                data += ` Monthly Report in ${months[previousMonthIndex]}:
                          <br>
                        * Ví ${content.name}:
                        <br>
                        - Opening Balance: ${content.openingBalance}
                        <br>
                        - Ending Balance: ${content.endingBalance}
                        <br>
                        - Transactions in time:
                        <br>
                    `;
                let transactionIndex = 1; // Biến đếm chỉ số giao dịch
                for (const transaction of content.transInTime) {
                    data += `
                    <br>
                        +, Index: ${transactionIndex}
                        <br>
                        +, Date: ${transaction.date}
                        <br>
                        +, Amount: ${transaction.amount}
                        <br>
                        +, Category: ${transaction.category.type}
                        <br>
                    `;
                    transactionIndex++; // Tăng chỉ số sau mỗi vòng lặp
                }
                contentReportInMail += data;
            }
            cron.schedule(`57 14 * * *`, async () => {
                await UserController.sendEmail(email, subject, contentReportInMail).then(() => {
                    res.status(200).json({
                        message: " Monthly report email was sent"
                    });
                })
            }, {
                scheduled: true,
                timezone: 'Asia/Ho_Chi_Minh', // Chọn timezone theo vùng của bạn
            });
        } catch (e) {
            return e.message;
        }
    }
}
export default UserController;

