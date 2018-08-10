import debugFactory from "debug";
import colors from "colors";
import moment from "moment";
import parseDuration from "parse-duration";

import { injectable, inject } from "inversify";

import TYPES from "../Types";
import { Channel, IChannelDTO } from "../models/Channel";
import { IChannelsRepository } from "../repositories/ChannelsRepository";
import { ISlackRepository } from "../repositories/SlackRepository";
import { IBansRepository } from "../Repositories/BansRepository";
import { IOpsRepository } from "../Repositories/OpsRepository";
import { IWarningsRepository } from "../Repositories/WarningsRepository";

const debug = debugFactory("chanserv");

export interface IBotService {
  postMessage(options: { channelId: string; text: string }): {};
  warn(options: {
    userId: string;
    targetId: string;
    channelId: string;
    reason: string;
  }): {};
  unwarn(options: { userId: string; targetId: string; channelId: string }): {};
  warnings(options: { channelId: string }): {};
  report(channelId: string, userId: string): {};
  help(channelId: string, commands: Array<any>): {};
  info(channelId: string): {};
  register(options: {
    channelId: string;
    channelName: string;
    ownerId: string;
    adminId: string;
  }): {};
  kick(options: {
    userId: string;
    targetId: string;
    channelId: string;
    reason: string;
  }): {};
  ban(options: {
    userId: string;
    targetId: string;
    channelId: string;
    reason: string;
    expires: string;
  }): {};
  unban(options: { userId: string; targetId: string; channelId: string }): {};
  bans(options: { channelId: string }): {};
  op(options: { userId: string; targetId: string; channelId: string }): {};
  deop(options: { userId: string; targetId: string; channelId: string }): {};
  whois(options: { userId: string; targetId: string; channelId: string }): {};
  removeMessage(options: {
    userId: string;
    targetChannelId: string;
    targetTimestamp: string;
    currentChannelId: string;
    currentTimestamp: string;
  }): {};
  protectTopic(options: {
    channelId: string;
    userId: string;
    topic: string;
  }): {};
  protectPurpose(options: {
    channelId: string;
    userId: string;
    purpose: string;
  }): {};
  enforceBan(options: { userId: string; channelId: string }): {};
  enforceRegistration(options: { userId: string; channelId: string }): {};
}

@injectable()
export class BotService implements IBotService {
  @inject(TYPES.ChannelsRepository)
  private channelsRepository: IChannelsRepository;

  @inject(TYPES.WarningsRepository)
  private warningsRepository: IWarningsRepository;
  @inject(TYPES.BansRepository)
  private bansRepository: IBansRepository;
  @inject(TYPES.OpsRepository)
  private opsRepository: IOpsRepository;
  @inject(TYPES.SlackRepository)
  private slackRepository: ISlackRepository;

  private checkPermissions(channel, user, target?): any {
    const userPermissions = channel.getPermissions(user);

    if (target) {
      const targetPermissions = channel.getPermissions(target);
      if (targetPermissions.isAdmin || targetPermissions.isChanserv) {
        throw new Error(`You can't perform that command on <@${target.id}>.`);
      }
    }

    if (!userPermissions.isAdmin && !userPermissions.isOp) {
      throw new Error(
        `You must be an operator on <#${
          channel.channelId
        }> or an admin to use this command.`
      );
    }
  }

  public async postMessage({ channelId, text }) {
    try {
      await this.slackRepository.postMessage(channelId, text);
    } catch (error) {}
  }

  public async warn({ userId, targetId, channelId, reason }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const targetDto = await this.slackRepository.getUserInfo(targetId);
      const channel = new Channel(channelDto);
      const expires = moment().add(30, "days");

      this.checkPermissions(channel, userDto, targetDto);

      await this.warningsRepository.create({
        channelId: channelId,
        userId: targetId,
        reason: reason,
        expiresAt: expires.format()
      });

      // Todo: Check how many warns have been created and make sure
      // the user has not exceeded their limit.
      // If so, kick.

      const response = `
      *<@${targetId}>* has been warned by Chanserv!
      *Reason:* ${reason}
      *Expires:* ${expires.calendar()}`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to warn *<@${targetId}>*`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async unwarn({ userId, targetId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const channel = new Channel(channelDto);
      const user = await this.slackRepository.getUserInfo(userId);
      const target = await this.slackRepository.getUserInfo(targetId);

      this.checkPermissions(channel, user, target);

      // We don't actually want to delete the warning.
      // We want to update the warning's expiration to now
      // So it is no longer active, but we can keep a history of
      // how many times a user has been warned.
      await this.warningsRepository.update(
        {
          channelId: channelId,
          userId: targetId
        },
        {
          expiresAt: "NOW()",
          updatedAt: "NOW()"
        }
      );

      const response = `*<@${targetId}>* has been unwarned by Chanserv!`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to unwarn *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async warnings({ channelId }) {
    try {
      const warningsDTO = await this.warningsRepository.find({ channelId });
      const warnings = warningsDTO
        .map(
          warning =>
            `<@${warning.userId}>:
                *Banned*: ${moment(warning.createdAt).calendar()}
                *Expires*: ${moment(warning.expiresAt).calendar()}
                *Reason*: ${warning.reason}
            \n`
        )
        .join("");

      const response = `*<#${channelId}> Warnings*: ${
        warnings.length ? warnings : "None"
      }`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem getting *<#${channelId}> warnings.*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async report(channelId, userId) {
    try {
      const response = `
      *Chanserv Incidence Response*:

      Hello <@${userId}>,

      <@${
        process.env.CHANSERV_USERID
      }> has notified the admin team that you are in need of assistance.
      The server admins will contact you as soon as they are available.`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem getting *<#${channelId}> info.*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async help(channelId, commands) {
    commands = commands
      .filter(c => c.scope !== "system")
      .map(c => {
        return `  — *${c.name}* (_Scope: ${c.scope}_):
           ${c.help}
        `;
      })
      .join("\n");

    try {
      const response = `
      *Chanserv Help*:

      Chanserv is a bot that helps manage channels on a public slack.

      Below are a list of commands that are available:
      ${commands}`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem getting *<#${channelId}> info.*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async info(channelId) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const channel = new Channel(channelDto);
      const ops = channel.ops.map(id => `<@${id}>`).join(", ");
      const bans = channel.bans.map(id => `<@${id}>`).join(", ");
      const warnings = channel.warnings.map(id => `<@${id}>`).join(", ");
      const response = `*<#${channelId}> info*:
      *Registered:* ${moment(channel.createdAt).calendar()}
      *Channel Owner:* <@${channel.ownerId}>
      *Operators:* ${ops.length ? ops : "None"}
      *Active Bans:* ${bans.length ? bans : "None"}
      *Active Warnings:* ${warnings.length ? warnings : "None"}
      *Mutes:* None`;
      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem getting *<#${channelId}> info.*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async register({ channelId, channelName, ownerId, adminId }) {
    try {
      // This command is only allowed in the support channel.
      // if (currentChannelId !== process.env.SUPPORT_CHANNELID) {
      //   throw new Error(
      //     `You can only register channels in <#${
      //       process.env.SUPPORT_CHANNELID
      //     }>`
      //   );
      // }
      // Check if the user that is requesting the channel
      // to be registered is an admin.

      const trim = function(str, length) {
        return str.length > length ? str.substring(0, length) + "..." : str;
      };

      const { is_admin: isAdmin } = await this.slackRepository.getUserInfo(
        adminId
      );

      if (!isAdmin) {
        throw new Error(`You must be an administrator to register channels.`);
      }

      // Check if this channel is already registered?
      const channelExists = await this.channelsRepository.findOne({
        channelId
      });

      if (channelExists) {
        throw new Error(
          `This channel is already registered to <@${channelExists.ownerId}>`
        );
      }
      const {
        channel: {
          topic: { value: targetChannelTopic },
          purpose: { value: targetChannelPurpose },
          is_channel: targetIsChannel,
          created: targetChannelCreated,
          creator: targetChannelCreator
        }
      } = await this.slackRepository.webClient.channels.info({
        channel: channelId
      });

      if (!targetIsChannel) {
        throw new Error(
          `This channel <#${channelId}> does has not been created yet.`
        );
      }

      // Register the channel
      const channelDto = {
        ownerId: ownerId,
        channelId: channelId,
        name: channelName,
        topic: trim(targetChannelTopic, 250),
        purpose: trim(targetChannelPurpose, 250)
      };

      const channelRes = await this.channelsRepository.create(channelDto);

      await this.slackRepository.webClient.channels.invite({
        channel: channelId,
        user: process.env.CHANSERV_USERID
      });

      await this.slackRepository.webClient.channels.setTopic({
        channel: channelId,
        topic: channelDto.topic
      });

      await this.slackRepository.webClient.channels.setPurpose({
        channel: channelId,
        purpose: channelDto.purpose
      });

      let response = `
      *Registered <#${channelId}>!*:
      *Registered:* ${moment(channelRes.createdAt).calendar()}
      *Channel Owner:* <@${ownerId}>
      *Topic*: ${channelDto.topic}
      *Purpose*: ${channelDto.purpose}`;

      if (targetChannelCreator !== ownerId) {
        response += `
        *Notice: <@${targetChannelCreator}>,
        This channel has been registered by ${ownerId}.
        You initially created this channel, on ${targetChannelCreated}.
        If you would like to dispute this channel being registered, please visit <#${
          process.env.SUPPORT_CHANNELID
        }>`;
      }

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem registering *<#${channelId}>.*`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async kick({ userId, targetId, channelId, reason }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const channel = new Channel(channelDto);
      const user = await this.slackRepository.getUserInfo(userId);
      const target = await this.slackRepository.getUserInfo(targetId);

      this.checkPermissions(channel, user, target);

      // Kick the user from the channel
      await this.slackRepository.kick(targetId, channelId, reason);
      const response = `
      *<@${targetId}>* has been kicked by Chanserv!
      *Reason:* ${reason}`;
      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to kick *<@${targetId}>*`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async ban({ userId, targetId, channelId, reason, expires }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const targetDto = await this.slackRepository.getUserInfo(targetId);
      const channel = new Channel(channelDto);

      const expiresAt = moment().add(parseDuration(expires), "milliseconds");

      this.checkPermissions(channel, userDto, targetDto);

      await this.bansRepository.create({
        channelId: channelId,
        userId: targetId,
        reason: reason,
        expiresAt: expiresAt.format()
      });

      // Kick the user from the channel
      await this.slackRepository.kick(targetId, channelId, reason);

      const response = `
      *<@${targetId}>* has been banned by Chanserv!
      *Reason:* ${reason}
      *Expires:* ${moment(expires).calendar()}`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `
      Sorry, but we were unable to ban *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async unban({ userId, targetId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const channel = new Channel(channelDto);
      const user = await this.slackRepository.getUserInfo(userId);
      const target = await this.slackRepository.getUserInfo(targetId);

      this.checkPermissions(channel, user, target);

      // We don't actually want to delete the ban.
      // We want to update the ban's expiration to now
      // So it is no longer active, but we can keep a history of
      // how many times a user has been banned.
      await this.bansRepository.update(
        {
          channelId: channelId,
          userId: targetId
        },
        {
          expiresAt: "NOW()",
          updatedAt: "NOW()"
        }
      );

      const response = `*<@${targetId}>* has been unbanned by Chanserv!`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to unban *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async bans({ channelId }) {
    try {
      const bansDTO = await this.bansRepository.find({ channelId });
      const bans = bansDTO
        .map(
          ban =>
            `<@${ban.userId}>:
                *Banned*: ${moment(ban.createdAt).calendar()}
                *Expires*: ${moment(ban.expiresAt).calendar()}
                *Reason*: ${ban.reason}
            \n`
        )
        .join("");
      const response = `*<#${channelId}> Bans*:
      ${bans.length ? bans : "None"}`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but there was a problem getting <#${channelId}> bans.`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async op({ userId, targetId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const targetDto = await this.slackRepository.getUserInfo(targetId);
      const channel = new Channel(channelDto);

      this.checkPermissions(channel, userDto, targetDto);

      await this.opsRepository.create({
        channelId: channelId,
        userId: targetId
      });

      const response = `*<@${targetId}>* has been opped by Chanserv!`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to op *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }
  public async deop({ userId, targetId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const targetDto = await this.slackRepository.getUserInfo(targetId);
      const channel = new Channel(channelDto);

      this.checkPermissions(channel, userDto, targetDto);

      await this.opsRepository.delete({
        channelId: channelId,
        userId: targetId
      });

      const response = `*<@${targetId}>* has been deoped by Chanserv!`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to deop *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async whois({ userId, targetId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const targetDto = await this.slackRepository.getUserInfo(targetId);
      const channel = new Channel(channelDto);

      this.checkPermissions(channel, userDto, targetDto);

      const conversations = await this.slackRepository.webClient.users.conversations(
        {
          user: targetId
        }
      );

      const {
        user: userInfo
      } = await this.slackRepository.webClient.users.info({
        user: targetId
      });

      const {
        presence
      } = await this.slackRepository.webClient.users.getPresence({
        user: targetId
      });

      const opsRes = await this.opsRepository.find({
        userId: targetId
      });
      const bansRes = await this.bansRepository.find({
        userId: targetId
      });
      const channels = conversations.channels.map(c => `<#${c.id}>`).join(", ");
      const ops = opsRes.map(o => `<#${o.channelId}>`).join(", ");
      const bans = bansRes.map(b => `<#${b.channelId}>`).join(", ");

      const response = `WHOIS for * <@${targetId}> (${
        userInfo.profile.real_name_normalized
      })*:

      *Status:* ${presence} — ${userInfo.profile.status_emoji} — ${
        userInfo.profile.status_text
      }

      *Admin:* ${userInfo.is_admin ? "Yes" : "No"}
      *Owner:* ${userInfo.is_owner ? "Yes" : "No"}
      *Bot* ${userInfo.is_bot ? "Yes" : "No"}
      *Operator* ${ops ? `On ${ops}` : "No"}
      *Bans* ${bans ? `Banned on ${bans}` : "No"}
      *Channels* ${channels}
      *Avatar* ${userInfo.profile.image_192}`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to whois *<@${targetId}>*`;

      return {
        response,
        error: error.message
      };
    }
  }

  public async removeMessage({
    userId,
    targetChannelId,
    targetTimestamp,
    currentChannelId,
    currentTimestamp
  }) {
    try {
      const channelDto = await this.channelsRepository.findOne({
        channelId: targetChannelId
      });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const channel = new Channel(channelDto);

      this.checkPermissions(channel, userDto);

      // Delete the target message
      await this.slackRepository.webClient.chat.delete({
        channel: targetChannelId,
        ts: targetTimestamp
      });

      // Delete the !remove message
      await this.slackRepository.webClient.chat.delete({
        channel: currentChannelId,
        ts: currentTimestamp
      });

      const response = `Message (${targetTimestamp}) removed by Chanserv.`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to remove the message.`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async protectTopic({ channelId, userId, topic }) {
    try {
      const channelDTO = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const channel = new Channel(channelDTO);
      const userPermissions = channel.getPermissions(userDto);

      if (
        userPermissions.isAdmin ||
        userPermissions.isOp ||
        userPermissions.isChanserv
      ) {
        // Update channel topic
        channelDTO.topic = topic;
        await this.channelsRepository.update(channelDTO);
        return {
          response: undefined,
          error: false
        };
      }

      await this.slackRepository.botClient.channels.setTopic({
        channel: channelId,
        topic: channel.topic
      });

      throw new Error(
        `You are not an operator or an admin. You may not change the channel topic!`
      );
    } catch (error) {
      const response = `Sorry, but we were unable keep the topic.`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async protectPurpose({ channelId, userId, purpose }) {
    try {
      const channelDTO = await this.channelsRepository.findOne({ channelId });
      const userDto = await this.slackRepository.getUserInfo(userId);
      const channel = new Channel(channelDTO);
      const userPermissions = channel.getPermissions(userDto);

      if (
        userPermissions.isAdmin ||
        userPermissions.isOp ||
        userPermissions.isChanserv
      ) {
        // Update channel purpose
        channelDTO.purpose = purpose;
        await this.channelsRepository.update(channelDTO);
        return {
          response: undefined,
          error: false
        };
      }

      await this.slackRepository.botClient.channels.setPurpose({
        channel: channelId,
        purpose: channel.purpose
      });

      throw new Error(
        `You are not an operator or an admin. You may not change the channel purpose!`
      );
    } catch (error) {
      const response = `Sorry, but we were unable keep the purpose.`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async enforceBan({ userId, channelId }) {
    try {
      const userDto = await this.slackRepository.getUserInfo(userId);
      const channelDto = await this.channelsRepository.findOne({ channelId });
      const channel = new Channel(channelDto);
      const { isBanned } = channel.getPermissions(userDto);

      if (!isBanned) {
        return;
      }

      const banBto = await this.bansRepository.findOne({ channelId, userId });

      await this.slackRepository.webClient.channels.kick({
        channel: channelId,
        user: userId
      });

      const response = `Automatically removed <@${userId}>!
      *Banned*: ${banBto.reason}
      *Expires*: ${moment(banBto.expiresAt).calendar()}`;
      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to automatically remove <@${userId}>`;
      return {
        response,
        error: error.message
      };
    }
  }

  public async enforceRegistration({ userId, channelId }) {
    try {
      const channelDto = await this.channelsRepository.findOne({ channelId });

      if (channelDto || userId !== process.env.CHANSERV_USERID) {
        return;
      }

      await this.slackRepository.kick(
        userId,
        channelId,
        `Please register this channel with <#${process.env.SUPPORT_CHANNELID}>`
      );
      const response = `Automatically removed <@${userId}>! Please register this channel with <#${
        process.env.SUPPORT_CHANNELID
      }>`;

      return {
        response,
        error: false
      };
    } catch (error) {
      const response = `Sorry, but we were unable to enforce Chanserv registration.`;
      return {
        response,
        error: error.message
      };
    }
  }
}
