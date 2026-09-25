import * as dt from "@internationalized/date";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PlayerAPI = {
  playTimes: {
    join: dt.ZonedDateTime;
    leave: dt.ZonedDateTime | null;
  }[];
  playDuration: number;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PlayerAPIJson = {
  playTimes: {
    join: string;
    leave: string | null;
  }[];
  playDuration: number;
};

export const playerAPI = {
  ser({ playDuration, playTimes }: PlayerAPI): PlayerAPIJson {
    return {
      playTimes: playTimes.map(({ join, leave }) => ({
        join: join.toAbsoluteString(),
        leave: leave?.toAbsoluteString() ?? null,
      })),
      playDuration,
    };
  },
  de({ playDuration, playTimes }: PlayerAPIJson): PlayerAPI {
    return {
      playTimes: playTimes.map(({ join, leave }) => ({
        join: dt.parseAbsoluteToLocal(join),
        leave: leave ? dt.parseAbsoluteToLocal(leave) : null,
      })),
      playDuration,
    };
  },
} as const;

export type CategoriesAPI = Record<string, { colour: string; uuids: string[] }>;

export type CountsAPI = {
  timestamp: dt.ZonedDateTime;
  values: Record<"all" | string, number>;
}[];

export type CountsAPIJson = {
  timestamp: string;
  values: Record<"all" | string, number>;
}[];

export const countsAPI = {
  ser(counts: CountsAPI): CountsAPIJson {
    return counts.map(({ timestamp, ...rest }) => ({
      timestamp: timestamp.toAbsoluteString(),
      ...rest,
    }));
  },
  de(counts: CountsAPIJson): CountsAPI {
    return counts.map(({ timestamp, ...rest }) => ({
      timestamp: dt.parseAbsoluteToLocal(timestamp),
      ...rest,
    }));
  },
} as const;

export type PercentOnlineAPI = Record<"all" | string, number>;
