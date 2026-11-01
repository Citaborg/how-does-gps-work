// Geometry is in illustrative coordinates, never real satellite ephemerides.
export const C = 299792458;
export const L1 = 1575.42e6;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const mul = (a, s) => a.map(x => x * s);
export const dot = (a, b) => a.reduce((v, x, i) => v + x * b[i], 0);
export const length = a => Math.hypot(...a);
export const distance = (a, b) => length(sub(a, b));
export const unit = a => mul(a, 1 / (length(a) || 1));
export const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];

export function circleIntersections(a, ra, b, rb) {
  const d = distance(a, b);
  if (d < 1e-9 || d > ra + rb + 1e-8 || d < Math.abs(ra - rb) - 1e-8) return [];
  const x = (ra*ra - rb*rb + d*d) / (2*d);
  const h = Math.sqrt(Math.max(0, ra*ra - x*x));
  const v = mul(sub(b, a), 1/d), p = add(a, mul(v, x)), n = [-v[1], v[0]];
  return h < 1e-8 ? [p] : [add(p, mul(n, h)), add(p, mul(n, -h))];
}

export function errorGeometry(cluster) {
  const receiver=[500,480],spread=[[220,225],[780,230],[540,110]],group=[[390,180],[610,180],[510,130]],errors=[9,-9,6];
  const satellites=spread.map((s,i)=>s.map((x,j)=>mix(x,group[i][j],clamp(cluster))));
  const radii=satellites.map((s,i)=>distance(s,receiver)+errors[i]);
  const triangle=[[0,1],[1,2],[2,0]].map(([i,j])=>circleIntersections(satellites[i],radii[i],satellites[j],radii[j]).sort((a,b)=>distance(a,receiver)-distance(b,receiver))[0]).filter(Boolean);
  return {receiver,satellites,radii,triangle};
}

export function sphereCircle(a, ra, b, rb) {
  const d = distance(a, b);
  if (d < 1e-9 || d > ra + rb || d < Math.abs(ra - rb)) return null;
  const normal = unit(sub(b, a)), x = (ra*ra - rb*rb + d*d) / (2*d);
  const center = add(a, mul(normal, x)), radius = Math.sqrt(Math.max(0, ra*ra-x*x));
  const u = unit(cross(normal, Math.abs(normal[1]) < .9 ? [0,1,0] : [1,0,0]));
  return { center, radius, normal, u, v: cross(normal, u) };
}
export function circlePoint(circle, angle) {
  return add(circle.center, add(mul(circle.u, Math.cos(angle)*circle.radius), mul(circle.v, Math.sin(angle)*circle.radius)));
}

export function trilaterate(a, ra, b, rb, c, rc) {
  const ex = unit(sub(b,a)), d = distance(a,b), ac = sub(c,a), i = dot(ex,ac);
  const acOrthogonal = sub(ac,mul(ex,i)), j = length(acOrthogonal);
  if (d < 1e-8 || j < 1e-8) return [];
  const ey = mul(acOrthogonal,1/j), ez = cross(ex,ey);
  const x = (ra*ra-rb*rb+d*d)/(2*d);
  const y = (ra*ra-rc*rc+i*i+j*j-2*i*x)/(2*j);
  const z2 = ra*ra-x*x-y*y;
  if (z2 < -1e-8) return [];
  const p = add(a,add(mul(ex,x),mul(ey,y))), z = Math.sqrt(Math.max(0,z2));
  return z < 1e-8 ? [p] : [add(p,mul(ez,z)),add(p,mul(ez,-z))];
}

export function solveLinear(matrix, rhs) {
  const n=rhs.length, a=matrix.map((row,i)=>[...row,rhs[i]]);
  for (let j=0;j<n;j++) {
    let p=j;
    for(let i=j+1;i<n;i++) if(Math.abs(a[i][j])>Math.abs(a[p][j])) p=i;
    if(Math.abs(a[p][j])<1e-12) return null;
    [a[j],a[p]]=[a[p],a[j]];
    const divisor=a[j][j];
    for(let k=j;k<=n;k++) a[j][k]/=divisor;
    for(let i=0;i<n;i++) if(i!==j) {
      const f=a[i][j];
      for(let k=j;k<=n;k++) a[i][k]-=f*a[j][k];
    }
  }
  return a.map(row=>row[n]);
}

// Fourth state is clock bias expressed as a distance, b = c·δt.
// All four unknowns are solved together; no assumed receiver clock is needed.
export function solvePseudoranges(satellites, ranges, initial=[0,0,0,0]) {
  if(satellites.length<4 || satellites.length!==ranges.length) return null;
  let state=[...initial];
  for(let iteration=0;iteration<30;iteration++) {
    const rows=satellites.map(s=>[...unit(sub(state.slice(0,3),s)),1]);
    const residual=satellites.map((s,i)=>ranges[i]-distance(state.slice(0,3),s)-state[3]);
    const normal=Array.from({length:4},(_,j)=>Array.from({length:4},(_,k)=>rows.reduce((sum,r)=>sum+r[j]*r[k],0)));
    const rhs=Array.from({length:4},(_,j)=>rows.reduce((sum,r,i)=>sum+r[j]*residual[i],0));
    const delta=solveLinear(normal,rhs);
    if(!delta) return null;
    state=add(state,delta);
    // Earth-scale ranges lose a few nanometres when subtracted. Stop above
    // that floating-point floor instead of oscillating around a solved state.
    const tolerance=Math.max(1e-8,Math.max(...ranges)*Number.EPSILON*128);
    if(length(delta)<tolerance) return state;
  }
  return null;
}

export const rangeRate = (receiver, receiverVelocity, satellite, satelliteVelocity) =>
  dot(unit(sub(satellite,receiver)),sub(satelliteVelocity,receiverVelocity));
export const dopplerShift = rate => -rate * L1 / C;

export const SPACE_SATS = [[-1.35,.8,.35],[1.3,.65,.2],[-.1,-.9,-.95],[.6,.2,1.6]];
export const SPACE_RECEIVER = [.12,-.15,.12];
export const SPACE_RADII = SPACE_SATS.map(s=>distance(s,SPACE_RECEIVER));

export function cameraBasis(yaw=.2, pitch=.14, target=[0,0,0], radius=6.5) {
  const eye=add(target,[Math.sin(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius,Math.cos(yaw)*Math.cos(pitch)*radius]);
  const forward=unit(sub(target,eye)), right=unit(cross(forward,[0,1,0])), up=cross(right,forward);
  return {eye,forward,right,up};
}
export function project(point,camera,width,height) {
  const rel=sub(point,camera.eye), z=dot(rel,camera.forward), focal=height*1.42;
  return [width/2+dot(rel,camera.right)*focal/z,height/2-dot(rel,camera.up)*focal/z,z];
}
