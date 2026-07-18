// Fans out to each team's providers and merges their results into one
// response. Per-team (and per-provider) failures never fail the whole
// request — each card gets an "ok" | "unconfigured" | "error" status
// instead.
const teams = require("./lib/teams");
const { fetchSportsDb } = require("./lib/providers/sportsdb");
const { fetchApiFootball } = require("./lib/providers/apiFootball");
const { fetchRss } = require("./lib/providers/rss");
const { errored, mergeTeamData } = require("./lib/normalize");

const PROVIDERS = {
  sportsdb: fetchSportsDb,
  apiFootball: fetchApiFootball,
  rss: fetchRss,
};

// CDN-level cache so we don't hammer free-tier API quotas on every card
// load; matches the "fetch and cache periodically" goal without needing a
// separate scheduled function.
const CACHE_SECONDS = 15 * 60;

async function fetchTeam(team) {
  const results = await Promise.all(
    team.providers.map((name) => {
      const provider = PROVIDERS[name];
      if (!provider) return Promise.resolve(errored(team, `Unknown provider: ${name}.`));
      return provider(team).catch((err) => errored(team, err.message));
    })
  );
  return mergeTeamData(team, results);
}

exports.handler = async () => {
  const data = await Promise.all(teams.map(fetchTeam));

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
