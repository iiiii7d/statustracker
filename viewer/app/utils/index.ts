import type * as dt from "@internationalized/date";

export function hhmm(datetime: dt.AnyTime): string {
  const hour = datetime.hour.toString().padStart(2, "0");
  const minute = datetime.minute.toString().padStart(2, "0");
  return `${hour}:${minute}`;
}
