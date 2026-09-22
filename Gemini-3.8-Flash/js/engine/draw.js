/**
 * GPS Drawing & Vector Graphics Engine
 * Authentic "papir og fargestift" (colored pencil, crayon, graphite sketch) aesthetic,
 * multi-satellite geometry calculation overlays, on-canvas Doppler mathematics,
 * rich volumetric 3D spheres, solid luminous intersection curves, and zoomed-in regional Earth terrain.
 */

window.GPSDraw = {
  colors: {
    bg: '#050811',
    paperGrid: 'rgba(56, 189, 248, 0.045)',
    cyan: '#00f0ff',
    cyanPencil: '#38bdf8',
    cyanWash: 'rgba(0, 240, 255, 0.12)',
    magenta: '#e879f9',
    magentaPencil: '#f472b6',
    magentaWash: 'rgba(232, 121, 249, 0.12)',
    gold: '#fbbf24',
    goldPencil: '#f59e0b',
    goldWash: 'rgba(251, 191, 36, 0.12)',
    emerald: '#10b981',
    emeraldPencil: '#34d399',
    emeraldWash: 'rgba(16, 185, 129, 0.12)',
    rose: '#f43f5e',
    text: '#f8fafc',
    textDim: '#94a3b8'
  },

  setupHiDPI(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height, dpr };
  },

  hexToRgba(color, alpha = 1) {
    if (!color) return `rgba(0, 240, 255, ${alpha})`;
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/, `${alpha})`);
    }
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    let c = color.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(0, 240, 255, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  // Soft Blueprint & Textured Parchment Grid
  drawPaperBackground(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Light sketched blueprint grid with pencil feel
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.colors.paperGrid;
    const step = 44;
    ctx.beginPath();
    for (let x = 0; x <= width; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.restore();
  },

  // Authentic Hand-Drawn Pencil Stroke (loose organic passes, pressure variation, overshoot)
  sketchLine(ctx, p1, p2, color, lineWidth = 2.0, passes = 3, overshoot = 4) {
    ctx.save();
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) { ctx.restore(); return; }

    const ux = dx / dist;
    const uy = dy / dist;
    const steps = Math.max(4, Math.floor(dist / 18));

    for (let pass = 0; pass < passes; pass++) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * (pass === 0 ? 1.0 : (pass === 1 ? 0.75 : 0.5));
      ctx.globalAlpha = pass === 0 ? 0.88 : (pass === 1 ? 0.55 : 0.35);

      // Organic start and end overshoot (like real hand sketching on paper)
      const startOver = (pass === 0 ? 0 : (Math.sin(pass * 3.1) * overshoot));
      const endOver = (pass === 0 ? 0 : (Math.cos(pass * 2.7) * overshoot));

      const startX = p1.x - ux * startOver;
      const startY = p1.y - uy * startOver;
      const endX = p2.x + ux * endOver;
      const endY = p2.y + uy * endOver;

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        // Natural hand wobble (larger in the middle, small at endpoints)
        const envelope = Math.sin(t * Math.PI);
        const jitter = (Math.sin(pass * 4.3 + i * 2.7) * 1.2 + Math.cos(pass * 2.1 + i * 5.1) * 0.7) * envelope;
        const perpX = -uy * jitter;
        const perpY = ux * jitter;
        ctx.lineTo(startX + (endX - startX) * t + perpX, startY + (endY - startY) * t + perpY);
      }
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.restore();
  },

  // Hand-Sketched Arrow with Barbs
  sketchPencilArrow(ctx, p1, p2, color, headLen = 14, lineWidth = 2.2) {
    this.sketchLine(ctx, p1, p2, color, lineWidth, 2);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const barb1 = {
      x: p2.x - headLen * Math.cos(angle - Math.PI / 6),
      y: p2.y - headLen * Math.sin(angle - Math.PI / 6)
    };
    const barb2 = {
      x: p2.x - headLen * Math.cos(angle + Math.PI / 6),
      y: p2.y - headLen * Math.sin(angle + Math.PI / 6)
    };
    this.sketchLine(ctx, p2, barb1, color, lineWidth, 2);
    this.sketchLine(ctx, p2, barb2, color, lineWidth, 2);
  },

  // Hand-Sketched Angle Arc (θ)
  sketchAngleArc(ctx, center, radius, startAngle, endAngle, color, label = 'θ') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, false);
    ctx.stroke();

    const midAngle = (startAngle + endAngle) / 2;
    const labelX = center.x + (radius + 14) * Math.cos(midAngle);
    const labelY = center.y + (radius + 14) * Math.sin(midAngle);
    this.drawHandwrittenTag(ctx, labelX, labelY, label, color);
    ctx.restore();
  },

  // Organic Sketched Colored-Pencil Circle with Crayon Wash
  sketchColoredCircle2D(ctx, center, radius, color, washColor, opacity = 1.0) {
    if (radius <= 0 || opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    // 1. Soft crayon wash fill inside
    ctx.fillStyle = washColor;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hand-sketched multi-pass pencil loops with subtle hand wobble
    const segments = 52;
    for (let pass = 0; pass < 3; pass++) {
      ctx.strokeStyle = color;
      ctx.lineWidth = pass === 0 ? 1.9 : (pass === 1 ? 1.3 : 0.8);
      ctx.globalAlpha = opacity * (pass === 0 ? 0.92 : (pass === 1 ? 0.55 : 0.35));

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const rVar = Math.sin(theta * 5 + pass * 2.3) * 1.3 + Math.cos(theta * 3 + pass * 1.7) * 0.7;
        const r = radius + rVar;
        const x = center.x + Math.cos(theta) * r;
        const y = center.y + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  },

  drawHandwrittenTag(ctx, x, y, text, color = '#00f0ff') {
    ctx.save();
    ctx.font = '600 11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
    ctx.fillRect(x - w / 2 - 7, y - 9, w + 14, 19);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - w / 2 - 7, y - 9, w + 14, 19);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 4);
    ctx.restore();
  },

  // Hand-Sketched Technical Notebook Card
  sketchHandwrittenNotebookBox(ctx, x, y, width, height, title, lines = [], borderColor = '#00f0ff', bgColor = 'rgba(6, 12, 22, 0.94)') {
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    // Sketched double-pass box with overshooting pencil corners
    this.sketchLine(ctx, { x, y }, { x: x + width, y }, borderColor, 1.4, 2, 4);
    this.sketchLine(ctx, { x: x + width, y }, { x: x + width, y: y + height }, borderColor, 1.4, 2, 4);
    this.sketchLine(ctx, { x: x + width, y: y + height }, { x, y: y + height }, borderColor, 1.4, 2, 4);
    this.sketchLine(ctx, { x, y: y + height }, { x, y }, borderColor, 1.4, 2, 4);

    // Title
    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = borderColor;
    ctx.fillText(title, x + 12, y + 20);

    // Sketched dividing line
    this.sketchLine(ctx, { x: x + 8, y: y + 27 }, { x: x + width - 8, y: y + 27 }, this.hexToRgba(borderColor, 0.5), 1, 1);

    // Body lines
    ctx.font = '9px "Fira Code", monospace';
    lines.forEach((line, idx) => {
      ctx.fillStyle = line.color || '#94a3b8';
      ctx.fillText(line.text, x + 12, y + 44 + idx * 16);
    });

    ctx.restore();
  },

  /* ==========================================================================
     MULTI-SATELLITE GEOMETRY CALCULATION OVERLAY (Shows ALL active sats!)
     ========================================================================== */
  drawMultiSatelliteCalculationOverlay2D(ctx, activeSats, carPos, satCount, showClockError = false, bias = 0) {
    ctx.save();

    // 1. Draw Right-Angle Calculation Triangle to ALL active satellites simultaneously!
    activeSats.forEach((sat, i) => {
      const corner = { x: carPos.x, y: sat.y };
      const color = sat.color;

      // Soft crayon wash inside triangle
      ctx.fillStyle = this.hexToRgba(color, 0.05);
      ctx.beginPath();
      ctx.moveTo(sat.x, sat.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(carPos.x, carPos.y);
      ctx.closePath();
      ctx.fill();

      // Sketched dashed legs (Δx_i, Δy_i)
      ctx.setLineDash([5, 5]);
      this.sketchLine(ctx, sat, corner, this.hexToRgba(color, 0.7), 1.4, 1);
      this.sketchLine(ctx, corner, carPos, this.hexToRgba(color, 0.7), 1.4, 1);
      ctx.setLineDash([]);

      // Solid Sketched Hypotenuse (True Distance d_i)
      this.sketchLine(ctx, sat, carPos, color, 2.4, 2);

      // Right-Angle marker square with overshoots
      const sq = 10;
      const dirX = Math.sign(sat.x - corner.x) || 1;
      const dirY = Math.sign(carPos.y - corner.y) || 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(corner.x + dirX * sq, corner.y);
      ctx.lineTo(corner.x + dirX * sq, corner.y + dirY * sq);
      ctx.lineTo(corner.x, corner.y + dirY * sq);
      ctx.stroke();

      // Sketched dimension tags
      const midX = (sat.x + corner.x) / 2;
      const midY = (corner.y + carPos.y) / 2;
      const hypMidX = (sat.x + carPos.x) / 2;
      const hypMidY = (sat.y + carPos.y) / 2;

      // Offset tags slightly so multiple triangles don't collide
      const tagOffset = (i % 2 === 0 ? -12 : 12);
      this.drawHandwrittenTag(ctx, midX, corner.y + tagOffset, `Δx${i + 1}`, color);
      this.drawHandwrittenTag(ctx, corner.x + (i === 0 ? 28 : -28), midY, `Δy${i + 1}`, color);

      const dLabel = (showClockError && Math.abs(bias) > 2)
        ? `ρ${i + 1} = d${i + 1} + c·δt`
        : `d${i + 1} = c·Δt${i + 1}`;
      this.drawHandwrittenTag(ctx, hypMidX, hypMidY - 14, dLabel, color);
    });

    // 2. Simultaneous Equations Notebook Card drawn on the Canvas
    let eqLines = [];
    let boxTitle = '';
    let boxColor = '#00f0ff';

    if (satCount === 1) {
      boxTitle = 'TRILATERASJON: ÉN LIGNING';
      boxColor = '#00f0ff';
      eqLines = [
        { text: '(x - x₁)² + (y - y₁)² = d₁²', color: '#00f0ff' },
        { text: '• 1 Ligning for 2 Ukjente (x, y)', color: '#94a3b8' },
        { text: '• Gir en hel sirkel av mulige posisjoner.', color: '#94a3b8' },
        { text: '• Uavklart: Bilen kan være hvor som helst langs buen.', color: '#fbbf24' }
      ];
    } else if (satCount === 2) {
      boxTitle = 'TRILATERASJON: TO LIGNINGER (OVERLAPP)';
      boxColor = '#e879f9';
      eqLines = [
        { text: '(x - x₁)² + (y - y₁)² = d₁²   [Sat 1, Cyan]', color: '#00f0ff' },
        { text: '(x - x₂)² + (y - y₂)² = d₂²   [Sat 2, Magenta]', color: '#e879f9' },
        { text: '• 2 Ligninger gir nøyaktig 2 skjæringspunkter:', color: '#94a3b8' },
        { text: '  - Punkt A (Bilen)', color: '#10b981' },
        { text: '  - Punkt B (Speilpunktet langs korden)', color: '#fbbf24' }
      ];
    } else if (satCount === 3) {
      boxTitle = 'TRILATERASJON: TRE LIGNINGER (LÅST)';
      boxColor = '#fbbf24';
      eqLines = [
        { text: '(x - x₁)² + (y - y₁)² = d₁²', color: '#00f0ff' },
        { text: '(x - x₂)² + (y - y₂)² = d₂²', color: '#e879f9' },
        { text: '(x - x₃)² + (y - y₃)² = d₃²   [Sat 3, Gull]', color: '#fbbf24' },
        { text: '✓ Punkt B forkastes (bommer på Sat 3).', color: '#f43f5e' },
        { text: '✓ Entydig (x, y) posisjon er 100% låst!', color: '#10b981' }
      ];
    } else if (satCount === 4) {
      if (showClockError && Math.abs(bias) > 2) {
        boxTitle = 'TRILATERASJON: KVARTSUR TIDSFEIL (δt)';
        boxColor = '#f43f5e';
        eqLines = [
          { text: 'ρᵢ = dᵢ + c·δt  (i=1, 2, 3)  [+300 m feil]', color: '#f43f5e' },
          { text: '• Sirklene bommer og danner en rød FEILTREKANT.', color: '#f43f5e' },
          { text: '• Uten fjerde satellitt kan ikke posisjonen låses.', color: '#fbbf24' },
          { text: '• Satellitt 4 kobles inn for å eliminere δt...', color: '#38bdf8' }
        ];
      } else {
        boxTitle = 'TRILATERASJON: 4 LIGNINGER LØSER δt';
        boxColor = '#10b981';
        eqLines = [
          { text: 'ρᵢ = √[(x - xᵢ)² + (y - yᵢ)²] + c·δt  (i=1..4)', color: '#10b981' },
          { text: '✓ δt løst = 0.00 ns — Feiltrekanten har kollapset!', color: '#10b981' },
          { text: '• Kvartsklokken synkronisert til atomur-tid gratis', color: '#38bdf8' },
          { text: '✓ Posisjon (x, y) 100% låst | Feil < 0.1 meter', color: '#10b981' }
        ];
      }
    }

    this.sketchHandwrittenNotebookBox(
      ctx,
      30,
      86,
      360,
      116,
      boxTitle,
      eqLines,
      boxColor
    );

    ctx.restore();
  },

  /* ==========================================================================
     FEILTREKANT (Error Triangle caused by Receiver Clock Bias δt)
     Tegner den fysiske feiltrekanten visuelt med håndtegnet skravering,
     røde blyantstreker, noder og callout-notat, og animerer kollapsen til ett punkt.
     ========================================================================== */
  drawErrorTriangle2D(ctx, p12, p23, p31, carPos, bias, isSynced, time = 0, areaW = 1200) {
    ctx.save();

    const centroid = {
      x: (p12.x + p23.x + p31.x) / 3,
      y: (p12.y + p23.y + p31.y) / 3
    };

    const side1 = GPSMath.dist2D(p12, p23);
    const side2 = GPSMath.dist2D(p23, p31);
    const side3 = GPSMath.dist2D(p31, p12);
    const maxSide = Math.max(side1, side2, side3);

    const isCollapsed = isSynced || (maxSide < 4.0 && Math.abs(bias) < 2.0);

    if (!isCollapsed) {
      // 1. Soft Rose Crayon Wash fill inside the error triangle
      ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
      ctx.beginPath();
      ctx.moveTo(p12.x, p12.y);
      ctx.lineTo(p23.x, p23.y);
      ctx.lineTo(p31.x, p31.y);
      ctx.closePath();
      ctx.fill();

      // 2. Hand-Drawn Diagonal Pencil Hatching inside the triangle
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p12.x, p12.y);
      ctx.lineTo(p23.x, p23.y);
      ctx.lineTo(p31.x, p31.y);
      ctx.closePath();
      ctx.clip();

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.40)';
      ctx.lineWidth = 1.0;
      const minX = Math.min(p12.x, p23.x, p31.x) - 15;
      const maxX = Math.max(p12.x, p23.x, p31.x) + 15;
      const minY = Math.min(p12.y, p23.y, p31.y) - 15;
      const maxY = Math.max(p12.y, p23.y, p31.y) + 15;
      const h = maxY - minY;
      for (let lx = minX; lx < maxX + h; lx += 7) {
        ctx.beginPath();
        ctx.moveTo(lx, minY);
        ctx.lineTo(lx - h, maxY);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Hand-Sketched Red Pencil Perimeter with subtle wobble & overshoots
      this.sketchLine(ctx, p12, p23, '#f43f5e', 2.4, 2);
      this.sketchLine(ctx, p23, p31, '#f43f5e', 2.4, 2);
      this.sketchLine(ctx, p31, p12, '#f43f5e', 2.4, 2);

      // 4. Draw Distinct Vertex Markers (The 3 pairwise circle intersections)
      const vertices = [
        { pt: p12, label: 'P₁₂ (S₁ ∩ S₂)', offX: -36, offY: 16 },
        { pt: p23, label: 'P₂₃ (S₂ ∩ S₃)', offX: 20, offY: -10 },
        { pt: p31, label: 'P₃₁ (S₃ ∩ S₁)', offX: -45, offY: -12 }
      ];

      vertices.forEach(v => {
        // Outer red glowing ring
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(v.pt.x, v.pt.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(v.pt.x, v.pt.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Vertex Label Tag
        this.drawHandwrittenTag(ctx, v.pt.x + v.offX, v.pt.y + v.offY, v.label, '#f43f5e');
      });

      // 5. Dimension / Error indicator along one edge
      const midEdge = { x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2 };
      this.drawHandwrittenTag(ctx, midEdge.x + 36, midEdge.y, `Δ ≈ ${(bias * 8.8).toFixed(0)} m feil`, '#fbbf24');

      // 6. Connecting dashed lead line from centroid to True Car Position
      ctx.setLineDash([3, 3]);
      this.sketchLine(ctx, centroid, carPos, 'rgba(251, 191, 36, 0.7)', 1.2, 1);
      ctx.setLineDash([]);

      // 7. Hand-Drawn Callout Banner pointing down to the Feiltrekant
      const boxW = 345;
      const boxH = 76;
      const boxX = Math.max(400, Math.min(areaW - boxW - 20, centroid.x - boxW * 0.5));
      const boxY = Math.max(160, centroid.y - 120);

      // Arrow pointing down to centroid
      this.sketchPencilArrow(
        ctx,
        { x: centroid.x, y: boxY + boxH },
        { x: centroid.x, y: Math.min(p12.y, p23.y, p31.y) - 8 },
        '#f43f5e',
        10,
        2.0
      );

      // Warning Card
      this.sketchHandwrittenNotebookBox(
        ctx,
        boxX,
        boxY,
        boxW,
        boxH,
        '⚠️ FEILTREKANT (KVARTSUR TIDSAVVIK)',
        [
          { text: `• Kvartsur avvik δt ≈ +${(bias / 28).toFixed(2)} μs (c·δt ≈ ${(bias * 8.8).toFixed(0)} m)`, color: '#f43f5e' },
          { text: '• Sirklene bommer på hverandre og danner en feiltrekant', color: '#94a3b8' },
          { text: '• Satellitt 4 tilfører 4. ligning og kollapser trekanten', color: '#fbbf24' }
        ],
        '#f43f5e'
      );

    } else {
      // COLLAPSED STATE: δt = 0! The triangle has collapsed to a single point.
      // 1. Concentric radiant green waves
      const pulsePhase = (time * 2.0) % 1.0;
      const pulseR = 8 + pulsePhase * 26;
      const pulseAlpha = 1.0 - pulsePhase;

      ctx.strokeStyle = `rgba(16, 185, 129, ${pulseAlpha * 0.8})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(carPos.x, carPos.y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(16, 185, 129, ${pulseAlpha * 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(carPos.x, carPos.y, pulseR * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Collapsed Point Marker
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(carPos.x, carPos.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(carPos.x, carPos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Celebratory Lock Banner pointing down to the collapsed point
      const boxW = 345;
      const boxH = 74;
      const boxX = Math.max(400, Math.min(areaW - boxW - 20, carPos.x - boxW * 0.5));
      const boxY = Math.max(160, carPos.y - 116);

      this.sketchPencilArrow(
        ctx,
        { x: carPos.x, y: boxY + boxH },
        { x: carPos.x, y: carPos.y - 12 },
        '#10b981',
        10,
        2.0
      );

      this.sketchHandwrittenNotebookBox(
        ctx,
        boxX,
        boxY,
        boxW,
        boxH,
        '✓ FEILTREKANT KOLLAPSET: ATOMUR-LÅS',
        [
          { text: '✓ Satellitt 4 løste tidsavviket: δt = 0.00 ns!', color: '#10b981' },
          { text: '✓ Alle 4 sirkler møtes i ett entydig punkt (x, y)', color: '#10b981' },
          { text: '✓ Kvartsur oppnår atomur-presisjon gratis!', color: '#38bdf8' }
        ],
        '#10b981'
      );
    }

    ctx.restore();
  },

  /* ==========================================================================
     DOPPLER MATHEMATICS ILLUSTRATION (Draws math directly on canvas!)
     ========================================================================== */
  drawDopplerMathIllustration(ctx, areaW, height, carPos, sats, wavePhase, speedKmh = 90.0) {
    ctx.save();
    const speedMs = (speedKmh / 3.6).toFixed(1);

    // 1. Prominent Velocity Vector v extending forward from the car
    const vLength = 110;
    const vEnd = { x: carPos.x + vLength, y: carPos.y };
    this.sketchPencilArrow(ctx, carPos, vEnd, '#10b981', 16, 3.2);

    // Vector v Label Tag
    this.drawHandwrittenTag(
      ctx,
      carPos.x + vLength / 2 + 10,
      carPos.y + 24,
      `v = ${speedKmh.toFixed(1)} km/t (${speedMs} m/s)`,
      '#10b981'
    );

    // 2. Line-of-sight vectors and angle arcs for Sat 1 (receding) and Sat 2 (approaching)
    if (sats[0] && sats[1]) {
      const sat1 = sats[0];
      const sat2 = sats[1];

      // --- Satellitt 1 (Bak: Receding, Red Shift) ---
      const dx1 = sat1.x - carPos.x;
      const dy1 = sat1.y - carPos.y;
      const dist1 = Math.hypot(dx1, dy1);
      const angle1 = Math.atan2(dy1, dx1); // Line-of-sight angle

      // Line of sight line
      ctx.setLineDash([4, 4]);
      this.sketchLine(ctx, carPos, sat1, 'rgba(244, 63, 94, 0.7)', 1.5, 1);
      ctx.setLineDash([]);

      // Angle arc θ_1 between v (0 rad) and line of sight to sat 1
      this.sketchAngleArc(ctx, carPos, 42, angle1, 0, '#f43f5e', 'θ₁ ≈ 148°');

      // LOS projection vector component
      const cos1 = Math.cos(angle1);
      const vlos1 = (speedKmh * cos1).toFixed(1);
      this.drawHandwrittenTag(
        ctx,
        (sat1.x + carPos.x) / 2 - 20,
        (sat1.y + carPos.y) / 2,
        `v_LOS₁ = v·cos(θ₁) = ${vlos1} km/t (Fjerner seg)`,
        '#f43f5e'
      );

      // --- Satellitt 2 (Foran: Approaching, Blue Shift) ---
      const dx2 = sat2.x - carPos.x;
      const dy2 = sat2.y - carPos.y;
      const dist2 = Math.hypot(dx2, dy2);
      const angle2 = Math.atan2(dy2, dx2);

      // Line of sight line
      ctx.setLineDash([4, 4]);
      this.sketchLine(ctx, carPos, sat2, 'rgba(0, 240, 255, 0.7)', 1.5, 1);
      ctx.setLineDash([]);

      // Angle arc θ_2
      this.sketchAngleArc(ctx, carPos, 50, 0, angle2, '#00f0ff', 'θ₂ ≈ 38°');

      // LOS projection vector component
      const cos2 = Math.cos(angle2);
      const vlos2 = (speedKmh * cos2).toFixed(1);
      this.drawHandwrittenTag(
        ctx,
        (sat2.x + carPos.x) / 2 + 30,
        (sat2.y + carPos.y) / 2,
        `v_LOS₂ = v·cos(θ₂) = +${vlos2} km/t (Nærmer seg)`,
        '#00f0ff'
      );
    }

    // 3. Technical Doppler Formula Notebook Card drawn on the Canvas
    const mathLines = [
      { text: 'Bærebølge (L1): f₀ = 1575.42 MHz  |  Bølgelengde: λ = c / f₀ ≈ 19.03 cm', color: '#38bdf8' },
      { text: 'Doppler-formel:  Δf = -f₀ · (v · u_LOS) / c = - (v · cos θ) / λ', color: '#00f0ff' },
      { text: '• Satellitt 1 (Bak):   Δf₁ = -126 Hz < 0  (Rødskift: Bølgene strekkes)', color: '#f43f5e' },
      { text: '• Satellitt 2 (Foran): Δf₂ = +131 Hz > 0  (Blåskift: Bølgene komprimeres)', color: '#00f0ff' },
      { text: 'Matrise-inversjon: [Δf₁, Δf₂]ᵀ = -1/λ · [u_LOS] · v  ==> v = (vx, vy)', color: '#fbbf24' },
      { text: '✓ Gir bilens øyeblikkelige hastighetsvektor med under ±0.03 km/t feil!', color: '#10b981' }
    ];

    this.sketchHandwrittenNotebookBox(
      ctx,
      30,
      86,
      440,
      138,
      'HASTIGHETSBEREGNING VIA BÆREBØLGE-DOPPLER',
      mathLines,
      '#00f0ff'
    );

    ctx.restore();
  },

  // Soft, Luminous, Rich 3D Sphere (Translucent, visible volume, bright Fresnel rim, NO harsh outline)
  drawVolumetricSphere3D(ctx, projCenter, radius, baseColor, alpha = 0.32) {
    if (radius <= 2 || alpha <= 0.01) return;
    ctx.save();

    // 1. Rich multi-stop radial gradient with bright Fresnel edge (bubble / glass orb look)
    const grad = ctx.createRadialGradient(
      projCenter.x - radius * 0.15,
      projCenter.y - radius * 0.15,
      radius * 0.05,
      projCenter.x,
      projCenter.y,
      radius
    );
    grad.addColorStop(0, this.hexToRgba(baseColor, alpha * 2.6));
    grad.addColorStop(0.35, this.hexToRgba(baseColor, alpha * 1.6));
    grad.addColorStop(0.70, this.hexToRgba(baseColor, alpha * 1.1));
    // Bright glowing Fresnel rim
    grad.addColorStop(0.88, this.hexToRgba(baseColor, alpha * 2.2));
    grad.addColorStop(0.96, this.hexToRgba(baseColor, alpha * 0.9));
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)'); // Soft edge, zero harsh silhouette stroke!

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(projCenter.x, projCenter.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Subtle sketched translucent orientation rings (papir & fargestift technical sketch look)
    ctx.strokeStyle = this.hexToRgba(baseColor, alpha * 1.8);
    ctx.lineWidth = 1.1;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.ellipse(projCenter.x, projCenter.y, radius * 0.95, radius * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  // SOLID, VIVID, GLOWING 3D Intersection Ring (NO DASHES, strong multi-layer stroke)
  drawExactSphereIntersectionRing3D(ctx, ring3D, width, height, rotX, rotY, color = '#00f0ff', label = '✨ Skjæring: 3D Sirkelring i rommet', opacity = 1.0) {
    if (!ring3D || opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    const { center, radius, u, v } = ring3D;
    const numPoints = 72;
    const projectedPoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Point on 3D circle
      const p3D = {
        x: center.x + radius * (cosT * u.x + sinT * v.x),
        y: center.y + radius * (cosT * u.y + sinT * v.y),
        z: center.z + radius * (cosT * u.z + sinT * v.z)
      };

      // Rotate around scene center
      const rot = GPSMath.rotate3D(p3D, rotX, rotY, 0);
      const proj = GPSMath.project3D(rot, width, height, 1.05, 460);
      if (proj.visible) {
        projectedPoints.push(proj);
      }
    }

    if (projectedPoints.length > 5) {
      // 1. Outer Luminous Glow (SOLID, NO DASHES)
      ctx.setLineDash([]);
      ctx.strokeStyle = this.hexToRgba(color, 0.45);
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
      for (let i = 1; i < projectedPoints.length; i++) {
        ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // 2. Bright White Core (SOLID)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // 3. Vivid Intense Color Overlay (SOLID)
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Label on top of ring if provided
      if (label) {
        let topPt = projectedPoints[0];
        for (let i = 1; i < projectedPoints.length; i++) {
          if (projectedPoints[i].y < topPt.y) topPt = projectedPoints[i];
        }
        this.drawHandwrittenTag(ctx, topPt.x, topPt.y - 18, label, color);
      }
    }

    ctx.restore();
  },

  // Zoomed-in Regional Curved Earth Surface and Highway
  drawZoomedEarthAndRoad3D(ctx, areaW, height, rotX, rotY) {
    ctx.save();
    const groundCenter = { x: areaW * 0.5, y: height * 0.92 };
    const groundR = areaW * 0.95;

    // 1. Curved Ground Fill
    const earthGrad = ctx.createRadialGradient(
      groundCenter.x, groundCenter.y, groundR * 0.7,
      groundCenter.x, groundCenter.y, groundR
    );
    earthGrad.addColorStop(0, 'rgba(8, 16, 32, 0.95)');
    earthGrad.addColorStop(0.85, 'rgba(10, 22, 42, 0.92)');
    earthGrad.addColorStop(1.0, 'rgba(14, 28, 54, 0.85)');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(groundCenter.x, groundCenter.y, groundR, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.lineTo(areaW, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 2. Atmospheric Sky Glow along Horizon
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(groundCenter.x, groundCenter.y, groundR, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();

    const atmosGlow = ctx.createRadialGradient(
      groundCenter.x, groundCenter.y, groundR - 8,
      groundCenter.x, groundCenter.y, groundR + 24
    );
    atmosGlow.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    atmosGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
    atmosGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = atmosGlow;
    ctx.beginPath();
    ctx.arc(groundCenter.x, groundCenter.y, groundR + 24, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.lineTo(areaW, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 3. Hand-Sketched Mountain Ridges in Distance
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const mountainStep = 28;
    for (let x = 60; x < areaW - 60; x += mountainStep) {
      const my = groundCenter.y - Math.sqrt(Math.max(0, groundR * groundR - Math.pow(x - groundCenter.x, 2)));
      const peakH = (Math.sin(x * 0.04) * 12) + (Math.cos(x * 0.09) * 8);
      if (x === 60) ctx.moveTo(x, my - peakH);
      else ctx.lineTo(x, my - peakH);
    }
    ctx.stroke();

    // 4. Curved Highway Road
    const roadR = groundR - 18;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(groundCenter.x, groundCenter.y, roadR, Math.PI * 1.2, Math.PI * 1.8, false);
    ctx.stroke();

    // Dashed center line along highway
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(groundCenter.x, groundCenter.y, roadR, Math.PI * 1.2, Math.PI * 1.8, false);
    ctx.stroke();
    ctx.setLineDash([]);

    // Terrain Tag
    const crestY = groundCenter.y - groundR;
    this.drawHandwrittenTag(ctx, areaW * 0.16, crestY + 50, 'JORDENS OVERFLATE (ZOOM-INN)', '#38bdf8');

    ctx.restore();
  },

  // Altitude Ruler & Physical Rejection Guide in 3D
  drawAltitudeRejectionGuide3D(ctx, projP1, projP2, areaW, height) {
    if (!projP1 || !projP2) return;
    ctx.save();

    // 1. Vertical Sketched Dimension Bracket connecting P1 and P2
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);

    const bracketX = Math.min(projP1.x, projP2.x) - 45;
    ctx.beginPath();
    ctx.moveTo(projP1.x, projP1.y);
    ctx.lineTo(bracketX, projP1.y);
    ctx.lineTo(bracketX, projP2.y);
    ctx.lineTo(projP2.x, projP2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Midpoint altitude distance callout
    const midY = (projP1.y + projP2.y) / 2;
    this.drawHandwrittenTag(
      ctx,
      bracketX - 10,
      midY,
      'Δh ≈ 12 400 km avstand',
      '#f43f5e'
    );

    // 2. Point 1: Valid ground location (Car on road)
    this.drawTargetPoint(ctx, projP1.x, projP1.y, '✔ PUNKT 1: BAKKEN (h = 84m)', '#10b981', 8);

    // 3. Point 2: Physically absurd space location (Rejected!)
    this.drawTargetPoint(ctx, projP2.x, projP2.y, '✖ PUNKT 2: I ROMMET (h ≈ 12 400 km)', '#f43f5e', 7);

    // Big red rejection cross over Point 2
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    const sz = 14;
    ctx.beginPath();
    ctx.moveTo(projP2.x - sz, projP2.y - sz);
    ctx.lineTo(projP2.x + sz, projP2.y + sz);
    ctx.moveTo(projP2.x + sz, projP2.y - sz);
    ctx.lineTo(projP2.x - sz, projP2.y + sz);
    ctx.stroke();

    // Clear explanation box
    const cardX = projP2.x + 28;
    const cardY = projP2.y + 14;
    ctx.fillStyle = 'rgba(6, 12, 22, 0.94)';
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, 260, 66);
    ctx.strokeRect(cardX, cardY, 260, 66);

    ctx.font = '700 10px "Fira Code", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('FORKASTES UMIDDELBART:', cardX + 12, cardY + 18);

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• En bil kjører på bakken (h ≈ 0-200m).', cardX + 12, cardY + 36);
    ctx.fillText('• Punkt 2 svever i tomt verdensrom!', cardX + 12, cardY + 52);

    ctx.restore();
  },

  // Hand-Drawn Target Marker
  drawTargetPoint(ctx, x, y, label = '', color = '#10b981', radius = 6) {
    ctx.save();
    ctx.translate(x, y);

    // Outer sketched ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Center filled dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(-radius * 2.3, 0); ctx.lineTo(radius * 2.3, 0);
    ctx.moveTo(0, -radius * 2.3); ctx.lineTo(0, radius * 2.3);
    ctx.stroke();

    if (label) {
      ctx.font = '700 10px "Fira Code", monospace';
      const w = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
      ctx.fillRect(radius * 2.4, -10, w + 12, 20);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.strokeRect(radius * 2.4, -10, w + 12, 20);

      ctx.fillStyle = color;
      ctx.fillText(label, radius * 2.4 + 6, 4);
    }
    ctx.restore();
  },

  // Detailed Hand-Sketched Satellite
  drawSatellite(ctx, x, y, id = 1, angle = 0, color = '#00f0ff', scale = 1, opacity = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(6, 12, 22, 0.95)';

    // Solar Wings with Individual Solar Cells (Grid Hatching)
    const w = 30, h = 13, off = 16;
    // Left Wing
    ctx.fillRect(-off - w, -h / 2, w, h);
    ctx.strokeRect(-off - w, -h / 2, w, h);
    // Right Wing
    ctx.fillRect(off, -h / 2, w, h);
    ctx.strokeRect(off, -h / 2, w, h);

    // Solar Cells Grid Lines (Blue pencil texture)
    ctx.strokeStyle = this.hexToRgba(color, 0.4);
    ctx.lineWidth = 0.8;
    for (let c = -off - w + 6; c < -off; c += 6) {
      ctx.beginPath(); ctx.moveTo(c, -h / 2); ctx.lineTo(c, h / 2); ctx.stroke();
    }
    for (let c = off + 6; c < off + w; c += 6) {
      ctx.beginPath(); ctx.moveTo(c, -h / 2); ctx.lineTo(c, h / 2); ctx.stroke();
    }

    // Struts & Central Body
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-off, 0); ctx.lineTo(off, 0);
    ctx.stroke();

    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeRect(-8, -8, 16, 16);

    // Gold Foil Texture in Satellite Center
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
    ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
    ctx.stroke();

    // Parabolic Dish Antenna
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 11, 9, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();

    // Antenna feed horn
    ctx.beginPath();
    ctx.moveTo(0, 11); ctx.lineTo(0, 16);
    ctx.stroke();

    // Radio Transmission Wavefront Arcs
    ctx.strokeStyle = this.hexToRgba(color, 0.6);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 14, 6, Math.PI * 0.25, Math.PI * 0.75, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 14, 11, Math.PI * 0.3, Math.PI * 0.7, false);
    ctx.stroke();

    // Center atomic clock beacon
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Label with ID & Frequency
    ctx.save();
    ctx.translate(x, y);
    ctx.font = '700 9px "Fira Code", monospace';
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.textAlign = 'center';
    ctx.fillText(`SV ${id < 10 ? '0' + id : id} (L1: 1575.42 MHz)`, 0, -18 * scale);
    ctx.restore();
  },

  // Detailed Hand-Sketched Car
  drawCar(ctx, x, y, angle = 0, color = '#10b981', scale = 1, isLocked = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // 1. Underbody Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Headlight Light Beam Cone (Forward illumination)
    const beamGrad = ctx.createRadialGradient(24, 6, 4, 80, 6, 60);
    beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    beamGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.12)');
    beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(22, 2);
    ctx.lineTo(85, -12);
    ctx.lineTo(85, 24);
    ctx.lineTo(22, 10);
    ctx.closePath();
    ctx.fill();

    // 3. Chassis Body
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(8, 14, 26, 0.96)';

    ctx.beginPath();
    ctx.moveTo(24, -4);
    ctx.quadraticCurveTo(28, 4, 24, 11);
    ctx.lineTo(16, 12);
    // Front wheel arch
    ctx.arc(11, 12, 6, Math.PI, 0, true);
    ctx.lineTo(-6, 12);
    // Rear wheel arch
    ctx.arc(-11, 12, 6, Math.PI, 0, true);
    ctx.lineTo(-24, 12);
    ctx.quadraticCurveTo(-28, 4, -24, -4);
    ctx.lineTo(-14, -6);
    // Sleek aerodynamic roofline
    ctx.quadraticCurveTo(-8, -15, 2, -15);
    ctx.quadraticCurveTo(12, -15, 18, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Aerodynamic Contour Hatching
    ctx.strokeStyle = this.hexToRgba(color, 0.35);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(16, 0);
    ctx.moveTo(-16, 4); ctx.lineTo(20, 4);
    ctx.stroke();

    // 5. Wheels (Tire treads & Rims)
    [-11, 11].forEach((wx) => {
      ctx.fillStyle = '#060a12';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(wx, 12, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rim spokes
      ctx.strokeStyle = this.hexToRgba(color, 0.6);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(wx - 4, 12); ctx.lineTo(wx + 4, 12);
      ctx.moveTo(wx, 12 - 4); ctx.lineTo(wx, 12 + 4);
      ctx.stroke();
    });

    // 6. Windshield & Windows
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(2, -13);
    ctx.lineTo(-10, -13);
    ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windshield reflection streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -8); ctx.lineTo(4, -12);
    ctx.stroke();

    // 7. Roof GPS Antenna Dome with Reception Waves
    ctx.fillStyle = isLocked ? '#10b981' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(-1, -15, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Expanding reception ripples
    if (isLocked) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-1, -15, 7, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-1, -15, 12, Math.PI * 1.2, Math.PI * 1.8, false);
      ctx.stroke();
    }

    ctx.restore();
  },

  // Ghost Car (Spøkelsesbil) caused by multipath/NLOS reflection
  drawGhostCar(ctx, x, y, angle = 0, scale = 1, opacity = 0.75, time = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    // 1. Shimmering Holographic Underbody Glow
    const glowGrad = ctx.createRadialGradient(0, 10, 2, 0, 10, 32);
    glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
    glowGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.12)');
    glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 12, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Phantom Chassis Fill
    ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
    ctx.beginPath();
    ctx.moveTo(24, -4);
    ctx.quadraticCurveTo(28, 4, 24, 11);
    ctx.lineTo(16, 12);
    ctx.arc(11, 12, 6, Math.PI, 0, true);
    ctx.lineTo(-6, 12);
    ctx.arc(-11, 12, 6, Math.PI, 0, true);
    ctx.lineTo(-24, 12);
    ctx.quadraticCurveTo(-28, 4, -24, -4);
    ctx.lineTo(-14, -6);
    ctx.quadraticCurveTo(-8, -15, 2, -15);
    ctx.quadraticCurveTo(12, -15, 18, -6);
    ctx.closePath();
    ctx.fill();

    // 3. Jittery Sketched Outline (Phantom / Glitch aesthetic)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Glitch Scanlines across Ghost Body
    const glitchJitter = Math.sin(time * 12) * 2;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18 + glitchJitter, -2); ctx.lineTo(22 + glitchJitter, -2);
    ctx.moveTo(-12 - glitchJitter, 3); ctx.lineTo(18 - glitchJitter, 3);
    ctx.stroke();

    // 5. Ghost Wheels (Dashed phantom circles)
    [-11, 11].forEach((wx) => {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(wx, 12, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 6. Blinking Warning Beacon on Ghost Antenna
    const blink = Math.sin(time * 8) > 0;
    ctx.fillStyle = blink ? '#f43f5e' : 'rgba(244, 63, 94, 0.3)';
    ctx.beginPath();
    ctx.arc(-1, -15, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Red warning ripples
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-1, -15, 8, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();

    ctx.restore();
  },

  // Glass Skyscraper Architecture (Architectural blueprint style with tinted glass & reflections)
  drawGlassBuilding(ctx, x, y, w, h, label, isReflecting = false, reflectPt = null, time = 0) {
    ctx.save();

    // 1. Dark Structural Core
    ctx.fillStyle = 'rgba(8, 16, 28, 0.94)';
    ctx.fillRect(x, y, w, h);

    // 2. Tinted Glass Facade
    const glassGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    glassGrad.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
    glassGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.10)');
    glassGrad.addColorStop(1, 'rgba(14, 165, 233, 0.20)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(x, y, w, h);

    // 3. Architectural Framing with Hand-Drawn Sketch Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1.6;
    this.sketchLine(ctx, { x, y }, { x: x + w, y }, 'rgba(56, 189, 248, 0.65)', 1.8, 1);
    this.sketchLine(ctx, { x: x + w, y }, { x: x + w, y: y + h }, 'rgba(56, 189, 248, 0.65)', 1.8, 1);
    this.sketchLine(ctx, { x: x + w, y: y + h }, { x, y: y + h }, 'rgba(56, 189, 248, 0.65)', 1.8, 1);
    this.sketchLine(ctx, { x, y: y + h }, { x, y }, 'rgba(56, 189, 248, 0.65)', 1.8, 1);

    // 4. Floor Slabs & Mullion Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1.0;
    const floorStep = 24;
    for (let fy = y + floorStep; fy < y + h - 10; fy += floorStep) {
      ctx.beginPath();
      ctx.moveTo(x + 4, fy); ctx.lineTo(x + w - 4, fy);
      ctx.stroke();
    }

    const colStep = 28;
    for (let cx = x + colStep; cx < x + w - 10; cx += colStep) {
      ctx.beginPath();
      ctx.moveTo(cx, y + 4); ctx.lineTo(cx, y + h - 4);
      ctx.stroke();
    }

    // 5. Diagonal Glossy Glass Sheen Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    const sheenSlant = 45;
    for (let sx = x - h; sx < x + w + h; sx += 80) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + sheenSlant, y + h);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Rooftop Communication Spire / Mechanical Penthouse
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.4;
    const roofMidX = x + w * 0.5;
    ctx.strokeRect(roofMidX - 16, y - 18, 32, 18);
    this.sketchLine(ctx, { x: roofMidX, y: y - 18 }, { x: roofMidX, y: y - 48 }, 'rgba(56, 189, 248, 0.7)', 1.5, 1);
    // Red beacon on top of antenna spire
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)';
    ctx.beginPath();
    ctx.arc(roofMidX, y - 48, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Architectural Label Tag
    if (label) {
      this.drawHandwrittenTag(ctx, roofMidX, y - 62, label, '#38bdf8');
    }

    // 8. If this building has active reflection: Draw Specular Reflection Glint & Normal Vector
    if (isReflecting && reflectPt) {
      // Specular Glint Starburst
      const glintPhase = (time * 4.0) % (Math.PI * 2);
      const glintSize = 7 + Math.sin(glintPhase) * 2;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(reflectPt.x, reflectPt.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(reflectPt.x - glintSize, reflectPt.y); ctx.lineTo(reflectPt.x + glintSize, reflectPt.y);
      ctx.moveTo(reflectPt.x, reflectPt.y - glintSize); ctx.lineTo(reflectPt.x, reflectPt.y + glintSize);
      ctx.stroke();

      // Normal Vector n̂ (perpendicular to glass facade)
      const normalEnd = { x: reflectPt.x - 36, y: reflectPt.y };
      this.sketchPencilArrow(ctx, reflectPt, normalEnd, '#fbbf24', 8, 1.4);
      this.drawHandwrittenTag(ctx, normalEnd.x - 14, normalEnd.y - 12, 'Normal n̂', '#fbbf24');
    }

    ctx.restore();
  }
};
