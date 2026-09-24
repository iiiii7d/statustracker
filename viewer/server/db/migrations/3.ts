import type { Migration } from "kysely/migration";
import type { Database } from "#server/db";
import type { Kysely } from "kysely";

export default {
  // eslint-disable-next-line max-statements
  async up(db: Kysely<Database>): Promise<void> {
    if (
      (await db.introspection.getTables()).filter(
        (table) => table.name === "version",
      ).length === 0
    ) {
      return;
    }

    logger.info("Backing up data from v3");
    await db.schema
      .createTable("counts_v3")
      .as(db.selectFrom("counts").selectAll())
      .execute();
    await db.schema
      .createTable("players_v3")
      .as(db.selectFrom("players").selectAll())
      .execute();
    await db.schema
      .createTable("webhooks_v3")
      // @ts-expect-error
      .as(db.selectFrom("webhooks").selectAll())
      .execute();
    await db.schema
      .createTable("version_v3")
      // @ts-expect-error
      .as(db.selectFrom("version").selectAll())
      .execute();

    await db.schema.dropTable("counts").execute();
    await db.schema.dropTable("players").execute();
    await db.schema.dropTable("webhooks").execute();
    await db.schema.dropTable("version").execute();
  },

  async down(db: Kysely<Database>): Promise<void> {
    await db.schema
      .createTable("counts")
      // @ts-expect-error
      .as(db.selectFrom("counts_v3").selectAll())
      .execute();
    await db.schema
      .createTable("players")
      // @ts-expect-error
      .as(db.selectFrom("players_v3").selectAll())
      .execute();
    await db.schema
      .createTable("webhooks")
      // @ts-expect-error
      .as(db.selectFrom("webhooks_v3").selectAll())
      .execute();
    await db.schema
      .createTable("version")
      // @ts-expect-error
      .as(db.selectFrom("version_v3").selectAll())
      .execute();

    await db.schema.dropTable("counts_v3").execute();
    await db.schema.dropTable("players_v3").execute();
    await db.schema.dropTable("webhooks_v3").execute();
    await db.schema.dropTable("version_v3").execute();
  },
} as Migration;
