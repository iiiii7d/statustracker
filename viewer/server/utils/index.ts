import { sql } from "kysely";
import type * as dt from "@internationalized/date";
import logger from "#server/utils/logger.ts";

export const currentTimestamp = sql<dt.ZonedDateTime>`date_trunc('minute', now())`;
export const previousTimestamp = sql<dt.ZonedDateTime>`date_trunc('minute', now() - INTERVAL '1 minute')`;

const cache = new Map<string, string | null>();

export async function nameToUUID(name: string): Promise<string | null> {
  const c = cache.get(name);
  if (c !== undefined) return c;

  const res = await fetch(
    `https://api.minecraftservices.com/minecraft/profile/lookup/name/${name}`,
  );
  if (res.status !== 200 && res.status !== 404)
    throw Error(
      `${config.dynmapLink} returned ${res.status}:\n${await res.text()}`,
    );
  const uuid = res.status === 404 ? null : (await res.json()).id;
  cache.set(name, uuid);
  logger.verbose(`Found that \`${name}\` has UUID \`${uuid}\``);
  return uuid;
}
