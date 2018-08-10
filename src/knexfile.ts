import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const config = {
  client: "pg",
  debug: true,
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  migrations: {
    directory: "./Stores/Migrations"
  },
  seeds: {
    directory: "./Stores/Seeds"
  }
};

export default config;
module.exports = config;
