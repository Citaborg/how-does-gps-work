/**
 * Small, dependency-free geometry helpers for the explanatory scene.
 * Coordinates are canvas/scene coordinates only; they do not model GPS signal
 * propagation, timing, or receiver error.
 */

const EPSILON = 1e-10;

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(t) {
  const value = clamp(t);
  return value * value * (3 - 2 * value);
}

export function distance(a, b) {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

/** Unit sightline points from receiver to satellite; positive rate means receding. */
export function lineOfSightMotion(receiver, satellite, velocity, satelliteVelocity = [0, 0]) {
  const range = distance(receiver, satellite);
  const unit = satellite.map((value, i) => (value - receiver[i]) / range);
  const receiverProjection = unit.reduce((sum, value, i) => sum + value * velocity[i], 0);
  const relativeRangeRate = unit.reduce((sum, value, i) => sum + value * (satelliteVelocity[i] - velocity[i]), 0);
  return { unit, receiverProjection, relativeRangeRate };
}

/** Closed segment/rectangle clipping, used for both direct and reflected rays. */
export function segmentIntersectsRect(a, b, rect) {
  let enter = 0, exit = 1;
  const delta = [b[0] - a[0], b[1] - a[1]];
  for (const [axis, low, high] of [[0, rect.left, rect.right], [1, rect.top, rect.bottom]]) {
    if (Math.abs(delta[axis]) < EPSILON) {
      if (a[axis] < low || a[axis] > high) return false;
      continue;
    }
    const first = (low - a[axis]) / delta[axis], last = (high - a[axis]) / delta[axis];
    enter = Math.max(enter, Math.min(first, last));
    exit = Math.min(exit, Math.max(first, last));
    if (enter > exit) return false;
  }
  return true;
}

/** Local least-squares fit for the known-clock, illustrative 2D ranges. */
export function leastSquaresPosition(centers, radii, initial) {
  let { x, y } = initial;
  for (let iteration = 0; iteration < 20; iteration++) {
    let xx = 0, xy = 0, yy = 0, bx = 0, by = 0;
    centers.forEach((center, i) => {
      const d = Math.hypot(x - center.x, y - center.y);
      if (d < EPSILON) return;
      const ux = (x - center.x) / d, uy = (y - center.y) / d;
      const residual = radii[i] - d;
      xx += ux * ux; xy += ux * uy; yy += uy * uy;
      bx += ux * residual; by += uy * residual;
    });
    const determinant = xx * yy - xy * xy;
    if (Math.abs(determinant) < EPSILON) break;
    const dx = (yy * bx - xy * by) / determinant;
    const dy = (xx * by - xy * bx) / determinant;
    x += dx; y += dy;
    if (Math.hypot(dx, dy) < 1e-8) break;
  }
  return { x, y };
}

/** Returns zero, one, or two intersections of two 2D circles. */
export function circleIntersections(a, ra, b, rb) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);

  // Coincident circles have infinitely many intersections, which this finite
  // result contract represents as no point intersections.
  if (d < EPSILON || d > ra + rb + EPSILON || d < Math.abs(ra - rb) - EPSILON) {
    return [];
  }

  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const heightSquared = ra * ra - along * along;
  if (heightSquared < -EPSILON) return [];

  const baseX = a.x + (along * dx) / d;
  const baseY = a.y + (along * dy) / d;
  const height = Math.sqrt(Math.max(0, heightSquared));
  if (height < EPSILON) return [{ x: baseX, y: baseY }];

  const offsetX = (-dy * height) / d;
  const offsetY = (dx * height) / d;
  return [
    { x: baseX + offsetX, y: baseY + offsetY },
    { x: baseX - offsetX, y: baseY - offsetY },
  ];
}

function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function subtract(a, b) {
  return a.map((value, index) => value - b[index]);
}

function addScaled(a, b, scale) {
  return a.map((value, index) => value + b[index] * scale);
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(vector) {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length);
}

function planeBasis(normal) {
  // Pick the cardinal axis least parallel to the normal for a stable cross.
  const axis = Math.abs(normal[0]) <= Math.abs(normal[1]) && Math.abs(normal[0]) <= Math.abs(normal[2])
    ? [1, 0, 0]
    : Math.abs(normal[1]) <= Math.abs(normal[2])
      ? [0, 1, 0]
      : [0, 0, 1];
  const u = normalize(cross(normal, axis));
  return { u, v: normalize(cross(normal, u)) };
}

/**
 * Returns the circle where two 3D sphere surfaces meet, or null when they do
 * not have a finite intersection circle. A tangent is represented by radius 0.
 */
export function sphereIntersection(a, ra, b, rb) {
  const delta = subtract(b, a);
  const d = Math.hypot(...delta);
  if (d < EPSILON || d > ra + rb + EPSILON || d < Math.abs(ra - rb) - EPSILON) {
    return null;
  }

  const normal = delta.map((value) => value / d);
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const radiusSquared = ra * ra - along * along;
  if (radiusSquared < -EPSILON) return null;

  const { u, v } = planeBasis(normal);
  return {
    center: addScaled(a, normal, along),
    radius: Math.sqrt(Math.max(0, radiusSquared)),
    normal,
    u,
    v,
  };
}

/** Returns the finite points shared by three 3D sphere surfaces. */
export function tripleSphereIntersections(a, ra, b, rb, c, rc) {
  const firstPair = sphereIntersection(a, ra, b, rb);
  if (!firstPair) return [];

  const fromCircleCenter = subtract(c, firstPair.center);
  const normalDistance = dot(fromCircleCenter, firstPair.normal);
  const projectedCenter = addScaled(c, firstPair.normal, -normalDistance);
  const projectedRadiusSquared = rc * rc - normalDistance * normalDistance;
  if (projectedRadiusSquared < -EPSILON) return [];

  const relative = subtract(projectedCenter, firstPair.center);
  const planarCenter = { x: dot(relative, firstPair.u), y: dot(relative, firstPair.v) };
  const points = circleIntersections(
    { x: 0, y: 0 },
    firstPair.radius,
    planarCenter,
    Math.sqrt(Math.max(0, projectedRadiusSquared)),
  );
  return points.map((point) => addScaled(
    addScaled(firstPair.center, firstPair.u, point.x),
    firstPair.v,
    point.y,
  ));
}

/**
 * Illustrative car loop for a 1000 x 680 canvas (units: seconds and pixels):
 * 0–2: stopped at the left; 2–10: smoothly travels to x=790; 10–12: frozen
 * at the right for overlays; 12–20: smoothly returns left. The 20-second
 * cycle repeats continuously, including negative seeks, with zero speed at
 * every transition. It is visual choreography, not real vehicle/GPS math.
 */
export function carPosition(time) {
  const cycle = 20;
  const t = ((time % cycle) + cycle) % cycle;
  const startX = 150;
  const endX = 790;

  if (t < 2 || t >= 20) return { x: startX, y: 425, speed: 0 };
  if (t < 10) {
    const phase = (t - 2) / 8;
    const progress = smoothstep(phase);
    const derivative = (6 * phase * (1 - phase)) / 8;
    const dx = (endX - startX) * derivative;
    const dy = -55 * Math.PI * Math.cos(Math.PI * progress) * derivative;
    return { x: startX + (endX - startX) * progress, y: 425 - 55 * Math.sin(Math.PI * progress), speed: Math.hypot(dx, dy) };
  }
  if (t < 12) return { x: endX, y: 425, speed: 0 };

  const phase = (t - 12) / 8;
  const progress = smoothstep(phase);
  const derivative = (6 * phase * (1 - phase)) / 8;
  const dx = -(endX - startX) * derivative;
  const dy = -55 * Math.PI * Math.cos(Math.PI * progress) * derivative;
  return { x: endX - (endX - startX) * progress, y: 425 - 55 * Math.sin(Math.PI * progress), speed: Math.hypot(dx, dy) };
}
