// Shape every provider must produce for a team, so the frontend never has
// to know which API a card's data came from.
function emptyTeamData(team) {
  return {
    id: team.id,
    name: team.name,
    league: team.league,
    nextMatch: null,
    lastResult: null,
    headline: null,
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

module.exports = { emptyTeamData, unconfigured, errored };
