/* ==========================================================================
   js/sketch.js — "Papir og fargestift" hand-drawn Canvas 2D rendering engine
   ========================================================================== */
(function (global) {
  'use strict';

  const GPSApp = (global.GPSApp = global.GPSApp || {});

  // Harmonious colored-pencil palette
  const PALETTE = {
    ink: '#26231e',
    pencil: '#4a443b',
    muted: '#8c8273',
    paper: '#faf6ee',
    sat1: '#2d6fb8',     // Cobalt blue
    sat1RGB: [45, 111, 184],
    sat2: '#d95b49',     // Terracotta coral
    sat2RGB: [217, 91, 73],
    sat3: '#348c64',     // Sage emerald
    sat3RGB: [52, 140, 100],
    sat4: '#cf8b23',     // Warm ochre amber
    sat4RGB: [207, 139, 35],
    violet: '#7c52a8',   // Mix / highlight accent
    violetRGB: [124, 82, 168],
    glass: '#6ea8c9',
    jamRed: '#c8372d',
    road: '#70685c',
    earthOcean: '#5b8fb9',
    earthLand: '#739e6d',
  };

  // Deterministic fast hash -> [-1, 1]
  function hashSigned(n) {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return (x - Math.floor(x)) * 2 - 1;
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function easeOutCubic(t) {
    const u = 1 - clamp(t, 0, 1);
    return 1 - u * u * u;
  }

  function easeInOutCubic(t) {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function rgba(rgb, a) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  }

  function mixRGB(a, b, t) {
    return [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];
  }

  // Pre-rendered warm paper grain tile
  let paperPatternCanvas = null;
  function getPaperTile() {
    if (paperPatternCanvas) return paperPatternCanvas;
    const size = 220;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < size * size; i++) {
      const n = hashSigned(i * 0.73) * 7;
      const speck = hashSigned(i * 3.17) > 0.96 ? -14 : 0;
      const base = 248 + n + speck;
      const idx = i * 4;
      d[idx] = clamp(base + 2, 0, 255);
      d[idx + 1] = clamp(base - 2, 0, 255);
      d[idx + 2] = clamp(base - 10, 0, 255);
      d[idx + 3] = 28; // Subtle paper tooth overlay
    }
    g.putImageData(img, 0, 0);
    // Faint sketchbook fiber strokes
    g.strokeStyle = 'rgba(120, 104, 82, 0.045)';
    g.lineWidth = 0.7;
    for (let i = 0; i < 36; i++) {
      const x = ((i * 53) % size);
      const y = ((i * 97) % size);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + hashSigned(i + 5) * 14, y + hashSigned(i + 19) * 6);
      g.stroke();
    }
    paperPatternCanvas = c;
    return c;
  }

  function drawPaperBackground(ctx, w, h) {
    // Warm cream radial paper wash
    const grad = ctx.createRadialGradient(w * 0.36, h * 0.46, 40, w * 0.45, h * 0.5, Math.max(w, h) * 0.78);
    grad.addColorStop(0, '#fdfaf3');
    grad.addColorStop(0.62, '#f7f1e5');
    grad.addColorStop(1, '#ede4d3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain pattern
    const pat = ctx.createPattern(getPaperTile(), 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }

    // Very faint architectural notebook dot grid in background
    ctx.fillStyle = 'rgba(125, 114, 96, 0.11)';
    const step = 36;
    for (let y = 24; y < h; y += step) {
      for (let x = 24; x < w; x += step) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  }

  // Hand-drawn crayon/pencil line with progressive draw-on (progress 0..1)
  function sketchLine(ctx, x1, y1, x2, y2, opts) {
    const o = opts || {};
    const prog = o.progress !== undefined ? clamp(o.progress, 0, 1) : 1;
    if (prog <= 0.001) return;

    const ex = lerp(x1, x2, prog);
    const ey = lerp(y1, y2, prog);
    const dx = ex - x1;
    const dy = ey - y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;

    const nx = -dy / len;
    const ny = dx / len;
    const roughness = o.roughness !== undefined ? o.roughness : 1.4;
    const strokes = o.strokes !== undefined ? o.strokes : 2;
    const seed = o.seed !== undefined ? o.seed : 1;
    const steps = Math.max(4, Math.min(28, Math.floor(len / 18)));

    ctx.save();
    ctx.strokeStyle = o.color || PALETTE.ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);

    for (let s = 0; s < strokes; s++) {
      ctx.lineWidth = (o.lineWidth || 2) * (s === 0 ? 1 : 0.72);
      ctx.globalAlpha = (o.alpha !== undefined ? o.alpha : 1) * (s === 0 ? 0.92 : 0.45);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const env = Math.sin(t * Math.PI); // Taper wobble at endpoints
        const wob = hashSigned(seed * 31.7 + s * 17.3 + i * 5.9) * roughness * (0.35 + 0.65 * env);
        const bow = Math.sin(t * Math.PI) * hashSigned(seed * 13.1 + s * 7.7) * roughness * 0.75;
        const px = x1 + dx * t + nx * (wob + bow);
        const py = y1 + dy * t + ny * (wob + bow);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hand-drawn polyline / smooth curve through points
  function sketchPolyline(ctx, pts, opts) {
    if (!pts || pts.length < 2) return;
    const o = opts || {};
    const prog = o.progress !== undefined ? clamp(o.progress, 0, 1) : 1;
    if (prog <= 0.001) return;

    const totalSegs = pts.length - 1;
    const maxIdx = prog * totalSegs;
    const roughness = o.roughness !== undefined ? o.roughness : 1.1;
    const strokes = o.strokes !== undefined ? o.strokes : 2;
    const seed = o.seed || 7;

    ctx.save();
    ctx.strokeStyle = o.color || PALETTE.ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);

    for (let s = 0; s < strokes; s++) {
      ctx.lineWidth = (o.lineWidth || 2) * (s === 0 ? 1 : 0.68);
      ctx.globalAlpha = (o.alpha !== undefined ? o.alpha : 1) * (s === 0 ? 0.92 : 0.42);
      ctx.beginPath();
      const whole = Math.floor(maxIdx);
      const frac = maxIdx - whole;
      for (let i = 0; i <= Math.min(whole, totalSegs); i++) {
        const wobX = hashSigned(seed * 19 + s * 11 + i * 3.1) * roughness;
        const wobY = hashSigned(seed * 23 + s * 13 + i * 4.7) * roughness;
        const px = pts[i].x + wobX;
        const py = pts[i].y + wobY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      if (whole < totalSegs && frac > 0.001) {
        const p0 = pts[whole];
        const p1 = pts[whole + 1];
        ctx.lineTo(lerp(p0.x, p1.x, frac), lerp(p0.y, p1.y, frac));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hand-drawn circle with optional soft colored-pencil wash fill
  function sketchCircle(ctx, cx, cy, r, opts) {
    if (r <= 0.5) return;
    const o = opts || {};
    const prog = o.progress !== undefined ? clamp(o.progress, 0, 1) : 1;
    if (prog <= 0.001) return;

    const roughness = o.roughness !== undefined ? o.roughness : 1.5;
    const strokes = o.strokes !== undefined ? o.strokes : 2;
    const seed = o.seed !== undefined ? o.seed : 3;
    const alpha = o.alpha !== undefined ? o.alpha : 1;

    ctx.save();
    if (o.fill && prog > 0.15) {
      ctx.globalAlpha = alpha * smoothstep(0.15, 0.7, prog);
      ctx.fillStyle = o.fill;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (o.stroke !== false) {
      ctx.strokeStyle = o.color || PALETTE.ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (o.dash) ctx.setLineDash(o.dash);

      const segs = Math.max(36, Math.min(110, Math.round(r * 0.55)));
      const startAngle = o.startAngle !== undefined ? o.startAngle : -Math.PI * 0.5;
      const totalAngle = Math.PI * 2 * prog;

      for (let s = 0; s < strokes; s++) {
        ctx.lineWidth = (o.lineWidth || 2.1) * (s === 0 ? 1 : 0.7);
        ctx.globalAlpha = alpha * (s === 0 ? 0.92 : 0.42);
        ctx.beginPath();
        const overlap = prog >= 0.999 ? 0.09 : 0;
        const maxSteps = Math.max(2, Math.ceil(segs * prog));
        for (let i = 0; i <= maxSteps; i++) {
          const frac = i / maxSteps;
          const ang = startAngle + frac * (totalAngle + overlap);
          // Smooth periodic wobble so the circle closes cleanly
          const w1 = Math.sin(ang * 3 + seed + s * 2.1) * roughness * 0.7;
          const w2 = Math.cos(ang * 5 - seed * 1.7 + s * 3.3) * roughness * 0.42;
          const rr = r + w1 + w2;
          const px = cx + Math.cos(ang) * rr;
          const py = cy + Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Hand-drawn arc (great for angle markers)
  function sketchArc(ctx, cx, cy, r, a0, a1, opts) {
    const o = opts || {};
    const prog = o.progress !== undefined ? clamp(o.progress, 0, 1) : 1;
    if (prog <= 0.001 || r <= 1) return;

    const endA = lerp(a0, a1, prog);
    const steps = Math.max(8, Math.ceil(Math.abs(endA - a0) * r * 0.18));
    const roughness = o.roughness !== undefined ? o.roughness : 0.9;
    const seed = o.seed || 11;

    ctx.save();
    ctx.strokeStyle = o.color || PALETTE.ink;
    ctx.lineWidth = o.lineWidth || 1.7;
    ctx.globalAlpha = o.alpha !== undefined ? o.alpha : 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = lerp(a0, endA, i / steps);
      const rr = r + Math.sin(a * 6 + seed) * roughness;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Hand-drawn arrow
  function sketchArrow(ctx, x1, y1, x2, y2, opts) {
    const o = opts || {};
    const prog = o.progress !== undefined ? clamp(o.progress, 0, 1) : 1;
    if (prog <= 0.01) return;
    sketchLine(ctx, x1, y1, x2, y2, o);

    if (prog > 0.72) {
      const headProg = smoothstep(0.72, 1, prog);
      const ex = lerp(x1, x2, prog);
      const ey = lerp(y1, y2, prog);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const headLen = (o.headSize || 10) * headProg;
      const spread = 0.45;
      sketchLine(
        ctx,
        ex,
        ey,
        ex - Math.cos(ang - spread) * headLen,
        ey - Math.sin(ang - spread) * headLen,
        Object.assign({}, o, { progress: 1, strokes: 1, roughness: 0.6, seed: (o.seed || 1) + 9 })
      );
      sketchLine(
        ctx,
        ex,
        ey,
        ex - Math.cos(ang + spread) * headLen,
        ey - Math.sin(ang + spread) * headLen,
        Object.assign({}, o, { progress: 1, strokes: 1, roughness: 0.6, seed: (o.seed || 1) + 17 })
      );
    }
  }

  // Hand-drawn colored-pencil hatching inside a convex polygon (e.g., error triangle!)
  function sketchHatchPolygon(ctx, pts, opts) {
    if (!pts || pts.length < 3) return;
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 0.7;
    const spacing = o.spacing || 6.5;

    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();

    if (o.fill) {
      ctx.globalAlpha = alpha * 0.42;
      ctx.fillStyle = o.fill;
      ctx.fill();
    }

    ctx.clip();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const diag = Math.hypot(maxX - minX, maxY - minY) + 20;
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const angle = o.angle !== undefined ? o.angle : -Math.PI * 0.25;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    ctx.strokeStyle = o.color || PALETTE.sat2;
    ctx.lineWidth = o.lineWidth || 1.6;
    ctx.globalAlpha = alpha * 0.72;
    ctx.lineCap = 'round';
    for (let d = -diag * 0.6; d <= diag * 0.6; d += spacing) {
      const px = cx - sa * d;
      const py = cy + ca * d;
      const x1 = px - ca * diag * 0.6;
      const y1 = py - sa * diag * 0.6;
      const x2 = px + ca * diag * 0.6;
      const y2 = py + sa * diag * 0.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // Crisp sketchy border
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      sketchLine(ctx, a.x, a.y, b.x, b.y, {
        color: o.color || PALETTE.sat2,
        lineWidth: o.borderWidth || 2.1,
        alpha: alpha,
        roughness: 0.85,
        seed: 41 + i * 7,
      });
    }
  }

  // Handwritten math / diagram label with subtle paper halo
  function drawMathLabel(ctx, text, x, y, opts) {
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const size = o.size || 20;
    const family = o.serif
      ? "'Fraunces', Georgia, serif"
      : o.sans
      ? "'Plus Jakarta Sans', sans-serif"
      : "'Caveat', cursive";
    const weight = o.weight || (o.sans ? '600' : '600');
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.baseline || 'middle';

    // Soft paper halo so text reads effortlessly over colored washes
    if (o.halo !== false) {
      ctx.lineWidth = o.haloWidth || 5.5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(250, 246, 238, 0.88)';
      ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = o.color || PALETTE.ink;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Charming hand-drawn car (side-profile or gently tilted along road)
  function drawCar(ctx, x, y, angle, opts) {
    const o = opts || {};
    const scale = o.scale || 1;
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    const ghost = !!o.ghost;
    const bodyColor = ghost ? 'rgba(130, 120, 145, 0.32)' : (o.color || '#d66853');
    const strokeColor = ghost ? 'rgba(96, 82, 118, 0.72)' : PALETTE.ink;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Ground shadow
    if (!ghost) {
      ctx.fillStyle = 'rgba(38, 35, 30, 0.13)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 24, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Car body fill (crayon feel)
    ctx.beginPath();
    ctx.moveTo(-22, 5);
    ctx.lineTo(-22, -2);
    ctx.quadraticCurveTo(-17, -4, -12, -5);
    ctx.lineTo(-7, -13);
    ctx.quadraticCurveTo(0, -15, 9, -13);
    ctx.lineTo(14, -5);
    ctx.quadraticCurveTo(21, -4, 23, 0);
    ctx.lineTo(23, 6);
    ctx.closePath();
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // Windows
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-6, -11.5);
    ctx.lineTo(7, -11.5);
    ctx.lineTo(11.5, -5);
    ctx.closePath();
    ctx.fillStyle = ghost ? 'rgba(205, 222, 238, 0.35)' : 'rgba(220, 238, 248, 0.88)';
    ctx.fill();

    // Hand-drawn body outline
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (ghost) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-22, 5);
    ctx.lineTo(-22, -2);
    ctx.quadraticCurveTo(-17, -4.5, -12, -5);
    ctx.lineTo(-7, -13);
    ctx.quadraticCurveTo(0, -15.2, 9, -13);
    ctx.lineTo(14, -5);
    ctx.quadraticCurveTo(21, -4, 23, 0);
    ctx.lineTo(23, 6);
    ctx.lineTo(-22, 5.5);
    ctx.stroke();

    // Window divider
    ctx.beginPath();
    ctx.moveTo(0.5, -12);
    ctx.lineTo(0.5, -5);
    ctx.stroke();

    // Wheels
    ctx.setLineDash([]);
    [-12.5, 13].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, 6.5, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = ghost ? 'rgba(90, 82, 102, 0.3)' : '#3a352f';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(wx, 6.5, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = '#ede5d7';
      ctx.fill();
    });

    // Little roof GPS receiver dot
    if (!ghost) {
      ctx.beginPath();
      ctx.arc(1, -15.5, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.sat1;
      ctx.fill();
      ctx.strokeStyle = PALETTE.paper;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Hand-drawn GPS satellite with solar panels & dish
  function drawSatellite(ctx, x, y, opts) {
    const o = opts || {};
    const scale = o.scale || 1;
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    const color = o.color || PALETTE.sat1;
    const angle = o.angle !== undefined ? o.angle : -0.35;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Soft colored-pencil halo behind satellite
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    halo.addColorStop(0, color + '36');
    halo.addColorStop(1, color + '00');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(angle);

    // Solar wings (left & right)
    ctx.fillStyle = color + '33';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    [-1, 1].forEach((dir) => {
      const bx = dir * 9;
      ctx.beginPath();
      ctx.rect(dir > 0 ? bx : bx - 17, -6.5, 17, 13);
      ctx.fill();
      ctx.stroke();

      // Solar grid lines
      ctx.beginPath();
      ctx.moveTo(dir > 0 ? bx + 5.7 : bx - 5.7, -6.5);
      ctx.lineTo(dir > 0 ? bx + 5.7 : bx - 5.7, 6.5);
      ctx.moveTo(dir > 0 ? bx + 11.4 : bx - 11.4, -6.5);
      ctx.lineTo(dir > 0 ? bx + 11.4 : bx - 11.4, 6.5);
      ctx.moveTo(dir > 0 ? bx : bx - 17, 0);
      ctx.lineTo(dir > 0 ? bx + 17 : bx, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
    });

    // Central satellite bus
    ctx.fillStyle = '#efe6d5';
    ctx.beginPath();
    ctx.rect(-7.5, -7.5, 15, 15);
    ctx.fill();
    ctx.stroke();

    // Colored core dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Antenna dish pointing down
    ctx.beginPath();
    ctx.moveTo(0, 7.5);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 13.5, 4.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.restore();

    if (o.label) {
      drawMathLabel(ctx, o.label, x + (o.labelDx || 0), y + (o.labelDy || -28), {
        color: color,
        size: o.labelSize || 19,
        alpha: alpha,
      });
    }
  }

  // Hand-drawn intersection highlight dot (solid, vivid, never dashed)
  function drawIntersectionPoint(ctx, x, y, opts) {
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    const color = o.color || PALETTE.violet;
    const radius = o.radius || 7;
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Soft luminous glow
    const glow = ctx.createRadialGradient(x, y, 1, x, y, radius * 2.8);
    glow.addColorStop(0, color + '66');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Solid outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = PALETTE.paper;
    ctx.stroke();

    // Inner bright dot
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  // Hand-drawn modern glass skyscraper for multipath/echo scene
  function drawGlassBuilding(ctx, x, y, w, h, opts) {
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Translucent cool glass tint
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(130, 186, 214, 0.38)');
    grad.addColorStop(0.5, 'rgba(176, 218, 236, 0.24)');
    grad.addColorStop(1, 'rgba(95, 148, 179, 0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Diagonal glass sheen streaks
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 5;
    for (let i = -h; i < w + h; i += 34) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i - h * 0.45, y + h);
      ctx.stroke();
    }
    ctx.restore();

    // Window mullions
    const cols = Math.max(3, Math.round(w / 22));
    const rows = Math.max(4, Math.round(h / 24));
    for (let c = 1; c < cols; c++) {
      const gx = x + (w * c) / cols;
      sketchLine(ctx, gx, y + 4, gx, y + h - 4, {
        color: '#4c7c96',
        lineWidth: 1,
        alpha: 0.42 * alpha,
        strokes: 1,
        roughness: 0.6,
        seed: 200 + c,
      });
    }
    for (let r = 1; r < rows; r++) {
      const gy = y + (h * r) / rows;
      sketchLine(ctx, x + 4, gy, x + w - 4, gy, {
        color: '#4c7c96',
        lineWidth: 1,
        alpha: 0.38 * alpha,
        strokes: 1,
        roughness: 0.6,
        seed: 300 + r,
      });
    }

    // Hand-drawn exterior frame
    sketchLine(ctx, x, y, x + w, y, { color: PALETTE.ink, lineWidth: 2.1, alpha, seed: 101 });
    sketchLine(ctx, x + w, y, x + w, y + h, { color: PALETTE.ink, lineWidth: 2.1, alpha, seed: 102 });
    sketchLine(ctx, x + w, y + h, x, y + h, { color: PALETTE.ink, lineWidth: 2.1, alpha, seed: 103 });
    sketchLine(ctx, x, y + h, x, y, { color: PALETTE.ink, lineWidth: 2.1, alpha, seed: 104 });

    ctx.restore();
  }

  // Hand-drawn ground radar / control station on Earth's surface
  function drawGroundStation(ctx, x, y, normalAngle, opts) {
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    const scale = o.scale || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(normalAngle + Math.PI * 0.5);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Base house
    ctx.fillStyle = '#e8dfd0';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.rect(-7, -6, 14, 7);
    ctx.fill();
    ctx.stroke();

    // Mast & parabolic dish
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -13);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -16, 7, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -14, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.sat2;
    ctx.fill();

    ctx.restore();
  }

  // Hand-drawn sinusoidal radio wave between two points (with custom wavelength for Doppler!)
  function drawWaveLine(ctx, x1, y1, x2, y2, opts) {
    const o = opts || {};
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const wavelength = o.wavelength || 22;
    const amp = o.amp !== undefined ? o.amp : 5.5;
    const phase = o.phase || 0;
    const steps = Math.max(24, Math.floor(len / 3));

    ctx.save();
    ctx.strokeStyle = o.color || PALETTE.sat1;
    ctx.lineWidth = o.lineWidth || 2;
    ctx.globalAlpha = o.alpha !== undefined ? o.alpha : 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const d = (i / steps) * len;
      const env = smoothstep(0, 18, d) * smoothstep(0, 18, len - d);
      const s = Math.sin((d / wavelength) * Math.PI * 2 - phase) * amp * env;
      const px = x1 + ux * d + nx * s;
      const py = y1 + uy * d + ny * s;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Hand-drawn roadside jammer transmitter
  function drawJammer(ctx, x, y, t, intensity, opts) {
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    // Small rugged box/antenna mast
    ctx.fillStyle = '#4e4740';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.rect(-13, -10, 26, 18);
    ctx.fill();
    ctx.stroke();

    // Mast
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -34);
    ctx.stroke();

    // Antenna tip
    ctx.beginPath();
    ctx.arc(0, -36, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = intensity > 0.1 ? PALETTE.jamRed : '#8c8273';
    ctx.fill();
    ctx.stroke();

    // Chaotic crayon noise rings when active
    if (intensity > 0.02) {
      for (let k = 0; k < 5; k++) {
        const cycle = ((t * 1.45 + k * 0.2) % 1);
        const r = 12 + cycle * 210 * intensity;
        const a = (1 - cycle) * 0.62 * intensity;
        ctx.strokeStyle = PALETTE.jamRed;
        ctx.lineWidth = 2.2 * (1 - cycle * 0.45);
        ctx.globalAlpha = a * alpha;
        ctx.beginPath();
        const segs = 48;
        for (let i = 0; i <= segs; i++) {
          const ang = (i / segs) * Math.PI * 2;
          const jag = Math.sin(ang * 13 + t * 9 + k * 4) * (3.5 + cycle * 9) * intensity;
          const px = Math.cos(ang) * (r + jag);
          const py = -36 + Math.sin(ang) * (r + jag);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Exact 2D circle-circle intersection points
  function circleIntersections(x0, y0, r0, x1, y1, r1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.hypot(dx, dy);
    if (d > r0 + r1 || d < Math.abs(r0 - r1) || d < 1e-6) return [];
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    const hSq = r0 * r0 - a * a;
    if (hSq < 0) return [];
    const h = Math.sqrt(Math.max(0, hSq));
    const xm = x0 + (a * dx) / d;
    const ym = y0 + (a * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
    return [
      { x: xm + rx, y: ym + ry },
      { x: xm - rx, y: ym - ry },
    ];
  }

  GPSApp.Sketch = {
    PALETTE,
    hashSigned,
    clamp,
    lerp,
    smoothstep,
    easeOutCubic,
    easeInOutCubic,
    rgba,
    mixRGB,
    drawPaperBackground,
    sketchLine,
    sketchPolyline,
    sketchCircle,
    sketchArc,
    sketchArrow,
    sketchHatchPolygon,
    drawMathLabel,
    drawCar,
    drawSatellite,
    drawIntersectionPoint,
    drawGlassBuilding,
    drawGroundStation,
    drawWaveLine,
    drawJammer,
    circleIntersections,
  };
})(window);
