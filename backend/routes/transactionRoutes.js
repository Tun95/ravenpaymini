import express from "express";
import axios from "axios";
import BankAccountModel from "../models/accountModel.js";
import TransactionModel from "../models/transactionModel.js";
import { isAuth } from "../utils.js";
import expressAsyncHandler from "express-async-handler";

const transactionRouter = express.Router();

//======================================
// Create a new transaction (ravenpay: send money)
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

      // Log the full response from RavenPay (Annoying)
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

//==========================
// Local Transfer money route
//==========================
transactionRouter.post(
  "/transfer",
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

      // Check if the transfer amount exceeds the limit of 1,000,000
      if (amount > 1000000) {
        return res
          .status(400)
          .json({ message: "Transfer amount cannot exceed 1,000,000" });
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
        transaction_type: "transfer",
      });

      // Update the transaction status
      await TransactionModel.updateStatus(transactionId, "successful");

      // Deduct from sender
      const updatedSenderAccount = await BankAccountModel.updateBalance(
        senderId,
        -parseFloat(amount)
      );

      // Credit recipient
      const updatedRecipientAccount = await BankAccountModel.updateBalance(
        recipientAccount.user_id,
        parseFloat(amount)
      );

      // Simulate a webhook notification
      const webhookPayload = {
        transaction_id: transactionId,
        status: "successful",
        amount,
        recipient_account_number: recipientAccountNumber,
      };

      // Call the webhook endpoint internally
      await axios.post(
        "http://localhost:5000/api/transactions/webhook",
        webhookPayload
      );

      res.json({
        message: "Transaction successful",
        transaction,
        updatedSenderAccount,
        updatedRecipientAccount,
      });
    } catch (error) {
      console.log(
        "Error:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ message: error.message });
    }
  })
);

//==========================
// Local money deposit route
//==========================
transactionRouter.post(
  "/deposit",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { amount } = req.body;
    const senderId = req.user.id;

    if (amount <= 100) {
      return res
        .status(400)
        .json({ message: "Deposit amount must be greater than #100" });
    }

    // Check if the deposit amount exceeds the limit of 1,000,000
    if (amount > 1000000) {
      return res
        .status(400)
        .json({ message: "Deposit amount cannot exceed 1,000,000" });
    }

    try {
      console.log("Sender ID:", senderId);

      // Find the user's account
      const senderAccount = await BankAccountModel.findByUserId(senderId);
      console.log("Sender Account:", senderAccount);

      if (!senderAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Generate transaction ID and reference
      const transactionId = Math.floor(Math.random() * 10000000000);
      const reference = Math.floor(Math.random() * 1000000000000);

      // Create a deposit transaction
      const transaction = await TransactionModel.create({
        sender_id: senderId,
        recipient_id: senderId,
        recipient_account_number: senderAccount.account_number,
        amount,
        transaction_id: transactionId,
        reference,
        currency: "NGN",
        transaction_type: "deposit",
      });

      // Simulate a webhook notification
      const webhookPayload = {
        transaction_id: transactionId,
        status: "successful",
        amount,
        recipient_account_number: senderAccount.account_number,
      };

      // Call the webhook endpoint internally
      await axios.post(
        "http://localhost:5000/api/transactions/webhook",
        webhookPayload
      );

      res.json({ message: "Deposit successful", transaction });
    } catch (error) {
      console.log(
        "Error:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ message: error.message });
    }
  })
);

//==========================
// Webhook Notification
//==========================
transactionRouter.post(
  "/webhook",
  expressAsyncHandler(async (req, res) => {
    const payload = req.body;

    console.log("Webhook Payload:", payload);

    const { transaction_id, status, amount, recipient_account_number } =
      payload;

    try {
      await TransactionModel.updateStatus(transaction_id, status);

      if (status === "successful") {
        const recipientAccount = await BankAccountModel.findByAccountNumber(
          recipient_account_number
        );
        if (recipientAccount) {
          await BankAccountModel.updateBalance(
            recipientAccount.user_id,
            parseFloat(amount) // Ensure amount is a number
          );
        }
      }

      res.status(200).json({ message: "Webhook received successfully" });
    } catch (error) {
      console.error("Webhook Error:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  })
);

//==========================
// Get all transactions for a user
//==========================
transactionRouter.get(
  "/history/:user_id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.user_id;
    const { type = "all" } = req.query;

    try {
      // Get transactions based on the type
      const transactions = await TransactionModel.getByUserId(userId, type);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

export default transactionRouter;
