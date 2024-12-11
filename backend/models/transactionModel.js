import knex from "../db/knex.js";

class TransactionModel {
  // Create a new transaction
  static async create({
    sender_id,
    recipient_id,
    recipient_account_number,
    amount,
    transaction_id,
  }) {
    const [transaction] = await knex("transactions")
      .insert({
        sender_id,
        recipient_id, // Include recipient_id
        recipient_account_number,
        amount,
        transaction_id,
        status: "pending",
      })
      .returning("*");

    return transaction;
  }

  // Get all transactions for a user (either as sender or recipient)
  static async getByUserId(user_id) {
    const transactions = await knex("transactions")
      .where("sender_id", user_id)
      .orWhere("recipient_id", user_id) // Include recipient_id filter
      .orderBy("created_at", "desc");
    return transactions;
  }

  // Update transaction status
  static async updateStatus(transaction_id, status) {
    const [transaction] = await knex("transactions")
      .where({ transaction_id })
      .update({ status })
      .returning("*");

    return transaction;
  }
}

export default TransactionModel;
