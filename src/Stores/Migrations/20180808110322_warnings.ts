import * as Knex from "knex";

export const up = async function(knex: Knex): Promise<any> {
  await knex.schema.createTable("warnings", function(table) {
    table.increments();
    table.string("channelId").notNullable();
    table.foreign("channelId").references("channels.channelId");
    table.string("userId").notNullable();
    table.string("reason").notNullable();
    table.dateTime("expiresAt").defaultTo();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
};

export const down = async function(knex: Knex): Promise<any> {
  await knex.schema.dropTable("warnings");
};
