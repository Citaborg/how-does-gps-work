# Verification · 2026-10-29

Scope: only `GPT-6.1-Sol-high/**`, a new independent static application. Base: `main` at `1512057ab2002172b41928a3f060073f245ccf5a`, initially clean. Other model solution files were not read. Work item: `WI#how-does-gps-work/0005`.

## Checks recorded before independent review

- `npm run check`: PASS, syntax checks plus 8 tests. Coverage includes real circle/sphere surface constraints, rejection of the wrong candidate, the entire error-triangle transition, recovery of receiver coordinates and clock bias from four/five pseudoranges, rank-deficient geometry, Doppler signs/projections/satellite motion and camera projection.
- `node tests/browser.mjs`: PASS with installed local Playwright Chromium. 18 scenes visited; all 17 automatic chapter boundaries crossed; pause/play, previous/next, chapter dialog, source dialog, Escape, 2× speed, arrow-key seeking, endpoint/replay and deterministic backward seeking verified.
- Browser rendering checked at 1920×1080 and mobile 390×844. Mobile reduced-motion start was paused. WebGL renderer compiled successfully. Forced no-WebGL path rendered the story without page errors at 1366×768.
- No JavaScript/console errors or off-origin requests during the browser run. The source links are user-initiated; playback itself has no external dependencies.
- Rendered screenshots captured for every chapter. Targeted visual inspection covered the opening, circle geometry, two/three/four spheres, Doppler, error triangle, reflections and mobile layout. Labels were moved away from spacecraft and the error triangle received a magnified inset.
- `git diff --check`: PASS for existing tracked files (unchanged). A direct scan of all 11 new source/document files also passed: no trailing whitespace and final newlines present. No staged commit was made because independent review is pending.
- Source reads: UiO fetched successfully from this machine, plus official GPS.gov, FAA, NIST and ESA Navipedia references. The initially guessed ESA `/Velocity` page returned 404 and was replaced with the verified `GNSS_Basic_Observables` reference.

## Diagnosed failures, not retried unchanged

1. The first geometry run passed 6/7 but the four-pseudorange case returned no solution. Numerical trace showed a correct solution oscillating around 0.1 micrometre at Earth-scale ranges because the absolute convergence threshold was below the subtraction precision. A range-scaled floating-point tolerance fixed the cause. The changed solver then passed; the later suite adds the error-triangle regression test.
2. Visual inspection found one candidate label colliding with a satellite, mobile headings losing spaces where desktop line breaks were hidden, and an error triangle disappearing during a portion of the clustering transition. Label offsets and heading spaces were corrected; the clustered satellite layout now preserves three pairwise intersections throughout the transition, covered by 101 sampled states. Paused narrative text is fully opaque.

## Boundaries

The story is an educational geometric illustration, not live GNSS processing. Scales and orbit deviations are exaggerated; the Canvas-only sphere fallback is approximate; the reflected ghost is an explicitly labelled candidate from one biased range. The README records these assumptions. Chromium is verified here; Safari, Firefox, physical mobile GPUs, accessibility with a screen reader and a published web server have not been separately qualified. No push or deployment was performed.

## Review status

The targeted lead review covered the actual newly authored files, the numerical invariants, timeline state, source assumptions and rendered results above. No remaining blocking defect was identified in that review. The application is implemented and locally verified; it is **awaiting the workspace-required independent review**.

A single fresh read-only Claude Opus/high review was requested, restricted to this folder and forbidden from reading other model solutions or rerunning checks. The CLI identified the requested model as `claude-opus-5-5`, then returned `is_error: true`, exit code 1: “You've hit your weekly limit · resets Oct 31, 5am (Europe/Oslo)”. No review was performed and no pass is claimed. It was not retried. No Astra overlay is required for this illustrative website, which does not control or implement a physical system.

Reviewed-by-lead source fingerprints (SHA-256):

| File | SHA-256 |
|---|---|
| `app.js` | `9D150278DF1F9BCEF167623ADB841538D160C75CCB71B7C86AD7A411F310A440` |
| `geometry.js` | `FE2D59DBE0E1E3846444F016C08AC44B3549196361FCEB5CFD4513010C1DFB1C` |
| `spheres.js` | `863C8B617663C44DEDC7200EEE3BF5EA0319DDED0A49D1C48F7F19B0873D3578` |

The delivery was subsequently copied into the isolated `codex/gps-sol-evidence` branch for GitHub #2. The three runtime source fingerprints above are unchanged. Documentation and bounded session excerpts were added separately. Independent review remains pending; the quota failure is not an approval.

Follow-up observation: in the jamming illustration, loss begins slightly before the drawn ellipse intersects the receiver's horizontal path. This is a low-impact visual mismatch in an illustrative zone, not a GNSS calculation. It is disclosed in the comparison and left unchanged to preserve the original app.
