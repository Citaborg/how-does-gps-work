# Notes — Opus-5.5-medium

- **Model**: Claude Opus 5.5 (`claude-opus-5-5`), reasoning effort medium
- **Tool**: Claude Code (cloud session, desktop app)
- **Dates**: 2026-10-29 and 2026-11-01. The run stopped after about 17 minutes (out of tokens, worker restarted) and was continued in the same conversation three days later with "Try again". No new instructions about the page were given, so it counts as one shot.
- **Active time**: ca. 55 min in total (about 17 min on 29 October, about 38 min on 1 November including screenshots and testing).
- **Length**: 21 chapters, 17:40 in total.
- **Tokens out**: 94 000 logged after the restart; the first part was not logged, estimated 30 000 – roughly 125 000 in total.
- **Subagents**: none.
- **Run locally**: open `index.html` directly or serve with any static HTTP server. No build step and no JS libraries. Uses Google Fonts (Caveat, Fraunces, Newsreader). 3D chapters need WebGL2.
- **Deep links**: `#c=k3` jumps to a chapter by key, `#t=300` to a time in seconds.
- **Not touched by hand.** The folder was first called `Claude-Code/` and was renamed to follow the repo convention.
