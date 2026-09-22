import assert from 'node:assert/strict';
import test from 'node:test';
import {
  carPosition,
  circleIntersections,
  distance,
  leastSquaresPosition,
  lineOfSightMotion,
  segmentIntersectsRect,
  sphereIntersection,
  tripleSphereIntersections,
} from '../src/geometry.js';

const closeTo = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);
};

test('least-squares error illustration minimizes real range residuals', () => {
  const centers = [{x:230,y:160},{x:782,y:190},{x:500,y:570}];
  const target = {x:505,y:362};
  const exact = centers.map(c => Math.hypot(c.x-target.x,c.y-target.y));
  const ideal = leastSquaresPosition(centers, exact, {x:490,y:350});
  closeTo(ideal.x,target.x); closeTo(ideal.y,target.y);
  const noisy = exact.map((r,i) => r + [13,-9,16][i]);
  const fitted = leastSquaresPosition(centers,noisy,{x:500,y:350});
  const residual = p => centers.reduce((sum,c,i) => sum + (Math.hypot(p.x-c.x,p.y-c.y)-noisy[i])**2,0);
  for(const [dx,dy] of [[.1,0],[-.1,0],[0,.1],[0,-.1]]) {
    assert.ok(residual(fitted)<residual({x:fitted.x+dx,y:fitted.y+dy}));
  }
});

test('Doppler projection includes vertical motion and agrees with change in range', () => {
  const current = carPosition(34), future = carPosition(34.001);
  const receiver = [current.x, current.y - 16], satellite = [811,188];
  const velocity = [(future.x-current.x)/.001, (future.y-current.y)/.001];
  assert.ok(Math.abs(velocity[1]) > 1);
  const motion = lineOfSightMotion(receiver,satellite,velocity);
  closeTo(motion.relativeRangeRate,-motion.receiverProjection);
  const tiny = .00001;
  const shifted = receiver.map((v,i)=>v+velocity[i]*tiny);
  closeTo((distance(shifted,satellite)-distance(receiver,satellite))/tiny,motion.relativeRangeRate,.01);
  assert.ok(Math.abs(motion.receiverProjection-motion.unit[0]*velocity[0])>1);
});

test('the returning car retraces the drawn road without a position jump', () => {
  for (const time of [2,3,4,5,6,7,8,9,10]) {
    const outward = carPosition(time), returning = carPosition(22-time);
    closeTo(outward.x,returning.x); closeTo(outward.y,returning.y);
    closeTo(returning.y,425-55*Math.sin(Math.PI*(returning.x-150)/640));
  }
});

test('multipath becomes available only when BOTH reflected legs clear the blocker', () => {
  const rect = {left:390,right:455,top:255,bottom:415};
  const source = [185,109], wall = 830;
  const path = x => {
    const receiver = [x,422], mirrorX = 2*wall-x;
    const bounce = [wall,source[1]+(receiver[1]-source[1])*(wall-source[0])/(mirrorX-source[0])];
    return {
      direct: !segmentIntersectsRect(source,receiver,rect),
      echo: !segmentIntersectsRect(source,bounce,rect)&&!segmentIntersectsRect(bounce,receiver,rect),
    };
  };
  assert.equal(path(300).direct,true);
  assert.deepEqual(path(410),{direct:false,echo:false});
  assert.deepEqual(path(500),{direct:false,echo:true});
  assert.equal(path(820).direct,true);
  assert.equal(segmentIntersectsRect([400,300],[401,301],rect),true);
  assert.equal(segmentIntersectsRect([200,200],[200,500],rect),false);
});

test('circle intersections lie on both input circles', () => {
  const a = { x: 1, y: 2 };
  const b = { x: 7, y: 5 };
  const points = circleIntersections(a, 5, b, 4);
  assert.equal(points.length, 2);
  for (const point of points) {
    closeTo(Math.hypot(point.x - a.x, point.y - a.y), 5);
    closeTo(Math.hypot(point.x - b.x, point.y - b.y), 4);
  }
});

test('circle intersections handle tangency, disjoint circles, and concentric circles', () => {
  const tangent = circleIntersections({ x: 0, y: 0 }, 2, { x: 4, y: 0 }, 2);
  assert.equal(tangent.length, 1);
  closeTo(tangent[0].x, 2);
  closeTo(tangent[0].y, 0);
  assert.deepEqual(circleIntersections({ x: 0, y: 0 }, 1, { x: 3, y: 0 }, 1), []);
  assert.deepEqual(circleIntersections({ x: 0, y: 0 }, 2, { x: 0, y: 0 }, 2), []);
  assert.deepEqual(circleIntersections({ x: 0, y: 0 }, 3, { x: 0, y: 0 }, 1), []);
});

test('sphere intersection supplies an orthonormal plane basis', () => {
  const result = sphereIntersection([0, 0, 0], 5, [6, 0, 0], 5);
  assert.ok(result);
  closeTo(distance(result.center, [0, 0, 0]) ** 2 + result.radius ** 2, 25);
  closeTo(distance(result.center, [6, 0, 0]) ** 2 + result.radius ** 2, 25);
  closeTo(distance(result.normal, [0, 0, 0]), 1);
  closeTo(distance(result.u, [0, 0, 0]), 1);
  closeTo(distance(result.v, [0, 0, 0]), 1);
  closeTo(result.normal.reduce((sum, value, index) => sum + value * result.u[index], 0), 0);
  closeTo(result.normal.reduce((sum, value, index) => sum + value * result.v[index], 0), 0);
  closeTo(result.u.reduce((sum, value, index) => sum + value * result.v[index], 0), 0);
  assert.equal(sphereIntersection([0, 0, 0], 1, [3, 0, 0], 1), null);
  assert.equal(sphereIntersection([0, 0, 0], 2, [0, 0, 0], 2), null);
});

test('triple sphere intersections satisfy all three sphere distances', () => {
  const points = tripleSphereIntersections([0, 0, 0], 5, [6, 0, 0], 5, [3, 4, 0], 5);
  assert.equal(points.length, 2);
  for (const point of points) {
    closeTo(distance(point, [0, 0, 0]), 5);
    closeTo(distance(point, [6, 0, 0]), 5);
    closeTo(distance(point, [3, 4, 0]), 5);
  }

  const tangent = tripleSphereIntersections([0, 0, 0], 5, [6, 0, 0], 5, [3, 4, 0], 8);
  assert.equal(tangent.length, 1);
  for (const point of tangent) closeTo(distance(point, [3, 4, 0]), 8);
  assert.deepEqual(tripleSphereIntersections([0, 0, 0], 1, [3, 0, 0], 1, [0, 3, 0], 1), []);
});

test('car route is bounded, deterministic, stationary during overlays, and continuous at every phase boundary', () => {
  for (const time of [-40, -0.5, 0, 1, 2, 6, 10, 11, 12, 16, 20, 40]) {
    const position = carPosition(time);
    assert.ok(position.x >= 150 && position.x <= 850);
    assert.ok(position.y >= 370 && position.y <= 480);
    assert.ok(position.speed >= 0);
    assert.deepEqual(position, carPosition(time));
  }
  assert.deepEqual(carPosition(0), carPosition(20));
  assert.deepEqual(carPosition(10), carPosition(11));
  for (const boundary of [2, 10, 12, 20]) {
    const before = carPosition(boundary - 1e-6);
    const at = carPosition(boundary);
    const after = carPosition(boundary + 1e-6);
    assert.ok(Math.hypot(before.x - at.x, before.y - at.y) < 1e-5);
    assert.ok(Math.hypot(after.x - at.x, after.y - at.y) < 1e-5);
    closeTo(at.speed, 0);
  }
  assert.ok(carPosition(6).x < carPosition(9).x);
  assert.ok(carPosition(16).x < carPosition(13).x);
});
