import express from "express";
import { isAdmin, isAuth } from "../utils.js";
import BankAccountModel from "../models/accountModel.js";
import expressAsyncHandler from "express-async-handler";
import axios from "axios";
import qs from "qs";

const accounterRouter = express.Router();

//======================================
// Generate a new bank account
//======================================
accounterRouter.post(
  "/generate",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      bank_name,
      account_type,
      amount,
      phone,
      email,
      first_name,
      last_name,
    } = req.body;

    const data = qs.stringify({
      first_name,
      last_name,
      phone,
      amount,
      email,
    });

    // Configuration for the RavenPay API call
    const config = {
      method: "POST",
      url: "https://integrations.getravenbank.com/v1/pwbt/generate_account",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.RAVENPAY_API_TOKEN}`,
      },
      data: data,
    };

    try {
      // Make the API call to RavenPay
      const ravenPayResponse = await axios(config);

      //logging
      console.log("RavenPay Response:", ravenPayResponse.data);

      const { account_number, bank } = ravenPayResponse.data.data || {};
      if (!account_number) {
        return res
          .status(400)
          .json({ message: "Account number not found in RavenPay response" });
      }

      console.log("Generated Account Number:", account_number);

      // Save the amount as balance in the database
      const newAccount = await BankAccountModel.create({
        user_id: userId,
        account_number: account_number,
        bank_name: bank || bank_name,
        account_type,
        balance: parseFloat(amount), // Convert amount to a number and save as balance
      });

      res.status(201).json({
        message: "Bank account created successfully",
        accountNumber: newAccount.account_number,
        balance: newAccount.balance, // Include balance in the response
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

// accounterRouter.post(
//   "/generate",
//   isAuth,
//   expressAsyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const { customer_email, bvn, nin, fname, lname, phone } = req.body;

//     // Validate required fields
//     if (!customer_email || !bvn || !nin || !fname || !lname || !phone) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     try {
//       // Call RavenPay API to create wallet
//       const response = await axios.post(
//         "https://integrations.getravenbank.com/v1/wallet/create_merchant",
//         { customer_email, bvn, nin, fname, lname, phone },
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.RAVENPAY_API_TOKEN}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("RavenPay Response:", response.data);

//       const walletData = response.data.data;
//       if (!walletData.account_number) {
//         return res
//           .status(400)
//           .json({ message: "Failed to generate wallet account" });
//       }

//       // Save wallet details in the database
//       const newWallet = await BankAccountModel.create({
//         user_id: userId,
//         customer_email,
//         account_number: walletData.account_number,
//         bank_name: walletData.bank_name,
//         account_name: walletData.account_name,
//         reference: walletData.reference,
//       });

//       res.status(201).json({
//         message: "Wallet created successfully",
//         accountNumber: newWallet.account_number,
//       });
//     } catch (error) {
//       console.error(
//         "Error creating wallet:",
//         error.response ? error.response.data : error.message
//       );
//       res.status(500).json({ message: "Wallet creation failed" });
//     }
//   })
// );

//======================================
// Get all bank accounts with user details
//======================================
accounterRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const accounts = await BankAccountModel.findAll();
      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ message: "No bank accounts found" });
      }

      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

//======================================
// Get bank account by user ID
//======================================
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

//======================================
// Get bank account by account number
//======================================
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

//======================================
// Delete a bank account by account number
//======================================
accounterRouter.delete(
  "/number/:account_number",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const accountNumber = req.params.account_number;

    try {
      const deletedAccount = await BankAccountModel.deleteByAccountNumber(
        accountNumber
      );

      res.json({
        message: "Bank account deleted successfully",
        deletedAccount,
      });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  })
);

export default accounterRouter;
