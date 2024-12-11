export const up = function (knex) {
  return knex.schema.createTable("bank_accounts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("account_number").notNullable().unique();
    table.string("bank_name").notNullable();
    table
      .enum("account_type", ["savings", "current"]) // Add account_type field
      .notNullable()
      .defaultTo("savings");
    table.decimal("balance", 15, 2).notNullable().defaultTo(0); // Add balance field
    table.timestamps(true, true);
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("bank_accounts");
};
