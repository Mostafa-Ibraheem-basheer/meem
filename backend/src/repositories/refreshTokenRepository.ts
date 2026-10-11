import type { Pool } from "pg";
import type { IRefreshTokenRepository } from "../interfaces.js";
import type {
  RefreshToken,
  RefreshTokenCreationInput,
  RefreshTokenUpdateInput,
} from "../types.js";
import { BaseRepository } from "./baseRepository.js";

export class RefreshTokenRepository
  extends BaseRepository
  implements IRefreshTokenRepository
{
  constructor(db: Pool) {
    super(db);
  }

  async findOne(id: string): Promise<RefreshToken | null> {
    const result = await this.query<RefreshToken>(
      `SELECT * FROM refresh_tokens WHERE id=$1`,
      [id],
    );
    return result.rows[0] ?? null;
  }
  async create(data: RefreshTokenCreationInput): Promise<RefreshToken> {
    const result = await this.query<RefreshToken>(
      `
        INSERT INTO refresh_tokens (id, user_id, token_hash) 
        VALUES ($1, $2, $3)
        RETURNING *
        `,
      [data.id, data.userId, data.tokenHash],
    );
    const token = result.rows[0];

    if (!token) {
      throw Error("An Unexpected Error Occured");
    }

    return token;
  }
  async update(
    id: string,
    data: RefreshTokenUpdateInput,
  ): Promise<RefreshToken> {
    const result = await this.query<RefreshToken>(
      `
        UPDATE refresh_tokens 
        SET token_hash = $1
        WHERE id = $2
        RETURNING *
        `,
      [data.tokenHash, id],
    );
    const token = result.rows[0];
    if (!token) {
      throw Error("An Unexpected Error Occured");
    }
    return token;
  }
  async delete(id: string): Promise<boolean> {
    const result = await this.query<RefreshToken>(
      `
        DELETE FROM refresh_tokens WHERE id = $1
      `,
      [id],
    );

    return result.rowCount === 1;
  }
  async purgeTokens(userId: string): Promise<boolean> {
    const result = await this.query<RefreshToken>(
      `
        DELETE FROM refresh_tokens WHERE user_id = $1
      `,
      [userId],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
