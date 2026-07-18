// api-sports.io "API-Football" v3 — used for the big European/South
// American clubs. Requires API_FOOTBALL_KEY; card degrades gracefully
// without one instead of breaking the whole dashboard.
const { emptyTeamData, unconfigured, errored } = require("../normalize");

const BASE = "https://v3.football.api-sports.io";

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
  });
  if (!res.ok) throw new Error(`API-Football request failed: ${res.status}`);
  return res.json();
}

async function resolveTeamId(team) {
  if (team.apiFootballId) return team.apiFootballId;
  const search = await fetchJson(`/teams?search=${encodeURIComponent(team.query)}`);
  const found = search.response && search.response[0];
  return found ? found.team.id : null;
}

async function fetchApiFootball(team) {
  if (!process.env.API_FOOTBALL_KEY) {
    return unconfigured(team, "API_FOOTBALL_KEY is not set.");
  }

  try {
    const teamId = await resolveTeamId(team);
    if (!teamId) {
      return errored(team, "Team not found on API-Football.");
    }

    const data = emptyTeamData(team);

    const [nextRes, lastRes] = await Promise.allSettled([
      fetchJson(`/fixtures?team=${teamId}&next=1`),
      fetchJson(`/fixtures?team=${teamId}&last=1`),
    ]);

    if (nextRes.status === "fulfilled") {
      const fx = nextRes.value.response && nextRes.value.response[0];
      if (fx) {
        const isHome = fx.teams.home.id === teamId;
        data.nextMatch = {
          opponent: isHome ? fx.teams.away.name : fx.teams.home.name,
          date: fx.fixture.date,
          competition: fx.league.name,
          venue: fx.fixture.venue ? fx.fixture.venue.name : null,
        };
      }
    }

    if (lastRes.status === "fulfilled") {
      const fx = lastRes.value.response && lastRes.value.response[0];
      if (fx) {
        const isHome = fx.teams.home.id === teamId;
        const goalsFor = isHome ? fx.goals.home : fx.goals.away;
        const goalsAgainst = isHome ? fx.goals.away : fx.goals.home;
        data.lastResult = {
          opponent: isHome ? fx.teams.away.name : fx.teams.home.name,
          score: `${fx.goals.home}-${fx.goals.away}`,
          outcome:
            goalsFor === null || goalsAgainst === null
              ? null
              : goalsFor > goalsAgainst
              ? "W"
              : goalsFor < goalsAgainst
              ? "L"
              : "D",
          date: fx.fixture.date,
        };
      }
    }

    return data;
  } catch (err) {
    return errored(team, err.message);
  }
}

module.exports = { fetchApiFootball };
