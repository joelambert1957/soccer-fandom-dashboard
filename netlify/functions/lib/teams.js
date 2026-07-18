// One entry per card on the dashboard. `provider` selects which module in
// lib/providers/ handles the team; provider-specific fields (rssFeeds,
// keywords, etc.) are only read by that provider.
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
    // KingFut's feed covers Egyptian football broadly, not per-team, so we
    // filter items by keyword instead of expecting a clean team feed.
    rssFeeds: ["https://feeds.feedburner.com/KingFut"],
    keywords: ["ahly"],
  },
  {
    id: "al-mokawloon",
    name: "Al Mokawloon",
    league: "Egyptian Premier League",
    provider: "rss",
    rssFeeds: ["https://feeds.feedburner.com/KingFut"],
    keywords: ["mokawloon"],
  },
];
