import express from "express";
import axios from "axios";
import BankAccountModel from "../models/accountModel.js";
import TransactionModel from "../models/transactionModel.js";
import { isAuth } from "../utils.js";
import expressAsyncHandler from "express-async-handler";

const transactionRouter = express.Router();

//======================================
// Create a new transaction (send money)
//=====================================
transactionRouter.post(
  "/send",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { recipientAccountNumber, amount } = req.body;
    const senderId = req.user.id;

    try {
      // Check if recipient's bank account exists
      const recipientAccount = await BankAccountModel.findByAccountNumber(
        recipientAccountNumber
      );
      if (!recipientAccount) {
        return res
          .status(404)
          .json({ message: "Recipient bank account not found" });
      }

      // Check sender's balance
      const senderAccount = await BankAccountModel.findByUserId(senderId);
      if (senderAccount.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create a transaction
      const transactionId = Math.floor(Math.random() * 10000000000);
      const transaction = await TransactionModel.create({
        sender_id: senderId,
        recipient_id: recipientAccount.user_id, 
        recipient_account_number: recipientAccountNumber,
        amount,
        transaction_id: transactionId,
      });

      // Process balances
      await BankAccountModel.updateBalance(
        senderId,
        senderAccount.balance - amount
      );
      await BankAccountModel.updateBalance(
        recipientAccount.user_id,
        recipientAccount.balance + amount
      );

      // Update transaction status
      await TransactionModel.updateStatus(transactionId, "successful");

      res.json({ message: "Transaction successful", transaction });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

//======================================
// Get all transactions for a user
//======================================
transactionRouter.get(
  "/:user_id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.user_id;

    try {
      const transactions = await TransactionModel.getByUserId(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

export default transactionRouter;
