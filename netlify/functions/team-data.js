// Fans out to the right provider per team and merges the results into one
// response. Per-team failures never fail the whole request — each card
// gets an "ok" | "unconfigured" | "error" status instead.
const teams = require("./lib/teams");
const { fetchSportsDb } = require("./lib/providers/sportsdb");
const { fetchApiFootball } = require("./lib/providers/apiFootball");
const { fetchRss } = require("./lib/providers/rss");
const { errored } = require("./lib/normalize");

const PROVIDERS = {
  sportsdb: fetchSportsDb,
  apiFootball: fetchApiFootball,
  rss: fetchRss,
};

// CDN-level cache so we don't hammer free-tier API quotas on every card
// load; matches the "fetch and cache periodically" goal without needing a
// separate scheduled function.
const CACHE_SECONDS = 15 * 60;

exports.handler = async () => {
  const results = await Promise.allSettled(
    teams.map((team) => {
      const provider = PROVIDERS[team.provider];
      return provider ? provider(team) : Promise.resolve(errored(team, "Unknown provider."));
    })
  );

  const data = results.map((result, i) =>
    result.status === "fulfilled" ? result.value : errored(teams[i], result.reason?.message)
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
    },
    body: JSON.stringify({
      updatedAt: new Date().toISOString(),
      teams: data,
    }),
  };
};
