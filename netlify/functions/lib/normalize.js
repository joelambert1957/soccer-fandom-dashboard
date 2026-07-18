// Shape every provider must produce for a team, so the frontend never has
// to know which API a card's data came from.
function emptyTeamData(team) {
  return {
    id: team.id,
    name: team.name,
    league: team.league,
    crest: null,
    nextMatch: null,
    lastResult: null,
    headline: null,
    standings: null,
    status: "ok",
    message: null,
  };
}

function unconfigured(team, message) {
  return { ...emptyTeamData(team), status: "unconfigured", message };
}

function errored(team, message) {
  return { ...emptyTeamData(team), status: "error", message };
}

// A team can be served by more than one provider (e.g. sportsdb for
// fixtures/standings, rss for a headline). Merge fills each field from the
// first provider result that has it, and the team is only "unconfigured" or
// "error" if every provider that ran failed to produce anything.
function mergeTeamData(team, results) {
  const merged = emptyTeamData(team);
  const fields = ["crest", "nextMatch", "lastResult", "headline", "standings"];
  let anyOk = false;
  const messages = [];

  for (const result of results) {
    if (!result) continue;
    if (result.status === "ok") anyOk = true;
    if (result.message) messages.push(result.message);
    for (const field of fields) {
      if (result[field] != null && merged[field] == null) {
        merged[field] = result[field];
      }
    }
  }

  if (anyOk) {
    merged.status = "ok";
    merged.message = null;
  } else {
    merged.status = results.every((r) => r && r.status === "unconfigured") ? "unconfigured" : "error";
    merged.message = messages.join(" ") || null;
  }

  return merged;
}

module.exports = { emptyTeamData, unconfigured, errored, mergeTeamData };
