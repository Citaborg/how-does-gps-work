'use strict';
/* Gjennomsiktige «akvarell»-kuler, strålesporet i en fragment-shader.
   Fargene blandes subtraktivt (som pigment på papir), og skjæringslinjene
   mellom kulene tegnes med sterkere farge. */
const GLR = (() => {
  let gl = null, canvas = null, U = {}, ok = false;
  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const FS = `
precision highp float;
uniform vec2 uRes, uCen;
uniform float uF, uEarth, uAlpha, uGround, uFill;
uniform vec3 uEye, uR, uU, uFw;
uniform vec4 uSph[4];
uniform vec3 uCol[4];
uniform float uAl[4];
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 rd = normalize(uFw * uF + uR * (px.x - uCen.x) - uU * (px.y - uCen.y));
  vec3 ro = uEye;
  float pix = 1. / uF;
  vec3 L = normalize(uU * 0.7 - uR * 0.45 - uFw * 0.55);
  float grain = 0.84 + 0.3 * vn(px * 0.31) + 0.06 * vn(px * 0.07);

  float tE = 1e9, cov = 0.;
  {
    float b = dot(ro, rd), c = dot(ro, ro) - 1., h = b*b - c;
    float dp = sqrt(max(dot(ro, ro) - b*b, 0.));
    if (b < 0.) {
      cov = clamp((1. - dp) / (max(-b, 0.01) * pix) + .5, 0., 1.);
      tE = h > 0. ? -b - sqrt(h) : -b;
    }
    if (cov <= 0.) tE = 1e9;
  }
  float eo = uEarth * cov;

  vec3 T = vec3(1.);
  vec3 LC = vec3(0.); float LA = 0.;
  float t1[4]; float t2[4];
  for (int i = 0; i < 4; i++) {
    vec3 oc = ro - uSph[i].xyz; float r = uSph[i].w;
    float b = dot(oc, rd), h = b*b - (dot(oc, oc) - r*r);
    if (h > 0. && uAl[i] > 0.002 && r > 0.002) { float s = sqrt(h); t1[i] = -b - s; t2[i] = -b + s; }
    else { t1[i] = -1.; t2[i] = -1.; }
  }
  for (int i = 0; i < 4; i++) {
    if (t2[i] <= 0.) continue;
    vec3 ci = uSph[i].xyz; float ri = uSph[i].w;
    float a0 = max(t1[i], 0.), a1 = t2[i];
    float front = max(min(a1, tE) - a0, 0.), back = max(a1 - max(a0, tE), 0.);
    float chord = front + back * (1. - eo);
    vec3 ph = ro + rd * (t1[i] > 0. ? t1[i] : t2[i]);
    float k = .5 + .5 * dot((ph - ci) / ri, L);
    float av = uAl[i] * 0.5 * uFill * (1. - exp(-5. * chord / (2. * ri))) * grain * mix(1.22, 0.78, k);
    T *= mix(vec3(1.), uCol[i], clamp(av, 0., 1.));
    for (int s = 0; s < 2; s++) {
      float th = s == 0 ? t1[i] : t2[i];
      if (th <= 0.) continue;
      float vis = (th < tE ? 1. : 1. - eo) * (s == 0 ? 1. : .8);
      vec3 p = ro + rd * th; vec3 ni = (p - ci) / ri;
      float w = th * pix * 3.3;
      for (int j = 0; j < 4; j++) {
        if (j == i || uAl[j] < 0.002 || uSph[j].w < 0.002) continue;
        vec3 q = p - uSph[j].xyz; float dj = length(q);
        float d = abs(dj - uSph[j].w);
        float sn = length(cross(ni, q / dj));
        float cd = d / max(sn, 0.22);
        float l = (1. - smoothstep(w * .55, w * 1.35, cd)) * vis * min(uAl[i], uAl[j]);
        vec3 av2 = mix(uCol[i], uCol[j], .5);
        av2 -= min(av2.r, min(av2.g, av2.b)) * 0.8;
        av2 *= 0.8 / max(av2.r, max(av2.g, av2.b));
        float la = l * 0.92;
        LC = mix(LC, av2, la / max(LA + la - LA * la, 1e-4));
        LA = LA + la - LA * la;
      }
    }
    for (int j = 0; j < 4; j++) {
      if (j <= i || t2[j] <= 0.) continue;
      float o0 = max(max(t1[i], t1[j]), 0.);
      float o1 = min(min(t2[i], t2[j]), mix(1e9, tE, step(.5, eo)));
      float ov = max(o1 - o0, 0.);
      T *= mix(vec3(1.), mix(uCol[i], uCol[j], .5),
               0.3 * uFill * uFill * (1. - exp(-4. * ov / min(ri, uSph[j].w))) * min(uAl[i], uAl[j]) * grain);
    }
  }
  if (eo > 0.) {
    vec3 p = ro + rd * tE; vec3 n = normalize(p);
    float land = smoothstep(.50, .56, vn3(n * 2.3 + 3.1) * .65 + vn3(n * 5.7) * .35);
    vec3 col = mix(vec3(.60, .80, .93), vec3(.66, .83, .58), land);
    float ndl = dot(n, L);
    col *= mix(.74, 1., smoothstep(-.3, .7, ndl));
    float hat = step(.55, fract((px.x + px.y) * .085 + vn(px * .02) * .6)) * (1. - smoothstep(-.2, .45, ndl));
    col *= 1. - .16 * hat;
    float rim = pow(1. - max(dot(n, -rd), 0.), 4.);
    col = mix(col, vec3(.2, .2, .25), rim * .75);
    float w = tE * pix * 2.8;
    for (int j = 0; j < 4; j++) {
      if (uAl[j] < 0.002 || uSph[j].w < 0.002) continue;
      vec3 q = p - uSph[j].xyz; float dj = length(q);
      float d = abs(dj - uSph[j].w);
      float sn = length(cross(n, q / dj));
      float cd = d / max(sn, .22);
      float l = (1. - smoothstep(w * .55, w * 1.35, cd)) * uAl[j] * uGround;
      col = mix(col, uCol[j] * .8, l * .92);
    }
    T *= mix(vec3(1.), col * (0.92 + 0.12 * grain), eo);
  }
  T = mix(T, LC * (0.9 + 0.12 * grain), LA);
  gl_FragColor = vec4(mix(vec3(1.), T, uAlpha), 1.);
}`;

  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function init(c) {
    canvas = c;
    try {
      gl = c.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
      if (!gl) return false;
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const n of ['uRes', 'uCen', 'uF', 'uEarth', 'uAlpha', 'uGround', 'uFill', 'uEye', 'uR', 'uU', 'uFw']) U[n] = gl.getUniformLocation(pr, n);
      U.uSph = gl.getUniformLocation(pr, 'uSph[0]'); U.uCol = gl.getUniformLocation(pr, 'uCol[0]'); U.uAl = gl.getUniformLocation(pr, 'uAl[0]');
      gl.viewport(0, 0, c.width, c.height);
      ok = true;
    } catch (e) { console.error('WebGL:', e); ok = false; }
    return ok;
  }
  let shown = null;
  function render(g) {
    if (!ok) return;
    const vis = !!(g && g.alpha > 0.003);
    if (vis !== shown) { canvas.style.visibility = vis ? 'visible' : 'hidden'; shown = vis; }
    if (!vis) return;
    const c = g.cam;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uCen, c.cx, c.cy);
    gl.uniform1f(U.uF, c.f); gl.uniform1f(U.uEarth, g.earth || 0); gl.uniform1f(U.uAlpha, g.alpha); gl.uniform1f(U.uGround, g.ground || 0); gl.uniform1f(U.uFill, g.fill === undefined ? 1 : g.fill);
    gl.uniform3fv(U.uEye, c.eye); gl.uniform3fv(U.uR, c.r); gl.uniform3fv(U.uU, c.u); gl.uniform3fv(U.uFw, c.fw);
    const sp = new Float32Array(16), col = new Float32Array(12), al = new Float32Array(4);
    g.spheres.forEach((s, i) => { sp.set([s.c[0], s.c[1], s.c[2], s.r], i * 4); col.set(s.col, i * 3); al[i] = s.a; });
    gl.uniform4fv(U.uSph, sp); gl.uniform3fv(U.uCol, col); gl.uniform1fv(U.uAl, al);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* kamera + projeksjon, delt med 2D-laget */
  const V = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
  };
  const F = 1766, CX = 690, CY = 540;
  function cam(o) {
    const D = Math.PI / 180, a = o.az * D, e = o.el * D, t = [o.tx, o.ty, o.tz];
    const eye = [t[0] + o.dist * Math.cos(e) * Math.cos(a), t[1] + o.dist * Math.sin(e), t[2] + o.dist * Math.cos(e) * Math.sin(a)];
    const fw = V.norm(V.sub(t, eye)), r = V.norm(V.cross(fw, [0, 1, 0])), u = V.cross(r, fw);
    return { eye, fw, r, u, f: F, cx: CX, cy: CY };
  }
  function project(c, p) {
    const v = V.sub(p, c.eye), z = V.dot(v, c.fw);
    return [c.cx + c.f * V.dot(v, c.r) / z, c.cy - c.f * V.dot(v, c.u) / z, z];
  }
  /* tre kuler -> to punkter */
  function trilat(p1, r1, p2, r2, p3, r3) {
    const ex = V.norm(V.sub(p2, p1)), d = V.len(V.sub(p2, p1));
    const i = V.dot(ex, V.sub(p3, p1));
    const ey = V.norm(V.sub(V.sub(p3, p1), V.mul(ex, i)));
    const ez = V.cross(ex, ey), j = V.dot(ey, V.sub(p3, p1));
    const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const y = (r1 * r1 - r3 * r3 + i * i + j * j) / (2 * j) - i / j * x;
    const z = Math.sqrt(Math.max(0, r1 * r1 - x * x - y * y));
    const base = V.add(p1, V.add(V.mul(ex, x), V.mul(ey, y)));
    return [V.add(base, V.mul(ez, z)), V.sub(base, V.mul(ez, z))];
  }
  return { init, render, cam, project, trilat, V, F, CX, CY, get ok() { return ok; } };
})();
