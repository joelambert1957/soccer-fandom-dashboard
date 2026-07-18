// RSS headline provider — the "weak link" per the project plan (Al Ahly,
// Al Mokawloon). Both currently point at KingFut's general Egyptian
// football feed rather than a per-team feed, so we scan every item and
// pick the first one matching the team's keywords (checked against both
// the title and the item's <category> tags).
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

function extractTags(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const results = [];
  let match;
  while ((match = regex.exec(xml))) {
    results.push(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim());
  }
  return results;
}

function parseItems(xml) {
  const blocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => ({
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    publishedAt: extractTag(block, "pubDate"),
    categories: extractTags(block, "category"),
  }));
}

function matchesKeywords(item, keywords) {
  const haystack = [item.title, ...item.categories].join(" ").toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

async function fetchRss(team) {
  if (!team.rssFeeds || team.rssFeeds.length === 0) {
    return unconfigured(team, "No RSS feed configured for this team yet.");
  }

  const keywords = team.keywords && team.keywords.length ? team.keywords : [team.name];

  for (const feedUrl of team.rssFeeds) {
    try {
      const res = await fetch(feedUrl);
      if (!res.ok) continue;
      const xml = await res.text();
      const match = parseItems(xml).find((item) => item.title && matchesKeywords(item, keywords));

      if (match) {
        const data = emptyTeamData(team);
        let source;
        try {
          source = new URL(match.link || feedUrl).hostname;
        } catch {
          source = new URL(feedUrl).hostname;
        }
        data.headline = {
          title: match.title,
          link: match.link,
          publishedAt: match.publishedAt,
          source,
        };
        return data;
      }
    } catch {
      // try the next feed
    }
  }

  return errored(team, "No recent headline matched this team's keywords.");
}

module.exports = { fetchRss };
