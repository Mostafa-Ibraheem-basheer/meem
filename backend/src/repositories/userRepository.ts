import type { Pool } from "pg";
import { NotFoundError } from "../helpers/errors.js";
import type { IUserRepository } from "../interfaces.js";
import type { User, UserCreationInput, UserUpdateInput } from "../types.js";
import { BaseRepository } from "./baseRepository.js";

const columnMap = {
  name: "name",
  email: "email",
  profilePicture: "profile_picture",
  role: "role",
  password: "password_hash",
} as const satisfies Record<keyof UserCreationInput, string>;

export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(db: Pool) {
    super(db);
  }

  async findOne(id: string): Promise<User | null> {
    const result = await this.query<User>(`SELECT * FROM users WHERE id=$1`, [
      id,
    ]);
    return result.rows[0] ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query<User>(
      `SELECT * FROM users WHERE email=$1`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async create(data: UserCreationInput): Promise<User> {
    // names of properties of the data
    const columns: string[] = [];
    // the $1, $2, $3 that the query method uses to fill columns
    const placeholders: string[] = [];
    // actual values from the data object to be used in the second argument
    const values: unknown[] = [];

    // iterate the whitelist (columnMap), not the input, so unknown keys are ignored
    for (const key of Object.keys(columnMap) as (keyof UserCreationInput)[]) {
      const value = data[key];
      // skip undefined so the DB default applies instead of sending NULL
      if (value === undefined) continue;
      // 1. add the column name through the map (since db uses snake not camel)
      columns.push(columnMap[key]);
      // 2. add the value to the array
      values.push(value);
      // 3. add a $N to the placeholders (values.length is already updated)
      placeholders.push(`$${values.length}`);
    }

    // NOTE: column names only ever come from columnMap, never from user input,
    // and values are injected as PLACEHOLDERS, not inlined, so there is no SQL injection risk
    const result = await this.query<User>(
      `
    INSERT INTO users (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING *
  `,
      values,
    );

    const user = result.rows[0];
    if (!user) {
      throw Error("An Unexpected Error Occured");
    }

    return user;
  }

  async update(id: string, data: UserUpdateInput): Promise<User> {
    const setters: string[] = [];
    const values: unknown[] = [];
    for (const key of Object.keys(columnMap) as (keyof UserUpdateInput)[]) {
      const value = data[key];
      if (value === undefined) continue;
      values.push(value);
      setters.push(`${columnMap[key]} = $${values.length}`);
    }

    if (setters.length === 0) {
      const user = await this.findOne(id);
      if (!user) {
        throw new NotFoundError("user");
      }
      return user;
    }

    const result = await this.query<User>(
      `
      UPDATE users
      SET ${setters.join(", ")}
      WHERE id = $${values.length + 1}
      RETURNING *
    `,
      [...values, id],
    );

    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError("user");
    }

    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM users WHERE id = $1`, [id]);

    return result.rowCount === 1;
  }
}
