import debugFactory from "debug";
import colors from "colors";
import { injectable, inject } from "inversify";
import TYPES from "../Types";
import { IChannelDTO } from "../Models/Channel";

const debug = debugFactory("chanserv");

export interface IChannelsRepository {
  find(): Promise<Array<IChannelDTO>>;
  findOne(whereClause: object): Promise<IChannelDTO>;
  create(channelDTO: IChannelDTO): Promise<IChannelDTO>;
  update(channelDTO: IChannelDTO): Promise<IChannelDTO>;
}

@injectable()
export class ChannelsRepository implements IChannelsRepository {
  @inject(TYPES.DatabaseClient)
  private db: any;

  public async find(whereClause?: object): Promise<Array<IChannelDTO>> {
    return await this.db.find(whereClause);
  }

  public async findOne(whereClause: object): Promise<IChannelDTO> {
    try {
      const [channelDTO] = await this.db
        .select("*")
        .from("channels")
        .where(whereClause)
        .limit(1);

      if (!channelDTO) {
        return undefined;
      }

      const ops = await this.db
        .select("userId")
        .from("ops")
        .where({ channelId: channelDTO.channelId });

      const bans = await this.db
        .select("userId")
        .from("bans")
        .where({ channelId: channelDTO.channelId })
        .where("expiresAt", ">", "NOW()");

      const warnings = await this.db
        .select("userId")
        .from("warnings")
        .where({ channelId: channelDTO.channelId })
        .where("expiresAt", ">", "NOW()");

      channelDTO.ops = Array.from(new Set(ops.map(o => o.userId)));
      channelDTO.bans = Array.from(new Set(bans.map(o => o.userId)));
      channelDTO.warnings = Array.from(new Set(warnings.map(o => o.userId)));

      return channelDTO;
    } catch (error) {
      debug(
        colors.red(`ChannelsRepository::findOne — Error: ${error.message}`)
      );
      throw error;
    }
  }

  public async create(channelDTO: IChannelDTO): Promise<IChannelDTO> {
    try {
      return await this.db("channels")
        .insert({
          channelId: channelDTO.channelId,
          ownerId: channelDTO.ownerId,
          name: channelDTO.name,
          topic: channelDTO.topic,
          purpose: channelDTO.purpose
        })
        .returning("*");
    } catch (error) {
      debug(colors.red(`ChannelsRepository::create — Error: ${error.message}`));
      throw error;
    }
  }

  public async update(channelDTO: IChannelDTO): Promise<IChannelDTO> {
    try {
      return await this.db("channels")
        .where({ channelId: channelDTO.channelId })
        .update({
          name: channelDTO.name,
          topic: channelDTO.topic,
          purpose: channelDTO.purpose,
          channelId: channelDTO.channelId,
          ownerId: channelDTO.ownerId,
          updatedAt: this.db.fn.now()
        });
    } catch (error) {
      debug(colors.red(`ChannelsRepository::update — Error: ${error.message}`));
      throw error;
    }
  }
}
