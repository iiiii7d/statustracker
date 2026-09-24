import type { Migration } from "kysely/migration";
import type { Database } from "#server/db";
import { type Kysely, sql } from "kysely";

export default {
  // eslint-disable-next-line max-lines-per-function
  async up(db: Kysely<Database>): Promise<void> {
    logger.info("Runnning migrations for v4.0.0");

    await db.schema
      .createTable("counts")
      .ifNotExists()
      .addColumn("timestamp", "timestamptz", (col) =>
        col.defaultTo(currentTimestamp),
      )
      .addColumn("category", "varchar", (col) =>
        col.notNull().check(sql`LENGTH("category") > 0`),
      )
      .addColumn("value", "smallint", (col) =>
        col.notNull().check(sql`"value" >= 0`),
      )
      .addPrimaryKeyConstraint("counts_pkey", ["timestamp", "category"])
      .execute();

    await db.schema
      .createTable("players")
      .ifNotExists()
      .addColumn("uuid", "uuid", (col) => col.notNull())
      .addColumn("join", "timestamptz", (col) => col.notNull())
      .addColumn("leave", "timestamptz", (col) =>
        col.check(sql`leave IS NULL OR "join" <= leave`),
      )
      .addPrimaryKeyConstraint("players_pkey", ["uuid", "join"])
      .execute();

    if (
      (await db.introspection.getTables()).filter(
        (table) => table.name === "version_v3",
      ).length === 0
    ) {
      return;
    }
    logger.info("Importing data from v3");

    const v3Categories = (await db.introspection.getTables())
      .filter((table) => table.name === "counts_v3")[0]!
      .columns.map((c) => c.name)
      .filter((n) => n !== "timestamp");
    await Promise.all(
      v3Categories.map((cat) =>
        db
          .insertInto("counts")
          .columns(["timestamp", "category", "value"])
          .expression((eb) =>
            eb
              // @ts-expect-error
              .selectFrom("counts_v3")
              // @ts-expect-error
              .select("timestamp")
              .select(sql.lit(cat).as("category"))
              .select(
                sql.ref(cat === "all" ? "all" : `cat_${cat}`).as("value"),
              ),
          )
          .execute(),
      ),
    );

    await db
      .insertInto("players")
      .columns(["uuid", "join", "leave"])
      .expression((eb) =>
        eb
          // @ts-expect-error
          .selectFrom("players_v3")
          // @ts-expect-error
          .select(["uuid", "join", "leave"]),
      )
      .execute();
  },

  async down(db: Kysely<Database>): Promise<void> {
    await db.schema
      .createTable("counts_bak")
      .as(db.selectFrom("counts").selectAll())
      .execute();
    await db.schema
      .createTable("players_bak")
      .as(db.selectFrom("players").selectAll())
      .execute();
    await db.schema.dropTable("counts").ifExists().execute();
    await db.schema.dropTable("players").ifExists().execute();
  },
} as Migration;
