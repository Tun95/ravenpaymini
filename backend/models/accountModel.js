import knex from "../db/knex.js";

class BankAccountModel {
  // Create a new bank account
  static async create({
    user_id,
    account_number,
    bank_name, // Add bank_name to the parameters
    account_type = "savings",
    balance = 0,
  }) {
    if (!bank_name) {
      throw new Error("Bank name is required");
    }

    await knex("bank_accounts").insert({
      user_id,
      account_number,
      bank_name, // Include bank_name in the insert query
      account_type,
      balance,
    });

    // Retrieve the inserted account by unique account number
    const account = await knex("bank_accounts")
      .where({ account_number })
      .first();

    return account;
  }

  // Get a bank account by user_id
  static async findByUserId(user_id) {
    const account = await knex("bank_accounts")
      .join("users", "bank_accounts.user_id", "users.id")
      .where("bank_accounts.user_id", user_id)
      .select(
        "bank_accounts.*", 
        "users.first_name", 
        "users.last_name", 
        "users.email", 
        "users.is_admin", 
        "users.is_blocked" 
      )
      .first();
    return account;
  }

  // Get a bank account by account_number along with user details
  static async findByAccountNumber(account_number) {
    const account = await knex("bank_accounts")
      .join("users", "bank_accounts.user_id", "users.id") // Join bank_accounts with users
      .where({ "bank_accounts.account_number": account_number })
      .select(
        "bank_accounts.id",
        "bank_accounts.user_id",
        "bank_accounts.account_number",
        "bank_accounts.bank_name",
        "bank_accounts.account_type",
        "bank_accounts.balance",
        "bank_accounts.created_at",
        "bank_accounts.updated_at",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.is_admin",
        "users.is_blocked"
      )
      .first(); // Ensure we only get one record (if account_number is unique)

    return account;
  }

  // Update balance of a bank account
  static async updateBalance(user_id, newBalance) {
    await knex("bank_accounts")
      .where({ user_id })
      .update({ balance: newBalance });

    const account = await knex("bank_accounts").where({ user_id }).first();

    return account;
  }

  // Update account type of a bank account
  static async updateAccountType(user_id, account_type) {
    await knex("bank_accounts").where({ user_id }).update({ account_type }); // Update account_type

    const account = await knex("bank_accounts").where({ user_id }).first();

    return account;
  }
}

export default BankAccountModel;
