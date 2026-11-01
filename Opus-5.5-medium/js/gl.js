'use strict';
/* WebGL2 ray-traced transparent spheres.
   Each pixel shoots a ray, finds every sphere surface it crosses, blends the
   colours order-independently (so overlapping spheres mix), and draws the
   lines where two sphere surfaces meet (the intersection circles) in a
   stronger mixed colour. An optional opaque Earth occludes what is behind it. */

const GL = (() => {
  const VS = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 uRes, uCenter;
  uniform float uTan, uScale, uLW, uTilt;
  uniform vec3 uPos, uF, uR, uU;
  uniform vec4 uS[4];
  uniform vec3 uC[4];
  uniform float uV[4];
  uniform vec4 uE;
  uniform float uEV;
  out vec4 frag;

  float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  vec2 hitS(vec3 ro, vec3 rd, vec4 s){
    vec3 oc = ro - s.xyz; float b = dot(oc, rd); float c = dot(oc,oc) - s.w*s.w;
    float h = b*b - c; if (h < 0.0) return vec2(-1.0); h = sqrt(h); return vec2(-b-h, -b+h);
  }
  float gridLine(float x, float step, float w){
    float f = abs(fract(x/step + 0.5) - 0.5) * step;
    return 1.0 - smoothstep(0.0, w, f);
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - uCenter) / (0.5*uRes.y);
    vec3 rd = normalize(uF + uv.x*uTan*uR + uv.y*uTan*uU);
    vec3 ro = uPos;
    float pix = 2.0*uTan/uRes.y;
    vec3 L = normalize(-0.5*uR + 0.8*uU - 0.45*uF);
    float grain = h21(floor(gl_FragCoord.xy/ (1.4*uScale)));

    /* ---- Earth ---- */
    float tE = 1e9; vec3 eCol = vec3(0.0); float eA = 0.0;
    if (uEV > 0.001) {
      vec2 he = hitS(ro, rd, uE);
      if (he.x > 0.0) {
        tE = he.x;
        vec3 p = ro + rd*tE; vec3 n = normalize(p - uE.xyz);
        float lam = max(dot(n, L), 0.0);
        float ct = cos(uTilt), st = sin(uTilt);
        vec3 m = vec3(n.x, ct*n.y - st*n.z, st*n.y + ct*n.z);
        float lat = degrees(asin(clamp(m.y, -1.0, 1.0)));
        float lon = degrees(atan(m.z, m.x));
        float facing = max(dot(n, -rd), 0.15);
        float wDeg = pix*tE/uE.w*57.2958/facing * 1.3;
        float g15 = max(gridLine(lat, 15.0, wDeg), gridLine(lon, 15.0, wDeg/max(cos(radians(lat)),0.05)));
        float fine = smoothstep(1.6, 0.25, wDeg);
        float g1 = max(gridLine(lat, 1.0, wDeg), gridLine(lon, 1.0, wDeg/max(cos(radians(lat)),0.05))) * fine;
        vec3 base = mix(vec3(0.70,0.80,0.80), vec3(0.88,0.90,0.84), smoothstep(-0.2,0.6,n.y));
        eCol = base*(0.62 + 0.42*lam);
        // pencil hatching on the night side
        float hatch = step(0.6, fract((gl_FragCoord.x + gl_FragCoord.y)/(5.0*uScale)));
        eCol = mix(eCol, vec3(0.30,0.32,0.38), hatch*(1.0-lam)*0.22);
        eCol = mix(eCol, vec3(0.20,0.20,0.26), g15*0.42 + g1*0.20);
        float rim = smoothstep(0.35, 0.0, facing);
        eCol = mix(eCol, vec3(0.17,0.16,0.21), rim*0.55);
        eCol *= 0.94 + 0.08*grain;
        eA = uEV;
      }
    }

    /* ---- spheres ---- */
    vec3 acc = vec3(0.0); float accA = 0.0; float T = 1.0;
    vec3 lineC = vec3(0.0); float lineA = 0.0;
    for (int i = 0; i < 4; i++) {
      if (uV[i] < 0.002 || uS[i].w < 0.01) continue;
      vec2 h = hitS(ro, rd, uS[i]);
      if (h.y < 0.0) continue;
      for (int k = 0; k < 2; k++) {
        float t = (k == 0) ? h.x : h.y;
        if (t < 0.0) continue;
        float occ = (t > tE) ? (1.0 - uEV) : 1.0;
        if (occ < 0.001) continue;
        vec3 p = ro + rd*t;
        vec3 n = (p - uS[i].xyz)/uS[i].w;
        float facing = abs(dot(n, rd));
        vec3 nn = (k == 0) ? n : -n;
        float lam = max(dot(nn, L), 0.0);
        float a = uV[i]*((k == 0) ? 0.30 : 0.17)*(0.18 + 0.82*facing)*occ;
        vec3 c = uC[i]*(0.70 + 0.40*lam) + vec3(0.10)*pow(lam, 10.0);
        float hatch = step(0.58, fract((gl_FragCoord.x - gl_FragCoord.y)/(6.5*uScale)));
        a += uV[i]*occ*0.09*(1.0 - lam)*hatch*((k == 0) ? 1.0 : 0.5)*facing;
        acc += c*a; accA += a; T *= (1.0 - a);

        float w = uLW*pix*t;
        for (int j = 0; j < 4; j++) {
          if (j == i || uV[j] < 0.002 || uS[j].w < 0.01) continue;
          float dj = abs(length(p - uS[j].xyz) - uS[j].w);
          float l = exp(-dj*dj/(w*w)) * min(uV[i], uV[j]) * occ * ((k == 0) ? 1.0 : 0.78);
          vec3 lc = mix(uC[i], uC[j], 0.5)*0.66;
          if (l > lineA) { lineA = l; lineC = lc; }
          for (int m = j + 1; m < 4; m++) {
            if (m == i || uV[m] < 0.002 || uS[m].w < 0.01) continue;
            float dm = abs(length(p - uS[m].xyz) - uS[m].w);
            float tp = exp(-(dj*dj + dm*dm)/(w*w*10.0)) * min(uV[i], min(uV[j], uV[m])) * occ;
            if (tp > 0.04) { lineC = mix(lineC, vec3(0.13,0.11,0.16), tp); lineA = max(lineA, tp); }
          }
        }
      }
    }
    vec3 sc = accA > 0.0 ? acc/accA : vec3(0.0);
    float sa = 1.0 - T;
    sa *= 0.9 + 0.1*grain;

    vec3 pm = eCol*eA*(1.0 - sa) + sc*sa;
    float pa = eA*(1.0 - sa) + sa;
    lineA = clamp(lineA*0.95, 0.0, 1.0);
    pm = pm*(1.0 - lineA) + lineC*lineA;
    pa = pa*(1.0 - lineA) + lineA;
    frag = vec4(pm, pa);
  }`;

  let gl = null, prog = null, loc = {}, canvas = null;
  const api = { ok: false };

  api.init = cv => {
    canvas = cv;
    gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return false;
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pl = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uCenter', 'uTan', 'uScale', 'uLW', 'uTilt', 'uPos', 'uF', 'uR', 'uU', 'uS', 'uC', 'uV', 'uE', 'uEV']
      .forEach(n => (loc[n] = gl.getUniformLocation(prog, n)));
    api.ok = true;
    return true;
  };

  api.resize = (w, h) => { if (!gl) return; canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); };

  api.clear = () => { if (!gl) return; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };

  /* st: { cam (from camera()), k (canvas px per stage px), spheres:[{c,r,col,vis}], earth:{c,r,vis}, tilt } */
  api.render = st => {
    if (!api.ok) return;
    const k = st.k, cam = st.cam;
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform2f(loc.uCenter, VIEW3.cx * k, (1080 - VIEW3.cy) * k);
    gl.uniform1f(loc.uTan, cam.tan);
    gl.uniform1f(loc.uScale, k);
    gl.uniform1f(loc.uLW, st.lineW || 2.3);
    gl.uniform1f(loc.uTilt, st.tilt || 0);
    gl.uniform3fv(loc.uPos, cam.pos); gl.uniform3fv(loc.uF, cam.F); gl.uniform3fv(loc.uR, cam.R); gl.uniform3fv(loc.uU, cam.U);
    const S = new Float32Array(16), C = new Float32Array(12), Vv = new Float32Array(4);
    (st.spheres || []).slice(0, 4).forEach((s, i) => {
      S.set([s.c[0], s.c[1], s.c[2], Math.max(0, s.r)], i * 4);
      C.set(rgb01(COL.s[s.col]), i * 3);
      Vv[i] = s.vis;
    });
    gl.uniform4fv(loc.uS, S); gl.uniform3fv(loc.uC, C); gl.uniform1fv(loc.uV, Vv);
    const e = st.earth || { c: [0, 0, 0], r: 1, vis: 0 };
    gl.uniform4f(loc.uE, e.c[0], e.c[1], e.c[2], e.r);
    gl.uniform1f(loc.uEV, e.vis);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return api;
})();

/* ---- camera shared by shader and the 2D overlay ---- */
const VIEW3 = { cx: 715, cy: 535 };

function camera(c) {
  const cp = Math.cos(c.pitch);
  const pos = V3.add(c.target, V3.mul([cp * Math.sin(c.yaw), Math.sin(c.pitch), cp * Math.cos(c.yaw)], c.dist));
  const F = V3.norm(V3.sub(c.target, pos));
  let R = V3.cross(F, [0, 1, 0]);
  if (V3.len(R) < 1e-6) R = [1, 0, 0];
  R = V3.norm(R);
  const U = V3.cross(R, F);
  return { pos, F, R, U, tan: Math.tan((c.fov || 40 * DEG) / 2), raw: c };
}
function camLerp(a, b, t) {
  return {
    target: V3.lerp(a.target, b.target, t), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t),
    dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t)), fov: lerp(a.fov || 40 * DEG, b.fov || 40 * DEG, t),
  };
}
function project(cam, p) {
  const d = V3.sub(p, cam.pos), z = V3.dot(d, cam.F);
  if (z < 0.01) return null;
  const s = 540 / cam.tan;
  return { x: VIEW3.cx + V3.dot(d, cam.R) / z * s, y: VIEW3.cy - V3.dot(d, cam.U) / z * s, z, scale: s / z };
}
/* screen radius of a sphere silhouette */
function projRadius(cam, c, r) {
  const D = V3.dist(cam.pos, c);
  if (D <= r) return 4000;
  return Math.tan(Math.asin(r / D)) / cam.tan * 540;
}
