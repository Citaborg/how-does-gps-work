# Notes — Fable-5.2-medium

- **Model**: Claude Fable 5.2 (`claude-fable-5-2`), reasoning effort medium
- **Tool**: Claude Code (desktop app, Windows)
- **Date**: 2026-11-19
- **Prompt**: the model was started in an empty folder containing only a copy of `USER_PROMPTS.md` (byte-identical to the root file) and told to read and run the prompt from that file without looking at any other folder. The copy is not kept here. It fetched the UiO article named in the prompt with curl.
- **Session time**: 26 min 6 s (14:30:42–14:56:48 UTC), one turn, no user pause. 35 tool calls: ten file writes, a syntax check, a local `http.server`, eight calls driving Chrome to look at still frames from all five parts, five small fixes, and a draw-time measurement. A first start in the same folder at 14:29:46 ran on Opus 5.5 by mistake and was interrupted by the user after 26 s, before any file was written; it is not counted. See [session evidence](../docs/SESSION_EVIDENCE.md) and [sessions/](sessions/).
- **Tokens** (last usage per unique message ID in the Claude Code log): 135 995 output; 46 plain input + 414 955 cache creation + 3 773 235 cache read. No subagents.
- **Length**: 19 chapters in five parts, 09:34 in total.
- **Run locally**: open `index.html` directly. No build step and no JS libraries. Uses Google Fonts (Caveat, Lora). The 3D part needs WebGL. `#t=300` jumps to a time in seconds; add `paused` to start paused.
- The model stated that it had looked at still frames but not watched the whole film in real time. The code has not been edited by hand.
