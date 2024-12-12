import knex from "../db/knex.js";

class TransactionModel {
  // Create a new transaction (supporting both deposit and transfer)
  static async create({
    sender_id,
    recipient_id,
    recipient_account_number,
    amount,
    transaction_id,
    currency = "NGN",
    reference,
    transaction_type = "transfer",
  }) {
    await knex("transactions").insert({
      sender_id,
      recipient_id,
      recipient_account_number,
      amount,
      transaction_id,
      status: "pending",
      currency,
      reference,
      transaction_type,
    });

    // Retrieve the inserted transaction using transaction_id
    const transaction = await knex("transactions")
      .where({ transaction_id })
      .first();

    return transaction;
  }

  // Get all transactions for a user (either as sender or recipient)
  static async getByUserId(user_id, type = "all") {
    let query = knex("transactions").where(
      knex.raw("sender_id = ? OR recipient_id = ?", [user_id, user_id])
    );

    // Filter by type (either "transfer", "deposit", or "all")
    if (type === "transfer") {
      query = query.where("transaction_type", "transfer");
    } else if (type === "deposit") {
      query = query.where("transaction_type", "deposit");
    }

    query = query.orderBy("created_at", "desc");
    const transactions = await query;
    return transactions;
  }

  // Update transaction status
  static async updateStatus(transaction_id, status) {
    await knex("transactions").where({ transaction_id }).update({ status });

    // Retrieve the updated transaction using transaction_id
    const transaction = await knex("transactions")
      .where({ transaction_id })
      .first();

    return transaction;
  }
}

export default TransactionModel;
