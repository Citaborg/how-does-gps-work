/* ==========================================================================
   js/scenes.js — All 9 cohesive chapters of "Hvordan GPS virker"
   ========================================================================== */
(function (global) {
  'use strict';

  const GPSApp = (global.GPSApp = global.GPSApp || {});

  // Shared scenic road path in normalized stage coordinates (x: 0..1, y: 0..1)
  // Kept nicely in the left-to-center 72% of the screen so the right narration stays unobstructed
  function getRoadPoint(u, stage) {
    const x = stage.x + stage.w * (0.06 + 0.88 * u);
    const y =
      stage.y +
      stage.h *
        (0.71 -
          0.085 * Math.sin(u * Math.PI * 1.15 - 0.25) +
          0.025 * Math.cos(u * Math.PI * 2.4));
    return { x, y };
  }

  function getRoadAngle(u, stage) {
    const eps = 0.004;
    const p0 = getRoadPoint(Math.max(0, u - eps), stage);
    const p1 = getRoadPoint(Math.min(1, u + eps), stage);
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }

  function drawScenicRoad(ctx, stage, alpha) {
    if (alpha <= 0.01) return;
    const S = GPSApp.Sketch;
    const pts = [];
    const segs = 48;
    for (let i = 0; i <= segs; i++) {
      pts.push(getRoadPoint(i / segs, stage));
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Soft warm pencil road ribbon
    ctx.strokeStyle = 'rgba(130, 120, 106, 0.17)';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Hand-drawn road edges
    const upper = pts.map((p) => ({ x: p.x, y: p.y - 12 }));
    const lower = pts.map((p) => ({ x: p.x, y: p.y + 12 }));
    S.sketchPolyline(ctx, upper, {
      color: S.PALETTE.road,
      lineWidth: 1.5,
      alpha: 0.65 * alpha,
      strokes: 1,
      roughness: 0.7,
      seed: 12,
    });
    S.sketchPolyline(ctx, lower, {
      color: S.PALETTE.road,
      lineWidth: 1.5,
      alpha: 0.65 * alpha,
      strokes: 1,
      roughness: 0.7,
      seed: 19,
    });

    // Subtle centerline dashes
    ctx.strokeStyle = 'rgba(112, 104, 92, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([9, 10]);
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Standard 2D satellite anchor positions in stage space
  function get2DSatellites(stage) {
    const P = GPSApp.Sketch.PALETTE;
    return [
      {
        id: 'S1',
        x: stage.x + stage.w * 0.24,
        y: stage.y + stage.h * 0.23,
        enterX: stage.x + stage.w * 0.04,
        enterY: stage.y - 40,
        color: P.sat1,
        rgb: P.sat1RGB,
      },
      {
        id: 'S2',
        x: stage.x + stage.w * 0.76,
        y: stage.y + stage.h * 0.22,
        enterX: stage.x + stage.w * 0.96,
        enterY: stage.y - 40,
        color: P.sat2,
        rgb: P.sat2RGB,
      },
      {
        id: 'S3',
        x: stage.x + stage.w * 0.16,
        y: stage.y + stage.h * 0.68,
        enterX: stage.x - 50,
        enterY: stage.y + stage.h * 0.82,
        color: P.sat3,
        rgb: P.sat3RGB,
      },
      {
        id: 'S4',
        x: stage.x + stage.w * 0.82,
        y: stage.y + stage.h * 0.66,
        enterX: stage.x + stage.w * 1.05,
        enterY: stage.y + stage.h * 0.82,
        color: P.sat4,
        rgb: P.sat4RGB,
      },
    ];
  }

  // Draw a colored 2D distance circle (soft watercolor wash + hand-drawn solid ring)
  function drawSatCircle2D(ctx, sx, sy, r, sat, alpha, prog) {
    const S = GPSApp.Sketch;
    if (alpha <= 0.01 || r <= 1) return;
    S.sketchCircle(ctx, sx, sy, r, {
      color: sat.color,
      fill: S.rgba(sat.rgb, 0.085),
      lineWidth: 2.4,
      alpha: alpha,
      progress: prog !== undefined ? prog : 1,
      roughness: 1.35,
      strokes: 2,
      seed: sat.id.charCodeAt(1) * 13,
    });
  }

  // Draw geometry overlay from car to ALL active satellites (lines, distances, angles)
  function drawMultiSatGeometry(ctx, car, activeSats, prog, opts) {
    const S = GPSApp.Sketch;
    if (prog <= 0.01 || activeSats.length === 0) return;
    const o = opts || {};

    // Draw connecting lines & distance labels to every active satellite
    activeSats.forEach((sat, idx) => {
      const lineProg = S.smoothstep(idx * 0.1, 0.55 + idx * 0.1, prog);
      if (lineProg <= 0.01) return;

      S.sketchLine(ctx, sat.x, sat.y, car.x, car.y, {
        color: sat.color,
        lineWidth: 2.0,
        alpha: 0.88 * lineProg,
        progress: lineProg,
        roughness: 0.9,
        seed: 70 + idx * 17,
      });

      // Distance midpoint label
      if (lineProg > 0.55) {
        const lblAlpha = S.smoothstep(0.55, 0.95, lineProg);
        const mx = S.lerp(sat.x, car.x, 0.48);
        const my = S.lerp(sat.y, car.y, 0.48);
        const dx = car.x - sat.x;
        const dy = car.y - sat.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 18;
        const ny = (dx / len) * 18;
        const txt = o.biasLabel ? `d${idx + 1} + c·δt` : `d${idx + 1} = c·Δt${idx + 1}`;
        S.drawMathLabel(ctx, txt, mx + nx, my + ny, {
          color: sat.color,
          size: 18,
          alpha: lblAlpha,
        });
      }
    });

    // If 2+ satellites, sketch baseline(s) and angle arc at the car so the triangulation/trilateration geometry is crystal clear
    if (activeSats.length >= 2 && prog > 0.45) {
      const triProg = S.smoothstep(0.45, 0.92, prog);
      for (let i = 0; i < activeSats.length - 1; i++) {
        const a = activeSats[i];
        const b = activeSats[i + 1];
        S.sketchLine(ctx, a.x, a.y, b.x, b.y, {
          color: S.PALETTE.muted,
          lineWidth: 1.3,
          alpha: 0.45 * triProg,
          progress: triProg,
          strokes: 1,
          roughness: 0.8,
          seed: 140 + i * 11,
        });
      }
      // Angle arc at car between first two satellites
      const a0 = Math.atan2(activeSats[0].y - car.y, activeSats[0].x - car.x);
      const a1 = Math.atan2(activeSats[1].y - car.y, activeSats[1].x - car.x);
      let diff = a1 - a0;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      S.sketchArc(ctx, car.x, car.y, 34, a0, a0 + diff, {
        color: S.PALETTE.ink,
        lineWidth: 1.7,
        alpha: 0.72 * triProg,
        progress: triProg,
      });
    }
  }

  // Helper to resolve narration beat based on normalized chapter time u (0..1)
  function pickBeat(beats, u) {
    let active = beats[0];
    for (let i = 0; i < beats.length; i++) {
      if (u >= beats[i].at) active = beats[i];
    }
    return active;
  }

  // ========================================================================
  // CHAPTER DEFINITIONS
  // ========================================================================
  const CHAPTERS = [
    // ----------------------------------------------------------------------
    // 1. 2D — 1 Satellitt
    // ----------------------------------------------------------------------
    {
      id: '2d-1',
      shortTitle: '2D: Én satellitt',
      tag: 'Del 1 · 2D-prinsippet',
      duration: 17,
      beats: [
        {
          at: 0.0,
          heading: 'Mottakeren bare lytter',
          body: 'GPS-en i bilen sender aldri signaler tilbake til rommet. Den lytter bare på tidssignaler som satellittene sender ut kontinuerlig.',
          note: 'Radiobølger beveger seg med lysets fart: c ≈ 300 000 km/s',
        },
        {
          at: 0.42,
          heading: 'Tid blir til avstand',
          body: 'Ved å måle hvor lenge signalet var underveis fra satellitt 1, regner bilen ut avstanden d₁. Men med bare én satellitt vet vi kun at bilen er et sted langs hele sirkelen.',
          note: 'd₁ = c · Δt₁  →  uendelig mange punkter på ringen',
        },
      ],
      render(ctx, stage, u, t) {
        const S = GPSApp.Sketch;
        const sats = get2DSatellites(stage);

        // Car drives smoothly from 0.14 to 0.34, then stops RIGHT WHERE IT IS
        const driveProg = S.easeOutCubic(S.clamp(u / 0.36, 0, 1));
        const carU = S.lerp(0.14, 0.34, driveProg);
        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);

        drawScenicRoad(ctx, stage, 1);

        // Satellite 1 glides in smoothly
        const satEnter = S.easeOutCubic(S.clamp((u - 0.06) / 0.24, 0, 1));
        const s1 = Object.assign({}, sats[0], {
          x: S.lerp(sats[0].enterX, sats[0].x, satEnter),
          y: S.lerp(sats[0].enterY, sats[0].y, satEnter),
        });

        // Distance circle blooms outward smoothly after satellite settles
        const circleProg = S.easeOutCubic(S.clamp((u - 0.24) / 0.28, 0, 1));
        const r1 = Math.hypot(car.x - s1.x, car.y - s1.y);

        if (circleProg > 0.01) {
          drawSatCircle2D(ctx, s1.x, s1.y, r1 * circleProg, s1, S.clamp(circleProg * 1.4, 0, 1), 1);
        }

        // Gentle moving "possible position" highlight gliding along the circle
        if (u > 0.6) {
          const hAlpha = S.smoothstep(0.6, 0.74, u);
          const ang = Math.atan2(car.y - s1.y, car.x - s1.x) + Math.sin((u - 0.6) * 5.2) * 1.1;
          const hx = s1.x + Math.cos(ang) * r1;
          const hy = s1.y + Math.sin(ang) * r1;
          S.drawIntersectionPoint(ctx, hx, hy, { color: s1.color, radius: 5.5, alpha: hAlpha * 0.8 });
          S.drawMathLabel(ctx, 'Her? Eller her?', hx + 12, hy - 18, {
            color: s1.color,
            size: 18,
            alpha: hAlpha * 0.85,
            align: 'left',
          });
        }

        // Geometry overlay sketches directly from Sat 1 to the stopped car
        const geoProg = S.smoothstep(0.4, 0.65, u);
        drawMultiSatGeometry(ctx, car, [s1], geoProg);

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, s1.x, s1.y, {
          color: s1.color,
          alpha: S.clamp(satEnter * 2, 0, 1),
          label: 'Satellitt 1',
        });
      },
    },

    // ----------------------------------------------------------------------
    // 2. 2D — 2 Satellitter
    // ----------------------------------------------------------------------
    {
      id: '2d-2',
      shortTitle: '2D: To satellitter',
      tag: 'Del 2 · Skjæringspunkter',
      duration: 17,
      beats: [
        {
          at: 0.0,
          heading: 'En satellitt til kommer inn',
          body: 'Bilen ruller videre mens en andre satellitt glir inn på himmelen. Den tegner sin egen avstandssirkel i en ny farge.',
          note: 'To kjente avstander: d₁ og d₂',
        },
        {
          at: 0.45,
          heading: 'Bare to mulige steder igjen',
          body: 'Der de to sirklene krysser hverandre, blandes fargene. Hele kartet er nå snevret inn til kun to nøyaktige skjæringspunkter.',
          note: 'Hvilket av de to punktene er bilen i?',
        },
      ],
      render(ctx, stage, u) {
        const S = GPSApp.Sketch;
        const sats = get2DSatellites(stage);

        // Continues seamlessly from u=0.34 -> 0.50, then stops right where it is
        const driveProg = S.easeInOutCubic(S.clamp(u / 0.34, 0, 1));
        const carU = S.lerp(0.34, 0.50, driveProg);
        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);

        drawScenicRoad(ctx, stage, 1);

        const s1 = sats[0];
        const sat2Enter = S.easeOutCubic(S.clamp((u - 0.08) / 0.26, 0, 1));
        const s2 = Object.assign({}, sats[1], {
          x: S.lerp(sats[1].enterX, sats[1].x, sat2Enter),
          y: S.lerp(sats[1].enterY, sats[1].y, sat2Enter),
        });

        const r1 = Math.hypot(car.x - s1.x, car.y - s1.y);
        const r2Full = Math.hypot(car.x - s2.x, car.y - s2.y);
        const r2Prog = S.easeOutCubic(S.clamp((u - 0.28) / 0.24, 0, 1));
        const r2 = r2Full * r2Prog;

        drawSatCircle2D(ctx, s1.x, s1.y, r1, s1, 1);
        if (r2Prog > 0.01) {
          drawSatCircle2D(ctx, s2.x, s2.y, r2, s2, S.clamp(r2Prog * 1.4, 0, 1));
        }

        // Exact intersection points highlighted in vivid mixed color
        if (r2Prog > 0.92) {
          const pts = S.circleIntersections(s1.x, s1.y, r1, s2.x, s2.y, r2Full);
          const ptAlpha = S.smoothstep(0.48, 0.64, u);
          pts.forEach((p) => {
            const isCar = Math.hypot(p.x - car.x, p.y - car.y) < 12;
            S.drawIntersectionPoint(ctx, p.x, p.y, {
              color: S.PALETTE.violet,
              radius: isCar ? 7.5 : 7,
              alpha: ptAlpha,
            });
            if (!isCar) {
              S.drawMathLabel(ctx, 'Mulig punkt 2?', p.x, p.y - 22, {
                color: S.PALETTE.violet,
                size: 19,
                alpha: ptAlpha,
              });
            }
          });
        }

        // Geometry overlay to BOTH satellites when car stops
        const geoProg = S.smoothstep(0.52, 0.78, u);
        drawMultiSatGeometry(ctx, car, [s1, s2], geoProg);

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, s1.x, s1.y, { color: s1.color, label: 'Satellitt 1' });
        S.drawSatellite(ctx, s2.x, s2.y, {
          color: s2.color,
          alpha: S.clamp(sat2Enter * 2, 0, 1),
          label: 'Satellitt 2',
        });
      },
    },

    // ----------------------------------------------------------------------
    // 3. 2D — 3 Satellitter (Trilaterasjon)
    // ----------------------------------------------------------------------
    {
      id: '2d-3',
      shortTitle: '2D: Tre satellitter',
      tag: 'Del 3 · Trilaterasjon',
      duration: 17,
      beats: [
        {
          at: 0.0,
          heading: 'Den tredje satellitten avgjør',
          body: 'Når satellitt 3 glir inn og slår sin grønne avstandssirkel, treffer den bare ett av de to gjenværende punktene.',
          note: 'Trilaterasjon: tre avstander gir én unik posisjon (x, y)',
        },
        {
          at: 0.48,
          heading: 'Geometrien låser posisjonen',
          body: 'Bilen stopper opp og vi ser hele geometrien samtidig: tre kjente satellittposisjoner og tre avstander som møtes på meteren.',
          note: '… men bare dersom klokken i bilen er helt perfekt!',
        },
      ],
      render(ctx, stage, u) {
        const S = GPSApp.Sketch;
        const sats = get2DSatellites(stage);

        // Continues seamlessly from u=0.50 -> 0.60, then stops right where it is
        const driveProg = S.easeInOutCubic(S.clamp(u / 0.28, 0, 1));
        const carU = S.lerp(0.50, 0.60, driveProg);
        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);

        drawScenicRoad(ctx, stage, 1);

        const s1 = sats[0];
        const s2 = sats[1];
        const sat3Enter = S.easeOutCubic(S.clamp((u - 0.06) / 0.26, 0, 1));
        const s3 = Object.assign({}, sats[2], {
          x: S.lerp(sats[2].enterX, sats[2].x, sat3Enter),
          y: S.lerp(sats[2].enterY, sats[2].y, sat3Enter),
        });

        const r1 = Math.hypot(car.x - s1.x, car.y - s1.y);
        const r2 = Math.hypot(car.x - s2.x, car.y - s2.y);
        const r3Full = Math.hypot(car.x - s3.x, car.y - s3.y);
        const r3Prog = S.easeOutCubic(S.clamp((u - 0.26) / 0.24, 0, 1));

        drawSatCircle2D(ctx, s1.x, s1.y, r1, s1, 1);
        drawSatCircle2D(ctx, s2.x, s2.y, r2, s2, 1);
        if (r3Prog > 0.01) {
          drawSatCircle2D(ctx, s3.x, s3.y, r3Full * r3Prog, s3, S.clamp(r3Prog * 1.4, 0, 1));
        }

        // Fade out the discarded 2-sat intersection point as Sat 3 locks in
        const pts12 = S.circleIntersections(s1.x, s1.y, r1, s2.x, s2.y, r2);
        const discardFade = 1 - S.smoothstep(0.42, 0.62, u);
        pts12.forEach((p) => {
          const isCar = Math.hypot(p.x - car.x, p.y - car.y) < 12;
          if (!isCar && discardFade > 0.02) {
            S.drawIntersectionPoint(ctx, p.x, p.y, {
              color: S.PALETTE.violet,
              radius: 6.5,
              alpha: discardFade,
            });
          }
        });

        // Vivid lock at the car's exact spot
        const lockAlpha = S.smoothstep(0.44, 0.58, u);
        S.drawIntersectionPoint(ctx, car.x, car.y, {
          color: S.PALETTE.sat3,
          radius: 8,
          alpha: lockAlpha,
        });

        // Full geometry overlay to ALL 3 satellites
        const geoProg = S.smoothstep(0.48, 0.78, u);
        drawMultiSatGeometry(ctx, car, [s1, s2, s3], geoProg);

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, s1.x, s1.y, { color: s1.color, label: 'Satellitt 1' });
        S.drawSatellite(ctx, s2.x, s2.y, { color: s2.color, label: 'Satellitt 2' });
        S.drawSatellite(ctx, s3.x, s3.y, {
          color: s3.color,
          alpha: S.clamp(sat3Enter * 2, 0, 1),
          label: 'Satellitt 3',
          labelDy: 30,
        });
      },
    },

    // ----------------------------------------------------------------------
    // 4. 2D — Feiltrekanten & 4. Satellitt (Klokkefeil)
    // ----------------------------------------------------------------------
    {
      id: '2d-4',
      shortTitle: '2D: Feiltrekanten & 4. satellitt',
      tag: 'Del 4 · Klokkefeil',
      duration: 21,
      beats: [
        {
          at: 0.0,
          heading: 'Hva om bilens klokke går litt feil?',
          body: 'Satellittene har atomklokker, men bilen har en vanlig kvartsklokke. Bare ett mikrosekund feil gir 300 meter feil på hver eneste avstand!',
          note: 'Alle sirklene vokser likt: δd = c · δt',
        },
        {
          at: 0.30,
          heading: 'Feiltrekanten dukker opp',
          body: 'Nå møtes ikke de tre sirklene i ett punkt lenger — i stedet danner de en tydelig feiltrekant rundt bilen. Vi har én ukjent for mye: tidsfeilen δt.',
          note: 'Skraffert område = feiltrekanten',
        },
        {
          at: 0.62,
          heading: 'Satellitt 4 løser gåten',
          body: 'Med en fjerde satellitt kan mottakeren justere klokken sin δt til alle fire sirklene strammer inn og møtes i nøyaktig ett punkt. Feiltrekanten forsvinner!',
          note: '4 satellitter → nøyaktig posisjon + perfekt synkronisert klokke',
        },
      ],
      render(ctx, stage, u) {
        const S = GPSApp.Sketch;
        const sats = get2DSatellites(stage);

        // Car stays parked right where Chapter 3 ended (u = 0.60)
        const car = getRoadPoint(0.60, stage);
        const carAng = getRoadAngle(0.60, stage);
        drawScenicRoad(ctx, stage, 1);

        const s1 = sats[0];
        const s2 = sats[1];
        const s3 = sats[2];

        // Clock bias grows smoothly, holds so user clearly sees the error triangle, then shrinks to 0 when Sat 4 solves it
        const biasIn = S.easeInOutCubic(S.clamp((u - 0.08) / 0.20, 0, 1));
        const biasOut = 1 - S.easeInOutCubic(S.clamp((u - 0.72) / 0.20, 0, 1));
        const biasPx = 40 * biasIn * biasOut;

        const r1True = Math.hypot(car.x - s1.x, car.y - s1.y);
        const r2True = Math.hypot(car.x - s2.x, car.y - s2.y);
        const r3True = Math.hypot(car.x - s3.x, car.y - s3.y);

        const r1 = r1True + biasPx;
        const r2 = r2True + biasPx;
        const r3 = r3True + biasPx;

        drawSatCircle2D(ctx, s1.x, s1.y, r1, s1, 0.95);
        drawSatCircle2D(ctx, s2.x, s2.y, r2, s2, 0.95);
        drawSatCircle2D(ctx, s3.x, s3.y, r3, s3, 0.95);

        // Compute the 3 vertices of the error triangle ("feiltrekanten") nearest to the car!
        if (biasPx > 2.5) {
          const near = (pts) => {
            if (!pts.length) return null;
            return pts.reduce((best, p) =>
              Math.hypot(p.x - car.x, p.y - car.y) < Math.hypot(best.x - car.x, best.y - car.y) ? p : best
            );
          };
          const v12 = near(S.circleIntersections(s1.x, s1.y, r1, s2.x, s2.y, r2));
          const v23 = near(S.circleIntersections(s2.x, s2.y, r2, s3.x, s3.y, r3));
          const v31 = near(S.circleIntersections(s3.x, s3.y, r3, s1.x, s1.y, r1));
          if (v12 && v23 && v31) {
            const triAlpha = S.clamp((biasPx - 2.5) / 14, 0, 1);
            S.sketchHatchPolygon(ctx, [v12, v23, v31], {
              color: S.PALETTE.sat2,
              fill: 'rgba(217, 91, 73, 0.34)',
              alpha: triAlpha,
              spacing: 6,
            });
            // Label pointing to feiltrekanten
            const cx = (v12.x + v23.x + v31.x) / 3;
            const cy = (v12.y + v23.y + v31.y) / 3;
            S.sketchArrow(ctx, cx + 82, cy - 66, cx + 12, cy - 12, {
              color: S.PALETTE.sat2,
              lineWidth: 2,
              alpha: triAlpha,
              seed: 88,
            });
            S.drawMathLabel(ctx, 'Feiltrekant (δt ≠ 0)', cx + 92, cy - 78, {
              color: S.PALETTE.sat2,
              size: 21,
              alpha: triAlpha,
            });
          }
        }

        // Satellite 4 glides in smoothly around u = 0.52
        const sat4Enter = S.easeOutCubic(S.clamp((u - 0.52) / 0.16, 0, 1));
        const s4 = Object.assign({}, sats[3], {
          x: S.lerp(sats[3].enterX, sats[3].x, sat4Enter),
          y: S.lerp(sats[3].enterY, sats[3].y, sat4Enter),
        });
        const r4True = Math.hypot(car.x - s4.x, car.y - s4.y);
        const r4Prog = S.easeOutCubic(S.clamp((u - 0.62) / 0.12, 0, 1));
        if (r4Prog > 0.01) {
          drawSatCircle2D(ctx, s4.x, s4.y, (r4True + biasPx) * r4Prog, s4, S.clamp(r4Prog * 1.4, 0, 1));
        }

        // Geometry lines to all active satellites
        if (u > 0.25 && u < 0.62) {
          const gA = S.smoothstep(0.25, 0.36, u) * (1 - S.smoothstep(0.54, 0.62, u));
          drawMultiSatGeometry(ctx, car, [s1, s2, s3], gA, { biasLabel: true });
        } else if (u >= 0.78) {
          const gB = S.smoothstep(0.78, 0.92, u);
          drawMultiSatGeometry(ctx, car, [s1, s2, s3, s4], gB);
          S.drawIntersectionPoint(ctx, car.x, car.y, {
            color: S.PALETTE.sat4,
            radius: 8.5,
            alpha: gB,
          });
          S.drawMathLabel(ctx, 'δt = 0  ✓  Eksakt posisjon!', car.x, car.y + 42, {
            color: S.PALETTE.sat3,
            size: 21,
            alpha: gB,
          });
        }

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, s1.x, s1.y, { color: s1.color, label: 'Satellitt 1' });
        S.drawSatellite(ctx, s2.x, s2.y, { color: s2.color, label: 'Satellitt 2' });
        S.drawSatellite(ctx, s3.x, s3.y, { color: s3.color, label: 'Satellitt 3', labelDy: 30 });
        if (sat4Enter > 0.01) {
          S.drawSatellite(ctx, s4.x, s4.y, {
            color: s4.color,
            alpha: S.clamp(sat4Enter * 2, 0, 1),
            label: 'Satellitt 4',
            labelDy: 30,
          });
        }
      },
    },

    // ----------------------------------------------------------------------
    // 5. 3D — 1, 2, 3, 4 Sfærer + Jorden + Forkasting av falskt punkt
    // ----------------------------------------------------------------------
    {
      id: '3d-spheres',
      shortTitle: '3D: Sfærer og skjæringer',
      tag: 'Del 5 · Fra 2D til 3D',
      duration: 34,
      beats: [
        {
          at: 0.0,
          heading: 'Ut i tre dimensjoner — 1 sfære',
          body: 'I virkeligheten er vi i 3D. Avstanden til én satellitt avgrenser ikke en sirkel, men skallet på en hel kule (sfære) i rommet.',
          note: '1 satellitt → overflaten av en kule',
        },
        {
          at: 0.21,
          heading: '2 sfærer møtes i en sirkel',
          body: 'Når satellitt 2 glir inn, krysser de to gjennomsiktige kulene hverandre. Selve skjæringen mellom to kuler er alltid en skarp sirkel i rommet.',
          note: 'Kule 1 ∩ Kule 2 = én sirkel',
        },
        {
          at: 0.44,
          heading: '3 sfærer kutter til 2 punkter',
          body: 'Den tredje kulen skjærer tvers gjennom denne sirkelen — og kutter hele rommet ned til nøyaktig to mulige punkter.',
          note: 'Kule 1 ∩ Kule 2 ∩ Kule 3 = 2 punkter',
        },
        {
          at: 0.65,
          heading: 'Jorden avslører hvilket punkt som forkastes',
          body: 'Zoomer vi inn på et utsnitt av jordoverflaten, ligger det ene punktet rett på bakken der bilen vår er. Det andre svever langt ute i verdensrommet — og forkastes umiddelbart!',
          note: 'Punktet ute i rommet er fysisk umulig for en bil',
        },
        {
          at: 0.83,
          heading: '4 sfærer låser tid og rom',
          body: 'Satellitt 4 korrigerer bilens klokke δt i 3D, slik at breddegrad, lengdegrad, høyde og tid løses samtidig (4 ligninger, 4 ukjente).',
          note: 'Uten Einsteins relativitetsteori ville GPS drevet ~11 km feil per dag!',
        },
      ],
      render(ctx, stage, u, t) {
        const S = GPSApp.Sketch;
        const R3 = GPSApp.Spheres3D;
        const P = S.PALETTE;

        // Smooth camera orbit so the 3D volume & intersection rings feel unmistakably spatial
        const yaw = -0.35 + u * 0.85 + Math.sin(t * 0.35) * 0.08;
        const pitch = 0.28 + Math.sin(u * Math.PI) * 0.08;
        const cam = R3.makeCamera(yaw, pitch, 7.2, [0, 0.05, 0], 38);

        const vp = {
          x: stage.x,
          y: stage.y,
          w: stage.w,
          h: stage.h,
          cx: stage.x + stage.w * 0.5,
          cy: stage.y + stage.h * 0.5,
        };

        // Target car point in 3D space (sits right on our zoomed-in Earth patch!)
        const car3D = [0.0, -0.58, 0.0];

        // 4 satellite centers arranged cleanly around car3D so:
        // - All 4 spheres pass through car3D
        // - The second 3-sphere intersection point lies clearly ABOVE car3D (out in space!)
        const satDefs = [
          { id: 'S1', c: [-1.62, 0.62, 0.55], enter: [-3.8, 2.2, 1.4], rgb: P.sat1RGB, color: P.sat1, start: 0.0 },
          { id: 'S2', c: [1.58, 0.55, 0.42], enter: [3.9, 2.1, 1.2], rgb: P.sat2RGB, color: P.sat2, start: 0.20 },
          { id: 'S3', c: [-0.22, 0.52, -1.62], enter: [-0.8, 2.4, -3.6], rgb: P.sat3RGB, color: P.sat3, start: 0.43 },
          { id: 'S4', c: [0.35, 1.48, 0.92], enter: [1.6, 3.6, 2.4], rgb: P.sat4RGB, color: P.sat4, start: 0.81 },
        ];

        const activeSpheres = [];
        satDefs.forEach((def) => {
          const enter = S.easeOutCubic(S.clamp((u - def.start) / 0.11, 0, 1));
          if (enter <= 0.005) return;
          const c = [
            S.lerp(def.enter[0], def.c[0], enter),
            S.lerp(def.enter[1], def.c[1], enter),
            S.lerp(def.enter[2], def.c[2], enter),
          ];
          const trueR = R3.vLen(R3.vSub(car3D, def.c));
          const bloom = S.easeOutCubic(S.clamp((u - (def.start + 0.04)) / 0.10, 0, 1));
          activeSpheres.push({
            id: def.id,
            c: c,
            r: trueR * bloom,
            rgb: def.rgb,
            color: def.color,
            alpha: enter,
            settled: bloom > 0.96,
          });
        });

        // 1. Draw zoomed-in Earth patch underneath car3D starting around u = 0.63
        const earthAlpha = S.easeInOutCubic(S.clamp((u - 0.63) / 0.10, 0, 1));
        if (earthAlpha > 0.01) {
          R3.drawEarthPatch(ctx, car3D, cam, vp, earthAlpha);
        }

        // 2. Render volumetric translucent 3D spheres (no hard outer ring, smooth color mixing)
        R3.renderTranslucentSpheres(ctx, activeSpheres, cam, vp);

        // 3. Draw exact SOLID intersection circles where pairs of settled spheres intersect
        if (activeSpheres.length >= 2) {
          const s1 = activeSpheres[0];
          const s2 = activeSpheres[1];
          const c12 = R3.sphereSphereCircle(s1, s2);
          if (c12) {
            // Vivid mixed color of blue + coral -> rich royal magenta-violet
            const mix12 = [134, 64, 152];
            const ringAlpha = S.clamp((u - 0.28) / 0.08, 0, 1);
            R3.drawIntersectionCircle(ctx, c12, cam, vp, {
              rgb: mix12,
              lineWidth: activeSpheres.length >= 3 ? 2.6 : 4.0,
              alpha: ringAlpha * (activeSpheres.length >= 3 ? 0.65 : 0.98),
            });
          }
        }

        if (activeSpheres.length >= 3) {
          const s1 = activeSpheres[0];
          const s2 = activeSpheres[1];
          const s3 = activeSpheres[2];
          const ring3Alpha = S.clamp((u - 0.50) / 0.08, 0, 1);
          const c13 = R3.sphereSphereCircle(s1, s3);
          const c23 = R3.sphereSphereCircle(s2, s3);
          if (c13) {
            R3.drawIntersectionCircle(ctx, c13, cam, vp, {
              rgb: [36, 128, 138], // Blue + emerald -> rich teal
              lineWidth: 2.3,
              alpha: ring3Alpha * 0.58,
            });
          }
          if (c23) {
            R3.drawIntersectionCircle(ctx, c23, cam, vp, {
              rgb: [158, 118, 54], // Coral + emerald -> warm bronze
              lineWidth: 2.3,
              alpha: ring3Alpha * 0.58,
            });
          }

          // Exact 3-sphere intersection points (2 points!)
          const pts3 = R3.threeSpherePoints(s1, s2, s3);
          const ptAlpha = S.clamp((u - 0.52) / 0.07, 0, 1);
          const discardProg = S.smoothstep(0.68, 0.78, u);

          pts3.forEach((pt3) => {
            const p2 = R3.projectPoint(pt3, cam, vp);
            if (!p2) return;
            const isCar = R3.vLen(R3.vSub(pt3, car3D)) < 0.25;

            if (isCar) {
              S.drawIntersectionPoint(ctx, p2.x, p2.y, {
                color: earthAlpha > 0.3 ? P.sat3 : P.violet,
                radius: 8.5,
                alpha: ptAlpha,
              });
              S.drawMathLabel(
                ctx,
                earthAlpha > 0.35 ? 'Bilen på bakken ✓' : 'Skjæringspunkt A',
                p2.x + 16,
                p2.y + (earthAlpha > 0.35 ? -24 : 20),
                {
                  color: earthAlpha > 0.35 ? P.sat3 : P.ink,
                  size: 20,
                  align: 'left',
                  alpha: ptAlpha,
                }
              );
            } else {
              // Second intersection point out in space -> clearly crossed out when Earth appears!
              S.drawIntersectionPoint(ctx, p2.x, p2.y, {
                color: P.sat2,
                radius: 7.5,
                alpha: ptAlpha * (1 - discardProg * 0.45),
              });
              if (discardProg > 0.05) {
                // Hand-drawn red crayon X over the impossible space point
                const r = 13 * discardProg;
                S.sketchLine(ctx, p2.x - r, p2.y - r, p2.x + r, p2.y + r, {
                  color: P.jamRed,
                  lineWidth: 2.8,
                  alpha: discardProg,
                  seed: 31,
                });
                S.sketchLine(ctx, p2.x + r, p2.y - r, p2.x - r, p2.y + r, {
                  color: P.jamRed,
                  lineWidth: 2.8,
                  alpha: discardProg,
                  seed: 37,
                });
                S.drawMathLabel(ctx, 'Forkastes — ute i rommet!', p2.x + 18, p2.y - 6, {
                  color: P.jamRed,
                  size: 19,
                  align: 'left',
                  alpha: discardProg,
                });
              } else {
                S.drawMathLabel(ctx, 'Skjæringspunkt B', p2.x + 16, p2.y - 6, {
                  color: P.violet,
                  size: 19,
                  align: 'left',
                  alpha: ptAlpha,
                });
              }
            }
          });
        }

        // 4. Draw subtle hand-drawn satellites at each active sphere's center
        activeSpheres.forEach((sp, idx) => {
          const pSat = R3.projectPoint(sp.c, cam, vp);
          if (!pSat) return;
          S.drawSatellite(ctx, pSat.x, pSat.y, {
            color: sp.color,
            scale: 0.85,
            alpha: sp.alpha,
            label: `Sat ${idx + 1}`,
            labelDy: -24,
            labelSize: 17,
          });
        });

        // 5. When 4th sphere settles, show clean 4-equation summary badge in sketch style
        if (u > 0.88) {
          const eqAlpha = S.smoothstep(0.88, 0.95, u);
          S.drawMathLabel(
            ctx,
            '4 sfærer → løser (x, y, z, δt) samtidig',
            vp.cx,
            vp.y + vp.h * 0.13,
            { color: P.ink, size: 22, alpha: eqAlpha }
          );
        }
      },
    },

    // ----------------------------------------------------------------------
    // 6. Fart og Dopplereffekt
    // ----------------------------------------------------------------------
    {
      id: 'doppler',
      shortTitle: 'Fart og Dopplereffekt',
      tag: 'Del 6 · Hastighetsberegning',
      duration: 20,
      beats: [
        {
          at: 0.0,
          heading: 'Hvordan måler GPS nøyaktig fart?',
          body: 'I stedet for bare å dele avstand på tid, lytter mottakeren på frekvensskiftet i radiobølgene — selve Dopplereffekten.',
          note: 'Akkurat som en ambulansesirene som endrer tonehøyde!',
        },
        {
          at: 0.45,
          heading: 'Komprimerte og strakte bølger',
          body: 'Når bilen kjører mot satellitt 2, klemmes bølgene sammen (høyere frekvens +Δf). Bort fra satellitt 1 strekkes de ut (lavere frekvens −Δf).',
          note: 'Δfᵢ = (f₀ / c) · v · cos θᵢ  →  gir fart med cm/s presisjon!',
        },
      ],
      render(ctx, stage, u, t) {
        const S = GPSApp.Sketch;
        const P = S.PALETTE;

        // Car drives briskly, pauses mid-scene in place to sketch Doppler vectors & math, then resumes
        let carU, speedKmh;
        if (u < 0.36) {
          const p = u / 0.36;
          carU = S.lerp(0.14, 0.48, S.easeOutCubic(p));
          speedKmh = Math.round(78 * Math.sin(p * Math.PI * 0.85 + 0.15));
        } else if (u < 0.78) {
          carU = 0.48; // Stopped right where it is for math overlay!
          speedKmh = 72; // Freezing the instantaneous velocity vector for the sketch
        } else {
          const p = (u - 0.78) / 0.22;
          carU = S.lerp(0.48, 0.74, S.easeInOutCubic(p));
          speedKmh = Math.round(72 + 14 * Math.sin(p * Math.PI));
        }

        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);
        drawScenicRoad(ctx, stage, 1);

        const sLeft = { x: stage.x + stage.w * 0.16, y: stage.y + stage.h * 0.24, color: P.sat1 };
        const sRight = { x: stage.x + stage.w * 0.82, y: stage.y + stage.h * 0.23, color: P.sat2 };

        // Animated Doppler radio waves: stretched from sLeft (moving away), compressed from sRight (approaching)
        const wavePhase = t * 6.5;
        S.drawWaveLine(ctx, sLeft.x, sLeft.y, car.x, car.y - 12, {
          color: P.sat1,
          wavelength: 30, // Stretched!
          amp: 6,
          phase: wavePhase,
          alpha: 0.78,
        });
        S.drawWaveLine(ctx, sRight.x, sRight.y, car.x, car.y - 12, {
          color: P.sat2,
          wavelength: 14, // Compressed!
          amp: 6,
          phase: wavePhase * 1.45,
          alpha: 0.82,
        });

        // Wave annotations
        S.drawMathLabel(ctx, 'Strekt bølge (f₀ − Δf₁)', (sLeft.x + car.x) * 0.5 - 24, (sLeft.y + car.y) * 0.5 - 26, {
          color: P.sat1,
          size: 19,
        });
        S.drawMathLabel(ctx, 'Komprimert bølge (f₀ + Δf₂)', (sRight.x + car.x) * 0.5 + 24, (sRight.y + car.y) * 0.5 - 26, {
          color: P.sat2,
          size: 19,
        });

        // Hand-drawn Doppler math & vector geometry sketched onto the paused car!
        const mathProg = S.smoothstep(0.36, 0.52, u) * (1 - S.smoothstep(0.76, 0.84, u));
        if (mathProg > 0.01) {
          // Velocity vector v⃗ along the road direction
          const vx = Math.cos(carAng) * 95;
          const vy = Math.sin(carAng) * 95;
          S.sketchArrow(ctx, car.x, car.y - 14, car.x + vx, car.y - 14 + vy, {
            color: P.sat3,
            lineWidth: 3,
            alpha: mathProg,
            progress: mathProg,
            seed: 55,
          });
          S.drawMathLabel(ctx, 'v⃗', car.x + vx + 16, car.y - 14 + vy, {
            color: P.sat3,
            size: 24,
            alpha: mathProg,
          });

          // Unit sight-line vectors û₁ and û₂ toward BOTH satellites + angles θ₁, θ₂
          [
            { sat: sLeft, lbl: 'û₁', angLbl: 'θ₁', col: P.sat1 },
            { sat: sRight, lbl: 'û₂', angLbl: 'θ₂', col: P.sat2 },
          ].forEach((item, idx) => {
            const dx = item.sat.x - car.x;
            const dy = item.sat.y - (car.y - 14);
            const len = Math.hypot(dx, dy) || 1;
            const ux = (dx / len) * 76;
            const uy = (dy / len) * 76;
            S.sketchArrow(ctx, car.x, car.y - 14, car.x + ux, car.y - 14 + uy, {
              color: item.col,
              lineWidth: 2.2,
              alpha: mathProg,
              progress: mathProg,
              seed: 61 + idx * 7,
            });
            S.drawMathLabel(ctx, item.lbl, car.x + ux * 1.18, car.y - 14 + uy * 1.18, {
              color: item.col,
              size: 20,
              alpha: mathProg,
            });

            // Angle arc between velocity vector and satellite sightline
            const aSat = Math.atan2(dy, dx);
            let dA = aSat - carAng;
            while (dA > Math.PI) dA -= Math.PI * 2;
            while (dA < -Math.PI) dA += Math.PI * 2;
            S.sketchArc(ctx, car.x, car.y - 14, 40 + idx * 10, carAng, carAng + dA, {
              color: item.col,
              lineWidth: 1.8,
              alpha: mathProg * 0.85,
              progress: mathProg,
            });
            const midA = carAng + dA * 0.5;
            S.drawMathLabel(
              ctx,
              item.angLbl,
              car.x + Math.cos(midA) * (54 + idx * 10),
              car.y - 14 + Math.sin(midA) * (54 + idx * 10),
              { color: item.col, size: 19, alpha: mathProg }
            );
          });

          // Doppler equation sketched cleanly above the scene
          S.drawMathLabel(
            ctx,
            'Δfᵢ = (f₀ / c) · (v⃗ · ûᵢ) = (f₀ / c) · v · cos θᵢ',
            stage.x + stage.w * 0.5,
            stage.y + stage.h * 0.22,
            { color: P.ink, size: 24, alpha: mathProg }
          );
        }

        // Clean handwritten live speed readout beneath the car
        S.drawMathLabel(ctx, `${speedKmh} km/t`, car.x, car.y + 38, {
          color: P.sat3,
          size: 23,
        });

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, sLeft.x, sLeft.y, { color: P.sat1, label: 'Satellitt 1' });
        S.drawSatellite(ctx, sRight.x, sRight.y, { color: P.sat2, label: 'Satellitt 2' });
      },
    },

    // ----------------------------------------------------------------------
    // 7. Ekko og spøkelsesposisjoner (Multipath bak glassbygning)
    // ----------------------------------------------------------------------
    {
      id: 'multipath',
      shortTitle: 'Ekko & spøkelsesposisjoner',
      tag: 'Del 7 · Signalforhold & multipath',
      duration: 20,
      beats: [
        {
          at: 0.0,
          heading: 'Inn blant høye glassbygninger',
          body: 'I trange bygater blokkerer betong og glass ofte den rette linjen til satellitten. Signalet finner likevel veien — ved å sprette av en glassfasade.',
          note: 'Direkte signal blokkert → reflektert ekko (multipath)',
        },
        {
          at: 0.48,
          heading: 'Omveien skaper en spøkelsesbil',
          body: 'Fordi ekkoet har reist en lengre omvei (+Δd), tror GPS-en at satellitten er lenger unna. Sirkelen blir for stor — og en spøkelsesposisjon dukker opp feil sted!',
          note: 'd_ekko = d_direkte + Δd_omvei',
        },
      ],
      render(ctx, stage, u) {
        const S = GPSApp.Sketch;
        const P = S.PALETTE;

        // Car drives smoothly behind the tall glass building
        const drive = S.easeOutCubic(S.clamp(u / 0.35, 0, 1));
        const carU = S.lerp(0.18, 0.52, drive);
        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);

        drawScenicRoad(ctx, stage, 1);

        // Two hand-drawn glass skyscrapers flanking the urban canyon
        const b1 = {
          x: stage.x + stage.w * 0.62,
          y: stage.y + stage.h * 0.25,
          w: stage.w * 0.14,
          h: stage.h * 0.36,
        };
        const b2 = {
          x: stage.x + stage.w * 0.31,
          y: stage.y + stage.h * 0.34,
          w: stage.w * 0.10,
          h: stage.h * 0.26,
        };

        S.drawGlassBuilding(ctx, b2.x, b2.y, b2.w, b2.h, { alpha: 0.92 });
        S.drawGlassBuilding(ctx, b1.x, b1.y, b1.w, b1.h, { alpha: 0.96 });
        S.drawMathLabel(ctx, 'Glassbygning', b1.x + b1.w * 0.5, b1.y - 16, {
          color: '#3f6d87',
          size: 18,
        });

        const s1 = { x: stage.x + stage.w * 0.18, y: stage.y + stage.h * 0.18, color: P.sat1, rgb: P.sat1RGB, id: 'S1' };
        const s2 = { x: stage.x + stage.w * 0.80, y: stage.y + stage.h * 0.16, color: P.sat2, rgb: P.sat2RGB, id: 'S2' };

        // Direct signal from Sat 1 is clear
        const r1 = Math.hypot(car.x - s1.x, car.y - s1.y);
        drawSatCircle2D(ctx, s1.x, s1.y, r1, s1, 0.55);
        S.sketchLine(ctx, s1.x, s1.y, car.x, car.y - 12, {
          color: P.sat1,
          lineWidth: 1.8,
          alpha: 0.72,
          seed: 11,
        });

        // Direct path from Sat 2 hits the glass building b1 and is BLOCKED!
        const blockPt = { x: b1.x + b1.w * 0.42, y: b1.y + b1.h * 0.32 };
        S.sketchLine(ctx, s2.x, s2.y, blockPt.x, blockPt.y, {
          color: P.sat2,
          lineWidth: 1.6,
          alpha: 0.45,
          dash: [5, 5],
          strokes: 1,
        });
        // Small X where direct ray is blocked
        S.sketchLine(ctx, blockPt.x - 6, blockPt.y - 6, blockPt.x + 6, blockPt.y + 6, {
          color: P.jamRed,
          lineWidth: 2.2,
          strokes: 1,
        });
        S.sketchLine(ctx, blockPt.x + 6, blockPt.y - 6, blockPt.x - 6, blockPt.y + 6, {
          color: P.jamRed,
          lineWidth: 2.2,
          strokes: 1,
        });

        // Reflected multipath bounce off the left glass facade of b1 -> car!
        const bouncePt = { x: b1.x, y: b1.y + b1.h * 0.58 };
        const bounceProg = S.smoothstep(0.24, 0.52, u);
        if (bounceProg > 0.01) {
          S.sketchArrow(ctx, s2.x, s2.y, bouncePt.x, bouncePt.y, {
            color: P.sat2,
            lineWidth: 2.3,
            alpha: 0.9,
            progress: S.clamp(bounceProg * 2, 0, 1),
            seed: 44,
          });
          if (bounceProg > 0.5) {
            const leg2 = S.clamp((bounceProg - 0.5) * 2, 0, 1);
            S.sketchArrow(ctx, bouncePt.x, bouncePt.y, car.x + 6, car.y - 12, {
              color: P.sat2,
              lineWidth: 2.3,
              alpha: 0.9,
              progress: leg2,
              seed: 49,
            });
          }
          S.drawMathLabel(ctx, 'Ekko (+Δd omvei)', bouncePt.x - 12, bouncePt.y - 18, {
            color: P.sat2,
            size: 18,
            align: 'right',
            alpha: bounceProg,
          });
        }

        // Expanded false circle from Sat 2 due to extra echo travel distance -> creates ghost car!
        const echoGrow = S.easeInOutCubic(S.clamp((u - 0.44) / 0.24, 0, 1));
        const r2Direct = Math.hypot(car.x - s2.x, car.y - s2.y);
        const r2Echo = r2Direct + 62 * echoGrow;
        drawSatCircle2D(ctx, s2.x, s2.y, r2Echo, s2, 0.72);

        // Compute shifted intersection with Sat 1's circle -> Ghost Car position!
        if (echoGrow > 0.15) {
          const pts = S.circleIntersections(s1.x, s1.y, r1, s2.x, s2.y, r2Echo);
          if (pts.length) {
            const ghostPt = pts.reduce((best, p) =>
              Math.hypot(p.x - car.x, p.y - car.y) < Math.hypot(best.x - car.x, best.y - car.y) ? p : best
            );
            const gAlpha = S.smoothstep(0.15, 0.7, echoGrow);
            S.sketchLine(ctx, car.x, car.y, ghostPt.x, ghostPt.y, {
              color: P.violet,
              lineWidth: 1.7,
              alpha: gAlpha * 0.7,
              dash: [4, 4],
              strokes: 1,
            });
            S.drawCar(ctx, ghostPt.x, ghostPt.y, carAng, { ghost: true, scale: 0.96, alpha: gAlpha });
            S.drawIntersectionPoint(ctx, ghostPt.x, ghostPt.y, {
              color: P.violet,
              radius: 6,
              alpha: gAlpha,
            });
            S.drawMathLabel(ctx, 'Spøkelsesposisjon!', ghostPt.x - 16, ghostPt.y - 26, {
              color: P.violet,
              size: 19,
              alpha: gAlpha,
            });
          }
        }

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawMathLabel(ctx, 'Faktisk bil', car.x, car.y + 34, { color: P.ink, size: 17 });
        S.drawSatellite(ctx, s1.x, s1.y, { color: P.sat1, label: 'Satellitt 1' });
        S.drawSatellite(ctx, s2.x, s2.y, { color: P.sat2, label: 'Satellitt 2' });
      },
    },

    // ----------------------------------------------------------------------
    // 8. Hvordan vet satellitten sin egen posisjon?
    // ----------------------------------------------------------------------
    {
      id: 'ephemeris',
      shortTitle: 'Satellittens egen posisjon',
      tag: 'Del 8 · Kontrollsegmentet & relativitet',
      duration: 21,
      beats: [
        {
          at: 0.0,
          heading: 'Forutsigbare baner i 20 200 km høyde',
          body: 'GPS-satellittene følger stabile Kepler-baner rundt jorden. Likevel dytter jordens ujevne tyngdekraft og solvind dem ørlite ut av kurs.',
          note: 'Omløpstid ≈ 12 timer · Høyde ≈ 20 200 km',
        },
        {
          at: 0.36,
          heading: 'Bakkestasjoner måler og korrigerer',
          body: 'Kontrollstasjoner over hele kloden overvåker satellittene kontinuerlig med radar, regner ut ferske banedata (efemerider) og sender dem opp igjen.',
          note: 'Efemeride-data = satellittens egen presise «adresse»',
        },
        {
          at: 0.70,
          heading: 'Atomklokker & Einsteins relativitet',
          body: 'Ombord sitter atomklokker. Høy fart gjør at tiden går 7 µs/dag saktere (spesiell relativitet), mens svakere tyngdekraft gjør den 45 µs/dag raskere (generell relativitet).',
          note: 'Sum: +38 µs/dag — korrigert i klokken før oppskytning! (UiO)',
        },
      ],
      render(ctx, stage, u, t) {
        const S = GPSApp.Sketch;
        const P = S.PALETTE;

        const cx = stage.x + stage.w * 0.49;
        const cy = stage.y + stage.h * 0.53;
        const earthR = Math.min(stage.w, stage.h) * 0.19;
        const orbitR = Math.min(stage.w, stage.h) * 0.38;

        // Ideal Keplerian orbit circle (faint pencil)
        S.sketchCircle(ctx, cx, cy, orbitR, {
          color: P.muted,
          lineWidth: 1.5,
          alpha: 0.45,
          strokes: 1,
          roughness: 0.9,
          seed: 7,
        });

        // Earth in the center (hand-colored watercolor globe)
        S.sketchCircle(ctx, cx, cy, earthR, {
          color: '#345843',
          fill: 'rgba(91, 143, 185, 0.36)',
          lineWidth: 2.3,
          alpha: 0.95,
          seed: 15,
        });
        // Little sketched continents on Earth
        ctx.save();
        ctx.fillStyle = 'rgba(115, 158, 109, 0.55)';
        ctx.beginPath();
        ctx.ellipse(cx - earthR * 0.25, cy - earthR * 0.18, earthR * 0.32, earthR * 0.22, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + earthR * 0.28, cy + earthR * 0.15, earthR * 0.26, earthR * 0.3, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        S.drawMathLabel(ctx, 'Jorden', cx, cy + 4, { color: '#274234', size: 20 });

        // 3 Ground Control Stations around Earth
        const stationAngles = [-Math.PI * 0.72, -Math.PI * 0.18, Math.PI * 0.55];
        const stations = stationAngles.map((ang) => ({
          ang,
          x: cx + Math.cos(ang) * earthR,
          y: cy + Math.sin(ang) * earthR,
        }));
        stations.forEach((st) => S.drawGroundStation(ctx, st.x, st.y, st.ang, { scale: 0.95 }));
        S.drawMathLabel(ctx, 'Kontrollstasjoner', stations[2].x, stations[2].y + 30, {
          color: P.ink,
          size: 18,
        });

        // Satellite orbiting with subtle perturbation drift that gets measured & corrected!
        const satAng = -Math.PI * 0.62 + u * Math.PI * 0.85;
        const driftAmp = 18 * S.smoothstep(0.14, 0.34, u) * (1 - S.smoothstep(0.62, 0.78, u));
        const actualR = orbitR + driftAmp;
        const sx = cx + Math.cos(satAng) * actualR;
        const sy = cy + Math.sin(satAng) * actualR;
        const idealX = cx + Math.cos(satAng) * orbitR;
        const idealY = cy + Math.sin(satAng) * orbitR;

        // Show subtle drift arrow when perturbed
        if (driftAmp > 3) {
          S.sketchArrow(ctx, idealX, idealY, sx, sy, {
            color: P.sat2,
            lineWidth: 2.1,
            alpha: S.clamp(driftAmp / 12, 0, 1),
            seed: 91,
          });
          S.drawMathLabel(ctx, 'Lite baneavvik', sx + 22, sy - 26, {
            color: P.sat2,
            size: 18,
            align: 'left',
            alpha: S.clamp(driftAmp / 12, 0, 1),
          });
        }

        // Radar tracking beams from nearest ground stations (u = 0.32..0.68)
        const radarAlpha = S.smoothstep(0.30, 0.40, u) * (1 - S.smoothstep(0.66, 0.76, u));
        if (radarAlpha > 0.01) {
          [stations[0], stations[1]].forEach((st, idx) => {
            S.drawWaveLine(ctx, st.x, st.y, sx, sy, {
              color: idx === 0 ? P.sat1 : P.sat4,
              wavelength: 18,
              amp: 4,
              phase: t * 5,
              alpha: radarAlpha * 0.78,
            });
          });
          S.drawMathLabel(ctx, 'Efemeride-oppdatering ↑', (stations[1].x + sx) * 0.5 + 32, (stations[1].y + sy) * 0.5, {
            color: P.sat4,
            size: 19,
            alpha: radarAlpha,
          });
        }

        // Relativity & Atomic Clock sketch notes (u > 0.68)
        const relAlpha = S.smoothstep(0.68, 0.78, u);
        if (relAlpha > 0.01) {
          const rx = stage.x + stage.w * 0.14;
          const ry = stage.y + stage.h * 0.28;
          S.drawMathLabel(ctx, 'Atomklokke & relativitet:', rx, ry, {
            color: P.ink,
            size: 21,
            align: 'left',
            alpha: relAlpha,
          });
          S.drawMathLabel(ctx, 'Spesiell (fart):  −7 µs/dag', rx, ry + 28, {
            color: P.sat1,
            size: 19,
            align: 'left',
            alpha: relAlpha,
          });
          S.drawMathLabel(ctx, 'Generell (tyngdekraft): +45 µs/dag', rx, ry + 54, {
            color: P.sat3,
            size: 19,
            align: 'left',
            alpha: relAlpha,
          });
          S.drawMathLabel(ctx, 'Netto: +38 µs/dag  (≈ 11 km/dag!)', rx, ry + 84, {
            color: P.sat2,
            size: 20,
            align: 'left',
            alpha: relAlpha,
          });
        }

        S.drawSatellite(ctx, sx, sy, {
          color: P.sat1,
          angle: satAng + Math.PI * 0.5,
          label: 'GPS-satellitt',
          labelDy: -28,
        });
      },
    },

    // ----------------------------------------------------------------------
    // 9. Jamming og forstyrrelser
    // ----------------------------------------------------------------------
    {
      id: 'jamming',
      shortTitle: 'Jamming av GPS',
      tag: 'Del 9 · Sårbarhet & jamming',
      duration: 18,
      beats: [
        {
          at: 0.0,
          heading: 'Et hviskende svakt signal fra rommet',
          body: 'Etter 20 200 kilometer er GPS-signalet ekstremt svakt — omtrent som å se en 25-watts lyspære på 20 000 kilometers avstand.',
          note: 'Signalstyrke ved bakken: ca. −130 dBm',
        },
        {
          at: 0.35,
          heading: 'Jamming overdøver satellittene',
          body: 'En liten lokal støysender (jammer) på samme frekvens (1575,42 MHz) trenger bare noen få milliwatt for å drukne det svake romsignalet i støy.',
          note: 'Mottakeren klarer ikke lenger å skille tidssignalene fra støyen',
        },
        {
          at: 0.72,
          heading: 'Jamming vs. spoofing',
          body: 'Mens jamming blokkerer GPS ved å overdøve med støy, sender spoofing ut et falskt GPS-signal som aktivt lurer bilen til å tro den er et helt annet sted.',
          note: 'Takk for at du fulgte reisen gjennom GPS!',
        },
      ],
      render(ctx, stage, u, t) {
        const S = GPSApp.Sketch;
        const P = S.PALETTE;

        const carU = S.lerp(0.20, 0.56, S.easeInOutCubic(S.clamp(u / 0.85, 0, 1)));
        const car = getRoadPoint(carU, stage);
        const carAng = getRoadAngle(carU, stage);

        drawScenicRoad(ctx, stage, 1);

        const s1 = { x: stage.x + stage.w * 0.20, y: stage.y + stage.h * 0.20, color: P.sat1, rgb: P.sat1RGB, id: 'S1' };
        const s2 = { x: stage.x + stage.w * 0.74, y: stage.y + stage.h * 0.19, color: P.sat2, rgb: P.sat2RGB, id: 'S2' };

        // Jammer ramps up around u = 0.30
        const jam = S.smoothstep(0.28, 0.46, u);
        const jamPos = { x: stage.x + stage.w * 0.66, y: stage.y + stage.h * 0.76 };

        // Clean satellite circles degrade & wobble as jamming intensifies
        const r1 = Math.hypot(car.x - s1.x, car.y - s1.y);
        const r2 = Math.hypot(car.x - s2.x, car.y - s2.y);
        const jitter = jam * Math.sin(t * 23) * 8;
        const satCircleAlpha = 1 - jam * 0.78;

        drawSatCircle2D(ctx, s1.x, s1.y, r1 + jitter, s1, satCircleAlpha);
        drawSatCircle2D(ctx, s2.x, s2.y, r2 - jitter, s2, satCircleAlpha);

        // Faint incoming satellite whispers
        S.sketchLine(ctx, s1.x, s1.y, car.x, car.y - 12, {
          color: P.sat1,
          lineWidth: 1.4,
          alpha: (1 - jam * 0.65) * 0.65,
          strokes: 1,
        });
        S.sketchLine(ctx, s2.x, s2.y, car.x, car.y - 12, {
          color: P.sat2,
          lineWidth: 1.4,
          alpha: (1 - jam * 0.65) * 0.65,
          strokes: 1,
        });

        // Roadside jammer & chaotic red crayon noise waves
        S.drawJammer(ctx, jamPos.x, jamPos.y, t, jam);
        S.drawMathLabel(ctx, jam > 0.1 ? 'Jammer (L1 støy)' : 'Støysender (av)', jamPos.x, jamPos.y + 26, {
          color: jam > 0.1 ? P.jamRed : P.muted,
          size: 18,
        });

        // Signal status above car
        if (jam > 0.55) {
          const blink = 0.55 + 0.45 * Math.sin(t * 10);
          S.drawMathLabel(ctx, '⚠ SIGNAL TAPT (overdøvet)', car.x, car.y - 38, {
            color: P.jamRed,
            size: 21,
            alpha: blink * S.smoothstep(0.55, 0.7, jam),
          });
        } else {
          S.drawIntersectionPoint(ctx, car.x, car.y, {
            color: P.sat3,
            radius: 7,
            alpha: 1 - jam * 1.4,
          });
          S.drawMathLabel(ctx, 'Svakt GPS-signal (−130 dBm)', car.x, car.y - 36, {
            color: P.sat3,
            size: 18,
            alpha: 1 - jam * 1.5,
          });
        }

        // Subtle comparison note in the last beat (Jamming vs Spoofing)
        if (u > 0.72) {
          const cmpAlpha = S.smoothstep(0.72, 0.82, u);
          S.drawMathLabel(
            ctx,
            'Jamming = støy blokkerer  ·  Spoofing = falskt signal lurer posisjonen',
            stage.x + stage.w * 0.48,
            stage.y + stage.h * 0.12,
            { color: P.ink, size: 19, alpha: cmpAlpha }
          );
        }

        S.drawCar(ctx, car.x, car.y, carAng, { scale: 1 });
        S.drawSatellite(ctx, s1.x, s1.y, { color: P.sat1, label: 'Satellitt 1' });
        S.drawSatellite(ctx, s2.x, s2.y, { color: P.sat2, label: 'Satellitt 2' });
      },
    },
  ];

  // Precompute cumulative timeline offsets
  let totalDuration = 0;
  CHAPTERS.forEach((ch, idx) => {
    ch.index = idx;
    ch.startTime = totalDuration;
    totalDuration += ch.duration;
    ch.endTime = totalDuration;
  });

  GPSApp.Scenes = {
    CHAPTERS,
    totalDuration,
    pickBeat,
  };
})(window);
