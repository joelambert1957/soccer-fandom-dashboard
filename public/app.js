const TEAMS = [
  { id: "nashville-sc", name: "Nashville SC", league: "MLS", accent: "#ECE83A" },
  { id: "san-jose-earthquakes", name: "San Jose Earthquakes", league: "MLS", accent: "#0450A1" },
  { id: "man-city", name: "Manchester City", league: "Premier League", accent: "#6CABDD" },
  { id: "barcelona", name: "Barcelona", league: "La Liga", accent: "#A50044" },
  { id: "flamengo", name: "Flamengo", league: "Série A", accent: "#E30613" },
  { id: "al-ahly", name: "Al Ahly", league: "Egyptian Premier League", accent: "#C4122F" },
  { id: "al-mokawloon", name: "Al Mokawloon", league: "Egyptian Premier League", accent: "#1E8A3C" },
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

function renderHeader(team, crest) {
  const header = el("div", "card-header");
  const titleGroup = el("div", "title-group");
  if (crest) {
    const img = document.createElement("img");
    img.className = "crest";
    img.src = crest;
    img.alt = "";
    img.loading = "lazy";
    titleGroup.append(img);
  }
  titleGroup.append(el("h2", null, team.name));
  header.append(titleGroup, el("span", "league", team.league));
  return header;
}

function renderCardSkeleton(team) {
  const card = el("article", "card skeleton");
  card.id = `card-${team.id}`;
  card.style.setProperty("--accent", team.accent);
  card.append(renderHeader(team, null), el("p", "status-note", "Loading…"));
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

function renderFormChips(form) {
  const wrap = el("span", "form-chips");
  for (const ch of form) {
    if (ch === "W" || ch === "D" || ch === "L") {
      wrap.append(el("span", `outcome ${ch}`, ch));
    }
  }
  return wrap;
}

function renderStandingsRow(standings) {
  const row = el("div", "row standings");
  row.append(el("span", "label", "Standings"));

  const summary = document.createElement("div");
  const seasonLabel = standings.isFinal ? `${standings.season} · Final` : standings.season;
  summary.append(
    document.createTextNode(
      standings.teamRank ? `#${standings.teamRank} · ${seasonLabel}` : `Outside top 5 · ${seasonLabel}`
    )
  );
  if (standings.teamForm) {
    summary.append(renderFormChips(standings.teamForm));
  }
  row.append(summary);

  if (standings.top && standings.top.length) {
    const details = document.createElement("details");
    details.className = "standings-detail";
    details.append(el("summary", null, "Top 5"));
    const list = document.createElement("ol");
    standings.top.forEach((entry) => {
      const li = el("li", entry.isTracked ? "highlight" : null, `${entry.team} — ${entry.points} pts`);
      list.append(li);
    });
    details.append(list);
    row.append(details);
  }

  return row;
}

function renderCard(team, teamData) {
  const card = el("article", "card");
  card.id = `card-${team.id}`;
  card.style.setProperty("--accent", team.accent);
  card.append(renderHeader(team, teamData?.crest));

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
  if (teamData.standings) {
    card.append(renderStandingsRow(teamData.standings));
  }
  if (!teamData.nextMatch && !teamData.lastResult && !teamData.headline && !teamData.standings) {
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
