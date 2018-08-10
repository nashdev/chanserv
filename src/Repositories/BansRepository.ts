import debugFactory from "debug";
import colors from "colors";
import { injectable, inject } from "inversify";
import TYPES from "../Types";
import { IBanDTO } from "../Models/Ban";

const debug = debugFactory("chanserv");

export interface IBansRepository {
  find(whereClause?: object): Promise<Array<IBanDTO>>;
  findOne(whereClause: object): Promise<IBanDTO>;
  create(banDTO: IBanDTO): Promise<IBanDTO>;
  update(whereClause: object, data: object): Promise<Array<IBanDTO>>;
}

@injectable()
export class BansRepository implements IBansRepository {
  @inject(TYPES.DatabaseClient) private db: any;

  public async find(whereClause?: object): Promise<Array<IBanDTO>> {
    return await this.db
      .select("*")
      .from("bans")
      .where("expiresAt", ">", "NOW()")
      .modify(q => {
        if (whereClause) {
          q.where(whereClause);
        }
      });
  }

  public async findOne(whereClause): Promise<IBanDTO> {
    try {
      const [banDTO] = await this.db
        .select("*")
        .from("bans")
        .where(whereClause)
        .where("expiresAt", ">", "NOW()")
        .orderBy("updatedAt", "desc")
        .limit(1);

      return banDTO;
    } catch (error) {
      debug(colors.red(`BansRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async create(banDTO): Promise<IBanDTO> {
    try {
      return await this.db.insert(banDTO).into("bans");
    } catch (error) {
      debug(colors.red(`BansRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async update(whereClause, data) {
    try {
      return await this.db("bans")
        .where(whereClause)
        .update(data)
        .returning("*");
    } catch (error) {
      debug(colors.red(`BansRepository::update — Error: ${error.message}`));
      throw error;
    }
  }
}
