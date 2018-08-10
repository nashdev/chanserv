import "reflect-metadata";
import { Container } from "inversify";
import TYPES from "../../Types";
import { Express } from "jest-express/lib/express";
import { SlackEventsController } from "../SlackEventsController";

jest.mock("express", () => {
  return require("jest-express");
});

describe("SlackEventsController", () => {
  let container: Container;
  let app;

  beforeEach(() => {
    app = new Express();
    container = new Container();
    container.bind(TYPES.SlackEventsController).to(SlackEventsController);
    container.bind(TYPES.SlackEventsAdapter).toConstantValue({
      on: jest.fn(),
      expressMiddleware: jest.fn()
    });
  });

  afterEach(() => {
    container = undefined;
    app.resetMocked();
  });

  it("#initialize() registers the app middleware.", done => {
    const slackEventsController = container.get<SlackEventsController>(
      TYPES.SlackEventsController
    );

    slackEventsController.initialize(app);
    expect(app.use).toBeCalledWith(
      "/slack/events",
      slackEventsController.slackEventsAdapter.expressMiddleware()
    );
    done();
  });
});
