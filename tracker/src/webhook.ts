import config, { type Config } from "shared/backend/config.ts";
import { getCountsChart } from "shared/backend/db/counts.ts";
import { getPercentOnlineChart } from "shared/backend/db/percentOnline.ts";
import type * as dt from "@internationalized/date";
import logger from "shared/logger.ts";
import { now } from "shared/index.ts";

interface Params {
  from: dt.ZonedDateTime;
  to: dt.ZonedDateTime;
  id: string;
  webhook: NonNullable<Config["webhooks"]>["schedules"][string];
}

// eslint-disable-next-line max-lines-per-function
async function formatMessage(input: string, params: Params): Promise<string> {
  let output = input
    .replaceAll(
      "%url%",
      JSON.stringify(
        `${config.webhooks!.serverUrl}?from=${params.from.toAbsoluteString()}&to=${params.to.toAbsoluteString()}`,
      ).slice(1, -1),
    )
    .replaceAll(
      "%countsChartUrl%",
      JSON.stringify(
        `${config.webhooks!.serverUrl}/chart/counts?from=${params.from.toAbsoluteString()}&to=${params.to.toAbsoluteString()}&movingAverages=${params.webhook.movingAverages.join(",")}&chartDimensions=${params.webhook.chartDimensions.join(",")}`,
      ),
    )
    .replaceAll(
      "%percentOnlineChartUrl%",
      JSON.stringify(
        `${config.webhooks!.serverUrl}/chart/percentOnline?from=${params.from.toAbsoluteString()}&to=${params.to.toAbsoluteString()}&movingAverages=${params.webhook.movingAverages.join(",")}&chartDimensions=${params.webhook.chartDimensions.join(",")}`,
      ),
    )
    .replaceAll("%id%", params.id)
    .replaceAll("%range%", JSON.stringify(params.webhook.range))
    .replaceAll(
      "%from%",
      Math.round(params.from.toDate().getTime() / 1000).toString(),
    )
    .replaceAll(
      "%to%",
      Math.round(params.to.toDate().getTime() / 1000).toString(),
    );

  // eslint-disable-next-line no-warning-comments
  // todo formatting of range

  if (output.includes("%countsChartBase64%")) {
    const countsChart = await getCountsChart(
      params.from,
      params.to,
      params.webhook.movingAverages,
      params.webhook.chartDimensions,
    );
    output = output.replaceAll(
      "%countsChartBase64%",
      countsChart.toString("base64"),
    );
  }
  if (output.includes("%percentOnlineChartBase64%")) {
    const percentOnlineChart = await getPercentOnlineChart(
      params.from,
      params.to,
      params.webhook.chartDimensions,
    );
    output = output.replaceAll(
      "%percentOnlineChartBase64%",
      percentOnlineChart.toString("base64"),
    );
  }

  return output;
}

// eslint-disable-next-line max-statements,max-lines-per-function
export default async function task(id: string) {
  const webhook = config.webhooks?.schedules[id];
  if (webhook === undefined) throw new Error(`no webhook \`${id}\``);

  logger.info(`Running webhook \`${id}\``);

  const from = now().subtract(webhook.range);
  const to = now();

  // eslint-disable-next-line init-declarations
  let request: RequestInit;
  // eslint-disable-next-line init-declarations
  let url: string;
  switch (webhook.type) {
    case "http": {
      // eslint-disable-next-line prefer-destructuring
      url = webhook.url;
      request = JSON.parse(
        await formatMessage(JSON.stringify(webhook.request), {
          from,
          to,
          id,
          webhook,
        }),
      );
      break;
    }
    case "discord": {
      const payloadJson = JSON.parse(
        await formatMessage(JSON.stringify(webhook.data), {
          from,
          to,
          id,
          webhook,
        }),
      );
      const formData = new FormData();
      formData.append("payload_json", payloadJson);
      if (webhook.sendCountsChart !== false) {
        const countsChart = Buffer.from(
          await getCountsChart(
            from,
            to,
            webhook.movingAverages,
            webhook.chartDimensions,
          ),
        );
        formData.append(webhook.sendCountsChart, new Blob([countsChart]));
      }
      if (webhook.sendPercentOnlineChart !== false) {
        const percentOnlineChart = Buffer.from(
          await getCountsChart(
            from,
            to,
            webhook.movingAverages,
            webhook.chartDimensions,
          ),
        );
        formData.append(
          webhook.sendPercentOnlineChart,
          new Blob([percentOnlineChart]),
        );
      }

      url = `${webhook.baseUrl}/${webhook.webhookId}/${webhook.webhookToken}`;
      request = {
        method: "POST",
        body: formData,
      };
      break;
    }
    default: {
      // @ts-expect-error
      throw new Error(`unknown webhook type ${webhook.type}`);
    }
  }

  const response = await fetch(url, request);
  if (response.ok) {
    logger.success(
      `Webhook run \`${id}\` successful (status code ${response.status})`,
    );
  } else {
    logger.error(
      `Webhook run \`${id}\` errored (status code ${response.status})`,
    );
  }
}
