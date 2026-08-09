import { z } from "zod/v4";
import { WebhookClient, type WebhookClientData } from "discord.js";
import { Pool, type PoolConfig } from "pg";
import type * as dt from "@internationalized/date";
import * as fs from "node:fs";
import logger from "#server/utils/logger";

const webhookScheduleCommon = {
  cron: z.string(),
  range: z.custom<dt.DateTimeDuration>(),
  chartDimensions: z
    .tuple([z.number().gt(0), z.number().gt(0)])
    .default([1920, 1080]),
  movingAverages: z
    .number()
    .gte(0)
    .array()
    .refine((arr) => arr.length === new Set(arr).size)
    .default([0, 1]),
};
const webhookScheduleHTTP = z.object({
  type: z.literal("http"),
  url: z.httpUrl(),
  method: z.string().default("POST"),
  data: z.looseObject({}).optional(),
  ...webhookScheduleCommon,
});

const webhookScheduleDiscord = z.object({
  type: z.literal("discord"),
  client: z.custom<WebhookClientData>().transform((a) => new WebhookClient(a)),
  message: z
    .string()
    .default(
      "[Server activity](%url%) (%id%) for past %range%\n-# from <t:%from%:F>\n-# to <t:%to%:F>",
    ),
  ...webhookScheduleCommon,
});

const webhookConfigSchema = z.object({
  serverUrl: z.string(),
  schedules: z
    .record(
      z.string(),
      z.discriminatedUnion("type", [
        webhookScheduleHTTP,
        webhookScheduleDiscord,
      ]),
    )
    .refine((a) => Object.keys(a).length >= 1),
});

const configSchema = z.object({
  dynmapLink: z.url(),
  db: z.custom<PoolConfig>().transform((a) => new Pool(a)),
  categories: z
    .record(
      z.string(),
      z.object({
        uuids: z
          .string()
          .regex(/^[0-9a-fA-F]{32}$/u)
          .array(),
        colour: z.string().regex(/^#(?:[0-9a-f]{3}){1,2}$/u),
      }),
    )
    .default({}),
  webhooks: webhookConfigSchema.optional(),
  deleteOldCategories: z.boolean().default(false),
  countsApproxMaxLength: z.int().gte(1).default(1000),
});

export type Config = z.infer<typeof configSchema>;

// eslint-disable-next-line consistent-return
export function getConfig(): Config {
  if (process.env.CONFIG) {
    logger.start("Using config found in `CONFIG`");
    return configSchema.parse(JSON.parse(process.env.CONFIG));
  }

  const configPath =
    process.env.CONFIG_PATH ??
    (process.env.DOCKER ? "../config.json" : "config.json");
  if (fs.existsSync(configPath)) {
    logger.start(`Using config found in \`${configPath}\``);
    return configSchema.parse(
      JSON.parse(fs.readFileSync(configPath).toString()),
    );
  }

  logger.fatal(`Could not find config at ${configPath}`);
  process.exit(1);
}
export default getConfig();
