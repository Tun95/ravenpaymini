import express from "express";
import { isAuth } from "../utils.js";
import BankAccountModel from "../models/accountModel.js";
import expressAsyncHandler from "express-async-handler";

const accounterRouter = express.Router();

// Generate a new bank account
accounterRouter.post(
  "/generate",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user.id; // Get user ID from JWT token
    const accountNumber = Math.floor(Math.random() * 10000000000); // Random 10-digit number for account number

    try {
      const newAccount = await BankAccountModel.create({
        user_id: userId,
        account_number: accountNumber,
      });

      res.status(201).json({
        message: "Bank account created successfully",
        accountNumber: newAccount.account_number,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Get bank account by user ID
accounterRouter.get(
  "/:user_id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.user_id;

    try {
      const account = await BankAccountModel.findByUserId(userId);
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }

      res.json(account);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Get bank account by account number
accounterRouter.get(
  "/number/:account_number",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const accountNumber = req.params.account_number;

    try {
      const account = await BankAccountModel.findByAccountNumber(accountNumber);
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }

      res.json(account);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

export default accounterRouter;
