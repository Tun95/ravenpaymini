export const up = function (knex) {
    return knex.schema.createTable("users", (table) => {
      table
        .uuid("id")
        .primary()
        .defaultTo(knex.raw("(UUID())"));
  
      table.string("first_name").notNullable();
      table.string("last_name").notNullable();
      table.string("image").nullable();
      table.string("email").notNullable().unique();
      table.boolean("is_admin").defaultTo(false);
      table.boolean("is_blocked").defaultTo(false);
      table.string("password").notNullable();
      table.timestamps(true, true);
    });
  };
  
  export const down = function (knex) {
    return knex.schema.dropTable("users");
  };
  