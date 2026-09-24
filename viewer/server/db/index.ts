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
import config from "#server/utils/config";
import logger from "#server/utils/logger";

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

pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, (val) =>
  dt.parseAbsoluteToLocal(val.replace(" ", "T")),
);
declare module "@internationalized/date" {
  interface ZonedDateTime extends Expression<ZonedDateTime> {
    get expressionType(): undefined;

    toOperationNode(): OperationNode;
  }
}
// @ts-ignore
dt.ZonedDateTime.prototype.expressionType = undefined;
// eslint-disable-next-line func-names
dt.ZonedDateTime.prototype.toOperationNode = function (this: dt.ZonedDateTime) {
  return sql<string>`${this.toAbsoluteString()}`.toOperationNode();
};

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: config.db,
  }),
});
let dbReady = false;

export async function getDB(): Promise<Kysely<Database>> {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!dbReady) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => {
      setTimeout(r, 0);
    });
  }
  return db;
}

(async () => {
  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations(): Promise<Record<string, Migration>> {
        return {
          "000000000": (await import("#server/db/migrations/3.ts")).default,
          "000000001": (await import("#server/db/migrations/4.0.0.ts")).default,
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

  logger.start("DB ready");
  dbReady = true;
})();
