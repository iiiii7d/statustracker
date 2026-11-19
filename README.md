# StatusTracker 4

![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/iiiii7d/statustracker?include_prereleases)
![GitHub License](https://img.shields.io/github/license/iiiii7d/statustracker)

Track players on a Minecraft server through their [Dynmap](https://www.spigotmc.org/resources/dynmap%C2%AE.274/)

## Usage

1. Set up a [Postgres](https://www.postgresql.org/) database somewhere
2. Set up `pnpm`
3. Clone this repository
4. Create `config.json` in the root folder (see below for configuration)
5. `pnpm run build`
6. Run the tracker: `node tracker/dist/tracker.js`
7. Run the web server ("viewer"): `node viewer/.output/server/index.mjs`

## Usage with Docker

1. Set up a [Postgres](https://www.postgresql.org/) database somewhere
2. `docker pull ghcr.io/iiiii7d/statustracker4:latest`
3. Create `config.json` (or any other name) in a convenient location (see below for configuration) and take note of its path
4. `docker run -dp <host_port>:3000 -v <host_config_path>:config.json ghcr.io/iiiii7d/statustracker4:latest` where
   - `<host_port>` is the port on the host StatusTracker will be hosted on
   - `<host_config_path>` is the path on the host where `config.json` is

## Usage with Docker Compose

```yaml
services:
  postgres:
    image: postgres:18
    networks:
      - statustracker
    # see https://hub.docker.com/_/postgres#-via-docker-compose for more information
  statustracker-tracker:
    image: ghcr.io/iiiii7d/statustracker:tracker-latest
    networks:
      - statustracker
    volumes:
      - "<host_config_path>:config.json"
  statustracker-viewer:
    image: ghcr.io/iiiii7d/statustracker:viewer-latest
    networks:
      - statustracker
    ports:
      - "<host_port>:3000"
    volumes:
      - "<host_config_path>:config.json"
```

## Configuration

Supports [JSON5](https://json5.org/).

```json5
{
  // URL of endpoint that returns player information
  // In the `Network` tab of any browser devtools, a request is sent to this URL
  // Timestamp is not necessary here
  "dynmapLink": "https://dynmap.example.com/.../xxx.json",

  // Configuration for the Postgres database. See below links for more info:
  // https://node-postgres.com/apis/pool
  // https://node-postgres.com/apis/client
  "db": {
    "database": "statustracker",
    "host": "localhost",
    "user": "user",
    "port": 5432,
  },

  // For tracking specific player ranks or groups of people, e.g. staff members
  // On the website, they will appear as a separate line
  // OPTIONAL
  "categories": {
    "staff": {
      "colour": "#f00", // must be either 3 or 6 digit hex code
      "players": [
        "uuid1", // uuid1 is part of this category at all times
        {
          "uuid": "uuid2", // uuid2 is only part of this category for a specified period
          "from": "2026-01-01T00:00:00Z", // OPTIONAL
          "to": "2027-01-01T00:00:00Z", // OPTIONAL
        },
      ],
    },
    // ...
  },

  // Sending a report of past activity on a schedule via Discord webhooks is supported
  // OPTIONAL
  "webhooks": {
    // The server unfortunately does not know its own address
    // thus we have to provide it
    "serverUrl": "https://statustracker.example.com",

    // A list of schedules, below are some examples
    "schedules": {
      // An arbitrary identifier
      "daily": {
        // See below for more info on supported cron formats:
        // https://www.nodecron.com/cron-syntax.html
        "cron": "0 0 * * *",

        // How far back to report
        // See below for more information on supported attributes:
        // https://react-aria.adobe.com/internationalized/date/CalendarDateTime#adding-and-subtracting-durations
        "range": { "days": 1 },

        // Dimensions of the charts sent in this webhook
        // OPTIONAL
        "chartDimensions": [1920, 1080],

        // No. hours of moving averages in the counts chart sent in this webhook
        // OPTIONAL
        "movingAverages": [0, 1],

        // ----- HTTP WEBHOOKS -----
        "type": "http",

        // URL to send the request to
        "url": "https://example.com",

        // See https://developer.mozilla.org/en-US/docs/Web/API/RequestInit for all attributes
         // By default, method is POST
         // Supported placeholders:
         //   %url%: URL to Statustracker with pre-filled from/to/moving average options
         //   %countsChartUrl%: URL to chart of counts with from/to/moving average options
         //   %percentOnlineChartUrl%: URL to chart of % of people online within the range with from/to/moving average options
         //   %id%: Identifier of this schedule (e.g. `daily`)
         //   %range%: Human readable range (e.g. `1 day`) (TODO stringified JSON for now)
         //   %from%: Earliest timestamp reported (unix timestamp)
         //   %to%: Latest timestamp reported, aka now (unix timestamp)
         //   %countsChartBase64%: base 64 of chart of counts
         //   %percentOnlineChartBase64%: base 64 of chart of % of people online within the range
        "request": {
          "data": {
            "message": "Daily activity from %from% to %to%",
            "countsChart": "%countsChartBase64%",
            "percentOnlineChart": "%percentOnlineChartBase64%",
          },
        },
      },
      "past 2.5h every 2h": {
        // see above
        "cron": "0 */2 * * *",
        "range": { "hours": 2, "minutes": 30 },

        // ----- DISCORD WEBHOOKS -----
        "type": "discord",

        // Discord webhooks are of the format https://discord.com/api/webhooks/<id>/<token>
        "baseUrl": "https://canary.discord.com/api/webhooks", // Change the base URL of the webhook. OPTIONAL
        "webhookId": "...",
        "webhookToken": "...",

        // Webhook JSON payload. Will be sent as a `multipart/form-data` request
        // See https://docs.discord.com/developers/resources/webhook#execute-webhook for more information
        "data": {
           "content": "# [Server activity](%url%) (%id%) for past %range%\n-# from <t:%from%:F>\n-# to <t:%to%:F>",
           "attachments": [
              {
                 "id": 0,
                 "filename": "countsChart.png",
              },
              {
                 "id": 1,
                 "filename": "percentOnlineChart.png",
            },
          ],
        },

        // The file name of the chart of counts, sent as `file[0]`
        // Either a string of the filename, false (won't be sent) or true (default name)
        // OPTIONAL (defaults to counts.png)
        "countsChart": "countsChart.png"

        // The file name of the chart of counts, sent as `file[1]` (or `file[0]` if `countsChart` is false)
        // Either a string of the filename, false (won't be sent) or true (default name)
        // OPTIONAL (defaults to counts.png)
        "percentOnlineChart": "percentOnlineChart.png"
      },
    },
  },

  // Approximate maximum number of data points returned by the `/counts` endpoint for display in the chart
  // Prevents response being too large
  // OPTIONAL
  "countsApproxMaxLength": 1000,

  // If Statustracker or the server goes down for a while and a few minutes were not captured, and there are players who were
  // online both before and after the downtime, above how many minutes of downtime will their play period be split in half and
  // below which will be considered as one continuous period?
  // OPTIONAL
  "serverPauseGracePeriodMinutes": 10,
}
```
