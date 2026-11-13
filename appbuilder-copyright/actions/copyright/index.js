/*
 * Copyright line for the HashiCorp site, as an Adobe App Builder (I/O Runtime) web action.
 *
 * GET .../api/v1/web/hashicorp-site/copyright
 * -> 200 {"year":2027,"text":"© 2027 HashiCorp, an IBM Company"}
 *
 * The year is taken in the company time zone (TIME_ZONE), so every visitor sees the new year at
 * the same moment, whatever their own clock says. The response may be cached by browsers and
 * CDNs, but never past the next New Year: max-age is capped at the seconds left in the year.
 *
 * Settings (action inputs in app.config.yaml, or .env when running locally):
 *   OWNER       text after the year, e.g. "HashiCorp, an IBM Company"
 *   TIME_ZONE   IANA time zone, e.g. "America/Los_Angeles"
 *   START_YEAR  optional first year; when set and earlier, the text shows a range "2013–2027"
 */

const MAX_AGE_SECONDS = 3600;

/** Wall-clock parts of `date` in `timeZone`. Throws RangeError for an unknown time zone. */
function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return {
    year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second'),
  };
}

/** Milliseconds `timeZone` is ahead of UTC at instant `date` (negative west of Greenwich). */
function offsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant when 1 January of `year`, 00:00, starts in `timeZone`. */
function newYearInstant(year, timeZone) {
  const wall = Date.UTC(year, 0, 1);
  let instant = wall - offsetMs(new Date(wall), timeZone);
  instant = wall - offsetMs(new Date(instant), timeZone); // second pass settles DST edges
  return new Date(instant);
}

/**
 * Pure business logic: no I/O, the clock is passed in so it can be tested.
 * @returns {{year: number, text: string, maxAge: number}}
 */
function buildCopyright(now, { owner, timeZone, startYear } = {}) {
  if (!owner || !owner.trim()) throw new Error('OWNER is not configured');
  if (!timeZone) throw new Error('TIME_ZONE is not configured');
  const { year } = zonedParts(now, timeZone);
  const first = Number.parseInt(startYear, 10);
  const years = Number.isInteger(first) && first < year ? `${first}–${year}` : `${year}`;
  const secondsLeft = Math.floor((newYearInstant(year + 1, timeZone) - now) / 1000);
  return {
    year,
    text: `© ${years} ${owner.trim()}`,
    maxAge: Math.max(0, Math.min(MAX_AGE_SECONDS, secondsLeft)),
  };
}

/** I/O Runtime entry point. `params` holds the action inputs (and query parameters, unused). */
function main(params = {}, now = new Date()) {
  try {
    const { year, text, maxAge } = buildCopyright(now, {
      owner: params.OWNER, timeZone: params.TIME_ZONE, startYear: params.START_YEAR,
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${maxAge}` },
      body: { year, text },
    };
  } catch (e) {
    // Configuration problem: say so without leaking internals; the footer falls back to its own year
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: { error: e instanceof RangeError ? 'TIME_ZONE is not a valid time zone' : e.message },
    };
  }
}

module.exports = { main, buildCopyright, newYearInstant };
