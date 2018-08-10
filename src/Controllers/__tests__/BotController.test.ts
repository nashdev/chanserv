import "reflect-metadata";
import { Container } from "inversify";

import TYPES from "../../Types";
import { BotController } from "../BotController";
import { IRegistrableController } from "../IRegisterableController";
import MockBotService from "../../Services/__mocks__/BotService";

describe("BotController", () => {
  let container: Container;

  beforeEach(() => {
    MockBotService.mockClear();
    container = new Container();
    container.bind(TYPES.BotService).toConstantValue(new MockBotService());
    container.bind(TYPES.BotController).to(BotController);
    container.bind(TYPES.SlackEventsAdapter).toConstantValue({
      on: jest.fn()
    });
  });

  afterEach(() => {
    container = undefined;
  });

  it("#initialize() should return the list of commands that have been registered", () => {
    const botController = container.get<IRegistrableController>(
      TYPES.BotController
    );

    expect(botController.initialize()).toEqual([
      "Help",
      "Report",
      "Info",
      "Register",
      "Warn",
      "Unwarn",
      "Warnings",
      "Kick",
      "Ban",
      "Unban",
      "Bans",
      "Op",
      "Deop",
      "Whois",
      "Remove",
      "Protect Topic",
      "Protect Purpose"
    ]);
  });

  it("#onMessage - No command should be fired for a generic message.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "hello world",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual([]);
    done();
  });

  it("#onMessage - No command should be fired for an unallowed sub_type", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      subtype: "me_message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "is doing that thing",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual([]);
    done();
  });

  it("#onMessage - should handle command errors gracefully", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const commands = [
      {
        name: "Info",
        scope: "public",
        pattern: /!info$/i,
        execute: () => {
          throw new Error("Error");
        },
        help: "Get information about a registered channel. Usage: `!info`"
      }
    ];
    botController.commands = commands;

    const message = {
      type: "message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "!info",
      ts: "1355517523.000005"
    };

    const result = await botController.onMessage(message);
    const executed = result.filter(x => x.status === "error").map(x => x.name);
    expect(executed).toEqual(["Info"]);
    done();
  });

  it("#onMessage - onReport() should be called when a !report is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "!report",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Report"]);
    expect(botController.botService.report).toHaveBeenCalledTimes(1);
    expect(botController.botService.report).toHaveBeenCalledWith(
      "C2147483705",
      "U2147483697"
    );
    done();
  });

  it("#onMessage - onHelp() should be called when a !help is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "!help",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Help"]);
    expect(botController.botService.help).toHaveBeenCalledTimes(1);
    expect(botController.botService.help).toHaveBeenCalledWith(
      "C2147483705",
      botController.commands
    );
    done();
  });

  it("#onMessage - onInfo() should be called when a !info is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "C2147483705",
      user: "U2147483697",
      text: "!info",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Info"]);
    expect(botController.botService.info).toHaveBeenCalledTimes(1);
    expect(botController.botService.info).toHaveBeenCalledWith("C2147483705");
    done();
  });

  it("#onMessage - onRegister() should be called when a !report <#channel> <@user> is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!register <#CXXTEST|test> <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Register"]);
    expect(botController.botService.register).toHaveBeenCalledTimes(1);
    expect(botController.botService.register).toHaveBeenCalledWith({
      channelId: "CXXTEST",
      channelName: "test",
      ownerId: "U123TEST",
      adminId: "U123ADMIN"
    });
    done();
  });

  it("#onMessage - onWarn() should be called when a !warn <@user> <reason> message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!warn <@U123TEST> you have been warned",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Warn"]);
    expect(botController.botService.warn).toHaveBeenCalledTimes(1);
    expect(botController.botService.warn).toHaveBeenCalledWith({
      targetId: "U123TEST",
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT",
      reason: "you have been warned"
    });
    done();
  });

  it("#onMessage - onWarn() should be called when a `!warn <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!warn <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Warn"]);
    expect(botController.botService.warn).toHaveBeenCalledTimes(1);
    expect(botController.botService.warn).toHaveBeenCalledWith({
      targetId: "U123TEST",
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT",
      reason: "You have been warned."
    });
    done();
  });

  it("#onMessage - onUnwarn() should be called when a `!unwarn <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!unwarn <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Unwarn"]);
    expect(botController.botService.unwarn).toHaveBeenCalledTimes(1);
    expect(botController.botService.unwarn).toHaveBeenCalledWith({
      targetId: "U123TEST",
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT"
    });
    done();
  });

  it("#onMessage - onWarnings() should be called when a `!warnings` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!warnings",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Warnings"]);
    expect(botController.botService.warnings).toHaveBeenCalledTimes(1);
    expect(botController.botService.warnings).toHaveBeenCalledWith({
      channelId: "CXXXSUPPORT"
    });
    done();
  });

  it("#onMessage - onKick() should be called when a !kick <@user> message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!kick <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Kick"]);
    expect(botController.botService.kick).toHaveBeenCalledTimes(1);
    expect(botController.botService.kick).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetId: "U123TEST",
      channelId: "CXXXSUPPORT",
      reason: "You have been warned."
    });
    done();
  });

  it("#onMessage - onKick() should be called when a !kick <@user> <reason> message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!kick <@U123TEST> you have been warned",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Kick"]);
    expect(botController.botService.kick).toHaveBeenCalledTimes(1);
    expect(botController.botService.kick).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetId: "U123TEST",
      channelId: "CXXXSUPPORT",
      reason: "you have been warned"
    });
    done();
  });

  it("#onMessage - onBan() should be called when a !ban <@user> <duration> <reason> message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!ban <@U123TEST> 1h stop doing that",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Ban"]);
    expect(botController.botService.ban).toHaveBeenCalledTimes(1);
    expect(botController.botService.ban).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetId: "U123TEST",
      channelId: "CXXXSUPPORT",
      expires: "1h",
      reason: "stop doing that"
    });
    done();
  });

  it("#onMessage - onBan() should be called when a !ban <@user> message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!ban <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Ban"]);
    expect(botController.botService.ban).toHaveBeenCalledTimes(1);
    expect(botController.botService.ban).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetId: "U123TEST",
      channelId: "CXXXSUPPORT",
      expires: "1h",
      reason: "You have been warned."
    });
    done();
  });

  it("#onMessage - onUnban() should be called when a `!unban <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!unban <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Unban"]);
    expect(botController.botService.unban).toHaveBeenCalledTimes(1);
    expect(botController.botService.unban).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetId: "U123TEST",
      channelId: "CXXXSUPPORT"
    });
    done();
  });

  it("#onMessage - onBans() should be called when a `!bans` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!bans",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Bans"]);
    expect(botController.botService.bans).toHaveBeenCalledTimes(1);
    expect(botController.botService.bans).toHaveBeenCalledWith({
      channelId: "CXXXSUPPORT"
    });
    done();
  });

  it("#onMessage - onOp() should be called when a `!op <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!op <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Op"]);
    expect(botController.botService.op).toHaveBeenCalledTimes(1);
    expect(botController.botService.op).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT",
      targetId: "U123TEST"
    });
    done();
  });

  it("#onMessage - onDeop() should be called when a `!deop <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!deop <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Deop"]);
    expect(botController.botService.deop).toHaveBeenCalledTimes(1);
    expect(botController.botService.deop).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT",
      targetId: "U123TEST"
    });
    done();
  });

  it("#onMessage - onWhois() should be called when a `!whois <@user>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text: "!whois <@U123TEST>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Whois"]);
    expect(botController.botService.whois).toHaveBeenCalledTimes(1);
    expect(botController.botService.whois).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      channelId: "CXXXSUPPORT",
      targetId: "U123TEST"
    });
    done();
  });

  it("#onMessage - onRemove() should be called when a `!remove <link>` message is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      channel: "CXXXSUPPORT",
      user: "U123ADMIN",
      text:
        "!remove <https://nashdev.slack.com/archives/CBWSR9719/p1533867061000085>",
      ts: "1355517523.000005"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Remove"]);
    expect(botController.botService.removeMessage).toHaveBeenCalledTimes(1);
    expect(botController.botService.removeMessage).toHaveBeenCalledWith({
      userId: "U123ADMIN",
      targetChannelId: "CBWSR9719",
      targetTimestamp: "1533867061.000085",
      currentChannelId: "CXXXSUPPORT",
      currentTimestamp: "1355517523.000005"
    });
    done();
  });

  it("#onMessage - protectTopic() should be fired when a message with subtype of channel_topic is heard", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    const message = {
      type: "message",
      subtype: "channel_topic",
      channel: "C2147483705",
      ts: "1358877455.000010",
      user: "U2147483828",
      topic: "hello world",
      text: "<@U2147483828|cal> set the channel topic: hello world"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Protect Topic"]);
    expect(botController.botService.protectTopic).toHaveBeenCalledTimes(1);
    expect(botController.botService.protectTopic).toHaveBeenCalledWith({
      channelId: "C2147483705",
      userId: "U2147483828",
      topic: "hello world"
    });
    done();
  });

  it("#onMessage - protectPurpose() should be fired when a message with subtype of channel_purpose is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);

    const message = {
      type: "message",
      subtype: "channel_purpose",
      channel: "C2147483705",
      ts: "1358877455.000010",
      user: "U2147483828",
      purpose: "whatever",
      text: "<@U2147483828|cal> set the channel purpose: whatever"
    };
    const commands = await botController.onMessage(message);
    const executed = commands
      .filter(x => x.status === "matched")
      .map(x => x.name);
    expect(executed).toEqual(["Protect Purpose"]);
    expect(botController.botService.protectPurpose).toHaveBeenCalledTimes(1);
    expect(botController.botService.protectPurpose).toHaveBeenCalledWith({
      channelId: "C2147483705",
      userId: "U2147483828",
      purpose: "whatever"
    });
    done();
  });

  it("#onJoin - should handle errors gracefully", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    botController.respond = async () => {
      throw new Error("Error");
    };

    const message = {
      type: "member_joined_channel",
      user: "W06GH7XHN",
      channel: "C0698JE0H",
      channel_type: "C",
      team: "T024BE7LD",
      inviter: "U123456789"
    };
    const res = await botController.onJoin(message);
    expect(res.error).toBe(true);
    done();
  });

  it("#onJoin - should not run any commands if the channel type is not allowed", async done => {
    const botController = container.get<BotController>(TYPES.BotController);

    const message = {
      type: "member_joined_channel",
      user: "W06GH7XHN",
      channel: "C0698JE0H",
      channel_type: "G",
      team: "T024BE7LD",
      inviter: "U123456789"
    };
    await botController.onJoin(message);
    expect(botController.botService.enforceBan).toHaveBeenCalledTimes(0);
    expect(botController.botService.enforceRegistration).toHaveBeenCalledTimes(
      0
    );
    done();
  });

  it("#onJoin - enforceBan()  should be fired when a `member_joined_channel` event is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);

    const message = {
      type: "member_joined_channel",
      user: "W06GH7XHN",
      channel: "C0698JE0H",
      channel_type: "C",
      team: "T024BE7LD",
      inviter: "U123456789"
    };
    const commands = await botController.onJoin(message);

    expect(botController.botService.enforceBan).toHaveBeenCalledTimes(1);
    expect(botController.botService.enforceBan).toHaveBeenCalledWith({
      channelId: "C0698JE0H",
      userId: "W06GH7XHN"
    });
    done();
  });

  it("#onJoin - enforceRegistration() should be fired when a `member_joined_channel` event is heard.", async done => {
    const botController = container.get<BotController>(TYPES.BotController);

    const message = {
      type: "member_joined_channel",
      user: "W06GH7XHN",
      channel: "C0698JE0H",
      channel_type: "C",
      team: "T024BE7LD",
      inviter: "U123456789"
    };
    const commands = await botController.onJoin(message);

    expect(botController.botService.enforceRegistration).toHaveBeenCalledTimes(
      1
    );
    expect(botController.botService.enforceRegistration).toHaveBeenCalledWith({
      channelId: "C0698JE0H",
      userId: "W06GH7XHN"
    });
    done();
  });

  it("#respond", async done => {
    const botController = container.get<BotController>(TYPES.BotController);
    await botController.respond("C0698JE0H", {
      response: "response",
      error: false
    });
    expect(botController.botService.postMessage).toHaveBeenCalledTimes(1);
    expect(botController.botService.postMessage).toHaveBeenCalledWith({
      channelId: "C0698JE0H",
      text: `
      —— Chanserv ——
      response
      `
    });

    await botController.respond("C0698JE0H", {
      response: "response",
      error: "There was an error."
    });
    expect(botController.botService.postMessage).toHaveBeenCalledTimes(2);
    expect(botController.botService.postMessage).toHaveBeenCalledWith({
      channelId: "C0698JE0H",
      text: `
      —— Chanserv ——
      response
      *Error: There was an error.
      `
    });
    done();
  });

  it("onError", async done => {
    // TODO
    const botController = container.get<BotController>(TYPES.BotController);
    await botController.onError({});
    done();
  });
});
