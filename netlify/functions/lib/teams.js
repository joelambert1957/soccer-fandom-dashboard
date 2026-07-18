// One entry per card on the dashboard. `provider` selects which module in
// lib/providers/ handles the team; provider-specific fields (apiFootballId,
// rssFeeds, etc.) are only read by that provider.
module.exports = [
  {
    id: "nashville-sc",
    name: "Nashville SC",
    league: "MLS",
    provider: "sportsdb",
    query: "Nashville SC",
  },
  {
    id: "san-jose-earthquakes",
    name: "San Jose Earthquakes",
    league: "MLS",
    provider: "sportsdb",
    query: "San Jose Earthquakes",
  },
  {
    id: "man-city",
    name: "Manchester City",
    league: "Premier League",
    provider: "sportsdb",
    query: "Manchester City",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    league: "La Liga",
    provider: "sportsdb",
    query: "Barcelona",
  },
  {
    id: "flamengo",
    name: "Flamengo",
    league: "Série A",
    provider: "sportsdb",
    query: "Flamengo",
  },
  {
    id: "al-ahly",
    name: "Al Ahly",
    league: "Egyptian Premier League",
    provider: "rss",
    // Add real feed URLs (e.g. KingFut, FilGoal team/tag feeds) once
    // confirmed. Left empty by default so the card fails gracefully
    // instead of shipping an unverified guessed URL.
    rssFeeds: [],
  },
  {
    id: "al-mokawloon",
    name: "Al Mokawloon",
    league: "Egyptian Premier League",
    provider: "rss",
    rssFeeds: [],
  },
];
