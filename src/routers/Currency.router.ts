import express from "express";
import currencyController from "../controllers/Currency.controller";

const currencyRouter = express.Router();

currencyRouter.get('/currencies', currencyController.getCurrencyList);

export default currencyRouter;