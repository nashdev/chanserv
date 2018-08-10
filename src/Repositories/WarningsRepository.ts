import debugFactory from "debug";
import colors from "colors";
import { injectable, inject } from "inversify";
import TYPES from "../Types";
import { IWarningDTO } from "../Models/Warning";

const debug = debugFactory("chanserv");

export interface IWarningsRepository {
  find(whereClause?: object): Promise<Array<IWarningDTO>>;
  findOne(whereClause: object): Promise<IWarningDTO>;
  create(warningDTO: IWarningDTO): Promise<IWarningDTO>;
  update(whereClause: object, data: object): Promise<Array<IWarningDTO>>;
}

@injectable()
export class WarningsRepository implements WarningsRepository {
  @inject(TYPES.DatabaseClient) private db: any;

  public async find(whereClause?: object): Promise<Array<IWarningDTO>> {
    return await this.db
      .select("*")
      .from("warnings")
      .where("expiresAt", ">", "NOW()")
      .modify(q => {
        if (whereClause) {
          q.where(whereClause);
        }
      });
  }

  public async findOne(whereClause): Promise<IWarningDTO> {
    try {
      const [warningDTO] = await this.db
        .select("*")
        .from("warnings")
        .where(whereClause)
        .where("expiresAt", ">", "NOW()")
        .limit(1);

      return warningDTO;
    } catch (error) {
      debug(colors.red(`WarningsRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async create(warningDTO): Promise<IWarningDTO> {
    try {
      return await this.db.insert(warningDTO).into("warnings");
    } catch (error) {
      debug(colors.red(`WarningsRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async update(whereClause, data) {
    try {
      return await this.db("warnings")
        .where(whereClause)
        .update(data)
        .returning("*");
    } catch (error) {
      debug(colors.red(`WarningsRepository::update — Error: ${error.message}`));
      throw error;
    }
  }
}
