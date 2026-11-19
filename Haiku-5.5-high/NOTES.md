# Notes — Haiku-5.5-high

- **Model**: Claude Haiku 5.5 (`claude-haiku-5-5`), reasoning effort high
- **Tool**: Claude Code (desktop app, Windows)
- **Date**: 2026-11-19
- **Prompt**: the model was started in an empty folder containing only a copy of `USER_PROMPTS.md` (byte-identical to the root file) and told to read and run the prompt from that file without looking at any other folder. The copy is not kept here. It did not fetch the UiO article.
- **Session time**: 8 min 52 s (14:45:32–14:54:24 UTC), one turn, no user pause and no retry. 10 tool calls: listing and reading the prompt, one file write, three Node checks (a smoke test of all 951 frames against a stubbed canvas, and a numeric check of the solvers) and two text edits. See [session evidence](../docs/SESSION_EVIDENCE.md) and [sessions/](sessions/).
- **Tokens** (last usage per unique message ID in the Claude Code log): 116 102 output; 18 plain input + 178 370 cache creation + 1 058 828 cache read. No subagents.
- **Length**: 8 chapters in two parts, 07:55 in total.
- **Run locally**: open `index.html` directly. One file, no build step and no JS libraries. Uses Google Fonts (Caveat, Fraunces).
- The model stated that it had not seen the page in a real browser. The code has not been edited by hand.
