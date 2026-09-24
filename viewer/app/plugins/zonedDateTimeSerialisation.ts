import * as dt from "@internationalized/date";

export default definePayloadPlugin(() => {
  definePayloadReducer(
    "ZonedDateTime",
    (value) => value instanceof dt.ZonedDateTime && value.toAbsoluteString(),
  );
  definePayloadReviver("ZonedDateTime", (value) =>
    dt.parseZonedDateTime(value),
  );
});
