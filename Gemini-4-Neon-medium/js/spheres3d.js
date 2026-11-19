/* ==========================================================================
   js/spheres3d.js — Analytical 3D Translucent Spheres & Exact Intersections
   ========================================================================== */
(function (global) {
  'use strict';

  const GPSApp = (global.GPSApp = global.GPSApp || {});

  // Offscreen buffer for smooth volumetric translucent ray-shaded spheres
  let bufCanvas = null;
  let bufCtx = null;
  let bufImg = null;
  let bufW = 0;
  let bufH = 0;

  function ensureBuffer(w, h) {
    if (bufW === w && bufH === h && bufCanvas) return;
    bufW = w;
    bufH = h;
    bufCanvas = document.createElement('canvas');
    bufCanvas.width = w;
    bufCanvas.height = h;
    bufCtx = bufCanvas.getContext('2d');
    bufImg = bufCtx.createImageData(w, h);
  }

  // Vector helpers
  function vSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function vAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function vScale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function vDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vCross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function vLen(a) { return Math.hypot(a[0], a[1], a[2]); }
  function vNorm(a) {
    const l = vLen(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  // Build camera basis from yaw, pitch, distance, target
  function makeCamera(yaw, pitch, dist, target, fov) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const pos = [
      target[0] + dist * cp * sy,
      target[1] + dist * sp,
      target[2] + dist * cp * cy,
    ];
    const forward = vNorm(vSub(target, pos));
    const worldUp = [0, 1, 0];
    const right = vNorm(vCross(forward, worldUp));
    const up = vCross(right, forward);
    const tanHalfFov = Math.tan((fov || 38) * Math.PI / 360);
    return { pos, forward, right, up, tanHalfFov, target, dist };
  }

  // Project 3D world point -> 2D viewport pixel {x, y, z, scale}
  function projectPoint(p, cam, vp) {
    const rel = vSub(p, cam.pos);
    const z = vDot(rel, cam.forward);
    if (z <= 0.1) return null;
    const xCam = vDot(rel, cam.right);
    const yCam = vDot(rel, cam.up);
    const f = (vp.h * 0.5) / cam.tanHalfFov;
    return {
      x: vp.cx + (xCam / z) * f,
      y: vp.cy - (yCam / z) * f,
      z: z,
      scale: f / z,
    };
  }

  // Exact analytical intersection circle between two 3D spheres
  function sphereSphereCircle(s1, s2) {
    const diff = vSub(s2.c, s1.c);
    const d = vLen(diff);
    if (d < 1e-5 || d >= s1.r + s2.r || d <= Math.abs(s1.r - s2.r)) return null;
    const a = (s1.r * s1.r - s2.r * s2.r + d * d) / (2 * d);
    const hSq = s1.r * s1.r - a * a;
    if (hSq <= 1e-6) return null;
    const h = Math.sqrt(hSq);
    const n = vScale(diff, 1 / d);
    const center = vAdd(s1.c, vScale(n, a));
    // Orthonormal basis (u, v) in circle plane
    const ref = Math.abs(n[1]) < 0.85 ? [0, 1, 0] : [1, 0, 0];
    const u = vNorm(vCross(n, ref));
    const v = vCross(n, u);
    return { center, r: h, n, u, v };
  }

  // Exact analytical intersection points of 3 spheres (0, 1, or 2 points)
  function threeSpherePoints(s1, s2, s3) {
    const circ = sphereSphereCircle(s1, s2);
    if (!circ) return [];
    const m = vSub(circ.center, s3.c);
    const A = 2 * circ.r * vDot(m, circ.u);
    const B = 2 * circ.r * vDot(m, circ.v);
    const C = s3.r * s3.r - vDot(m, m) - circ.r * circ.r;
    const mag = Math.hypot(A, B);
    if (mag < 1e-6) return [];
    const ratio = C / mag;
    if (Math.abs(ratio) > 1.0001) return [];
    const clamped = Math.max(-1, Math.min(1, ratio));
    const base = Math.atan2(B, A);
    const delta = Math.acos(clamped);
    const angles = delta < 1e-4 ? [base] : [base + delta, base - delta];
    return angles.map((ang) =>
      vAdd(
        circ.center,
        vAdd(vScale(circ.u, circ.r * Math.cos(ang)), vScale(circ.v, circ.r * Math.sin(ang)))
      )
    );
  }

  // Render translucent ray-shaded spheres (no hard outer boundary ring, smooth color mixing)
  function renderTranslucentSpheres(ctx, spheres, cam, vp) {
    const active = spheres.filter((s) => s.alpha > 0.01 && s.r > 0.02);
    if (active.length === 0) return;

    // Choose crisp yet fast offscreen resolution
    const aspect = vp.w / Math.max(1, vp.h);
    const rh = 240;
    const rw = Math.max(160, Math.round(rh * aspect));
    ensureBuffer(rw, rh);

    const data = bufImg.data;
    // Clear buffer
    data.fill(0);

    // Precompute sphere terms relative to camera position
    const lightDir = vNorm([0.45, 0.78, 0.44]);
    const pre = active.map((s) => {
      const oc = vSub(cam.pos, s.c);
      const ocDotOc = vDot(oc, oc) - s.r * s.r;
      return {
        c: s.c,
        r: s.r,
        invR: 1 / s.r,
        rgb: s.rgb,
        alpha: s.alpha,
        oc: oc,
        cTerm: ocDotOc,
      };
    });

    const fY = cam.tanHalfFov;
    const fX = fY * aspect;
    const hits = new Array(pre.length);

    for (let py = 0; py < rh; py++) {
      const ndcY = 1 - ((py + 0.5) / rh) * 2;
      const sy = ndcY * fY;
      for (let px = 0; px < rw; px++) {
        const ndcX = ((px + 0.5) / rw) * 2 - 1;
        const sx = ndcX * fX;

        // Ray direction (normalized)
        let dx = cam.forward[0] + cam.right[0] * sx + cam.up[0] * sy;
        let dy = cam.forward[1] + cam.right[1] * sx + cam.up[1] * sy;
        let dz = cam.forward[2] + cam.right[2] * sx + cam.up[2] * sy;
        const invLen = 1 / Math.hypot(dx, dy, dz);
        dx *= invLen;
        dy *= invLen;
        dz *= invLen;

        let hitCount = 0;
        for (let i = 0; i < pre.length; i++) {
          const sp = pre[i];
          const b = sp.oc[0] * dx + sp.oc[1] * dy + sp.oc[2] * dz;
          const disc = b * b - sp.cTerm;
          if (disc > 0) {
            const sq = Math.sqrt(disc);
            const t0 = Math.max(0.05, -b - sq);
            const t1 = -b + sq;
            if (t1 > t0) {
              // Normalized chord thickness (0 smoothly at silhouette, 1 at center -> no hard circle outline!)
              const thick = (t1 - t0) * 0.5 * sp.invR;
              // Front surface normal for soft volumetric shading
              const hx = cam.pos[0] + dx * t0 - sp.c[0];
              const hy = cam.pos[1] + dy * t0 - sp.c[1];
              const hz = cam.pos[2] + dz * t0 - sp.c[2];
              const nx = hx * sp.invR;
              const ny = hy * sp.invR;
              const nz = hz * sp.invR;

              const diff = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2]);
              // Soft glossy highlight
              const hvx = lightDir[0] - dx;
              const hvy = lightDir[1] - dy;
              const hvz = lightDir[2] - dz;
              const hvInv = 1 / (Math.hypot(hvx, hvy, hvz) || 1);
              const spec = Math.pow(
                Math.max(0, (nx * hvx + ny * hvy + nz * hvz) * hvInv),
                18
              );

              // Smooth edge falloff so there is NO harsh circular rim, while core stays vivid & luminous
              const edgeFade = Math.pow(thick, 0.72);
              const shade = 0.74 + 0.34 * diff;
              const rCol = Math.min(255, sp.rgb[0] * shade + spec * 115);
              const gCol = Math.min(255, sp.rgb[1] * shade + spec * 115);
              const bCol = Math.min(255, sp.rgb[2] * shade + spec * 115);
              // Translucent optical density
              const aCol = Math.min(0.62, sp.alpha * (0.14 + 0.36 * edgeFade) * (0.65 + 0.35 * thick));

              hits[hitCount++] = { t: t0, r: rCol, g: gCol, b: bCol, a: aCol };
            }
          }
        }

        if (hitCount > 0) {
          // Sort back-to-front by t descending for accurate translucent color mixing
          if (hitCount > 1) {
            for (let a = 0; a < hitCount - 1; a++) {
              for (let b = a + 1; b < hitCount; b++) {
                if (hits[b].t > hits[a].t) {
                  const tmp = hits[a];
                  hits[a] = hits[b];
                  hits[b] = tmp;
                }
              }
            }
          }

          let outR = 0, outG = 0, outB = 0, outA = 0;
          for (let h = 0; h < hitCount; h++) {
            const hh = hits[h];
            const srcA = hh.a;
            const invA = 1 - srcA;
            outR = hh.r * srcA + outR * invA;
            outG = hh.g * srcA + outG * invA;
            outB = hh.b * srcA + outB * invA;
            outA = srcA + outA * invA;
          }

          if (outA > 0.002) {
            const idx = (py * rw + px) * 4;
            const invOutA = 1 / outA;
            data[idx] = Math.min(255, outR * invOutA);
            data[idx + 1] = Math.min(255, outG * invOutA);
            data[idx + 2] = Math.min(255, outB * invOutA);
            data[idx + 3] = Math.min(255, outA * 255);
          }
        }
      }
    }

    bufCtx.putImageData(bufImg, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bufCanvas, vp.x, vp.y, vp.w, vp.h);
    ctx.restore();
  }

  // Draw an exact 3D intersection circle as a vivid SOLID mixed-color curve (never dashed)
  function drawIntersectionCircle(ctx, circ, cam, vp, opts) {
    if (!circ) return;
    const o = opts || {};
    const alpha = o.alpha !== undefined ? o.alpha : 1;
    if (alpha <= 0.01) return;

    const segs = 96;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const ang = (i / segs) * Math.PI * 2;
      const p3 = vAdd(
        circ.center,
        vAdd(vScale(circ.u, circ.r * Math.cos(ang)), vScale(circ.v, circ.r * Math.sin(ang)))
      );
      const p2 = projectPoint(p3, cam, vp);
      if (p2) pts.push(p2);
    }
    if (pts.length < 3) return;

    const rgb = o.rgb || [124, 82, 168];
    const vivid = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    const glow = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.32 * alpha})`;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Soft colored aura along the exact intersection ring
    ctx.strokeStyle = glow;
    ctx.lineWidth = (o.lineWidth || 3.4) * 3.1;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Solid vivid continuous curve (NO dashed lines!)
    ctx.strokeStyle = vivid;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = o.lineWidth || 3.4;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Subtle bright core filament for crisp 3D clarity
    ctx.strokeStyle = 'rgba(255, 252, 245, 0.55)';
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = (o.lineWidth || 3.4) * 0.34;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    ctx.restore();
  }

  // Draw a zoomed-in curved Earth horizon slice positioned so `carPos3D` sits right on the surface
  function drawEarthPatch(ctx, carPos3D, cam, vp, alpha) {
    if (alpha <= 0.01) return;
    const S = GPSApp.Sketch;
    const pCar = projectPoint(carPos3D, cam, vp);
    if (!pCar) return;

    // Large Earth radius in screen pixels so we see a zoomed-in curved horizon
    const earthR = Math.max(vp.w, vp.h) * 1.15;
    const cx = pCar.x;
    const cy = pCar.y + earthR + 10;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Clip to viewport area
    ctx.beginPath();
    ctx.rect(vp.x, vp.y, vp.w, vp.h);
    ctx.clip();

    // Curved Earth surface fill (soft hand-colored watercolor)
    const grad = ctx.createRadialGradient(cx, cy - earthR * 0.92, 20, cx, cy, earthR * 1.04);
    grad.addColorStop(0, 'rgba(136, 178, 130, 0.56)');
    grad.addColorStop(0.28, 'rgba(110, 158, 176, 0.42)');
    grad.addColorStop(1, 'rgba(92, 138, 168, 0.22)');

    ctx.beginPath();
    ctx.arc(cx, cy, earthR, Math.PI * 1.18, Math.PI * 1.82);
    ctx.lineTo(vp.x + vp.w + 40, vp.y + vp.h + 40);
    ctx.lineTo(vp.x - 40, vp.y + vp.h + 40);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle atmosphere glow along the limb
    ctx.strokeStyle = 'rgba(104, 162, 204, 0.34)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + 4, Math.PI * 1.24, Math.PI * 1.76);
    ctx.stroke();

    // Hand-drawn curved horizon line
    ctx.strokeStyle = '#3b5c49';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();

    // Small sketchy latitude/longitude grid hints on Earth
    ctx.strokeStyle = 'rgba(59, 92, 73, 0.2)';
    ctx.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) {
      const ang = -Math.PI * 0.5 + k * 0.085;
      const hx = cx + Math.cos(ang) * earthR;
      const hy = cy + Math.sin(ang) * earthR;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + Math.cos(ang) * -90, hy + Math.sin(ang) * -90);
      ctx.stroke();
    }

    // Little hand-drawn car sitting right on Earth's surface at pCar!
    S.drawCar(ctx, pCar.x, pCar.y - 2, 0, { scale: 0.78, alpha: alpha });
    S.drawMathLabel(ctx, 'Jordoverflaten', pCar.x - 135, pCar.y + 42, {
      color: '#345843',
      size: 20,
      alpha: alpha * 0.9,
    });

    ctx.restore();
  }

  GPSApp.Spheres3D = {
    vSub,
    vAdd,
    vScale,
    vDot,
    vCross,
    vLen,
    vNorm,
    makeCamera,
    projectPoint,
    sphereSphereCircle,
    threeSpherePoints,
    renderTranslucentSpheres,
    drawIntersectionCircle,
    drawEarthPatch,
  };
})(window);
