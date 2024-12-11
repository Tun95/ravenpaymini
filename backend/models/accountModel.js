import knex from "../db/knex.js";

class BankAccountModel {
  // Create a new bank account
  static async create({
    user_id,
    account_number,
    account_type = "savings",
    balance = 0,
  }) {
    const [account] = await knex("bank_accounts")
      .insert({
        user_id,
        account_number,
        account_type, // Include account_type when creating an account
        balance, // Include balance when creating an account
      })
      .returning("*");

    return account;
  }

  // Get a bank account by user_id
  static async findByUserId(user_id) {
    const account = await knex("bank_accounts")
      .where({ user_id })
      .select("*") // Explicitly include account_type and balance
      .first();
    return account;
  }

  // Get a bank account by account_number
  static async findByAccountNumber(account_number) {
    const account = await knex("bank_accounts")
      .where({ account_number })
      .select("*") // Explicitly include account_type and balance
      .first();
    return account;
  }

  // Update balance of a bank account
  static async updateBalance(user_id, newBalance) {
    const [account] = await knex("bank_accounts")
      .where({ user_id })
      .update({ balance: newBalance })
      .returning("*");

    return account;
  }

  // Update account type of a bank account
  static async updateAccountType(user_id, account_type) {
    const [account] = await knex("bank_accounts")
      .where({ user_id })
      .update({ account_type }) // Update account_type
      .returning("*");

    return account;
  }
}

export default BankAccountModel;
