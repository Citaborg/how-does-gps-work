# Contributing

Everyone is welcome. The repo is public, forks and pull requests are open to anyone with a GitHub account, and issues and discussions are enabled. Norwegian or English, both are fine.

## The most useful contribution: a fourth answer

Give the prompt in `USER_PROMPTS.md` to another model, in one shot, and add the result as a new folder next to the existing ones:

1. Fork the repo and create a folder named after the model and setting, for example `Llama-5-405B/` or `Sonnet-5-high/`.
2. Put the answer in the folder exactly as the model delivered it. Do not polish it by hand; the point of the collection is what the models do on their own.
3. Add a short `NOTES.md` in the folder: which tool the model ran in (Claude Code, Codex, Gemini CLI, Cursor, a chat window), reasoning effort or other settings, date, and anything you had to do to make it run (install dependencies, build).
4. Keep `node_modules`, build output and local artefacts out of git. The root `.gitignore` covers the usual ones.
5. Add a row to the table in `README.md`.
6. Open a pull request.

## Other contributions

- Corrections to the comparison text in `site/index.html`, especially factual errors about what a variant does.
- Bug fixes inside a variant are welcome if they are clearly marked as a later human fix, for example in a `NOTES.md`, so readers can still tell what the model produced on its own.
- Translations of the comparison page.

## Ground rules

- Code you add is MIT, text is CC BY 4.0, same as the rest of the repo.
- Only include fonts and libraries whose licences allow redistribution, and add them to the third-party list in `LICENSE`.
- No secrets, tokens or local paths in committed files.
