export const up = function (knex) {
  return knex.schema.createTable("transactions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())")); 
    table
      .uuid("sender_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); 
    table
      .uuid("recipient_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE"); 
    table.string("recipient_account_number").notNullable(); 
    table.decimal("amount", 10, 2).notNullable(); 
    table
      .enum("status", ["pending", "successful", "failed"])
      .defaultTo("pending"); 
    table.string("transaction_id").unique().notNullable();
    table.string("currency").defaultTo("NGN");
    table.string("reference").unique().nullable();
    table.timestamps(true, true); 
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("transactions");
};
