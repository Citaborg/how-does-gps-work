import test from 'node:test';
import assert from 'node:assert/strict';
import { C, L1, distance, dot, sub, circleIntersections, errorGeometry, sphereCircle, circlePoint, trilaterate, solvePseudoranges, rangeRate, dopplerShift, SPACE_SATS, SPACE_RADII, SPACE_RECEIVER, cameraBasis, project } from '../geometry.js';

const near=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} should be near ${expected}`);

test('two circles intersect at two candidates, tangent once, or never',()=>{
  const points=circleIntersections([0,0],5,[8,0],5);
  assert.equal(points.length,2);
  for(const p of points){near(p[0],4);near(Math.abs(p[1]),3);}
  assert.equal(circleIntersections([0,0],1,[2,0],1).length,1);
  assert.equal(circleIntersections([0,0],1,[4,0],1).length,0);
  assert.equal(circleIntersections([0,0],5,[1,0],1).length,0);
  assert.equal(circleIntersections([0,0],1,[0,0],1).length,0);
});

test('the 2D story eliminates the other candidate with the third range',()=>{
  const sats=[[325,280],[675,280],[490,150]],receiver=[500,475];
  const radii=sats.map(s=>distance(s,receiver)),hits=circleIntersections(sats[0],radii[0],sats[1],radii[1]);
  assert.equal(hits.length,2);
  const valid=hits.filter(p=>Math.abs(distance(p,sats[2])-radii[2])<1e-6);
  assert.equal(valid.length,1);near(distance(valid[0],receiver),0);
});

test('the sphere intersection curve lies on both surfaces at every sampled angle',()=>{
  const circle=sphereCircle(SPACE_SATS[0],SPACE_RADII[0],SPACE_SATS[1],SPACE_RADII[1]);
  assert.ok(circle);
  for(let i=0;i<90;i++){
    const p=circlePoint(circle,i*Math.PI*2/90);
    near(distance(p,SPACE_SATS[0]),SPACE_RADII[0]);near(distance(p,SPACE_SATS[1]),SPACE_RADII[1]);
    near(dot(sub(p,circle.center),circle.normal),0);
  }
  assert.equal(sphereCircle([0,0,0],1,[5,0,0],1),null);
});

test('the error triangle remains closed throughout clustering and grows with worse geometry',()=>{
  const area=points=>Math.abs(points.reduce((sum,p,i)=>sum+p[0]*points[(i+1)%3][1]-p[1]*points[(i+1)%3][0],0))/2;
  for(let i=0;i<=100;i++){
    const model=errorGeometry(i/100);
    assert.equal(model.triangle.length,3,`Missing intersection at ${i}%`);
    assert.ok(area(model.triangle)>1);
  }
  assert.ok(area(errorGeometry(1).triangle)>area(errorGeometry(0).triangle)*2);
});

test('three spheres give two actual common points; the fourth rejects the wrong point',()=>{
  const [a,b,c]=SPACE_SATS,[ra,rb,rc]=SPACE_RADII,hits=trilaterate(a,ra,b,rb,c,rc);
  assert.equal(hits.length,2);
  for(const p of hits)for(let i=0;i<3;i++)near(distance(p,SPACE_SATS[i]),SPACE_RADII[i]);
  const valid=hits.filter(p=>Math.abs(distance(p,SPACE_SATS[3])-SPACE_RADII[3])<1e-7);
  assert.equal(valid.length,1);near(distance(valid[0],SPACE_RECEIVER),0);
  // The rejected point in this illustrative local model is above the ground patch.
  const rejected=hits.find(p=>distance(p,SPACE_RECEIVER)>.01);
  assert.ok(rejected[1]>SPACE_RECEIVER[1]);
});

test('four pseudoranges recover position AND a receiver clock bias independently',()=>{
  const sats=[[15e6,0,20e6],[-15e6,5e6,20e6],[0,-15e6,22e6],[5e6,15e6,18e6],[18e6,10e6,10e6]];
  const position=[3e6,-2e6,5e6],bias=8100;
  const measured=sats.map(s=>distance(s,position)+bias);
  const answer=solvePseudoranges(sats,measured);
  assert.ok(answer);near(distance(answer.slice(0,3),position),0,.001);near(answer[3],bias,.001);
  const four=solvePseudoranges(sats.slice(0,4),measured.slice(0,4));
  assert.ok(four);near(distance(four.slice(0,3),position),0,.001);near(four[3],bias,.001);
  assert.equal(solvePseudoranges(sats.slice(0,3),measured.slice(0,3)),null);
  assert.equal(solvePseudoranges(Array(4).fill([1,0,0]),Array(4).fill(2)),null);
});

test('Doppler sign, line-of-sight projection, and satellite motion are consistent',()=>{
  near(rangeRate([0,0,0],[20,0,0],[1000,0,0],[0,0,0]),-20);
  near(dopplerShift(-20),20*L1/C);
  assert.ok(dopplerShift(-20)>100&&dopplerShift(-20)<110);
  near(rangeRate([0,0,0],[0,20,0],[1000,0,0],[0,0,0]),0);
  near(rangeRate([0,0,0],[20,0,0],[1000,0,0],[50,0,0]),30);
  assert.ok(dopplerShift(30)<0);
  near(C*1e-6,299.792458);
});

test('camera projects its target to the center without singular positions',()=>{
  const camera=cameraBasis(.19,.14,[0,-.05,0],7.3),p=project([0,-.05,0],camera,1000,740);
  near(p[0],500);near(p[1],370);assert.ok(p[2]>0);
  for(const s of SPACE_SATS)assert.ok(project(s,camera,1000,740).every(Number.isFinite));
});
