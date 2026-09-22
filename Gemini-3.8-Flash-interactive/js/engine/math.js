/**
 * GPS Math & Physics Engine
 * Contains vector math, circle/sphere intersections, exact 3D sphere-sphere
 * intersection rings, Doppler calculations, and relativistic time dilation.
 */

window.GPSMath = {
  SPEED_OF_LIGHT: 299792458, // m/s
  EARTH_RADIUS_KM: 6371,
  GPS_ALTITUDE_KM: 20200,

  dist2D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  dist3D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Smooth ease-out cubic for organic animations
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  // 2D Circle Intersections
  getCircleIntersections(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
      return [];
    }

    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

    const p2x = c1.x + (dx * a) / d;
    const p2y = c1.y + (dy * a) / d;

    return [
      { x: p2x + (h * dy) / d, y: p2y - (h * dx) / d },
      { x: p2x - (h * dy) / d, y: p2y + (h * dx) / d }
    ];
  },

  // Exact 3D Sphere-Sphere Intersection Circle
  // Returns { center: {x,y,z}, radius: r, u: {x,y,z}, v: {x,y,z} } or null
  getSphereSphereIntersectionRing3D(c1, r1, c2, r2) {
    const d = this.dist3D(c1, c2);
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
      return null;
    }

    // Distance from c1 to circle plane
    const h = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const rRing = Math.sqrt(Math.max(0, r1 * r1 - h * h));

    // Normal unit vector from c1 to c2
    const nx = (c2.x - c1.x) / d;
    const ny = (c2.y - c1.y) / d;
    const nz = (c2.z - c1.z) / d;

    // Center of ring in 3D
    const center = {
      x: c1.x + nx * h,
      y: c1.y + ny * h,
      z: c1.z + nz * h
    };

    // Find two orthogonal vectors u, v perpendicular to normal n
    // Choose arbitrary non-parallel vector
    let ax = 0, ay = 1, az = 0;
    if (Math.abs(ny) > 0.9) {
      ax = 1; ay = 0; az = 0;
    }

    // u = normalize(cross(n, a))
    let ux = ny * az - nz * ay;
    let uy = nz * ax - nx * az;
    let uz = nx * ay - ny * ax;
    const uLen = Math.hypot(ux, uy, uz);
    ux /= uLen; uy /= uLen; uz /= uLen;

    // v = cross(n, u)
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;

    return {
      center,
      radius: rRing,
      u: { x: ux, y: uy, z: uz },
      v: { x: vx, y: vy, z: vz },
      normal: { x: nx, y: ny, z: nz }
    };
  },

  // Exact 3D Three-Sphere Intersection Points (returns [knownPoint, conjugatePoint])
  getThreeSphereIntersections3D(c1, r1, c2, r2, c3, r3, knownPoint) {
    const ring = this.getSphereSphereIntersectionRing3D(c1, r1, c2, r2);
    if (!ring) return [knownPoint];
    const { center, u, v } = ring;

    const dc3 = { x: c3.x - center.x, y: c3.y - center.y, z: c3.z - center.z };
    const c3u = dc3.x * u.x + dc3.y * u.y + dc3.z * u.z;
    const c3v = dc3.x * v.x + dc3.y * v.y + dc3.z * v.z;
    const c3Len = Math.hypot(c3u, c3v);

    if (c3Len < 1e-5) {
      return [knownPoint];
    }

    const mu = c3u / c3Len;
    const mv = c3v / c3Len;

    const dkp = { x: knownPoint.x - center.x, y: knownPoint.y - center.y, z: knownPoint.z - center.z };
    const kpu = dkp.x * u.x + dkp.y * u.y + dkp.z * u.z;
    const kpv = dkp.x * v.x + dkp.y * v.y + dkp.z * v.z;

    const dotM = kpu * mu + kpv * mv;
    const conjU = 2 * dotM * mu - kpu;
    const conjV = 2 * dotM * mv - kpv;

    const conjugatePoint = {
      x: center.x + conjU * u.x + conjV * v.x,
      y: center.y + conjU * u.y + conjV * v.y,
      z: center.z + conjU * u.z + conjV * v.z
    };

    return [knownPoint, conjugatePoint];
  },

  // 3D Matrix & Vector Rotation
  rotate3D(point, rotX, rotY, rotZ = 0) {
    let { x, y, z } = point;

    // Rotate Y
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotate X
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Rotate Z
    const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
    const x3 = x1 * cosZ - y2 * sinZ;
    const y3 = x1 * sinZ + y2 * cosZ;

    return { x: x3, y: y3, z: z2 };
  },

  project3D(point3D, width, height, scale = 1, fov = 460) {
    const distance = 420;
    const z = point3D.z + distance;
    if (z <= 10) return { x: 0, y: 0, scale: 0, depth: z, visible: false };

    const projScale = (fov / z) * scale;
    const x2d = width / 2 + point3D.x * projScale;
    const y2d = height / 2 - point3D.y * projScale;

    return {
      x: x2d,
      y: y2d,
      scale: projScale,
      depth: z,
      visible: true
    };
  }
};
