import { z } from "zod/v4";
import { Pool, type PoolConfig } from "pg";
import * as dt from "@internationalized/date";
import * as fs from "node:fs";
import logger from "../logger.ts";
import type { CategoriesAPI } from "../api.ts";
import { now } from "../index.ts";
import JSON5 from "json5";

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
  url: z.url(),
  request: z
    .custom<RequestInit>()
    .transform((req) => ({ ...req, method: req.method ?? "POST" })),
  ...webhookScheduleCommon,
});
const webhookScheduleDiscord = z.object({
  type: z.literal("discord"),
  baseUrl: z.url().default("https://discord.com/api/webhooks"),
  webhookId: z.string(),
  webhookToken: z.string(),
  data: z.custom().default({
    content:
      "# [Server activity](%url%) (%id%) for past %range%\n-# from <t:%from%:F>\n-# to <t:%to%:F>",
    attachments: [
      {
        id: 0,
        filename: "counts.png",
      },
      {
        id: 1,
        filename: "percentOnline.png",
      },
    ],
  }),
  countsChart: z
    .union([z.boolean(), z.string().nonempty()])
    .default(true)
    .transform((a) => (a === true ? "counts.png" : a)),
  percentOnlineChart: z
    .union([z.boolean(), z.string().nonempty()])
    .default(true)
    .transform((a) => (a === true ? "percentOnline.png" : a)),
  ...webhookScheduleCommon,
});

const webhookConfigSchema = z.object({
  serverUrl: z.url(),
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

const categorySchema = z.object({
  players: z
    .union([
      z.object({
        uuid: z.uuid(),
        from: z
          .string()
          .transform((a) => dt.parseAbsoluteToLocal(a))
          .optional(),
        to: z
          .string()
          .transform((a) => dt.parseAbsoluteToLocal(a))
          .optional(),
      }),
      z.uuid(),
    ])
    .array(),
  colour: z.string().regex(/^#(?:[0-9a-f]{3}){1,2}$/u),
});

const configSchema = z.object({
  dynmapLink: z.url(),
  db: z.custom<PoolConfig>().transform((a) => new Pool(a)),
  categories: z.record(z.string(), categorySchema).default({}),
  webhooks: webhookConfigSchema.optional(),
  countsApproxMaxLength: z.int().gte(1).default(1000),
  serverPauseGracePeriodMinutes: z.int().gte(1).default(19),
});

export type RawConfig = z.infer<typeof configSchema>;
export type Config = RawConfig & {
  categoriesAsOf: (timestamp: dt.ZonedDateTime) => CategoriesAPI;
  currentCategories: () => CategoriesAPI;
};

// eslint-disable-next-line consistent-return
export function getConfig(): RawConfig {
  if (process.env.CONFIG) {
    logger.start("Using config found in `CONFIG`");
    return configSchema.parse(JSON5.parse(process.env.CONFIG));
  }

  const configPath = process.env.CONFIG_PATH ?? "config.json";
  if (fs.existsSync(configPath)) {
    logger.start(`Using config found in \`${configPath}\``);
    return configSchema.parse(
      JSON5.parse(fs.readFileSync(configPath).toString()),
    );
  }

  logger.fatal(`Could not find config at ${configPath}`);
  process.exit(1);
}

export function addDerivedAttrs(config: RawConfig): Config {
  return {
    ...config,
    categoriesAsOf(timestamp: dt.ZonedDateTime): CategoriesAPI {
      return Object.fromEntries(
        Object.entries(config.categories).map(([id, { players, colour }]) => {
          const uuids = players
            .filter((player) => {
              if (typeof player === "string") return true;
              return (
                (player.from === undefined ||
                  player.from.compare(timestamp) <= 0) &&
                (player.to === undefined || player.to.compare(timestamp) >= 0)
              );
            })
            .map((player) =>
              typeof player === "string" ? player : player.uuid,
            );
          return [id, { uuids, colour }];
        }),
      );
    },
    currentCategories(): CategoriesAPI {
      return this.categoriesAsOf(now());
    },
  };
}

export default addDerivedAttrs(getConfig());
