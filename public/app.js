const TEAMS = [
  { id: "nashville-sc", name: "Nashville SC", league: "MLS" },
  { id: "san-jose-earthquakes", name: "San Jose Earthquakes", league: "MLS" },
  { id: "man-city", name: "Manchester City", league: "Premier League" },
  { id: "barcelona", name: "Barcelona", league: "La Liga" },
  { id: "flamengo", name: "Flamengo", league: "Série A" },
  { id: "al-ahly", name: "Al Ahly", league: "Egyptian Premier League" },
  { id: "al-mokawloon", name: "Al Mokawloon", league: "Egyptian Premier League" },
];

const REFRESH_MS = 15 * 60 * 1000;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function renderCardSkeleton(team) {
  const card = el("article", "card skeleton");
  card.id = `card-${team.id}`;
  const header = el("div", "card-header");
  header.append(el("h2", null, team.name), el("span", "league", team.league));
  card.append(header, el("p", "status-note", "Loading…"));
  return card;
}

function renderMatchRow(label, match) {
  const row = el("div", "row");
  row.append(el("span", "label", label));
  row.append(document.createTextNode(`vs ${match.opponent} · ${formatDate(match.date) || "TBD"}`));
  return row;
}

function renderResultRow(result) {
  const row = el("div", "row");
  row.append(el("span", "label", "Last result"));
  const line = document.createElement("div");
  if (result.outcome) {
    const badge = el("span", `outcome ${result.outcome}`, result.outcome);
    line.append(badge);
  }
  line.append(document.createTextNode(`${result.opponent} ${result.score} · ${formatDate(result.date) || ""}`));
  row.append(line);
  return row;
}

function renderHeadlineRow(headline) {
  const row = el("div", "row headline");
  row.append(el("span", "label", "News"));
  const link = el("a", null, headline.title);
  link.href = headline.link || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  row.append(link);
  return row;
}

function renderCard(team, teamData) {
  const card = el("article", "card");
  card.id = `card-${team.id}`;
  const header = el("div", "card-header");
  header.append(el("h2", null, team.name), el("span", "league", team.league));
  card.append(header);

  if (!teamData || teamData.status === "error" || teamData.status === "unconfigured") {
    card.append(el("p", "status-note", teamData?.message || "No update available."));
    return card;
  }

  if (teamData.nextMatch) {
    card.append(renderMatchRow("Next match", teamData.nextMatch));
  }
  if (teamData.lastResult) {
    card.append(renderResultRow(teamData.lastResult));
  }
  if (teamData.headline) {
    card.append(renderHeadlineRow(teamData.headline));
  }
  if (!teamData.nextMatch && !teamData.lastResult && !teamData.headline) {
    card.append(el("p", "status-note", "No update available."));
  }

  return card;
}

async function loadDashboard() {
  const container = document.getElementById("cards");
  const updatedAtEl = document.getElementById("updated-at");

  if (!container.children.length) {
    TEAMS.forEach((team) => container.append(renderCardSkeleton(team)));
  }

  try {
    const res = await fetch("/api/team-data");
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const payload = await res.json();
    const byId = Object.fromEntries(payload.teams.map((t) => [t.id, t]));

    TEAMS.forEach((team) => {
      const card = renderCard(team, byId[team.id]);
      document.getElementById(`card-${team.id}`)?.replaceWith(card);
    });

    updatedAtEl.textContent = `Updated ${new Date(payload.updatedAt).toLocaleTimeString()}`;
  } catch (err) {
    updatedAtEl.textContent = "Could not load live data — showing last known state.";
    console.error(err);
  }
}

loadDashboard();
setInterval(loadDashboard, REFRESH_MS);
