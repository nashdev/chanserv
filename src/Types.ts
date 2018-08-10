const TYPES = {
  BotController: Symbol("BotController"),
  SlackEventsController: Symbol("SlackEventsController"),

  ChannelsRepository: Symbol("ChannelsRepository"),
  OpsRepository: Symbol("OpsRepository"),
  BansRepository: Symbol("BansRepository"),
  WarningsRepository: Symbol("WarningsRepository"),
  SlackRepository: Symbol("SlackRepository"),

  BotService: Symbol("BotService"),

  SlackEventsAdapter: Symbol("SlackEventsAdapter"),
  SlackBotClient: Symbol("SlackBotClient"),
  SlackWebClient: Symbol("SlackWebClient"),

  Cache: Symbol("Cache"),
  DatabaseClient: Symbol("DatabaseClient")
};

export default TYPES;
