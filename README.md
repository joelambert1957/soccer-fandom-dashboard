# Fandom Dashboard

Static 7-card dashboard (Nashville SC, San Jose Earthquakes, Manchester City,
Barcelona, Flamengo, Al Ahly, Al Mokawloon) showing next match, last result,
and a headline per team. A Netlify Function fans out to per-league data
providers so API keys stay server-side.

## Structure

- `public/` — static frontend (`index.html`, `style.css`, `app.js`)
- `netlify/functions/team-data.js` — orchestrator, calls one provider per team
- `netlify/functions/lib/providers/` — `sportsdb.js` (all 5 non-Egyptian teams,
  see note below), `apiFootball.js` (currently unused, see note below),
  `rss.js` (Al Ahly, Al Mokawloon)
- `netlify/functions/lib/teams.js` — the 7-team roster and which provider/query each uses

Every provider fails gracefully per team — a missing key or a broken feed
shows "No update available" on that one card instead of breaking the page.

## Setup

No API key is required for 5 of the 7 cards — they run on TheSportsDB's free
public test key by default.

1. (Optional) `cp .env.example .env` — only needed if you set `SPORTSDB_KEY`
   to raise TheSportsDB's rate limit. `API_FOOTBALL_KEY` is currently unused
   (see "Known gaps" below).
2. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) if you don't have it: `npm install -g netlify-cli`
3. `netlify dev` — serves `public/` and the functions together at `localhost:8888`

Al Ahly and Al Mokawloon pull headlines from KingFut's general Egyptian
football feed, filtered by keyword (see "Known gaps" below) — a card
occasionally showing "no recent headline matched" just means that team
hasn't had news in the feed's last 10 items recently. That's expected, not
an error.

## Deploy

Same flow as your other tools: push this repo to GitHub, connect it in
Netlify, and add `API_FOOTBALL_KEY` / `SPORTSDB_KEY` under Site settings →
Environment variables (never commit `.env`).

## Known gaps to fill in later

- **API-Football's free tier can't power "next match" / "last result."**
  Tested live with a real key: the `next=`/`last=` fixture params are
  paid-only ("Free plans do not have access to the Next parameter"), and
  season access is capped to 2022–2024 — no current-season fixtures at all
  on the free plan. So Man City, Barcelona, and Flamengo were moved to the
  `sportsdb` provider instead (confirmed working, no key, current-season
  data). `apiFootball.js` is left in place but unused; if you upgrade to a
  paid API-Football plan later it'd mainly be useful for things TheSportsDB
  doesn't cover well (deeper stats, lineups, odds).
- **Al Ahly / Al Mokawloon**: headlines only come from KingFut's general feed
  (`https://feeds.feedburner.com/KingFut`), filtered by keyword (`"ahly"`,
  `"mokawloon"` in `teams.js`) since it's not a per-team feed — no clean
  structured API exists for these two, matching the original plan's "weak
  link" expectation. FilGoal was considered but no working RSS URL was
  confirmed for it; add one to `rssFeeds` later if found. Fixture data
  (next match / last result) isn't wired up for these two at all yet, only
  headlines.
- **Headlines for the other 5 teams**: not implemented yet (TheSportsDB
  doesn't provide news). Cards just omit the News row until a source is added.
