import db, { type Database, SQLZonedDateTime } from "shared/db/index.ts";
import { sql, type Transaction } from "kysely";
import logger from "shared/logger.ts";
import config from "shared/config.ts";
import {
  nameToUUID,
  currentTimestamp,
  previousTimestamp,
} from "shared/index.ts";

async function currentPlayerList(): Promise<string[]> {
  logger.info(`Retrieving current player list from ${config.dynmapLink}`);

  const res = await fetch(config.dynmapLink);
  if (res.status !== 200)
    throw Error(
      `${config.dynmapLink} returned ${res.status}:\n${await res.text()}`,
    );
  const json = (await res.json()) as {
    players: { account: string }[];
  };
  const playerNames = json.players.map((a) => a.account);
  const playerUuids = (
    await Promise.all(playerNames.map((a) => nameToUUID(a)))
  ).filter((a) => a !== null);
  logger.success("Retrieval of current player list successful");
  return playerUuids;
}

async function updateCounts(trx: Transaction<Database>, playerList: string[]) {
  logger.info("Updating `counts` table");
  await trx
    .insertInto("counts")
    .values({
      timestamp: currentTimestamp,
      category: "all",
      value: playerList.length,
    })
    .execute();
  if (Object.keys(config.categories).length === 0) {
    return;
  }
  await trx
    .insertInto("counts")
    .values(
      Object.entries(config.categories).map(([cat, { uuids }]) => ({
        timestamp: currentTimestamp,
        category: cat,
        value: playerList.filter((a) => uuids.includes(a)).length,
      })),
    )
    .execute();
}

async function updatePlayersJoin(
  trx: Transaction<Database>,
  playerList: string[],
) {
  logger.info("Updating `players` table for joined players");
  await Promise.all(
    playerList.map(async (player) => {
      const existing = await trx
        .selectFrom("players")
        .where("uuid", "=", player)
        .where("leave", "is", null)
        .executeTakeFirst();
      if (existing === undefined) {
        await trx
          .insertInto("players")
          .values({
            uuid: player,
            join: currentTimestamp,
            leave: null,
          })
          .execute();
      }
    }),
  );
}

async function updatePlayersLeave(
  trx: Transaction<Database>,
  playerList: string[],
) {
  logger.info("Updating `players` table for left players");
  let cmd = trx
    .updateTable("players")
    .set({ leave: currentTimestamp })
    .where("leave", "is", null);
  if (playerList.length) cmd = cmd.where("uuid", "not in", playerList);

  await cmd.execute();
}

async function closePlayerEntriesIfPaused(trx: Transaction<Database>) {
  if (
    (await trx
      .selectFrom("counts")
      .where("timestamp", "=", previousTimestamp)
      .executeTakeFirst()) !== undefined
  )
    return;

  logger.info("Server was paused. Completing last player entries");
  const lastTimestamp = (
    await trx
      .selectFrom("counts")
      .select("timestamp")
      .orderBy("timestamp", "desc")
      .where("timestamp", "!=", currentTimestamp)
      .executeTakeFirst()
  )?.timestamp;

  if (lastTimestamp === undefined) return;

  await trx
    .updateTable("players")
    .where("leave", "is", null)
    .set({
      leave: sql`${new SQLZonedDateTime(lastTimestamp)}::timestamptz + INTERVAL '1 min'`,
    })
    .execute();
}

export default async function task() {
  const playerList = await currentPlayerList();

  await db.transaction().execute(async (trx) => {
    await updateCounts(trx, playerList);

    await closePlayerEntriesIfPaused(trx);

    await updatePlayersJoin(trx, playerList);
    await updatePlayersLeave(trx, playerList);
  });
}
