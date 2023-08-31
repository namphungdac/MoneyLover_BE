import {Response} from "express";
import {User} from "../models/entity/User";
import {CustomRequest} from "../middlewares/auth";
import {Category} from "../models/entity/Category";
import {AppDataSource} from "../models/data-source";
import TransactionController from "./Transaction.controller";
import {Transaction} from "../models/entity/Transaction";

class CategoryController {
    static categoryRepository = AppDataSource.getRepository(Category);
    static userRepository = AppDataSource.getRepository(User);

    static async getCategoryList(req: CustomRequest, res: Response) {
        try {
            const userID: number = req.token.userID;
            const categoryList: Category[] = await CategoryController.categoryRepository
                .createQueryBuilder("category")
                .leftJoinAndSelect("category.user", "user")
                .where("user.id = :userID OR category.user IS NULL", {userID})
                .getMany();
            if (categoryList.length > 0) {
                res.status(200).json({
                    message: "Get categoryList success",
                    categoryList: categoryList
                });
            } else {
                res.status(404).json({
                    message: 'No categories found',
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async createCategory(req: CustomRequest, res: Response) {
        try {
            const userID: number = req.token.userID;
            const user: User = await CategoryController.userRepository.findOneBy({id: userID});
            const {type, name} = req.body;
            const category: Category[] = await CategoryController.categoryRepository.find({
                where: {
                    name: name,
                    user: user
                }
            });
            if (category.length) {
                return res.status(500).json({
                    message: "Name of category already exist"
                });
            }
            const newCategory = {
                type: type,
                subType: "My categories",
                name: name,
                user: user
            };
            const savedCategory: Category = await CategoryController.categoryRepository.save(newCategory);
            if (savedCategory) {
                res.status(200).json({
                    message: "Create category success",
                    category: savedCategory
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async deleteCategory(req: CustomRequest, res: Response) {
        try {
            const userID: number = req.token.userID;
            const categoryID: number = +req.params.categoryID;
            const transactionList: Transaction[] | string = await TransactionController.getTransactionByCategoryID(categoryID);
            if (typeof transactionList !== "string") {
                for (const transaction of transactionList) {
                    let walletID: number = transaction.walletRole.wallet.id;
                    await TransactionController.deleteTransactionByTransactionID(userID, walletID, transaction.id);
                }
            }
            const deleteCategoryResult = await CategoryController.categoryRepository.delete({
                id: categoryID,
            });
            if (deleteCategoryResult.affected === 1) {
                res.status(200).json({
                    message: 'Delete category success!',
                });
            } else {
                res.status(404).json({
                    message: 'Category not found or not deleted.',
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async updateCategory(req: CustomRequest, res: Response) {
        try {
            const categoryID: number = +req.params.categoryID;
            const {name} = req.body;
            const updateCategory: Category = await CategoryController.categoryRepository.findOneBy({id: categoryID});
            updateCategory.name = name;
            const savedCategory: Category = await CategoryController.categoryRepository.save(updateCategory);
            if (savedCategory) {
                res.status(200).json({
                    message: "Update category success!",
                    updateCategory: savedCategory
                });
            } else {
                res.json({
                    message: "Update category failed!",
                });
            }
        } catch (e) {
            res.status(500).json({
                message: e.message
            });
        }
    }

    static async deleteCategoryByUserID(userID: number) {
        try {
            const deletedCategory = await CategoryController.categoryRepository.delete({
                user: {
                    id: userID
                }
            });
            return deletedCategory.affected;
        } catch (e) {
            return e.message;
        }
    }

}

export default CategoryController;