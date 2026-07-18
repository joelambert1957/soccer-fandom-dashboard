// RSS headline provider — the "weak link" per the project plan (Al Ahly,
// Al Mokawloon). No structured fixtures API is assumed here, only a
// headline pulled from the first <item> of the first working feed.
// Deliberately dependency-free: RSS <item> blocks are simple enough that a
// scoped regex is fine, and it avoids pulling in an XML parser for two
// team cards that already expect to run without live data much of the time.
const { emptyTeamData, unconfigured, errored } = require("../normalize");

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
    .trim();
}

function parseFirstItem(xml) {
  const itemMatch = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/i);
  if (!itemMatch) return null;
  const itemXml = itemMatch[1];
  return {
    title: extractTag(itemXml, "title"),
    link: extractTag(itemXml, "link"),
    publishedAt: extractTag(itemXml, "pubDate"),
  };
}

async function fetchRss(team) {
  if (!team.rssFeeds || team.rssFeeds.length === 0) {
    return unconfigured(team, "No RSS feed configured for this team yet.");
  }

  for (const feedUrl of team.rssFeeds) {
    try {
      const res = await fetch(feedUrl);
      if (!res.ok) continue;
      const xml = await res.text();
      const item = parseFirstItem(xml);
      if (item && item.title) {
        const data = emptyTeamData(team);
        data.headline = { ...item, source: new URL(feedUrl).hostname };
        return data;
      }
    } catch {
      // try the next feed
    }
  }

  return errored(team, "Could not read any configured RSS feed.");
}

module.exports = { fetchRss };
