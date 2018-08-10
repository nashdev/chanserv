import debugFactory from "debug";
import colors from "colors";
import { injectable, inject, multiInject } from "inversify";

import TYPES from "../Types";
import { IRegistrableController } from "./IRegisterableController";
import { IBotService } from "../Services/BotService";

const debug = debugFactory("chanserv");

@injectable()
export class BotController implements IRegistrableController {
  public botService: IBotService;
  private events: any;
  public commands = [
    {
      name: "Help",
      scope: "public",
      pattern: /!help$/i,
      execute: this.onHelp.bind(this),
      help:
        "Display the available Chanserv commands and their usage. Usage: `!help`"
    },

    {
      name: "Report",
      scope: "public",
      pattern: /!report$/i,
      execute: this.onReport.bind(this),
      help:
        "Ping the server admins to report an incident or ask for help. Usage: `!report`"
    },

    {
      name: "Info",
      scope: "public",
      pattern: /!info$/i,
      execute: this.onInfo.bind(this),
      help: "Get information about a registered channel. Usage: `!info`"
    },

    {
      name: "Register",
      scope: "admin",
      pattern: /!register <#(\w+)\|(\w+)>\s<@?(\w+\s?\w+)>/i,
      execute: this.onRegister.bind(this),
      help:
        "Register a channel with Chanserv. Usage: `!register <#channel> <@user>`"
    },

    {
      name: "Warn",
      scope: "op",
      pattern: /!warn <@?(\w+\s?\w+)>\s?(.*)?/i,
      execute: this.onWarn.bind(this),
      help:
        "Warn a user that if their behavior continues they will be kicked. Warnings expire after 30 days. Usage: `!warn <@user> <reason>`"
    },

    {
      name: "Unwarn",
      scope: "op",
      pattern: /!unwarn <@?(\w+\s?\w+)>\s?(.*)?/i,
      execute: this.onUnWarn.bind(this),
      help: "Expire all active warnings for a user. Usage: `!unwarn <@user>`"
    },

    {
      name: "Warnings",
      scope: "public",
      pattern: /!warnings$/i,
      execute: this.onWarnings.bind(this),
      help: "List all warnings for a channel. Usage: `!warnings`"
    },

    {
      name: "Kick",
      scope: "op",
      pattern: /!kick <@?(\w+\s?\w+)>\s?(.*)?/i,
      execute: this.onKick.bind(this),
      help: "Remove a user from a channel. Usage: `!kick <@user> <reason?>`"
    },

    {
      name: "Ban",
      scope: "op",
      pattern: /!ban <@?(\w+\s?\w+)>\s?(\w+)?\s?(.*)?/i,
      execute: this.onBan.bind(this),
      help:
        "Ban a user from rejoining a channel. Defaults to 1 hour ban. Usage: `!ban <@user> <duration?> <reason?>`"
    },

    {
      name: "Unban",
      scope: "op",
      pattern: /!unban <@?(\w+\s?\w+)>/i,
      execute: this.onUnban.bind(this),
      help: "Expire all active bans for a user. Usage: `!unban <@user>`"
    },

    {
      name: "Bans",
      scope: "public",
      pattern: /!bans$/i,
      execute: this.onBans.bind(this),
      help: "List all bans for a channel. Usage: `!bans`"
    },

    {
      name: "Op",
      scope: "op",
      pattern: /!op <@?(\w+\s?\w+)>/i,
      execute: this.onOp.bind(this),
      help:
        "Add an operator to the channel. An operator has access to kick, ban, op, warn, and other channel commands. Usage: `!op <@user>`"
    },

    {
      name: "Deop",
      scope: "op",
      pattern: /!deop <@?(\w+\s?\w+)>/i,
      execute: this.onDeop.bind(this),
      help: "Remove an operator from the channel. Usage: `!deop <@user>`"
    },

    {
      name: "Whois",
      scope: "public",
      pattern: /!whois <@?(\w+\s?\w+)>/i,
      execute: this.onWhois.bind(this),
      help:
        "Display public information about a user. Such as channels, operator status, admin status. Usage: `!whois <@user>`"
    },

    {
      name: "Remove",
      scope: "op",
      pattern: /!remove <https:\/\/nashdev\.slack\.com\/archives\/(\w+)\/p(\w{10})(\w{6})>/i,
      execute: this.onRemove.bind(this),
      help:
        "Remove a message from a channel. Provide a http link to the message and it will be removed. You can find the message link by clicking more actions-> copy link, next to a message. Usage: `!remove <link>`"
    },

    {
      name: "Protect Topic",
      scope: "system",
      subtype: "channel_topic",
      pattern: /^((?!!).)*$/i,
      execute: this.onTopic.bind(this),
      help: "Enforces the set channel topic."
    },

    {
      name: "Protect Purpose",
      subtype: "channel_purpose",
      scope: "system",
      pattern: /^((?!!).)*$/i,
      execute: this.onPurpose.bind(this),
      help: "Enforces the set channel purpose."
    }
  ];

  constructor(
    @inject(TYPES.SlackEventsAdapter) events: any,
    @inject(TYPES.BotService) botService: IBotService
  ) {
    this.events = events;
    this.botService = botService;

    // Handle Channel Message Events
    this.events.on("message", this.onMessage.bind(this));
    // Handle Channel Join Events
    this.events.on("member_joined_channel", this.onJoin.bind(this));
    // Handle Event Errors
    this.events.on("error", this.onError.bind(this));
  }

  public initialize() {
    return this.commands.map(Command => {
      debug(
        `
          ${colors.white("Registered Command:")} ${colors.bold(
          colors.underline(colors.green(Command.name))
        )}
          ${colors.white("Pattern:")} ${colors.cyan(
          Command.pattern.toString()
        )}`
      );
      return Command.name;
    });
  }

  onMessage(message) {
    const allowedSubtypes = this.commands
      .filter(x => x.subtype)
      .map(x => x.subtype);

    if (message.subtype && !allowedSubtypes.includes(message.subtype)) {
      return Promise.all([]);
    }

    debug(
      colors.white(
        `BotController::onMessage: Heard message: "${
          message.text
        }" in channel: ${colors.underline(message.channel)}`
      )
    );

    return Promise.all(
      this.commands
        .filter(Command => {
          if (Command.subtype) {
            return Command.subtype === message.subtype;
          }
          return true;
        })
        .map(async Command => {
          try {
            const matches = Command.pattern.exec(message.text);
            if (!matches) {
              return {
                name: Command.name,
                status: "unmatched"
              };
            }
            debug(
              colors.green(
                `BotController::onMessage — Success matching command: ${colors.underline(
                  Command.name
                )} with pattern: ${colors.underline(
                  Command.pattern.toString()
                )}`
              )
            );

            await Command.execute(matches, message);

            debug(
              colors.green(
                `BotController::onMessage — Success handling command: ${colors.underline(
                  Command.name
                )}`
              )
            );

            return {
              name: Command.name,
              status: "matched"
            };
          } catch (error) {
            debug(
              colors.red(
                `BotController::onMessage — Error handling command: ${colors.underline(
                  Command.name
                )} — ${error.message}`
              )
            );

            return {
              name: Command.name,
              status: "error",
              error: error.message
            };
          }
        })
    );
  }

  async onJoin(event: any) {
    const allowedChannelTypes = ["C"];
    try {
      const {
        channel_type: channelType,
        user: userId,
        channel: channelId
      } = event;

      debug(
        colors.green(
          `BotController::onJoin — A user (${colors.underline(
            userId
          )}) has joined the channel: ${colors.underline(channelId)}.`
        )
      );

      if (!allowedChannelTypes.includes(channelType)) {
        return {
          skipped: true
        };
      }

      const banRes = await this.botService.enforceBan({ userId, channelId });
      const regRes = await this.botService.enforceRegistration({
        userId,
        channelId
      });
      await this.respond(channelId, banRes);
      await this.respond(channelId, regRes);
      return {
        error: false
      };
    } catch (error) {
      debug(
        colors.red(
          `BotController::onJoin — Error handling onJoin event — ${
            error.message
          }`
        )
      );
      return {
        error: true
      };
    }
  }
  onError(error: any) {
    debug(
      colors.red(`BotController::onJoin — Events onError — ${error.message}`)
    );
  }

  async respond(channelId, res) {
    try {
      const { response, error } = res;
      if (error) {
        await this.botService.postMessage({
          channelId,
          text: `
      —— Chanserv ——
      ${response}
      *Error*: ${error}
      `
        });
        return;
      }

      await this.botService.postMessage({
        channelId,
        text: `
      —— Chanserv ——
      ${response}
      `
      });

      return;
    } catch (error) {}
  }

  async onHelp(matches: any, message: any) {
    const { channel: channelId } = message;
    const response = await this.botService.help(channelId, this.commands);
    await this.respond(channelId, response);
  }

  async onReport(matches: any, message: any) {
    const { channel: channelId, user: userId } = message;
    const response = await this.botService.report(channelId, userId);
    await this.respond(channelId, response);
  }

  async onInfo(matches: any, message: any) {
    const { channel: channelId } = message;
    const response = await this.botService.info(channelId);
    await this.respond(channelId, response);
  }

  async onRegister(matches: any, message: any) {
    const [, targetChannelId, targetChannelName, targetOwnerId] = matches;
    const { user: userId, channel: currentChannelId } = message;
    const response = await this.botService.register({
      channelId: targetChannelId,
      channelName: targetChannelName,
      ownerId: targetOwnerId,
      adminId: userId
    });
    await this.respond(currentChannelId, response);
    await this.respond(targetChannelId, response);
  }

  async onWarn(matches: any, message: any) {
    const [, targetId, reason = "You have been warned."] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.warn({
      userId,
      targetId,
      channelId,
      reason
    });
    await this.respond(channelId, response);
  }

  async onUnWarn(matches: any, message: any) {
    const [, targetId] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.unwarn({
      userId,
      targetId,
      channelId
    });
    await this.respond(channelId, response);
  }

  async onWarnings(matches: any, message: any) {
    const { channel: channelId } = message;
    const response = await this.botService.warnings({ channelId });
    await this.respond(channelId, response);
  }

  async onKick(matches: any, message: any) {
    const [, targetId, reason = "You have been warned."] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.kick({
      userId,
      targetId,
      channelId,
      reason
    });
    await this.respond(channelId, response);
  }

  async onBan(matches: any, message: any) {
    const [
      ,
      targetId,
      expires = "1h",
      reason = "You have been warned."
    ] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.ban({
      userId,
      targetId,
      channelId,
      reason,
      expires
    });
    await this.respond(channelId, response);
  }

  async onUnban(matches: any, message: any) {
    const [, targetId] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.unban({
      userId,
      targetId,
      channelId
    });
    await this.respond(channelId, response);
  }

  async onBans(matches: any, message: any) {
    const { channel: channelId } = message;
    const response = await this.botService.bans({ channelId });
    await this.respond(channelId, response);
  }

  async onOp(matches: any, message: any) {
    const [, targetId] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.op({
      userId,
      targetId,
      channelId
    });
    await this.respond(channelId, response);
  }

  async onDeop(matches: any, message: any) {
    const [, targetId] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.deop({
      userId,
      targetId,
      channelId
    });
    await this.respond(channelId, response);
  }

  async onWhois(matches: any, message: any) {
    const [, targetId] = matches;
    const { user: userId, channel: channelId } = message;
    const response = await this.botService.whois({
      userId,
      targetId,
      channelId
    });
    await this.respond(channelId, response);
  }

  async onRemove(matches: any, message: any) {
    const [, targetChannelId, ts1, ts2] = matches;
    const {
      user: userId,
      channel: currentChannelId,
      ts: currentTimestamp
    } = message;
    const targetTimestamp = `${ts1}.${ts2}`;

    const response = await this.botService.removeMessage({
      userId,
      targetChannelId,
      targetTimestamp,
      currentChannelId,
      currentTimestamp
    });
    await this.respond(currentChannelId, response);
  }

  async onTopic(matches: any, message: any) {
    const { channel: channelId, user: userId, topic } = message;

    const response = await this.botService.protectTopic({
      channelId,
      userId,
      topic
    });
    await this.respond(channelId, response);
  }

  async onPurpose(matches: any, message: any) {
    const { channel: channelId, user: userId, purpose } = message;

    const response = await this.botService.protectPurpose({
      channelId,
      userId,
      purpose
    });
    await this.respond(channelId, response);
  }
}
