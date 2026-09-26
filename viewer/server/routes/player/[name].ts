import { z } from "zod/v4";
import { sql } from "kysely";
import * as dt from "@internationalized/date";
import db, { SQLZonedDateTime } from "shared/db/index.ts";
import { currentTimestamp, nameToUUID, now } from "shared/index.ts";
import { playerAPI, type PlayerAPIJson } from "shared/api.ts";
import logger from "shared/logger.ts";

const schema = z
  .object({
    from: z.iso
      .datetime({ local: false, offset: true })
      .transform((a) => dt.parseAbsoluteToLocal(a)),
    to: z.iso
      .datetime({ local: false, offset: true })
      .transform((a) => dt.parseAbsoluteToLocal(a))
      .default(now()),
  })
  .refine(
    ({ from: f, to: t }) =>
      !(f instanceof dt.ZonedDateTime) ||
      !(t instanceof dt.ZonedDateTime) ||
      f.compare(t) < 0,
    { error: "`to` is earlier than `from`" },
  );

// eslint-disable-next-line max-lines-per-function
export default defineEventHandler(async (event): Promise<PlayerAPIJson> => {
  logger.verbose(`Processing ${event.path}`);
  const player = getRouterParam(event, "name")!;

  const { from, to } = await getValidatedQuery(event, (body) =>
    schema.parse(body),
  );

  const uuid = await nameToUUID(player);
  if (uuid === null) {
    throw createError({
      statusCode: 404,
      message: `no UUID for ${player}`,
    });
  }

  const playTimesP = db
    .selectFrom("players")
    .select(["join", "leave"])
    .where((eb) =>
      eb.or([
        eb.between(
          "join",
          new SQLZonedDateTime(from),
          new SQLZonedDateTime(to),
        ),
        eb.between(
          "leave",
          new SQLZonedDateTime(from),
          new SQLZonedDateTime(to),
        ),
      ]),
    )
    .where("uuid", "=", uuid)
    .orderBy("join", "asc")
    .execute();

  const playDurationP = db
    .with("ft", (qc) =>
      qc
        .selectFrom("players")
        .select((eb) =>
          eb
            .case()
            .when("leave", "is", null)
            .then(currentTimestamp)
            .when("leave", ">", currentTimestamp)
            .then(currentTimestamp)
            .when("leave", ">", new SQLZonedDateTime(to))
            .then(new SQLZonedDateTime(to))
            .else(sql.ref("leave"))
            .end()
            .as("leave"),
        )
        .select((eb) =>
          eb
            .case()
            .when("join", "<", new SQLZonedDateTime(to))
            .then(new SQLZonedDateTime(to))
            .else(sql.ref("join"))
            .end()
            .as("join"),
        )
        .where("uuid", "=", uuid)
        .where((eb) =>
          eb.or([
            eb.between(
              "join",
              new SQLZonedDateTime(from),
              new SQLZonedDateTime(to),
            ),
            eb.between(
              "leave",
              new SQLZonedDateTime(from),
              new SQLZonedDateTime(to),
            ),
          ]),
        ),
    )
    .selectFrom("ft")
    .select(
      sql<number>`(EXTRACT(EPOCH FROM SUM(ft.leave - ft."join"))/60)::int`.as(
        "playDuration",
      ),
    )
    .executeTakeFirstOrThrow();
  const [playTimes, { playDuration }] = await Promise.all([
    playTimesP,
    playDurationP,
  ]);

  return playerAPI.ser({
    playTimes,
    playDuration,
  });
});
