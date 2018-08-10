import "reflect-metadata";
import express from "express";
import compression from "compression"; // compresses requests
// import bodyParser from "body-parser";
import lusca from "lusca";
import dotenv from "dotenv";
import path from "path";
import expressValidator from "express-validator";
import container from "./injection.config";
import TYPES from "./Types";
import { IRegistrableController } from "./Controllers/IRegisterableController";

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env" });

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);

app.use(compression());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Find all registerable controllers.
 */
const botController: IRegistrableController = container.get<
  IRegistrableController
>(TYPES.BotController);

const slackController: IRegistrableController = container.get<
  IRegistrableController
>(TYPES.SlackEventsController);

/**
 * Register routes for each controller.
 */
botController.initialize(app);
slackController.initialize(app);

export default app;
