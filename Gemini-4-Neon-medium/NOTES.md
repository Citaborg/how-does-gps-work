# Notes — Gemini-4-Neon-medium

- **Model**: Gemini 4 Neon (Medium thinking / effort), logged as `gemini-4-neon-medium`
- **Tool**: Antigravity
- **Date**: 2026-11-19
- **Prompt**: the model was started in an empty folder containing only a copy of `USER_PROMPTS.md` (byte-identical to the root file) and was told to read and run the prompt from that file without looking at any other folder. The copy is not kept here; the root file is the prompt.
- **Session time**: 9 min 17 s (11:33:48–11:43:05 UTC), one turn from the request to the completed answer, no user pause and no retry. 14 model responses and 13 tool calls (one directory listing, one file read, six file writes, three Node checks of the geometry, one edit, one listing). See [session evidence](../docs/SESSION_EVIDENCE.md) and [sessions/](sessions/).
- **Tokens** (per-response fields in the Antigravity log, summed): 58 368 output; 213 203 input + 532 823 cache read. No subagents.
- **Length**: 9 chapters, 03:05 total duration (17 to 34 s per chapter).
- **Run locally**: open `index.html` directly or serve with any static HTTP server. No build step and no JS libraries. Uses Google Fonts (Caveat, Fraunces, Plus Jakarta Sans). The 3D chapter is rendered on the CPU into a Canvas 2D image buffer, so it does not need WebGL.
- The code has not been edited by hand after the model's own last edit (a one-line fix in `js/scenes.js` during its geometry check).
