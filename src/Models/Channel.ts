export interface IChannelSchema {
  name: string;
  topic: string;
  purpose: string;
  channelId: string;
  ownerId: string;
  ops?: Array<string>;
  bans?: Array<any>;
  warnings?: Array<string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface IChannelDTO extends IChannelSchema {}

export class Channel implements IChannelSchema {
  public name: string;
  public topic: string;
  public purpose: string;
  public channelId: string;
  public ownerId: string;
  public createdAt: string;
  public updatedAt: string;
  public ops: Array<string> = [];
  public bans: Array<string> = [];
  public warnings: Array<string> = [];

  constructor(channelDto: IChannelDTO) {
    this.name = channelDto.name;
    this.topic = channelDto.topic;
    this.purpose = channelDto.purpose;
    this.channelId = channelDto.channelId;
    this.ops = channelDto.ops || [];
    this.bans = channelDto.bans || [];
    this.warnings = channelDto.warnings || [];
    this.ownerId = channelDto.ownerId;
    this.createdAt = channelDto.createdAt;
    this.updatedAt = channelDto.updatedAt;
  }

  getPermissions(user) {
    return {
      isOwner: user.id === this.ownerId,
      isOp: this.ops.includes(user.id),
      isAdmin: user.is_admin,
      isBanned: this.bans.includes(user.id),
      isWarned: this.warnings.includes(user.id),
      isChanserv: user.id === process.env.CHANSERV_USERID
    };
  }
}
