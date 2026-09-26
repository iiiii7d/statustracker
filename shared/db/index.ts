import {
  type Expression,
  type OperationNode,
  type Generated,
  Kysely,
  PostgresDialect,
  sql,
} from "kysely";
import { type Migration, Migrator } from "kysely/migration";
import { types as pgTypes } from "pg";
import * as dt from "@internationalized/date";
import config from "../config.ts";
import logger from "../logger.ts";

export interface CountTable {
  timestamp: Generated<dt.ZonedDateTime>;
  category: "all" | string;
  value: number;
}

export interface PlayerTable {
  uuid: string;
  join: dt.ZonedDateTime;
  leave: dt.ZonedDateTime | null;
}

export interface Database {
  counts: CountTable;
  players: PlayerTable;
}

export class SQLZonedDateTime implements Expression<dt.ZonedDateTime> {
  private readonly value: dt.ZonedDateTime;
  constructor(value: dt.ZonedDateTime) {
    this.value = value;
  }

  get expressionType(): dt.ZonedDateTime | undefined {
    return this.value;
  }

  toOperationNode(): OperationNode {
    return sql<string>`${this.value.toAbsoluteString()}`.toOperationNode();
  }
}

export function getDB(): Kysely<Database> {
  pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, (val) =>
    dt.parseAbsoluteToLocal(val.replace(" ", "T")),
  );

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: config.db,
    }),
  });
}

const db = getDB();
export default db;

export async function migrateDB() {
  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations(): Promise<Record<string, Migration>> {
        return {
          "000000000": (await import("./migrations/3.ts")).default,
          "000000001": (await import("./migrations/4.0.0.ts")).default,
        };
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      logger.success(`Migration "${it.migrationName}" sucessful`);
    } else if (it.status === "Error") {
      logger.error(`Migration "${it.migrationName} failed"`);
    }
  });

  if (error) {
    logger.fatal("Failed to migrate", error);
    process.exit(1);
  }

  logger.start("DB migrated");
}
