import type { Pool, QueryResult, QueryResultRow } from "pg";
import { pool } from "../db.js";
import { handleDatabaseError } from "../helpers/errorTranslator.js";

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/gi, (_, char: string) => char.toUpperCase());
}

function mapRowToCamelCase<R extends QueryResultRow>(row: QueryResultRow): R {
  const camelRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    camelRow[toCamelCase(key)] = value;
  }
  return camelRow as R;
}

export abstract class BaseRepository {
  // get the pool
  constructor(protected readonly db: Pool = pool) {}

  // abstract query function
  protected async query<R extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<R>> {
    // pass the query to the database query method and return the promised result
    try {
      const result = await this.db.query(text, values);
      return {
        ...result,
        rows: result.rows.map((row) => mapRowToCamelCase<R>(row)),
      };
    } catch (error) {
      // adding our custom error translator
      throw handleDatabaseError(error);
    }
  }
}
