# StatusTracker 4

![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/iiiii7d/statustracker?include_prereleases)
![GitHub License](https://img.shields.io/github/license/iiiii7d/statustracker)

Track players on a Minecraft server through their [Dynmap](https://www.spigotmc.org/resources/dynmap%C2%AE.274/)

## Usage

1. Set up a [Postgres](https://www.postgresql.org/) database somewhere
2. Clone this repository
3. Create `config.json` in the root folder (see below for configuration)
4. `corepack enable` or install `pnpm` on your machine
5. `pnpm run build`
6. `node .output/server/index.mjs`

## Usage with Docker

1. Set up a [Postgres](https://www.postgresql.org/) database somewhere
2. `docker pull ghcr.io/iiiii7d/statustracker4:latest`
3. Create `config.json` (or any other name) in a convenient location (see below for configuration) and take note of its path
4. `docker run -dp <host_port>:3000 -v <host_config_path>:config.json ghcr.io/iiiii7d/statustracker4:latest` where
   - `<host_port>` is the port on the host StatusTracker will be hosted on
   - `<host_config_path>` is the path on the host where `config.json` is

### Compose

```yaml
services:
  statustracker4:
    image: ghcr.io/iiiii7d/statustracker4:latest
    ports:
      - "<host_port>:3000"
    volumes:
      - "<host_config_path>:config.json"
```

## Configuration

```jsonc
{
  // URL of endpoint that returns player information
  // In the `Network` tab of any browser devtools, a request is sent to this URL
  // Timestamp is not necessary here
  "dynmapLink": "https://dynmap.example.com/.../",

  // Configuration for the Postgres database. See below links for more info:
  // https://node-postgres.com/apis/pool
  // https://node-postgres.com/apis/client
  "db": {
    "database": "statustracker4",
    "host": "localhost",
    "user": "user",
    "port": 5432,
  },

  // For tracking specific player ranks or groups of people, e.g. staff members
  // On the website, they will appear as a separate line
  // OPTIONAL
  "categories": {
    "staff": {
      "uuids": ["uuid1", "uuid2"],
      "colour": "#f00", // must be either 3 or 6 digit hex code
    },
    // ...
  },

  // Sending a report of past activity on a schedule via Discord webhooks is supported
  // OPTIONAL
  "webhooks": {
    // ID and token, or URL of the webhook. See below for more info:
    // https://discordjs.guide/popular-topics/webhooks.html#creating-webhooks-through-server-settings
    "client": { "url": "https://discord.com/api/webhooks/id/token" },
    // OR ALTERNATIVELY { "id": "id", "token": "token" }

    // The server unfortunately does not know its own address
    // thus we have to provide it
    "serverUrl": "https://statustracker.example.com",

    // A list of schedules, below are some examples
    "schedules": {
      // An arbitrary identifier
      "daily": {
        // See below for more info on supported cron formats:
        // https://github.com/harrisiirak/cron-parser?tab=readme-ov-file#cron-format
        "cron": "0 0 * * *",

        // How far back to report
        // See below for more information on supported keys:
        // https://date-fns.org/v4.1.0/docs/formatDuration#types/Duration/2523
        "range": { "days": 1 },

        // Message to override the default one
        // Supported placeholders:
        //   %url%: URL to exact chart shown in the image in the webhook
        //   %id%: Identifier of this schedule (e.g. `daily`)
        //   %range%: Human readable range (e.g. `1 day`)
        //   %from%: Earliest timestamp reported (unix timestamp)
        //   %to%: Latest timestamp reported, aka now(unix timestamp)
        // OPTIONAL
        "message": "[Daily activity](%url%) from %from% to %to%",
      },
      "monthly": {
        "cron": "0 0 1 * *",
        "range": { "months": 1 },
      },
      "past 2.5h every 2h": {
        "cron": "0 */2 * * *",
        "range": { "hours": 2, "minutes": 30 },
      },
    },

    // Puppeteer is used to generate the image in the webhooks.
    // See below for more information:
    // https://pptr.dev/api/puppeteer.launchoptions
    // https://pptr.dev/api/puppeteer.clientoptions
    // + additional optional `timezone` field
    // OPTIONAL
    "puppeteer": {
      "timeout": 0,
      "timezone": "Asia/Singapore",
    },
  },

  // if any category gets removed in this config file,
  // should its data in the database also be removed?
  // OPTIONAL
  "deleteOldCategories": false,

  // Approximate maximum number of data points returned by the `/counts` endpoint
  // for display in the chart
  // Prevents response being too large
  // OPTIONAL
  "countsApproxMaxLength": 1000,
}
```
