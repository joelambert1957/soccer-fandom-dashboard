// TheSportsDB v1 API — used for fixtures, crests, and standings. The "3" key
// is TheSportsDB's own public test key for the free tier; a real key just
// raises rate limits.
const { emptyTeamData, errored } = require("../normalize");

const BASE = "https://www.thesportsdb.com/api/v1/json";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheSportsDB request failed: ${res.status}`);
  return res.json();
}

function previousSeason(season) {
  if (season.includes("-")) {
    const [start] = season.split("-").map(Number);
    return `${start - 1}-${start}`;
  }
  return String(Number(season) - 1);
}

// Free tier caps a table at 5 rows, so this is a "top 5" snapshot rather
// than the full league — enough to show context and highlight the team's
// row when it happens to be near the top, but not a full standings page.
async function fetchStandings(base, idLeague, teamName) {
  try {
    const leagueRes = await fetchJson(`${base}/lookupleague.php?id=${idLeague}`);
    const info = leagueRes.leagues && leagueRes.leagues[0];
    if (!info || !info.strCurrentSeason) return null;

    let season = info.strCurrentSeason;
    let rows = ((await fetchJson(`${base}/lookuptable.php?l=${idLeague}&s=${season}`)).table) || [];
    let isFinal = false;

    // intPlayed is 0 across the board before a season's first ball is
    // kicked; fall back to the prior (completed) season in that case.
    if (rows.length === 0 || Number(rows[0].intPlayed) === 0) {
      season = previousSeason(season);
      rows = ((await fetchJson(`${base}/lookuptable.php?l=${idLeague}&s=${season}`)).table) || [];
      isFinal = true;
    }

    if (rows.length === 0) return null;

    // Some leagues (e.g. MLS) publish separate conference tables with their
    // own rank numbering, so rank alone isn't a unique key across rows —
    // tag the tracked team's row directly instead of matching by rank.
    const top = rows.map((r) => ({
      rank: Number(r.intRank),
      team: r.strTeam,
      points: Number(r.intPoints),
      played: Number(r.intPlayed),
      form: r.strForm || null,
      isTracked: r.strTeam.toLowerCase() === teamName.toLowerCase(),
    }));
    const teamEntry = top.find((entry) => entry.isTracked);

    return {
      season,
      isFinal,
      top,
      teamRank: teamEntry ? teamEntry.rank : null,
      teamForm: teamEntry ? teamEntry.form : null,
    };
  } catch {
    return null;
  }
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
    data.crest = found.strBadge || null;

    const [nextRes, lastRes, standingsRes] = await Promise.allSettled([
      fetchJson(`${base}/eventsnext.php?id=${teamId}`),
      fetchJson(`${base}/eventslast.php?id=${teamId}`),
      found.idLeague
        ? fetchStandings(base, found.idLeague, found.strTeam)
        : Promise.resolve(null),
    ]);

    if (nextRes.status === "fulfilled") {
      const ev = nextRes.value.events && nextRes.value.events[0];
      if (ev) {
        data.nextMatch = {
          opponent: ev.strHomeTeam === found.strTeam ? ev.strAwayTeam : ev.strHomeTeam,
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

    if (standingsRes.status === "fulfilled") {
      data.standings = standingsRes.value;
    }

    return data;
  } catch (err) {
    return errored(team, err.message);
  }
}

module.exports = { fetchSportsDb };
