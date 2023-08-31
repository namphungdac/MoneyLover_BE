import express from "express";
import CategoryController from "../controllers/Category.controller";

const categoryRouter = express.Router();

categoryRouter.get('/users/categories', CategoryController.getCategoryList);
categoryRouter.post('/users/categories', CategoryController.createCategory);
categoryRouter.delete('/users/categories/:categoryID', CategoryController.deleteCategory);
categoryRouter.put('/users/categories/:categoryID', CategoryController.updateCategory);

export default categoryRouter;