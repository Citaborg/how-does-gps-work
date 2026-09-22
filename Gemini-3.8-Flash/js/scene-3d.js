/**
 * scene-3d.js
 * 3D WebGL / Three.js visualiseringsmotor for GPS Trilaterasjon:
 * - Myke, transparente sfærer i distinkte farger (uten harde silhuettkanter)
 * - Matematisk nøyaktige 3D-skjæringssirkler (ikke stiplet, men sterk lysende mikset farge)
 * - 3 sfærer gir nøyaktig 2 punkter (ett beholdes på bakken, ett forkastes i rom/kjerne)
 * - 4 sfærer låser posisjonen og eliminerer klokkeavvik
 * - Zoom-in mot jordoverflaten med bil og satellittbaner
 * - Fri kamera-navigasjon (OrbitControls)
 */

import {
  getSphereSphereIntersectionCircle,
  getThreeSphereIntersections
} from './math-utils.js';

export class Scene3D {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Satellitter i 3D
    this.satellites = [
      { id: 1, name: 'SAT 1', pos: [-40, 65, 30], color: 0x38bdf8, hex: '#38bdf8', active: true, progress: 1 },
      { id: 2, name: 'SAT 2', pos: [45, 60, 40], color: 0xfbbf24, hex: '#fbbf24', active: false, progress: 0 },
      { id: 3, name: 'SAT 3', pos: [10, 75, -50], color: 0xf472b6, hex: '#f472b6', active: false, progress: 0 },
      { id: 4, name: 'SAT 4', pos: [-25, 80, -20], color: 0x34d399, hex: '#34d399', active: false, progress: 0 }
    ];

    // Bilens posisjon på jordoverflaten i 3D
    this.carPos = [0, 5, 0];

    this.spheres = [];
    this.intersectionRing = null;
    this.intersectionPoints = [];
    this.satelliteMeshes = [];
    this.earthMesh = null;
    this.carMesh = null;

    this.step = 1; // 1, 2, 3, 4 satellitter
    this.animTime = 0;

    this.initThree();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f18);
    this.scene.fog = new THREE.FogExp2(0x0a0f18, 0.0035);

    // 2. Kamera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    this.camera.position.set(0, 90, 160);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls for fri utforskning
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.15;
      this.controls.minDistance = 20;
      this.controls.maxDistance = 450;
      this.controls.target.set(0, 20, 0);
    }

    // 5. Belysning
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(50, 150, 80);
    this.scene.add(dirLight);

    // 6. Bygg scenekomponenter
    this.buildEarthAndCar();
    this.buildSatellites();
    this.buildIntersectionGeometry();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.camera && this.renderer) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    }
  }

  buildEarthAndCar() {
    // Zoomer inn på et krummet stykke av jordkloden med blueprint-rutenett
    const earthRadius = 180;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 48, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      wireframe: false
    });

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(0, -earthRadius + this.carPos[1] - 1, 0);
    this.scene.add(this.earthMesh);

    // Kritt-/blueprint-rutenett på jordoverflaten
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const earthGrid = new THREE.Mesh(earthGeo, gridMat);
    this.earthMesh.add(earthGrid);

    // Bil på overflaten
    const carGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(4.5, 1.8, 2.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    carGroup.add(body);

    // Lykter og antenne
    const antGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
    const antMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(0, 2.5, 0);
    carGroup.add(ant);

    carGroup.position.set(this.carPos[0], this.carPos[1], this.carPos[2]);
    this.carMesh = carGroup;
    this.scene.add(this.carMesh);
  }

  buildSatellites() {
    this.satellites.forEach((sat) => {
      // 1. Satellitt-modell i 3D
      const satGroup = new THREE.Group();

      // Kjerne
      const coreGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const coreMat = new THREE.MeshStandardMaterial({ color: sat.color, metalness: 0.8, roughness: 0.2 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      satGroup.add(core);

      // Solceller
      const wingGeo = new THREE.BoxGeometry(4.5, 1.5, 0.2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.x = -3.8;
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.x = 3.8;
      satGroup.add(leftWing, rightWing);

      satGroup.position.set(sat.pos[0], sat.pos[1], sat.pos[2]);
      this.scene.add(satGroup);
      this.satelliteMeshes.push(satGroup);

      // 2. Avstandssfære (transparant farget skall, ingen harde yttergrenser)
      const trueDist = Math.hypot(
        sat.pos[0] - this.carPos[0],
        sat.pos[1] - this.carPos[1],
        sat.pos[2] - this.carPos[2]
      );

      const sphereGeo = new THREE.SphereGeometry(trueDist, 40, 30);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(sat.pos[0], sat.pos[1], sat.pos[2]);
      sphereMesh.scale.set(0.001, 0.001, 0.001); // Starter usynlig
      this.scene.add(sphereMesh);

      this.spheres.push({
        satId: sat.id,
        mesh: sphereMesh,
        targetRadius: trueDist,
        currentScale: sat.active ? 1 : 0
      });
    });
  }

  buildIntersectionGeometry() {
    // 1. Skjæringsring (3D sirkel mellom sfære 1 og 2)
    // Bruker TorusGeometry for en glødende, massiv og tydelig ring i 3D
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa3e635, // Glødende lime/gull fargemiks
      transparent: true,
      opacity: 0.95
    });

    // Dummy torus som vi oppdaterer matematisk
    const ringGeo = new THREE.TorusGeometry(1, 0.35, 16, 64);
    this.intersectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.intersectionRing.visible = false;
    this.scene.add(this.intersectionRing);

    // 2. Skjæringspunkter (for 3 sfærer)
    // Punkt A (Ekte bakkeposisjon)
    const ptGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const ptMatTrue = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const ptTrue = new THREE.Mesh(ptGeo, ptMatTrue);
    ptTrue.visible = false;
    this.scene.add(ptTrue);

    // Punkt B (Falsk kandidat i rommet / dypt i jorden som enkelt forkastes)
    const ptMatFalse = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const ptFalse = new THREE.Mesh(ptGeo, ptMatFalse);
    ptFalse.visible = false;
    this.scene.add(ptFalse);

    this.intersectionPoints = [ptTrue, ptFalse];
  }

  /**
   * Setter antall aktive satellitter i 3D (1, 2, 3, 4)
   */
  setSatelliteCount(count) {
    this.step = Math.max(1, Math.min(4, count));
    for (let i = 0; i < 4; i++) {
      this.satellites[i].active = i < this.step;
    }
  }

  update(dt) {
    this.animTime += dt;

    // Satellittbane-drift
    this.satellites.forEach((sat, idx) => {
      const mesh = this.satelliteMeshes[idx];
      const sphere = this.spheres[idx];

      // Myk oppskalering / animering inn når en satellitt aktiveres
      const targetScale = sat.active ? 1.0 : 0.001;
      sphere.currentScale += (targetScale - sphere.currentScale) * Math.min(1, dt * 2.5);
      sphere.mesh.scale.set(sphere.currentScale, sphere.currentScale, sphere.currentScale);
      sphere.mesh.visible = sphere.currentScale > 0.02;
      mesh.visible = sat.active || sphere.currentScale > 0.05;

      // Liten rolig svev i bane
      mesh.rotation.y += dt * 0.2;
    });

    // MATEMATISK BEREGNING OG VISNING AV SKJÆRINGER
    const sat1 = this.satellites[0];
    const sat2 = this.satellites[1];
    const sat3 = this.satellites[2];

    const r1 = this.spheres[0].targetRadius;
    const r2 = this.spheres[1].targetRadius;
    const r3 = this.spheres[2].targetRadius;

    // A) 2 Satellitter: Skjæringsring i 3D
    if (this.step >= 2 && this.spheres[1].currentScale > 0.6) {
      const circleData = getSphereSphereIntersectionCircle(sat1.pos, r1, sat2.pos, r2);
      if (circleData) {
        this.intersectionRing.visible = true;
        this.intersectionRing.position.set(circleData.center[0], circleData.center[1], circleData.center[2]);

        // Juster radius
        const targetRad = Math.max(0.1, circleData.radius);
        this.intersectionRing.scale.set(targetRad, targetRad, targetRad);

        // Orienter ringen slik at normalen peker langs aksen mellom satellittene
        const defaultNormal = new THREE.Vector3(0, 0, 1);
        const targetNormal = new THREE.Vector3(circleData.normal[0], circleData.normal[1], circleData.normal[2]).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(defaultNormal, targetNormal);
        this.intersectionRing.setRotationFromQuaternion(quat);
      }
    } else {
      this.intersectionRing.visible = false;
    }

    // B) 3 Satellitter: 2 Diskrete punkter
    if (this.step >= 3 && this.spheres[2].currentScale > 0.6) {
      const pts = getThreeSphereIntersections(sat1.pos, r1, sat2.pos, r2, sat3.pos, r3);
      if (pts && pts.length === 2) {
        this.intersectionPoints[0].visible = true;
        this.intersectionPoints[1].visible = true;

        // Punkt 0 er nær bakken (bilen)
        this.intersectionPoints[0].position.set(pts[0][0], pts[0][1], pts[0][2]);
        // Punkt 1 er det urealistiske punktet
        this.intersectionPoints[1].position.set(pts[1][0], pts[1][1], pts[1][2]);
      }
    } else {
      this.intersectionPoints[0].visible = false;
      this.intersectionPoints[1].visible = false;
    }

    // Oppdater kontroller
    if (this.controls) {
      this.controls.update();
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
