# Notes — Opus-5.5-medium

- **Model**: Claude Opus 5.5 (`claude-opus-5-5`), reasoning effort medium
- **Tool**: Claude Code (cloud session, started from the desktop app)
- **Dates**: 2026-10-29 and 2026-11-01. The run was stopped after 16:54 by the account's weekly usage limit while it was writing the first files. On 1 November the user wrote "Try again", and the run continued from the files that were left. No new instructions about the page were given, so it is counted as one shot.
- **Active time**: 34:01 (16:54 + 17:07) up to the last check of the app. The wait in between is subtracted. See `docs/TIMING.json` and `docs/SESSION_EVIDENCE.md`.
- **Tokens** (from the native Claude Code log, last usage per unique message ID): 182 438 output; 63 plain input + 386 227 cache creation + 7 321 789 cache read. 35 tool calls. No subagents.
- **Length**: 21 chapters, 17:40 in total.
- **Run locally**: open `index.html` directly or serve with any static HTTP server. No build step and no JS libraries. Uses Google Fonts (Caveat, Fraunces, Newsreader). The 3D chapters need WebGL2.
- **Deep links**: `#c=k3` jumps to a chapter by key, `#t=300` to a time in seconds.
- The folder was first called `Claude-Code/` and was renamed to follow the repo convention. The code has not been edited by hand.
