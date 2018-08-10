import moment from "moment";

export interface IWarningSchema {
  id?: string;
  channelId: string;
  userId: string;
  reason: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IWarningDTO extends IWarningSchema {}

export class Warning implements IWarningSchema {
  public id: string;
  public channelId: string;
  public userId: string;
  public reason: string;
  public expiresAt: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(banDto: IWarningDTO) {
    this.id = banDto.id;
    this.channelId = banDto.channelId;
    this.userId = banDto.userId;
    this.reason = banDto.reason;
    this.expiresAt = banDto.expiresAt;
    this.createdAt = banDto.createdAt;
    this.updatedAt = banDto.updatedAt;
  }

  isExpired() {
    return moment(this.expiresAt).isBefore();
  }
}
