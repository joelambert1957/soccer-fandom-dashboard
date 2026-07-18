// TheSportsDB v1 API — used for MLS teams. The "3" key is TheSportsDB's own
// public test key for the free tier; a real key just raises rate limits.
const { emptyTeamData, errored } = require("../normalize");

const BASE = "https://www.thesportsdb.com/api/v1/json";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheSportsDB request failed: ${res.status}`);
  return res.json();
}

async function fetchSportsDb(team) {
  const key = process.env.SPORTSDB_KEY || "3";
  const base = `${BASE}/${key}`;

  try {
    const search = await fetchJson(
      `${base}/searchteams.php?t=${encodeURIComponent(team.query)}`
    );
    const found = search.teams && search.teams[0];
    if (!found) {
      return errored(team, "Team not found on TheSportsDB.");
    }

    const teamId = found.idTeam;
    const data = emptyTeamData(team);

    const [nextRes, lastRes] = await Promise.allSettled([
      fetchJson(`${base}/eventsnext.php?id=${teamId}`),
      fetchJson(`${base}/eventslast.php?id=${teamId}`),
    ]);

    if (nextRes.status === "fulfilled") {
      const ev = nextRes.value.events && nextRes.value.events[0];
      if (ev) {
        data.nextMatch = {
          opponent: ev.strHomeTeam === team.query ? ev.strAwayTeam : ev.strHomeTeam,
          date: ev.dateEvent,
          competition: ev.strLeague,
          venue: ev.strVenue || null,
        };
      }
    }

    if (lastRes.status === "fulfilled") {
      const results = lastRes.value.results || [];
      const ev = results[0];
      if (ev) {
        const isHome = ev.strHomeTeam === found.strTeam;
        const goalsFor = isHome ? ev.intHomeScore : ev.intAwayScore;
        const goalsAgainst = isHome ? ev.intAwayScore : ev.intHomeScore;
        data.lastResult = {
          opponent: isHome ? ev.strAwayTeam : ev.strHomeTeam,
          score: `${ev.intHomeScore}-${ev.intAwayScore}`,
          outcome:
            goalsFor === null || goalsAgainst === null
              ? null
              : goalsFor > goalsAgainst
              ? "W"
              : goalsFor < goalsAgainst
              ? "L"
              : "D",
          date: ev.dateEvent,
        };
      }
    }

    return data;
  } catch (err) {
    return errored(team, err.message);
  }
}

module.exports = { fetchSportsDb };
