import * as Knex from "knex";
import knexfile from "../knexfile";

// instance
export const knex: Knex = Knex.default(knexfile);
