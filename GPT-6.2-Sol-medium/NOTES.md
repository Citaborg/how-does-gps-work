# Notes — GPT-6.2-Sol-medium

- **Model**: GPT-6.2 Sol (`gpt-6.2-sol`), reasoning effort medium
- **Tool**: Codex (desktop app, Windows, PowerShell)
- **Date**: 2026-11-19
- **Prompt**: the model was started in an empty folder containing only a copy of `USER_PROMPTS.md` (byte-identical to the root file) and told to read and run the prompt from that file without looking at any other folder. The copy is not kept here. It fetched the UiO article named in the prompt and GPS.gov's page on the control segment with its web tool.
- **Session time**: 9 min 57 s (11:59:25–12:09:22 UTC), one turn, no user pause and no retry. 14 tool calls: listing and reading the prompt, the web fetch, five PowerShell writes/appends that built the files, two text replacements, a local `http.server`, a browser attempt that failed (no browser available to the agent), and two Node checks that ran the drawing code at 240 time points with simulated browser interfaces. See [session evidence](../docs/SESSION_EVIDENCE.md) and [sessions/](sessions/).
- **Tokens** (Codex cumulative counter at the end of the turn): 24 271 output (1 698 reasoning); 886 928 input, of which 816 000 cached. No subagents.
- **Length**: 12 scenes of 10 to 20 s, 02:54 in total.
- **Run locally**: open `index.html` directly and press play (it does not autostart). No build step, no libraries, no external requests (system fonts).
- The model stated in its final message that the visual result was unverified because it had no browser. The code has not been edited by hand.
