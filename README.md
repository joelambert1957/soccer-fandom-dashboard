# Fandom Dashboard

Static 7-card dashboard (Nashville SC, San Jose Earthquakes, Manchester City,
Barcelona, Flamengo, Al Ahly, Al Mokawloon) showing next match, last result,
and a headline per team. A Netlify Function fans out to per-league data
providers so API keys stay server-side.

## Structure

- `public/` — static frontend (`index.html`, `style.css`, `app.js`)
- `netlify/functions/team-data.js` — orchestrator, calls one provider per team
- `netlify/functions/lib/providers/` — `sportsdb.js` (MLS), `apiFootball.js`
  (Man City, Barcelona, Flamengo), `rss.js` (Al Ahly, Al Mokawloon)
- `netlify/functions/lib/teams.js` — the 7-team roster and which provider/query each uses

Every provider fails gracefully per team — a missing key or a broken feed
shows "No update available" on that one card instead of breaking the page.

## Setup

1. `cp .env.example .env` and fill in what you have:
   - `API_FOOTBALL_KEY` — from [api-football.com](https://www.api-football.com/) / api-sports.io (free tier: 100 req/day)
   - `SPORTSDB_KEY` — optional, falls back to TheSportsDB's public `"3"` test key
2. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) if you don't have it: `npm install -g netlify-cli`
3. `netlify dev` — serves `public/` and the functions together at `localhost:8888`

With no keys set, all 7 cards still render and show "not configured" instead
of erroring — good for checking layout before wiring up real data.

## Deploy

Same flow as your other tools: push this repo to GitHub, connect it in
Netlify, and add `API_FOOTBALL_KEY` / `SPORTSDB_KEY` under Site settings →
Environment variables (never commit `.env`).

## Known gaps to fill in later

- **Al Ahly / Al Mokawloon**: `rssFeeds` in `teams.js` is empty — add real
  feed URLs (e.g. KingFut, FilGoal) once you've confirmed them; nothing was
  guessed here. Fixture data for these two isn't wired up yet, only headlines.
- **Headlines for the other 5 teams**: not implemented yet (API-Football and
  TheSportsDB don't provide news). Cards just omit the News row until a
  source is added.
- **Man City / Barcelona / Flamengo team IDs** in `teams.js` are best-effort
  from public API-Football docs — worth a one-time check against
  `GET /teams?search=<name>` once you have a key.
