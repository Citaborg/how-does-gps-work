/* gl3d.js — analytisk «raytrace» av gjennomskinnelige kuler, skjæringskurver og jordklode.
   Scenen beskrives per bilde:
   { cam:{target:[x,y,z], dist, az, el, fov}, spheres:[{c:[x,y,z], r, col:[r,g,b], a}], earth:{c:[..], r, a},
     points:[{p:[x,y,z], a}], linePx, glow }
   Verdenskoordinater: X = scenens x (piksler), Y = -scenens y, Z = opp. Kamera rett ovenfra med
   dist = 540/tan(fov/2) gir da nøyaktig samme bilde som 2D-tegningen. */
const GL3D = (() => {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  let prog = null, U = {};
  const W = 1920, H = 1080;

  const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uPos, uF, uR, uU; uniform float uTanHalf;
uniform vec3 uC[4]; uniform float uRad[4]; uniform vec3 uCol[4]; uniform float uA[4];
uniform vec3 uEC; uniform float uER; uniform float uEA;
uniform vec3 uP[2]; uniform float uPA[2];
uniform float uLinePx; uniform float uGlow;

float hash1(float n){ return fract(sin(n)*43758.5453123); }
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise3(vec3 x){
  vec3 p = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  float n = p.x + p.y*57.0 + p.z*113.0;
  return mix(mix(mix(hash1(n), hash1(n+1.0), f.x), mix(hash1(n+57.0), hash1(n+58.0), f.x), f.y),
             mix(mix(hash1(n+113.0), hash1(n+114.0), f.x), mix(hash1(n+170.0), hash1(n+171.0), f.x), f.y), f.z);
}
bool hitSphere(vec3 ro, vec3 rd, vec3 c, float r, out float t0, out float t1){
  vec3 oc = ro - c; float b = dot(oc, rd); float cc = dot(oc,oc) - r*r; float h = b*b - cc;
  if (h < 0.0) return false; h = sqrt(h); t0 = -b - h; t1 = -b + h; return true;
}
float pxWorld(float t){ return t * 2.0 * uTanHalf / uRes.y; } // én piksel i verdensenheter ved avstand t

vec3 paper(vec2 uv){
  vec3 base = vec3(0.965, 0.945, 0.905);
  float n = hash2(floor(gl_FragCoord.xy)); base += (n - 0.5) * 0.04;
  float vig = smoothstep(1.9, 0.5, length(uv)); base *= mix(0.93, 1.0, vig);
  return base;
}
vec3 shadeEarth(vec3 p, vec3 n, float t){
  float lat = asin(clamp(n.z, -1.0, 1.0)); float lon = atan(n.y, n.x);
  float land = noise3(n*2.6+vec3(3.1))*0.55 + noise3(n*6.0)*0.3 + noise3(n*13.0)*0.15;
  vec3 col = mix(vec3(0.72, 0.84, 0.90), vec3(0.70, 0.82, 0.58), smoothstep(0.50, 0.56, land));
  // pennestrek-rutenett hver 15 grader
  float step = 0.2617994; float wa = pxWorld(t) * 1.4 / uER;
  float g1 = abs(fract(lat/step + 0.5) - 0.5) * step;
  float g2 = abs(fract(lon/step + 0.5) - 0.5) * step * max(cos(lat), 0.02);
  float grid = max(smoothstep(wa*1.5, 0.0, g1), smoothstep(wa*1.5, 0.0, g2));
  col = mix(col, vec3(0.30, 0.27, 0.25), grid * 0.45);
  float lam = 0.62 + 0.38 * max(0.0, dot(n, normalize(vec3(-0.35, -0.45, 0.82))));
  // kanten litt mørkere (blyantskygge)
  float rim = pow(1.0 - abs(dot(n, normalize(p - uPos))), 2.5);
  return col * lam * (1.0 - 0.25*rim);
}
vec3 curveGlow(vec3 p, float t, int i, vec3 colI, float aI){
  vec3 acc = vec3(0.0); float w = pxWorld(t) * uLinePx;
  float wob = (noise3(p*0.035 + vec3(uTime*0.25)) - 0.5) * w * 0.9;
  for (int j = 0; j < 4; j++){
    if (j == i || uA[j] <= 0.001) continue;
    float d = abs(length(p - uC[j]) - uRad[j]) + wob;
    float g = exp(-(d*d)/(w*w)); float g2 = exp(-(d*d)/(w*w*12.0)) * 0.22;
    vec3 mc = (colI + uCol[j]) * 0.5; float l = dot(mc, vec3(0.333));
    mc = clamp(l + (mc - l) * 2.2, 0.0, 1.0) * 0.9;
    float s = min(aI, uA[j]) * uGlow;
    acc += mc * (g + g2) * s;
  }
  return acc;
}
vec3 composite(vec3 ro, vec3 rd, vec3 base, float tMax){
  vec3 trans = vec3(1.0); vec3 emit = vec3(0.0); vec3 lines = vec3(0.0);
  for (int i = 0; i < 4; i++){
    if (uA[i] <= 0.001) continue;
    float t0, t1; if (!hitSphere(ro, rd, uC[i], uRad[i], t0, t1)) continue;
    float a = max(t0, 0.0), b = min(t1, tMax); float len = max(b - a, 0.0);
    float dens = len / max(uRad[i], 1.0);
    vec3 absorb = exp(-dens * 0.55 * (vec3(1.0) - uCol[i]) * uA[i]);
    trans *= absorb; emit += uCol[i] * dens * 0.11 * uA[i];
    if (t0 > 0.0 && t0 < tMax){
      vec3 p = ro + rd*t0; vec3 n = normalize(p - uC[i]);
      float rim = pow(1.0 - abs(dot(n, rd)), 5.0);
      emit += uCol[i] * rim * 0.22 * uA[i];
      lines += curveGlow(p, t0, i, uCol[i], uA[i]);
    }
    if (t1 > 0.0 && t1 < tMax){ vec3 p = ro + rd*t1; lines += curveGlow(p, t1, i, uCol[i], uA[i]) * 0.8; }
  }
  vec3 col = base * trans + emit;
  // skjæringskurvene tegnes «oppå», som fargestift
  col = mix(col, clamp(lines, 0.0, 1.0), clamp(length(lines) * 0.9, 0.0, 0.92));
  for (int k = 0; k < 2; k++){
    if (uPA[k] <= 0.001) continue;
    vec3 q = uP[k] - ro; float tq = dot(q, rd); if (tq < 0.0 || tq > tMax) continue;
    float dd = length(q - rd*tq); float w = pxWorld(tq) * 9.0;
    float g = exp(-(dd*dd)/(w*w));
    col = mix(col, vec3(1.0, 0.62, 0.10), g * uPA[k] * 0.95);
  }
  return col;
}
void main(){
  vec2 ndc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0; float aspect = uRes.x / uRes.y;
  vec3 rd = normalize(uF + uR * ndc.x * aspect * uTanHalf + uU * ndc.y * uTanHalf);
  vec3 ro = uPos;
  vec3 bg = paper(ndc * vec2(aspect, 1.0));
  vec3 colA = composite(ro, rd, bg, 1e9);
  vec3 col = colA;
  if (uEA > 0.001){
    float e0, e1; vec3 colB = colA;
    if (hitSphere(ro, rd, uEC, uER, e0, e1) && e0 > 0.0){
      vec3 p = ro + rd*e0; vec3 n = normalize(p - uEC);
      colB = composite(ro, rd, shadeEarth(p, n, e0), e0);
    }
    col = mix(colA, colB, uEA);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); throw new Error('shader'); }
    return s;
  }
  function init() {
    if (!gl) return false;
    try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uTime', 'uPos', 'uF', 'uR', 'uU', 'uTanHalf', 'uEC', 'uER', 'uEA', 'uLinePx', 'uGlow'])
      U[n] = gl.getUniformLocation(prog, n);
    for (let i = 0; i < 4; i++) for (const n of ['uC', 'uRad', 'uCol', 'uA']) U[n + i] = gl.getUniformLocation(prog, `${n}[${i}]`);
    for (let i = 0; i < 2; i++) for (const n of ['uP', 'uPA']) U[n + i] = gl.getUniformLocation(prog, `${n}[${i}]`);
    gl.viewport(0, 0, W, H);
    return true;
    } catch (e) { console.error(e); prog = null; return false; }
  }

  // --- kamera ---------------------------------------------------------------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => mul(a, 1 / (len(a) || 1));
  function basis(cam) {
    const ce = Math.cos(cam.el), se = Math.sin(cam.el), sa = Math.sin(cam.az), ca = Math.cos(cam.az);
    const dir = [ce * sa, -ce * ca, se];
    const pos = add(cam.target, mul(dir, cam.dist));
    const f = mul(dir, -1);
    const u = [-se * sa, se * ca, ce];
    const r = cross(f, u);
    return { pos, f, r, u };
  }
  // 3D-punkt → skjermkoordinat [x, y, dybde] (null hvis bak kamera)
  function project(cam, p, B) {
    B = B || basis(cam); const d = sub(p, B.pos); const z = dot(d, B.f); if (z <= 1e-3) return null;
    const k = 540 / Math.tan(cam.fov / 2);
    return [960 + dot(d, B.r) / z * k, 540 - dot(d, B.u) / z * k, z];
  }
  // hvor mange piksler 1 verdensenhet er ved punktet p
  function pxScale(cam, p, B) { B = B || basis(cam); const z = dot(sub(p, B.pos), B.f); return 540 / Math.tan(cam.fov / 2) / Math.max(z, 1e-3); }
  // avstanden ovenfra som gjør 3D-bildet identisk med 2D-tegningen
  const topDownDist = fov => 540 / Math.tan(fov / 2);

  // tre kuler → de to skjæringspunktene (trilaterasjon i lukket form)
  function trilaterate(P1, r1, P2, r2, P3, r3) {
    const ex = norm(sub(P2, P1)); const d = len(sub(P2, P1));
    const p31 = sub(P3, P1); const i = dot(ex, p31);
    const ey = norm(sub(p31, mul(ex, i))); const ez = cross(ex, ey); const j = dot(ey, p31);
    const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const y = (r1 * r1 - r3 * r3 + i * i + j * j) / (2 * j) - (i / j) * x;
    const z2 = r1 * r1 - x * x - y * y; if (z2 < 0) return null;
    const z = Math.sqrt(z2);
    const base = add(add(P1, mul(ex, x)), mul(ey, y));
    return [add(base, mul(ez, z)), add(base, mul(ez, -z))];
  }

  function render(scene, time) {
    if (!prog) return;
    const B = basis(scene.cam);
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uTime, time);
    gl.uniform3fv(U.uPos, B.pos); gl.uniform3fv(U.uF, B.f); gl.uniform3fv(U.uR, B.r); gl.uniform3fv(U.uU, B.u);
    gl.uniform1f(U.uTanHalf, Math.tan(scene.cam.fov / 2));
    for (let i = 0; i < 4; i++) {
      const s = scene.spheres[i];
      gl.uniform3fv(U['uC' + i], s ? s.c : [0, 0, 0]); gl.uniform1f(U['uRad' + i], s ? Math.max(s.r, 0.001) : 0.001);
      gl.uniform3fv(U['uCol' + i], s ? s.col : [1, 1, 1]); gl.uniform1f(U['uA' + i], s ? s.a : 0);
    }
    const e = scene.earth || { c: [0, 0, 0], r: 1, a: 0 };
    gl.uniform3fv(U.uEC, e.c); gl.uniform1f(U.uER, e.r); gl.uniform1f(U.uEA, e.a);
    for (let i = 0; i < 2; i++) {
      const p = (scene.points || [])[i];
      gl.uniform3fv(U['uP' + i], p ? p.p : [0, 0, 0]); gl.uniform1f(U['uPA' + i], p ? p.a : 0);
    }
    gl.uniform1f(U.uLinePx, scene.linePx ?? 3.2); gl.uniform1f(U.uGlow, scene.glow ?? 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { init, render, basis, project, pxScale, topDownDist, trilaterate, v: { sub, add, mul, dot, cross, len, norm } };
})();
