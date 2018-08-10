import colors from "colors";
import debugFactory from "debug";
import { injectable, inject } from "inversify";
import TYPES from "../Types";

const debug = debugFactory("chanserv");

// TODO: Implement a CachedSlackRepository

export interface ISlackRepository {
  kick(user: string, channelId: string, reason: string): Promise<boolean>;
  postMessage(channelId: string, text: string): Promise<boolean>;
  postEphemeral(
    userId: string,
    channelId: string,
    text: string
  ): Promise<boolean>;
  getUserInfo(userId: string): Promise<any>;
  botClient: any;
  webClient: any;
}

@injectable()
export class SlackRepository implements ISlackRepository {
  @inject(TYPES.SlackBotClient) public botClient: any;
  @inject(TYPES.SlackWebClient) public webClient: any;

  async kick(user, channelId, reason) {
    debug(
      `${colors.white(
        `SlackRepository::kick — Attempting to kick user ${colors.underline(
          user
        )} from channel ${colors.underline(
          channelId
        )}. Reason: "${colors.underline(reason)}"`
      )}`
    );
    try {
      await this.webClient.channels.kick({
        channel: channelId,
        user
      });
      return true;
    } catch (error) {
      debug(
        colors.red(
          `SlackRepository::kick — Error: ${error.message} (${
            error.data.error
          })`
        )
      );
      throw new Error(`SlackRepository::kick — Error: ${error.message}.`);
    }
  }

  async postMessage(channelId: string, text) {
    try {
      await this.botClient.chat.postMessage({
        channel: channelId,
        text
      });
      return true;
    } catch (error) {
      debug(
        colors.red(
          `SlackRepository::postMessage — Error: ${error.message} (${
            error.data.error
          })`
        )
      );
      throw new Error(
        `SlackRepository::postMessage — Error: ${error.message}.`
      );
    }
  }

  async postEphemeral(userId: string, channelId: string, text) {
    try {
      await this.botClient.chat.postEphemeral({
        user: userId,
        channel: channelId,
        text
      });
      return true;
    } catch (error) {
      debug(
        colors.red(
          `SlackRepository::postMessage — Error: ${error.message} (${
            error.data.error
          })`
        )
      );
      throw new Error(
        `SlackRepository::postMessage — Error: ${error.message}.`
      );
    }
  }

  async getUserInfo(userId: string) {
    try {
      const { user } = await this.webClient.users.info({
        user: userId
      });
      return user;
    } catch (error) {
      debug(
        colors.red(
          `SlackRepository::getUserInfo — Error: ${error.message} (${
            error.data.error
          })`
        )
      );
      throw new Error(
        `SlackRepository::getUserInfo — Error: ${error.message}.`
      );
    }
  }
}
