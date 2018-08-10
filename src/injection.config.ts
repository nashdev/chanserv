import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { Container, ContainerModule } from "inversify";
import TYPES from "./Types";
import { WebClient as SlackWebClient } from "@slack/client";

import { ICache } from "./Stores/ICache";
import { knex } from "./Stores/Postgres";

// Adapters
import { createEventAdapter } from "@slack/events-api";

// Controllers
import { IRegistrableController } from "./Controllers/IRegisterableController";
import { SlackEventsController } from "./Controllers/SlackEventsController";
import { BotController } from "./Controllers/BotController";

// Services
import { IBotService, BotService } from "./Services/BotService";

// Repositories
import {
  ISlackRepository,
  SlackRepository
} from "./repositories/SlackRepository";
import {
  ChannelsRepository,
  IChannelsRepository
} from "./repositories/ChannelsRepository";
import { BansRepository, IBansRepository } from "./Repositories/BansRepository";
import {
  WarningsRepository,
  IWarningsRepository
} from "./Repositories/WarningsRepository";
import { OpsRepository } from "./Repositories/OpsRepository";

// Create a new IoC Container
const c = new Container();

export const controllers = new ContainerModule(bind => {
  bind<IRegistrableController>(TYPES.BotController).to(BotController);
  bind<IRegistrableController>(TYPES.SlackEventsController).to(
    SlackEventsController
  );
});

export const repositories = new ContainerModule(bind => {
  bind<IChannelsRepository>(TYPES.ChannelsRepository)
    .to(ChannelsRepository)
    .inSingletonScope();
  bind<IBansRepository>(TYPES.BansRepository)
    .to(BansRepository)
    .inSingletonScope();
  bind<OpsRepository>(TYPES.OpsRepository)
    .to(OpsRepository)
    .inSingletonScope();
  bind<IWarningsRepository>(TYPES.WarningsRepository)
    .to(WarningsRepository)
    .inSingletonScope();
  bind<ISlackRepository>(TYPES.SlackRepository)
    .to(SlackRepository)
    .inSingletonScope();
});

export const services = new ContainerModule(bind => {
  bind<IBotService>(TYPES.BotService).to(BotService);
});

export const adapters = new ContainerModule(bind => {
  bind<any>(TYPES.SlackEventsAdapter).toConstantValue(
    createEventAdapter(process.env.SLACK_SIGNING_SECRET)
  );
});

export const slackClients = new ContainerModule(bind => {
  bind<any>(TYPES.SlackBotClient).toConstantValue(
    new SlackWebClient(process.env.SLACK_BOT_TOKEN)
  );
  bind<any>(TYPES.SlackWebClient).toConstantValue(
    new SlackWebClient(process.env.SLACK_OAUTH_TOKEN)
  );
});

// Stores
export const databaseClient = new ContainerModule(bind => {
  bind<any>(TYPES.DatabaseClient).toConstantValue(knex);
});

c.load(
  controllers,
  repositories,
  services,
  adapters,
  slackClients,
  databaseClient
);

export default c;
