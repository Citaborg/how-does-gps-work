/**
 * math-utils.js
 * Matematiske og fysiske beregninger for GPS-visualiseringen
 * - Trilaterasjon i 2D og 3D
 * - Doppler-effekt og hastighetsberegning
 * - Einsteins relativitetsteori (SR + GR, ref UiO AST2000)
 * - Flerveisbølger (Multipath / Ekko) og spøkelsesposisjoner
 * - Signal-til-støy og jamming-matematikk
 */

export const C_LIGHT = 299792458; // m/s
export const GPS_L1_FREQ = 1575.42e6; // Hz (1575.42 MHz)
export const EARTH_RADIUS_KM = 6371; // km
export const GPS_ALTITUDE_KM = 20200; // km
export const GPS_ORBIT_RADIUS_KM = EARTH_RADIUS_KM + GPS_ALTITUDE_KM; // 26571 km
export const GM_EARTH = 3.986004418e14; // m^3 / s^2

/**
 * Beregner skjæringspunkter mellom to sirkler i 2D
 * @param {number} x1 - Senter X for sirkel 1
 * @param {number} y1 - Senter Y for sirkel 1
 * @param {number} r1 - Radius for sirkel 1
 * @param {number} x2 - Senter X for sirkel 2
 * @param {number} y2 - Senter Y for sirkel 2
 * @param {number} r2 - Radius for sirkel 2
 * @returns {Array<{x: number, y: number}>|null} - To skjæringspunkter eller null
 */
export function getCircleCircleIntersections(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return null; // Ingen skjæring eller konsentriske
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const xm = x1 + (dx * a) / d;
  const ym = y1 + (dy * a) / d;

  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  return [
    { x: xm + rx, y: ym + ry },
    { x: xm - rx, y: ym - ry }
  ];
}

/**
 * Beregner feiltrekanten (error triangle) som oppstår med 3 satellitter og klokkefeil (klokkebias)
 * @param {Array<{x: number, y: number, r: number}>} sats - Satellitter med målte pseudoradier
 * @returns {{points: Array<{x: number, y: number}>, center: {x: number, y: number}, area: number}|null}
 */
export function calculateErrorTriangle(sats) {
  if (sats.length < 3) return null;

  const p12 = getCircleCircleIntersections(sats[0].x, sats[0].y, sats[0].r, sats[1].x, sats[1].y, sats[1].r);
  const p23 = getCircleCircleIntersections(sats[1].x, sats[1].y, sats[1].r, sats[2].x, sats[2].y, sats[2].r);
  const p31 = getCircleCircleIntersections(sats[2].x, sats[2].y, sats[2].r, sats[0].x, sats[0].y, sats[0].r);

  if (!p12 || !p23 || !p31) return null;

  // Finn klyngen av tre punkter som ligger nærmest hverandre (det sanne usikkerhetsområdet)
  const allPts = [p12, p23, p31];
  let bestTriangle = null;
  let minPerimeter = Infinity;

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const ptA = allPts[0][i];
        const ptB = allPts[1][j];
        const ptC = allPts[2][k];

        const dAB = Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y);
        const dBC = Math.hypot(ptC.x - ptB.x, ptC.y - ptB.y);
        const dCA = Math.hypot(ptA.x - ptC.x, ptA.y - ptC.y);
        const perim = dAB + dBC + dCA;

        if (perim < minPerimeter) {
          minPerimeter = perim;
          bestTriangle = [ptA, ptB, ptC];
        }
      }
    }
  }

  if (!bestTriangle) return null;

  const [A, B, C] = bestTriangle;
  const centerX = (A.x + B.x + C.x) / 3;
  const centerY = (A.y + B.y + C.y) / 3;
  // Areal via kryssprodukt
  const area = 0.5 * Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));

  return {
    points: bestTriangle,
    center: { x: centerX, y: centerY },
    area
  };
}

/**
 * 3D Skjæringssirkel mellom to kuler (sfærer)
 * Skjæringen mellom to sfærer S1(c1, r1) og S2(c2, r2) er en sirkel i 3D
 * @param {Array<number>} c1 - [x, y, z] for sfære 1
 * @param {number} r1 - Radius for sfære 1
 * @param {Array<number>} c2 - [x, y, z] for sfære 2
 * @param {number} r2 - Radius for sfære 2
 * @returns {{center: Array<number>, radius: number, normal: Array<number>}|null}
 */
export function getSphereSphereIntersectionCircle(c1, r1, c2, r2) {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const dz = c2[2] - c1[2];
  const d = Math.hypot(dx, dy, dz);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return null;
  }

  // Normalvektor langs aksen mellom sentrene
  const normal = [dx / d, dy / d, dz / d];

  // Avstand fra c1 til planet for skjæringssirkelen
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const circleRadius = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const center = [
    c1[0] + normal[0] * a,
    c1[1] + normal[1] * a,
    c1[2] + normal[2] * a
  ];

  return { center, radius: circleRadius, normal };
}

/**
 * 3D Skjæringspunkter mellom tre sfærer
 * Skjærer sirkelen fra sfære 1 & 2 med sfære 3 for å få to diskrete punkter i 3D
 * @param {Array<number>} c1
 * @param {number} r1
 * @param {Array<number>} c2
 * @param {number} r2
 * @param {Array<number>} c3
 * @param {number} r3
 * @returns {Array<Array<number>>|null} - [Point1, Point2] i 3D
 */
export function getThreeSphereIntersections(c1, r1, c2, r2, c3, r3) {
  const circ = getSphereSphereIntersectionCircle(c1, r1, c2, r2);
  if (!circ) return null;

  // Finn avstand fra sirkelsenter til c3
  const dx = c3[0] - circ.center[0];
  const dy = c3[1] - circ.center[1];
  const dz = c3[2] - circ.center[2];

  // Prosjekter vektoren inn i sirkelplanet (ortogonal til normal)
  const dotNorm = dx * circ.normal[0] + dy * circ.normal[1] + dz * circ.normal[2];
  const projX = dx - dotNorm * circ.normal[0];
  const projY = dy - dotNorm * circ.normal[1];
  const projZ = dz - dotNorm * circ.normal[2];
  const dPlane = Math.hypot(projX, projY, projZ);

  if (dPlane === 0) return null;

  // Enhetsvektor i planet mot projeksjonen av c3
  const uX = projX / dPlane;
  const uY = projY / dPlane;
  const uZ = projZ / dPlane;

  // Vinkelrett enhetsvektor i sirkelplanet (kryssprodukt av normal og u)
  const vX = circ.normal[1] * uZ - circ.normal[2] * uY;
  const vY = circ.normal[2] * uX - circ.normal[0] * uZ;
  const vZ = circ.normal[0] * uY - circ.normal[1] * uX;

  // Avstand langs sirkelplanet til kordens midtpunkt
  // Avstand i 3D fra c3 til sirkelplanet er dotNorm
  // Radius i sfære 3 i dette planet er r3_eff = sqrt(r3^2 - dotNorm^2)
  const r3EffSq = r3 * r3 - dotNorm * dotNorm;
  if (r3EffSq < 0) return null;

  const r3Eff = Math.sqrt(r3EffSq);
  const a = (circ.radius * circ.radius - r3Eff * r3Eff + dPlane * dPlane) / (2 * dPlane);
  const hSq = circ.radius * circ.radius - a * a;
  if (hSq < 0) return null;
  const h = Math.sqrt(hSq);

  const p1 = [
    circ.center[0] + a * uX + h * vX,
    circ.center[1] + a * uY + h * vY,
    circ.center[2] + a * uZ + h * vZ
  ];

  const p2 = [
    circ.center[0] + a * uX - h * vX,
    circ.center[1] + a * uY - h * vY,
    circ.center[2] + a * uZ - h * vZ
  ];

  return [p1, p2];
}

/**
 * Beregner Doppler-forskyvning for bil i bevegelse
 * @param {Array<number>} carPos - Bilposisjon [x, y]
 * @param {Array<number>} carVel - Bilens hastighetsvektor [vx, vy] (m/s)
 * @param {Array<number>} satPos - Satellittposisjon [x, y]
 * @param {number} f0 - Bærebølgefrekvens (Hz), standard 1575.42 MHz
 * @returns {{deltaF: number, fReceived: number, vRadial: number, speedKmh: number}}
 */
export function calculateDopplerShift(carPos, carVel, satPos, f0 = GPS_L1_FREQ) {
  const dx = satPos[0] - carPos[0];
  const dy = satPos[1] - carPos[1];
  const dist = Math.hypot(dx, dy);

  if (dist === 0) {
    return { deltaF: 0, fReceived: f0, vRadial: 0, speedKmh: 0 };
  }

  // Enhetsvektor fra bil mot satellitt
  const uX = dx / dist;
  const uY = dy / dist;

  // Radial hastighet (komponent av bilens fart langs siktlinjen til satellitten)
  // v_radial > 0 betyr bilen beveger seg MOT satellitten (blåskift)
  const vRadial = carVel[0] * uX + carVel[1] * uY;

  // Doppler-forskyvning: delta_f = f0 * (v_radial / c)
  const deltaF = f0 * (vRadial / C_LIGHT);
  const fReceived = f0 + deltaF;
  const speedKmh = Math.hypot(carVel[0], carVel[1]) * 3.6;

  return {
    deltaF,
    fReceived,
    vRadial,
    speedKmh
  };
}

/**
 * Beregner relativistiske effekter for GPS (UiO AST2000 pensum)
 * @returns {object} Relativistiske verdier for spesiell og generell relativitet
 */
export function calculateRelativityEffects() {
  const rEarth = EARTH_RADIUS_KM * 1000; // m
  const rSat = GPS_ORBIT_RADIUS_KM * 1000; // m
  const secondsPerDay = 86400;

  // Satellittbanehastighet (sirkulær bane: v = sqrt(GM / r))
  const vSat = Math.sqrt(GM_EARTH / rSat); // ~ 3874 m/s

  // 1. Spesiell Relativitet (tidsdilatasjon pga. hastighet):
  // Satellittklokken går TREGERE: dt_SR = -0.5 * (v/c)^2 * dag
  const dtSR_fraction = -0.5 * Math.pow(vSat / C_LIGHT, 2);
  const dtSR_microsecPerDay = dtSR_fraction * secondsPerDay * 1e6; // ~ -7.21 us/dag

  // 2. Generell Relativitet (gravitasjonsfelt er svakere i 20 200 km høyde):
  // Satellittklokken går RASKERE: dt_GR = (Phi_bakke - Phi_sat) / c^2 * dag
  // Phi = -GM/r -> Delta Phi = GM(1/rEarth - 1/rSat)
  const deltaPhi = GM_EARTH * (1 / rEarth - 1 / rSat);
  const dtGR_fraction = deltaPhi / Math.pow(C_LIGHT, 2);
  const dtGR_microsecPerDay = dtGR_fraction * secondsPerDay * 1e6; // ~ +45.86 us/dag

  // Netto avvik per dag
  const netDt_microsecPerDay = dtGR_microsecPerDay + dtSR_microsecPerDay; // ~ +38.65 us/dag

  // Posisjonsfeil per dag dersom relativitet IKKE ble korrigert
  const posErrorKmPerDay = (netDt_microsecPerDay * 1e-6 * C_LIGHT) / 1000; // ~ 11.59 km/dag

  // Fabrikkjustering av atomur før oppskyting:
  // For å tikke på nøyaktig 10.23 MHz i bane, stilles klokken på bakken til:
  // f_bakke = 10.23 MHz * (1 - dt_netto) = 10.22999999543 MHz
  const baseFreq = 10.23e6;
  const factoryPreAdjustedFreq = baseFreq * (1 - (netDt_microsecPerDay * 1e-6) / secondsPerDay);

  return {
    vSat,
    dtSR_microsecPerDay,
    dtGR_microsecPerDay,
    netDt_microsecPerDay,
    posErrorKmPerDay,
    baseFreq,
    factoryPreAdjustedFreq
  };
}

/**
 * Flerveisbølger (Multipath): Beregner reflektert signalvei og spøkelsesposisjon
 * @param {Array<number>} carPos - [x, y]
 * @param {Array<number>} satPos - [x, y]
 * @param {number} wallX - X-koordinat for glassfasaden
 * @param {Array<number>} wallYRange - [yMin, yMax] for glassfasaden
 * @returns {object|null}
 */
export function calculateMultipathEcho(carPos, satPos, wallX, wallYRange) {
  // Speiler bilens posisjon over glassveggens linje x = wallX
  const mirroredCarX = 2 * wallX - carPos[0];
  const mirroredCarY = carPos[1];

  // Skjæringspunkt for reflektert stråle på glassveggen
  // Linjen fra satPos til (mirroredCarX, mirroredCarY) treffer x = wallX
  const t = (wallX - satPos[0]) / (mirroredCarX - satPos[0]);
  const reflectY = satPos[1] + t * (mirroredCarY - satPos[1]);

  // Sjekk om refleksjonen treffer innenfor byggets vertikale fasade
  const hitsWall = reflectY >= wallYRange[0] && reflectY <= wallYRange[1];

  const directDist = Math.hypot(satPos[0] - carPos[0], satPos[1] - carPos[1]);
  const bounceDist = Math.hypot(wallX - satPos[0], reflectY - satPos[1]) +
                     Math.hypot(carPos[0] - wallX, carPos[1] - reflectY);

  const extraDistance = bounceDist - directDist; // Alltid > 0
  const timeDelaySec = extraDistance / (C_LIGHT / 1000); // skalert for visualisering

  // Spøkelsesposisjonen beregnes lenger bort fra satellitten langs mottaksretningen
  const dirX = (carPos[0] - wallX);
  const dirY = (carPos[1] - reflectY);
  const len = Math.hypot(dirX, dirY) || 1;

  const ghostX = carPos[0] + (dirX / len) * (extraDistance * 0.85);
  const ghostY = carPos[1] + (dirY / len) * (extraDistance * 0.85);

  return {
    hitsWall,
    reflectPoint: { x: wallX, y: reflectY },
    directDist,
    bounceDist,
    extraDistance,
    timeDelaySec,
    ghostPos: { x: ghostX, y: ghostY }
  };
}
