import debugFactory from "debug";
import colors from "colors";
import { injectable, inject } from "inversify";
import TYPES from "../Types";
import { IOpDTO } from "../Models/Op";

const debug = debugFactory("chanserv");

export interface IOpsRepository {
  find(whereClause?: object): Promise<Array<IOpDTO>>;
  findOne(whereClause: object): Promise<IOpDTO>;
  create(opDTO: IOpDTO): Promise<IOpDTO>;
  update(whereClause: object, data: object): Promise<Array<IOpDTO>>;
  delete(whereClause: object): Promise<Array<IOpDTO>>;
}

@injectable()
export class OpsRepository implements IOpsRepository {
  @inject(TYPES.DatabaseClient) private db: any;

  public async find(whereClause?: object): Promise<Array<IOpDTO>> {
    return await this.db
      .select("*")
      .from("ops")
      .modify(q => {
        if (whereClause) {
          q.where(whereClause);
        }
      });
  }

  public async findOne(whereClause): Promise<IOpDTO> {
    try {
      const [opDTO] = await this.db
        .select("*")
        .from("ops")
        .where(whereClause)
        .limit(1);

      return opDTO;
    } catch (error) {
      debug(colors.red(`OpsRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async create(opDTO): Promise<IOpDTO> {
    try {
      return await this.db.insert(opDTO).into("ops");
    } catch (error) {
      debug(colors.red(`OpsRepository::find — Error: ${error.message}`));
      throw error;
    }
  }

  public async update(whereClause, data) {
    try {
      return await this.db("ops")
        .where(whereClause)
        .update(data)
        .returning("*");
    } catch (error) {
      debug(colors.red(`OpsRepository::update — Error: ${error.message}`));
      throw error;
    }
  }

  public async delete(whereClause) {
    if (!whereClause) {
      throw new Error("You cannot delete without a whereClause!");
    }
    try {
      return await this.db("ops")
        .where(whereClause)
        .delete();
    } catch (error) {
      debug(colors.red(`OpsRepository::update — Error: ${error.message}`));
      throw error;
    }
  }
}
