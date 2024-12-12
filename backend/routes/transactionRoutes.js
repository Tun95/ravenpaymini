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

      // Generate transaction ID and reference
      const transactionId = Math.floor(Math.random() * 10000000000);
      const reference = Math.floor(Math.random() * 1000000000000);

      // Create a transaction
      const transaction = await TransactionModel.create({
        sender_id: senderId,
        recipient_id: recipientAccount.user_id,
        recipient_account_number: recipientAccountNumber,
        amount,
        transaction_id: transactionId,
        reference,
        currency: "NGN",
      });

      // Prepare data for RavenPay API
      const transferData = {
        amount,
        bank_code: recipientAccount.bank_code,
        bank: recipientAccount.bank_name,
        account_number: recipientAccountNumber,
        account_name: recipientAccount.account_name,
        narration: `Transfer to ${recipientAccount.account_name}`,
        reference: reference.toString(),
        currency: "NGN", 
      };

      // Configure RavenPay API call
      const config = {
        method: "POST",
        url: "https://integrations.getravenbank.com/v1/transfers/create",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.RAVENPAY_API_TOKEN}`,
        },
        data: qs.stringify(transferData),
      };

      // Call RavenPay API
      const ravenPayResponse = await axios(config);

      // Log the full response from RavenPay
      console.log("RavenPay Response:", ravenPayResponse.data);
      console.log("RavenPay Status:", ravenPayResponse.data.status);
      if (ravenPayResponse.data.status !== "success") {
        return res.status(400).json({
          message: "Transaction failed",
          error: ravenPayResponse.data.message || "Unknown error",
        });
      }

      if (ravenPayResponse.data.status === "success") {
        // Update the transaction status
        await TransactionModel.updateStatus(transactionId, "successful");

        // Process balances
        await BankAccountModel.updateBalance(
          senderId,
          senderAccount.balance - amount
        );
        await BankAccountModel.updateBalance(
          recipientAccount.user_id,
          recipientAccount.balance + amount
        );

        res.json({ message: "Transaction successful", transaction });
      } else {
        await TransactionModel.updateStatus(transactionId, "failed");
        res.status(400).json({
          message: "Transaction failed",
          error: ravenPayResponse.data.message,
        });
      }
    } catch (error) {
      console.log(
        "Error:",
        error.response ? error.response.data : error.message
      );
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
