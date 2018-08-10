import * as Knex from "knex";

export const up = async function(knex: Knex): Promise<any> {
  await knex.schema.createTable("channels", function(table) {
    table
      .string("channelId")
      .unique()
      .notNullable()
      .primary();
    table.string("name").notNullable();
    table.string("topic").notNullable();
    table.string("purpose").notNullable();
    table.string("ownerId").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
};

export const down = async function(knex: Knex): Promise<any> {
  await knex.schema.dropTable("channels");
};
