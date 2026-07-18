# Fandom Dashboard

Static 7-card dashboard (Nashville SC, San Jose Earthquakes, Manchester City,
Barcelona, Flamengo, Al Ahly, Al Mokawloon) showing each team's crest, next
match, last result, a headline (where available), and a compact standings
snapshot. A Netlify Function fans out to per-league data providers so API
keys stay server-side.

## Structure

- `public/` — static frontend (`index.html`, `style.css`, `app.js`)
- `netlify/functions/team-data.js` — orchestrator; each team lists one or
  more `providers` (`lib/teams.js`), and their results are merged per team
  so e.g. Al Ahly/Al Mokawloon combine `sportsdb` (crest, fixtures,
  standings) with `rss` (headline)
- `netlify/functions/lib/providers/` — `sportsdb.js` (crest, next/last match,
  standings — used by all 7 teams), `rss.js` (headlines for Al Ahly/Al
  Mokawloon), `apiFootball.js` (currently unused, see "Known gaps")
- `netlify/functions/lib/teams.js` — the 7-team roster: provider list, search
  query, RSS keywords, and a rough club accent color per team

Every provider fails gracefully per team/field — a missing key, empty
standings table, or broken feed just omits that part of the card instead of
breaking the page.

## Setup

No API key is required for any of the 7 cards — they run on TheSportsDB's
free public test key by default.

1. (Optional) `cp .env.example .env` — only needed if you set `SPORTSDB_KEY`
   to raise TheSportsDB's rate limit (see "Known gaps"). `API_FOOTBALL_KEY`
   is currently unused.
2. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) if you don't have it: `npm install -g netlify-cli`
3. `netlify dev` — serves `public/` and the functions together at `localhost:8888`

Al Ahly and Al Mokawloon pull headlines from KingFut's general Egyptian
football feed, filtered by keyword — a card occasionally showing "no recent
headline matched" just means that team hasn't had news in the feed's last 10
items recently. That's expected, not an error.

## Deploy

Same flow as your other tools: push this repo to GitHub, connect it in
Netlify, and add `API_FOOTBALL_KEY` / `SPORTSDB_KEY` under Site settings →
Environment variables (never commit `.env`).

## Known gaps to fill in later

- **TheSportsDB's shared free test key (`"3"`) can rate-limit under bursty
  traffic.** Hit this directly while testing (Cloudflare error 1015 after
  many rapid requests). When it happens, the affected team's card just omits
  standings/fixtures for that fetch cycle rather than erroring — it recovers
  on its own. Getting a personal `SPORTSDB_KEY` (free signup) raises the
  limit if this comes up in normal use.
- **Standings are a "top 5" snapshot, not the full table.** The free tier
  caps `lookuptable.php` at 5 rows. If a tracked team isn't in the top 5, the
  card shows "Outside top 5" instead of a rank — there's no free way to get
  a team's exact position beyond that cutoff. Season picking (current vs.
  last season's final table) is automatic: it checks `intPlayed` on the
  current season and falls back to the prior season if it's 0 (i.e. not
  started yet).
- **MLS's table mixes Eastern/Western conference rankings**, so `intRank`
  isn't unique across rows (two teams can both be "#1"). The standings
  provider tags the tracked team's own row directly (`isTracked`) rather
  than matching by rank number, to avoid highlighting the wrong team.
- **API-Football's free tier can't power "next match" / "last result."**
  Tested live with a real key: the `next=`/`last=` fixture params are
  paid-only, and season access is capped to 2022–2024 — no current-season
  fixtures at all on the free plan. `apiFootball.js` is left in place but
  unused; a paid plan would mainly help with things TheSportsDB doesn't
  cover well (deeper stats, lineups, odds).
- **Al Ahly / Al Mokawloon**: headlines only come from KingFut's general feed
  (`https://feeds.feedburner.com/KingFut`), filtered by keyword (`"ahly"`,
  `"mokawloon"` in `teams.js`) since it's not a per-team feed — no clean
  structured API exists for these two, matching the original plan's "weak
  link" expectation. FilGoal was considered but no working RSS URL was
  confirmed for it; add one to `rssFeeds` later if found.
- **Headlines for the other 5 teams**: not implemented yet (TheSportsDB
  doesn't provide news). Cards just omit the News row until a source is
  added — likely a club-specific RSS feed per team.
- **Rosters**: not implemented yet. TheSportsDB has a players-by-team
  endpoint (`lookup_all_players.php`) confirmed working; a "Roster" link or
  expandable section per card is a natural next addition.
