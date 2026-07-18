// One entry per card on the dashboard. `providers` lists which modules in
// lib/providers/ handle the team, in order; results are merged, so a team
// can combine e.g. sportsdb (fixtures/standings/crest) with rss (headline).
// Provider-specific fields (rssFeeds, keywords, etc.) are only read by the
// provider that uses them. `accent` is a rough club color for the card's UI.
module.exports = [
  {
    id: "nashville-sc",
    name: "Nashville SC",
    league: "MLS",
    providers: ["sportsdb"],
    query: "Nashville SC",
    accent: "#ECE83A",
  },
  {
    id: "san-jose-earthquakes",
    name: "San Jose Earthquakes",
    league: "MLS",
    providers: ["sportsdb"],
    query: "San Jose Earthquakes",
    accent: "#0450A1",
  },
  {
    id: "man-city",
    name: "Manchester City",
    league: "Premier League",
    providers: ["sportsdb"],
    query: "Manchester City",
    accent: "#6CABDD",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    league: "La Liga",
    providers: ["sportsdb"],
    query: "Barcelona",
    accent: "#A50044",
  },
  {
    id: "flamengo",
    name: "Flamengo",
    league: "Série A",
    providers: ["sportsdb"],
    query: "Flamengo",
    accent: "#E30613",
  },
  {
    id: "al-ahly",
    name: "Al Ahly",
    league: "Egyptian Premier League",
    providers: ["sportsdb", "rss"],
    query: "Al Ahly",
    accent: "#C4122F",
    // KingFut's feed covers Egyptian football broadly, not per-team, so we
    // filter items by keyword instead of expecting a clean team feed.
    rssFeeds: ["https://feeds.feedburner.com/KingFut"],
    keywords: ["ahly"],
  },
  {
    id: "al-mokawloon",
    name: "Al Mokawloon",
    league: "Egyptian Premier League",
    providers: ["sportsdb", "rss"],
    query: "Al Mokawloon",
    accent: "#1E8A3C",
    rssFeeds: ["https://feeds.feedburner.com/KingFut"],
    keywords: ["mokawloon"],
  },
];
