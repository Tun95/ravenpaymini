export const up = function (knex) {
  return knex.schema.createTable("transactions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())")); // Unique transaction ID
    table
      .uuid("sender_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // Sender's user ID
    table
      .uuid("recipient_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); // Recipient's user ID
    table.string("recipient_account_number").notNullable(); // Recipient account number
    table.decimal("amount", 10, 2).notNullable(); // Amount of money transferred
    table
      .enum("status", ["pending", "successful", "failed"])
      .defaultTo("pending"); // Transaction status
    table.string("transaction_id").unique().notNullable(); // External transaction ID
    table.timestamps(true, true); // Created at, updated at
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("transactions");
};
