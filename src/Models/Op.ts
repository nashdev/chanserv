export interface IOpSchema {
  id?: string;
  channelId: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOpDTO extends IOpSchema {}

export class Op implements IOpSchema {
  public id: string;
  public channelId: string;
  public userId: string;
  public createdAt: string;
  public updatedAt: string;

  constructor(opDto: IOpDTO) {
    this.id = opDto.id;
    this.channelId = opDto.channelId;
    this.userId = opDto.userId;
    this.createdAt = opDto.createdAt;
    this.updatedAt = opDto.updatedAt;
  }
}
