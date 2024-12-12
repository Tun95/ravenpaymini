import knex from "../db/knex.js";

class BankAccountModel {
  // Create a new bank account
  static async create({
    user_id,
    account_number,
    bank_name,
    account_type = "savings",
    balance = 0,
  }) {
    if (!account_number) {
      throw new Error("Account number is required");
    }

    if (!bank_name) {
      throw new Error("Bank name is required");
    }

    // Insert the bank account details into the database
    await knex("bank_accounts").insert({
      user_id,
      account_number,
      bank_name,
      account_type,
      balance,
    });

    // Retrieve the inserted account by unique account number
    const account = await knex("bank_accounts")
      .where({ account_number })
      .first();

    return account;
  }

  // Get all bank accounts with user details
  static async findAll() {
    const accounts = await knex("bank_accounts")
      .join("users", "bank_accounts.user_id", "users.id")
      .select(
        "bank_accounts.*",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.is_admin",
        "users.is_blocked"
      );

    return accounts;
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
      .join("users", "bank_accounts.user_id", "users.id")
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
      .first();

    return account;
  }

  // Update balance of a bank account
  static async updateBalance(user_id, amount) {
    const account = await knex("bank_accounts").where({ user_id }).first();

    if (!account) {
      throw new Error("Account not found");
    }

    const newBalance = parseFloat(account.balance) + parseFloat(amount);

    await knex("bank_accounts")
      .where({ user_id })
      .update({ balance: newBalance });

    // Retrieve the updated account using user_id
    const updatedAccount = await knex("bank_accounts")
      .where({ user_id })
      .first();

    return updatedAccount;
  }

  // Update account type of a bank account
  static async updateAccountType(user_id, account_type) {
    await knex("bank_accounts").where({ user_id }).update({ account_type }); // Update account_type

    const account = await knex("bank_accounts").where({ user_id }).first();

    return account;
  }

  // Delete a bank account by account_number
  static async deleteByAccountNumber(account_number) {
    const account = await knex("bank_accounts")
      .where({ account_number })
      .first();

    if (!account) {
      throw new Error("Bank account not found");
    }

    await knex("bank_accounts").where({ account_number }).del();

    return account;
  }
}

export default BankAccountModel;
