---
name: Date-only API serialization
description: Calendar dates from the PostgreSQL layer may serialize as ISO timestamps at the JSON boundary.
---

Treat calendar-only date values as date-like strings at the client boundary, not as guaranteed `YYYY-MM-DD` strings. Normalize to the first ten characters before formatting or binding to date inputs.

**Why:** The database column preserves a calendar day, but the runtime response can serialize it as an ISO timestamp, and appending another time suffix creates an invalid date.

**How to apply:** Any UI formatter, date input initializer, or date comparison should normalize the value before constructing a `Date` or comparing calendar days.