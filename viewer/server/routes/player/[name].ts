import { z } from "zod/v4";
import { sql } from "kysely";
import * as dt from "@internationalized/date";
import { getDB } from "#server/db";
import now from "#shared/now.ts";
import { playerAPI, type PlayerAPIJson } from "#shared/api.ts";

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

// eslint-disable-next-line max-lines-per-function,max-statements
export default defineEventHandler(async (event): Promise<PlayerAPIJson> => {
  logger.verbose(`Processing ${event.path}`);
  const player = getRouterParam(event, "name")!;
  const db = await getDB();

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
      eb.or([eb.between("join", from, to), eb.between("leave", from, to)]),
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
            .when("leave", ">", to)
            .then(to)
            .else(sql.ref("leave"))
            .end()
            .as("leave"),
        )
        .select((eb) =>
          eb
            .case()
            .when("join", "<", from)
            .then(from)
            .else(sql.ref("join"))
            .end()
            .as("join"),
        )
        .where("uuid", "=", uuid)
        .where((eb) =>
          eb.or([eb.between("join", from, to), eb.between("leave", from, to)]),
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
