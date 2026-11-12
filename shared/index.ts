import * as dt from "@internationalized/date";

export function now(): dt.ZonedDateTime {
  return dt.now(dt.getLocalTimeZone());
}

export function hhmm(datetime: dt.AnyTime): string {
  const hour = datetime.hour.toString().padStart(2, "0");
  const minute = datetime.minute.toString().padStart(2, "0");
  return `${hour}:${minute}`;
}
