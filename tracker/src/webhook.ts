import { now } from "shared/index.ts";
import config, { type Config } from "shared/config.ts";
import { getMainChart } from "shared/db/chart/main.ts";
import { getPercentOnlineChart } from "shared/db/chart/percentOnline.ts";
import type * as dt from "@internationalized/date";
import logger from "shared/logger.ts";

export function formatMessage(
  input: string,
  params: {
    from: dt.ZonedDateTime;
    to: dt.ZonedDateTime;
    id: string;
    webhook: NonNullable<Config["webhooks"]>["schedules"][string];
  },
): string {
  return input
    .replaceAll(
      "%url%",
      `${config.webhooks!.serverUrl}?from=${params.from.toAbsoluteString()}&to=${params.to.toAbsoluteString()}`,
    )
    .replaceAll("%id%", params.id)
    .replaceAll("%range%", `${params.webhook.range}`)
    .replaceAll(
      "%from%",
      Math.round(params.from.toDate().getTime() / 1000).toString(),
    )
    .replaceAll(
      "%to%",
      Math.round(params.to.toDate().getTime() / 1000).toString(),
    );
}

// eslint-disable-next-line max-lines-per-function
export default async function task(id: string) {
  const webhook = config.webhooks?.schedules[id];
  if (webhook === undefined) throw new Error(`no webhook \`${id}\``);

  logger.info(`Running webhook \`${id}\``);
  const from = now().subtract(webhook.range);
  const to = now();
  const mainChart = await getMainChart(
    from,
    to,
    webhook.movingAverages,
    webhook.chartDimensions,
  );
  const percentOnlineChart = await getPercentOnlineChart(
    from,
    to,
    webhook.chartDimensions,
  );

  // eslint-disable-next-line no-console
  console.log(mainChart, percentOnlineChart);

  switch (webhook.type) {
    // case "discord": {
    //   const mainChartAttachment = new AttachmentBuilder(mainChart);
    //   const percentOnlineAttachment = new AttachmentBuilder(percentOnlineChart);
    //
    //   await webhook.client.send({
    //     content: webhook.message
    //       .replaceAll(
    //         "%url%",
    //         `${config.webhooks!.serverUrl}?from=${from.toAbsoluteString()}&to=${to.toAbsoluteString()}`,
    //       )
    //       .replaceAll("%id%", id)
    //       .replaceAll("%range%", `${webhook.range}`)
    //       .replaceAll(
    //         "%from%",
    //         Math.round(from.toDate().getTime() / 1000).toString(),
    //       )
    //       .replaceAll(
    //         "%to%",
    //         Math.round(to.toDate().getTime() / 1000).toString(),
    //       ),
    //     files: [mainChartAttachment, percentOnlineAttachment],
    //   });
    //   break;
    // }
    case "http":
      // eslint-disable-next-line no-warning-comments
      // todo
      break;
    default:
  }
  logger.success(`Webhook run \`${id}\` successful`);
}
