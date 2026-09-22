/**
 * sketch.js
 * "Papir og fargestift"-tegnemotor for GPS-visualiseringen
 * Gir levende, organiske og sjarmerende skisser i stedet for sterile datamaskinlinjer.
 */

// Hurtig pseudo-tilfeldig generator basert på koordinater for konsistent skissering
function pseudoRand(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Tegner en håndskissert linje med lett blyant/kritt-skjelving og to-pass strøk
 */
export function drawSketchLine(ctx, x1, y1, x2, y2, color = '#ffffff', width = 2, seed = 42) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return;

  const steps = Math.max(3, Math.floor(dist / 14));
  const perpX = -dy / dist;
  const perpY = dx / dist;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // To-pass: Første hovedstrøk og et lett overstrøk for blyant-/fargestiftfølelse
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalAlpha = pass === 0 ? 0.85 : 0.45;
    ctx.beginPath();
    ctx.moveTo(x1 + (pseudoRand(seed + pass * 17) - 0.5) * 1.5, y1 + (pseudoRand(seed + pass * 19) - 0.5) * 1.5);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      // Kurvet bue + tilfeldig skjelving
      const wobble = Math.sin(t * Math.PI) * 1.8 * (pseudoRand(seed + i * 3 + pass * 11) - 0.5);
      const px = x1 + dx * t + perpX * wobble;
      const py = y1 + dy * t + perpY * wobble;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x2 + (pseudoRand(seed + 99 + pass) - 0.5) * 1.5, y2 + (pseudoRand(seed + 101 + pass) - 0.5) * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Tegner en håndskissert sirkel med organisk ujevnhet og myk krittfølelse
 */
export function drawSketchCircle(ctx, cx, cy, r, color = '#38bdf8', width = 2.5, fillColor = null, seed = 13) {
  if (r <= 0) return;
  const segments = Math.max(24, Math.floor(r * 0.45));
  const step = (Math.PI * 2) / segments;

  ctx.save();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const theta = i * step;
      const radOffset = (pseudoRand(seed + i * 2) - 0.5) * 2;
      const x = cx + Math.cos(theta) * (r + radOffset);
      const y = cy + Math.sin(theta) * (r + radOffset);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dobbeltstrøk med overlappende ender som en ekte frihåndssirkel
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalAlpha = pass === 0 ? 0.9 : 0.5;
    ctx.beginPath();
    const overlapAngle = 0.35; // Håndtegnede sirkler overlapper litt i enden
    const totalAngle = Math.PI * 2 + overlapAngle;
    const totalSegs = Math.floor(totalAngle / step);

    for (let i = 0; i <= totalSegs; i++) {
      const theta = i * step;
      const wobble = (pseudoRand(seed + i * 5 + pass * 31) - 0.5) * (r > 60 ? 2.2 : 1.2);
      const x = cx + Math.cos(theta) * (r + wobble);
      const y = cy + Math.sin(theta) * (r + wobble);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Tegner en håndskissert pil for vektorer og signalretninger
 */
export function drawSketchArrow(ctx, x1, y1, x2, y2, color = '#ffffff', label = '', width = 2, seed = 7) {
  drawSketchLine(ctx, x1, y1, x2, y2, color, width, seed);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 14;
  const arrowAngle = Math.PI / 6;

  const hx1 = x2 - headLen * Math.cos(angle - arrowAngle);
  const hy1 = y2 - headLen * Math.sin(angle - arrowAngle);
  const hx2 = x2 - headLen * Math.cos(angle + arrowAngle);
  const hy2 = y2 - headLen * Math.sin(angle + arrowAngle);

  drawSketchLine(ctx, x2, y2, hx1, hy1, color, width * 1.1, seed + 1);
  drawSketchLine(ctx, x2, y2, hx2, hy2, color, width * 1.1, seed + 2);

  if (label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '13px "Courier New", "Caveat", "Segoe UI", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 6;
    ctx.fillText(label, midX, midY);
    ctx.restore();
  }
}

/**
 * Tegner en håndskissert målestokk / dimensjonslinje med piler og avstandstekst
 */
export function drawDimensionLine(ctx, x1, y1, x2, y2, label, color = '#e2e8f0', offset = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 5) return;

  const perpX = (-dy / dist) * offset;
  const perpY = (dx / dist) * offset;

  const px1 = x1 + perpX;
  const py1 = y1 + perpY;
  const px2 = x2 + perpX;
  const py2 = y2 + perpY;

  // Liten kryssmarkør i endepunktene
  const tickLen = 6;
  const tX = (-dy / dist) * tickLen;
  const tY = (dx / dist) * tickLen;
  drawSketchLine(ctx, px1 - tX, py1 - tY, px1 + tX, py1 + tY, color, 1.5, 41);
  drawSketchLine(ctx, px2 - tX, py2 - tY, px2 + tX, py2 + tY, color, 1.5, 42);

  // Selve dimensjonsstreken
  drawSketchLine(ctx, px1, py1, px2, py2, color, 1.5, 55);

  // Tekstetikett i senter med lesbar bakgrunn
  ctx.save();
  const midX = (px1 + px2) / 2;
  const midY = (py1 + py2) / 2;

  ctx.font = '600 13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);

  ctx.fillStyle = color;
  ctx.fillText(label, midX, midY);
  ctx.restore();
}

/**
 * Tegner en håndskissert trekant med skravering (f.eks. for feiltrekant eller geometriske beregninger)
 */
export function drawSketchTriangle(ctx, p1, p2, p3, strokeColor = '#f59e0b', fillColor = 'rgba(245, 158, 11, 0.2)', hatch = true) {
  ctx.save();

  // Fyll
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
  }

  // Skravering med fargestiftlinjer dersom ønsket
  if (hatch) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.clip();

    const minX = Math.min(p1.x, p2.x, p3.x) - 10;
    const maxX = Math.max(p1.x, p2.x, p3.x) + 10;
    const minY = Math.min(p1.y, p2.y, p3.y) - 10;
    const maxY = Math.max(p1.y, p2.y, p3.y) + 10;
    const spacing = 8;

    for (let x = minX; x < maxX + (maxY - minY); x += spacing) {
      drawSketchLine(ctx, x, minY, x - (maxY - minY), maxY, strokeColor, 1.2, x * 7);
    }
    ctx.restore();
  }

  // Ytterkanter
  drawSketchLine(ctx, p1.x, p1.y, p2.x, p2.y, strokeColor, 2, 101);
  drawSketchLine(ctx, p2.x, p2.y, p3.x, p3.y, strokeColor, 2, 102);
  drawSketchLine(ctx, p3.x, p3.y, p1.x, p1.y, strokeColor, 2, 103);

  ctx.restore();
}

/**
 * Tegner en vinkelbue med vinkelverdi
 */
export function drawSketchAngle(ctx, vertex, pA, pB, label = 'θ', color = '#fbbf24', radius = 24) {
  const angleA = Math.atan2(pA.y - vertex.y, pA.x - vertex.x);
  const angleB = Math.atan2(pB.y - vertex.y, pB.x - vertex.x);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, radius, Math.min(angleA, angleB), Math.max(angleA, angleB));
  ctx.stroke();

  const midAngle = (angleA + angleB) / 2;
  const textX = vertex.x + Math.cos(midAngle) * (radius + 12);
  const textY = vertex.y + Math.sin(midAngle) * (radius + 12);

  ctx.fillStyle = color;
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, textX, textY);
  ctx.restore();
}

/**
 * Tegner en sjarmerende håndtegnet bil med hjul, lykter og GPS-antenne
 */
export function drawSketchCar(ctx, x, y, angle = 0, color = '#f8fafc', isGhost = false, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const alpha = isGhost ? 0.5 : 1.0;
  ctx.globalAlpha = alpha;

  const carColor = isGhost ? '#c084fc' : color;
  const glassColor = isGhost ? 'rgba(192, 132, 252, 0.3)' : 'rgba(56, 189, 248, 0.4)';

  // Bilkarosseri - Skisset rektangel med avrundet tak
  const w = 46;
  const h = 22;

  // Hovedkropp
  ctx.fillStyle = isGhost ? 'rgba(192, 132, 252, 0.15)' : 'rgba(30, 41, 59, 0.9)';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 6);
  ctx.fill();

  // Skisserte linjer rundt bilkroppen
  drawSketchLine(ctx, -w / 2, -h / 2, w / 2, -h / 2, carColor, 2, 201);
  drawSketchLine(ctx, w / 2, -h / 2, w / 2, h / 2, carColor, 2, 202);
  drawSketchLine(ctx, w / 2, h / 2, -w / 2, h / 2, carColor, 2, 203);
  drawSketchLine(ctx, -w / 2, h / 2, -w / 2, -h / 2, carColor, 2, 204);

  // Frontrute og bakrute (sett ovenfra / isometrisk snitt)
  ctx.fillStyle = glassColor;
  ctx.fillRect(-w * 0.2, -h * 0.35, w * 0.4, h * 0.7);
  drawSketchLine(ctx, -w * 0.2, -h * 0.35, w * 0.2, -h * 0.35, carColor, 1.4, 205);
  drawSketchLine(ctx, -w * 0.2, h * 0.35, w * 0.2, h * 0.35, carColor, 1.4, 206);

  // Hjul (4 stk)
  const wheelW = 10;
  const wheelH = 5;
  const wheelColor = isGhost ? '#a855f7' : '#94a3b8';

  const wheels = [
    { x: -w * 0.35, y: -h / 2 - 2 },
    { x: w * 0.35, y: -h / 2 - 2 },
    { x: -w * 0.35, y: h / 2 - 3 },
    { x: w * 0.35, y: h / 2 - 3 }
  ];

  wheels.forEach((wh, idx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(wh.x - wheelW / 2, wh.y, wheelW, wheelH);
    drawSketchLine(ctx, wh.x - wheelW / 2, wh.y, wh.x + wheelW / 2, wh.y, wheelColor, 1.5, 300 + idx);
    drawSketchLine(ctx, wh.x - wheelW / 2, wh.y + wheelH, wh.x + wheelW / 2, wh.y + wheelH, wheelColor, 1.5, 310 + idx);
  });

  // GPS-antennemottaker på biltaket (liten pulserende eller lysende pinne/knapp)
  const antColor = isGhost ? '#e879f9' : '#38bdf8';
  ctx.fillStyle = antColor;
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  drawSketchCircle(ctx, 0, 0, 5, antColor, 1.5, null, 401);

  // Frontlykt-skjær dersom ikke spøkelse
  if (!isGhost) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    drawSketchLine(ctx, w / 2, -h * 0.3, w / 2 + 10, -h * 0.4, '#fef08a', 1.8, 450);
    drawSketchLine(ctx, w / 2, h * 0.3, w / 2 + 10, h * 0.4, '#fef08a', 1.8, 451);
  }

  // Hvis spøkelsesbil: Legg på "SPØKELSE (Multipath)" tekst
  if (isGhost) {
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#e879f9';
    ctx.textAlign = 'center';
    ctx.fillText('SPØKELSESPOSISJON', 0, -h - 8);
  }

  ctx.restore();
}

/**
 * Tegner en håndskissert GPS-satellitt med solcellepaneler og parabol/antenne
 */
export function drawSketchSatellite(ctx, x, y, angle = 0, label = 'SAT 1', color = '#38bdf8', scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Satellittkropp (gullfoliert kjerne)
  const bodyW = 20;
  const bodyH = 20;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

  // Skissert ramme
  drawSketchLine(ctx, -bodyW / 2, -bodyH / 2, bodyW / 2, -bodyH / 2, color, 2, 501);
  drawSketchLine(ctx, bodyW / 2, -bodyH / 2, bodyW / 2, bodyH / 2, color, 2, 502);
  drawSketchLine(ctx, bodyW / 2, bodyH / 2, -bodyW / 2, bodyH / 2, color, 2, 503);
  drawSketchLine(ctx, -bodyW / 2, bodyH / 2, -bodyW / 2, -bodyH / 2, color, 2, 504);

  // Solcellevinger (venstre og høyre)
  const panelW = 28;
  const panelH = 14;

  // Venstre vinge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(-bodyW / 2 - panelW - 4, -panelH / 2, panelW, panelH);
  drawSketchLine(ctx, -bodyW / 2 - panelW - 4, -panelH / 2, -bodyW / 2 - 4, -panelH / 2, color, 1.8, 510);
  drawSketchLine(ctx, -bodyW / 2 - 4, -panelH / 2, -bodyW / 2 - 4, panelH / 2, color, 1.8, 511);
  drawSketchLine(ctx, -bodyW / 2 - 4, panelH / 2, -bodyW / 2 - panelW - 4, panelH / 2, color, 1.8, 512);
  drawSketchLine(ctx, -bodyW / 2 - panelW - 4, panelH / 2, -bodyW / 2 - panelW - 4, -panelH / 2, color, 1.8, 513);
  // Celler på solpanelet
  drawSketchLine(ctx, -bodyW / 2 - panelW / 2 - 4, -panelH / 2, -bodyW / 2 - panelW / 2 - 4, panelH / 2, color, 1.2, 514);

  // Høyre vinge
  ctx.fillRect(bodyW / 2 + 4, -panelH / 2, panelW, panelH);
  drawSketchLine(ctx, bodyW / 2 + 4, -panelH / 2, bodyW / 2 + panelW + 4, -panelH / 2, color, 1.8, 520);
  drawSketchLine(ctx, bodyW / 2 + panelW + 4, -panelH / 2, bodyW / 2 + panelW + 4, panelH / 2, color, 1.8, 521);
  drawSketchLine(ctx, bodyW / 2 + panelW + 4, panelH / 2, bodyW / 2 + 4, panelH / 2, color, 1.8, 522);
  drawSketchLine(ctx, bodyW / 2 + 4, panelH / 2, bodyW / 2 + 4, -panelH / 2, color, 1.8, 523);
  drawSketchLine(ctx, bodyW / 2 + panelW / 2 + 4, -panelH / 2, bodyW / 2 + panelW / 2 + 4, panelH / 2, color, 1.2, 524);

  // Sendetrompet / antenne rettet ned mot jorden
  drawSketchLine(ctx, 0, bodyH / 2, 0, bodyH / 2 + 8, color, 2, 530);
  drawSketchLine(ctx, -6, bodyH / 2 + 8, 6, bodyH / 2 + 8, color, 2.2, 531);

  // Navnelapp
  ctx.save();
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -bodyH / 2 - 8);
  ctx.restore();

  ctx.restore();
}

/**
 * Tegner en stilig glassbygning med reflekterende fasade for multipath-ekko
 */
export function drawGlassBuilding(ctx, x, y, width, height, isReflecting = false) {
  ctx.save();
  // Bygningskropp i mørkt glass med fiolette/cyan reflekser
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(x, y, width, height);

  const frameColor = isReflecting ? '#e879f9' : '#64748b';
  drawSketchLine(ctx, x, y, x + width, y, frameColor, 2, 601);
  drawSketchLine(ctx, x + width, y, x + width, y + height, frameColor, 2, 602);
  drawSketchLine(ctx, x + width, y + height, x, y + height, frameColor, 2, 603);
  drawSketchLine(ctx, x, y + height, x, y, frameColor, 2, 604);

  // Glassvindu-rutenett med skisserte fargestiftstrøk
  const cols = 4;
  const rows = 8;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 1; r < rows; r++) {
    drawSketchLine(ctx, x, y + r * cellH, x + width, y + r * cellH, 'rgba(148, 163, 184, 0.35)', 1, 620 + r);
  }
  for (let c = 1; c < cols; c++) {
    drawSketchLine(ctx, x + c * cellW, y, x + c * cellW, y + height, 'rgba(148, 163, 184, 0.35)', 1, 640 + c);
  }

  // Reflekterende glasshinne på venstre fasade
  if (isReflecting) {
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    // Lysende glød på glasset
    ctx.save();
    ctx.shadowColor = '#e879f9';
    ctx.shadowBlur = 15;
    drawSketchLine(ctx, x, y, x, y + height, '#f472b6', 2, 660);
    ctx.restore();

    // Etikett
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#e879f9';
    ctx.textAlign = 'center';
    ctx.fillText('SPEILENDE GLASSFASADE', x + width / 2, y - 10);
  } else {
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('BYGNING', x + width / 2, y - 10);
  }

  ctx.restore();
}

/**
 * Tegner en jammer / støysender
 */
export function drawJammer(ctx, x, y, active = true, power = 1.0) {
  ctx.save();
  ctx.translate(x, y);

  const jammerColor = active ? '#ef4444' : '#64748b';

  // Stativ / trefot
  drawSketchLine(ctx, 0, 0, -12, 22, jammerColor, 2, 701);
  drawSketchLine(ctx, 0, 0, 12, 22, jammerColor, 2, 702);
  drawSketchLine(ctx, 0, 0, 0, 20, jammerColor, 2, 703);

  // Senderboks
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, -14, 20, 14);
  drawSketchLine(ctx, -10, -14, 10, -14, jammerColor, 2, 704);
  drawSketchLine(ctx, 10, -14, 10, 0, jammerColor, 2, 705);
  drawSketchLine(ctx, 10, 0, -10, 0, jammerColor, 2, 706);
  drawSketchLine(ctx, -10, 0, -10, -14, jammerColor, 2, 707);

  // Antenne
  drawSketchLine(ctx, 0, -14, 0, -32, jammerColor, 2.5, 708);
  drawSketchCircle(ctx, 0, -32, 3, jammerColor, 2, active ? '#f87171' : null, 709);

  // Jamming-bølger / interferens dersom aktiv
  if (active) {
    const waves = 4;
    for (let i = 1; i <= waves; i++) {
      const rad = 15 + i * 16 * power;
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, 0.9 - (i / waves) * 0.7);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, -32, rad, -Math.PI * 0.95, -Math.PI * 0.05);
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('GPS JAMMER (1575.42 MHz STØY)', 0, 36);
  }

  ctx.restore();
}

/**
 * Tegner Doppler-radiobølger med kompresjon (blåskift) eller ekspansjon (rødskift)
 */
export function drawDopplerWaves(ctx, satPos, carPos, vRadial = 0, time = 0) {
  const dx = carPos[0] - satPos[0];
  const dy = carPos[1] - satPos[1];
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const perpX = -ny;
  const perpY = nx;

  // Frekvenskompresjon: Hvis vRadial > 0 (nærmer seg), tettere bølger
  const baseWavelength = 24;
  const compression = 1 - (vRadial / 120); // Skalert for visuell tydelighet
  const waveLength = Math.max(8, baseWavelength * compression);

  // Farge basert på Doppler: Blåere ved tilnærming, rødere ved fjerning
  let waveColor = '#38bdf8';
  if (vRadial > 5) {
    waveColor = '#60a5fa'; // Blåskift
  } else if (vRadial < -5) {
    waveColor = '#f87171'; // Rødskift
  }

  ctx.save();
  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;

  const numWaves = Math.floor(dist / waveLength);
  const phase = (time * 1.5) % 1;

  for (let i = 0; i < numWaves; i++) {
    const t = (i + phase) / numWaves;
    if (t <= 0 || t >= 1) continue;

    const wx = satPos[0] + nx * (t * dist);
    const wy = satPos[1] + ny * (t * dist);
    const waveArcWidth = 14 + t * 20;

    // Liten bue for bølgefront
    ctx.beginPath();
    ctx.moveTo(wx - perpX * waveArcWidth, wy - perpY * waveArcWidth);
    ctx.quadraticCurveTo(wx + nx * 4, wy + ny * 4, wx + perpX * waveArcWidth, wy + perpY * waveArcWidth);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Tegner en kritt/skisse-tekstboks med ramme
 */
export function drawSketchNote(ctx, textLines, x, y, color = '#f8fafc', bgColor = 'rgba(15, 23, 42, 0.92)') {
  ctx.save();
  ctx.font = '13px "Courier New", monospace';
  const lineH = 18;
  const padding = 10;

  let maxW = 0;
  for (const line of textLines) {
    const w = ctx.measureText(line).width;
    if (w > maxW) maxW = w;
  }

  const boxW = maxW + padding * 2;
  const boxH = textLines.length * lineH + padding * 2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, boxW, boxH);

  drawSketchLine(ctx, x, y, x + boxW, y, color, 1.8, 801);
  drawSketchLine(ctx, x + boxW, y, x + boxW, y + boxH, color, 1.8, 802);
  drawSketchLine(ctx, x + boxW, y + boxH, x, y + boxH, color, 1.8, 803);
  drawSketchLine(ctx, x, y + boxH, x, y, color, 1.8, 804);

  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  textLines.forEach((line, idx) => {
    ctx.fillText(line, x + padding, y + padding + idx * lineH);
  });

  ctx.restore();
}

/**
 * Tegner bakgrunnsrutenett med kritt/teknisk millimeterpapir-mønster
 */
export function drawBlueprintGrid(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1;

  const gridSize = 40;
  ctx.beginPath();
  for (let x = 0; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Noen markante akser
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.beginPath();
  for (let x = 0; x < width; x += gridSize * 4) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize * 4) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  ctx.restore();
}
