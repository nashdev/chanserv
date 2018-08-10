import * as express from "express";
import { injectable, inject } from "inversify";
import { IRegistrableController } from "./IRegisterableController";
import TYPES from "../Types";

@injectable()
export class SlackEventsController implements IRegistrableController {
  public slackEventsAdapter: any;

  constructor(@inject(TYPES.SlackEventsAdapter) slackEventsAdapter: any) {
    this.slackEventsAdapter = slackEventsAdapter;
  }

  public initialize(app: express.Application): void {
    app.use("/slack/events", this.slackEventsAdapter.expressMiddleware());
  }
}
