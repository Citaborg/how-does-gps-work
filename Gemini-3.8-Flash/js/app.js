/**
 * GPS Cinematic Experience – Main Controller
 * Handles full-screen HD canvas rendering, vehicle stopping & multi-satellite geometry calculation overlays,
 * on-canvas Doppler velocity vector mathematics, rich volumetric 3D spheres with solid luminous intersection rings,
 * zoomed-in regional Earth, altitude rejection guide for 3D candidate points, and right-side calm narrative.
 */

window.App = {
  canvas: null,
  ctx: null,
  lastTime: 0,
  wavePhase: 0,
  camRotX: 0.22,
  camRotY: -0.35,
  isDragging3D: false,
  lastMouseX: 0,
  lastMouseY: 0,

  // Continuous Car State (No snapping or jumping!)
  carState: {
    x: 0,
    y: 0,
    speed: 75,
    isInitialized: false,
    heading: 0
  },

  // 2D Satellites (Color-coded)
  sats2D: [
    { id: 1, x: 220, y: 120, color: '#00f0ff', fill: 'rgba(0, 240, 255, 0.12)', name: 'SV 01' },
    { id: 2, x: 780, y: 130, color: '#e879f9', fill: 'rgba(232, 121, 249, 0.12)', name: 'SV 02' },
    { id: 3, x: 500, y: 80,  color: '#fbbf24', fill: 'rgba(251, 191, 36, 0.12)',  name: 'SV 03' },
    { id: 4, x: 280, y: 340, color: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', name: 'SV 04' }
  ],

  // 3D Satellites in Regional Sky Overhead (Zoomed-in scale)
  sats3D: [
    { id: 1, pos: { x: -160, y: 220, z: 40 },   color: '#00f0ff', fill: 'rgba(0, 240, 255, 0.14)', name: 'SV 01' },
    { id: 2, pos: { x: 160,  y: 210, z: 50 },   color: '#e879f9', fill: 'rgba(232, 121, 249, 0.14)', name: 'SV 02' },
    { id: 3, pos: { x: 0,    y: 240, z: -100 }, color: '#fbbf24', fill: 'rgba(251, 191, 36, 0.14)',  name: 'SV 03' },
    { id: 4, pos: { x: 60,   y: 150, z: 120 },  color: '#10b981', fill: 'rgba(16, 185, 129, 0.14)', name: 'SV 04' }
  ],
  userPos3D: { x: 10, y: 10, z: 10 },

  init() {
    this.canvas = document.getElementById('mainCanvas');
    if (!this.canvas) return;

    GPSStory.init();

    // Populate dropdown & timeline dots
    this.populateScenarioDropdown();
    this.buildTimelineDots();

    // Bind UI controls
    this.bindEvents();

    // Initial state update
    this.updateUI();
    this.updatePlayPauseIcon();

    // Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  populateScenarioDropdown() {
    const sel = document.getElementById('scenarioSelect');
    if (!sel) return;

    sel.innerHTML = GPSStory.scenes.map((scene, i) => `
      <option value="${i}" ${i === 0 ? 'selected' : ''}>
        ${scene.num.split(' ')[0]} ${scene.title}
      </option>
    `).join('');

    sel.addEventListener('change', (e) => {
      GPSStory.setScene(parseInt(e.target.value, 10));
      this.updateUI();
    });
  },

  buildTimelineDots() {
    const dotsContainer = document.getElementById('scenarioDots');
    if (!dotsContainer) return;

    let accumulated = 0;
    dotsContainer.innerHTML = GPSStory.scenes.map((scene, i) => {
      const pct = (accumulated / GPSStory.totalDuration) * 100;
      accumulated += scene.duration;
      // Thematic dot colors
      let themeClass = 'theme-2d';
      if (i >= 4 && i <= 7) themeClass = 'theme-3d';
      else if (i >= 8 && i <= 9) themeClass = 'theme-velocity';
      else if (i >= 10) themeClass = 'theme-security';

      return `<div class="scenario-dot ${themeClass} ${i === 0 ? 'active' : ''}" style="left: ${pct.toFixed(2)}%;"></div>`;
    }).join('');
  },

  bindEvents() {
    // Play/Pause
    const playBtn = document.getElementById('playPauseBtn');
    if (playBtn) playBtn.addEventListener('click', () => this.togglePlayPause());

    // Next / Prev
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => { GPSStory.nextScene(); this.updateUI(); });

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { GPSStory.prevScene(); this.updateUI(); });

    // Speed
    const speedBtn = document.getElementById('speedBtn');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        if (GPSStory.playbackSpeed === 1.0) GPSStory.playbackSpeed = 1.5;
        else if (GPSStory.playbackSpeed === 1.5) GPSStory.playbackSpeed = 2.0;
        else GPSStory.playbackSpeed = 1.0;
        speedBtn.innerText = `${GPSStory.playbackSpeed.toFixed(1)}x`;
      });
    }

    // Scrubber click
    const track = document.getElementById('timelineTrack');
    if (track) {
      track.addEventListener('click', (e) => {
        const rect = track.getBoundingClientRect();
        const progress = GPSMath.clamp((e.clientX - rect.left) / rect.width, 0, 1);
        GPSStory.seekToProgress(progress);
        this.updateUI();
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        GPSStory.nextScene();
        this.updateUI();
      } else if (e.code === 'ArrowLeft') {
        GPSStory.prevScene();
        this.updateUI();
      }
    });

    // 3D Canvas Dragging
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging3D = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging3D) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.camRotY += dx * 0.007;
      this.camRotX = GPSMath.clamp(this.camRotX + dy * 0.007, -Math.PI * 0.40, Math.PI * 0.40);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging3D = false;
    });

    // Touch support for 3D dragging
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging3D = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging3D || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;

      this.camRotY += dx * 0.007;
      this.camRotX = GPSMath.clamp(this.camRotX + dy * 0.007, -Math.PI * 0.40, Math.PI * 0.40);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging3D = false;
    });
  },

  togglePlayPause() {
    GPSStory.isPlaying = !GPSStory.isPlaying;
    this.updatePlayPauseIcon();
  },

  updatePlayPauseIcon() {
    const playIcon = document.getElementById('playIcon');
    if (playIcon) {
      playIcon.innerHTML = GPSStory.isPlaying
        ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        : '<polygon points="5 3 19 12 5 21 5 3"/>';
    }
  },

  updateUI() {
    const scene = GPSStory.getCurrentScene();
    if (!scene) return;

    // Tracker in top header with Theme Pill
    const trackerTheme = document.getElementById('trackerTheme');
    const trackerNum = document.getElementById('trackerNum');
    const trackerTitle = document.getElementById('trackerTitle');
    if (trackerTheme) trackerTheme.innerText = scene.tema.toUpperCase();
    if (trackerNum) trackerNum.innerText = scene.num;
    if (trackerTitle) trackerTitle.innerText = scene.title;

    // Dropdown sync
    const sel = document.getElementById('scenarioSelect');
    if (sel) sel.value = GPSStory.activeSceneIndex;

    // Right-side Calm Story Panel with smooth fade
    const panel = document.getElementById('storyPanel');
    if (panel) {
      panel.classList.add('fade-out');
      setTimeout(() => {
        const badge = document.getElementById('storyBadge');
        const heading = document.getElementById('storyHeading');
        const text = document.getElementById('storyText');
        const formula = document.getElementById('mathFormula');
        const subformula = document.getElementById('mathSub');
        const subtext = document.getElementById('storySubtext');

        if (badge) badge.innerText = scene.badge;
        if (heading) heading.innerText = scene.title;
        if (text) text.innerHTML = scene.text;
        if (formula) formula.innerText = scene.formula;
        if (subformula) subformula.innerText = scene.subformula;
        if (subtext) subtext.innerHTML = scene.subtext;

        panel.classList.remove('fade-out');
      }, 160);
    }

    // Timeline dots highlight
    const dots = document.querySelectorAll('#scenarioDots .scenario-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === GPSStory.activeSceneIndex);
    });
  },

  loop(currentTime) {
    const dt = Math.max(0.001, Math.min((currentTime - this.lastTime) / 1000, 0.1));
    this.lastTime = currentTime;

    const prevIndex = GPSStory.activeSceneIndex;
    GPSStory.update(dt);
    if (prevIndex !== GPSStory.activeSceneIndex) {
      this.updateUI();
    }

    // Scrubber update
    this.updateScrubber();

    // Render Fullscreen Canvas
    this.render(dt);

    requestAnimationFrame((t) => this.loop(t));
  },

  updateScrubber() {
    const fill = document.getElementById('timelineFill');
    const thumb = document.getElementById('timelineThumb');
    const timeCurrent = document.getElementById('timeCurrent');
    const timeTotal = document.getElementById('timeTotal');

    const progress = (GPSStory.totalElapsed / GPSStory.totalDuration) * 100;
    if (fill) fill.style.width = `${progress.toFixed(2)}%`;
    if (thumb) thumb.style.left = `${progress.toFixed(2)}%`;

    if (timeCurrent) {
      const curM = Math.floor(GPSStory.totalElapsed / 60);
      const curS = Math.floor(GPSStory.totalElapsed % 60);
      timeCurrent.innerText = `${curM < 10 ? '0' + curM : curM}:${curS < 10 ? '0' + curS : curS}`;
    }
    if (timeTotal) {
      const totM = Math.floor(GPSStory.totalDuration / 60);
      const totS = Math.floor(GPSStory.totalDuration % 60);
      timeTotal.innerText = `${totM < 10 ? '0' + totM : totM}:${totS < 10 ? '0' + totS : totS}`;
    }
  },

  // Helper: Satellite entrance animation metrics
  getSatEntrance(satIndex, totalActiveSats, sceneTime) {
    if (satIndex < totalActiveSats - 1) {
      return { progress: 1.0, eased: 1.0, isNew: false };
    }
    // In Scenario 4 (4 satellites with clock error), Sat 4 arrives after the 3-sat error triangle has been established
    if (totalActiveSats === 4 && sceneTime !== undefined) {
      if (sceneTime < 3.5) {
        return { progress: 0.0, eased: 0.0, isNew: true };
      }
      const progress = GPSMath.clamp((sceneTime - 3.5) / 1.6, 0, 1);
      const eased = GPSMath.easeOutCubic(progress);
      return { progress, eased, isNew: true };
    }
    const progress = GPSMath.clamp(sceneTime / 2.0, 0, 1);
    const eased = GPSMath.easeOutCubic(progress);
    return { progress, eased, isNew: true };
  },

  // Continuous Car Motion: Never snaps or jumps! Smooth deceleration to standstill in place
  updateCar2D(dt, areaW, height, sceneTime) {
    if (!this.carState.isInitialized) {
      this.carState.x = areaW * 0.28;
      this.carState.y = height * 0.65;
      this.carState.isInitialized = true;
    }
    this.carState.y = height * 0.65;

    const cycleTime = sceneTime % 10.0;
    let speedFactor = 1.0;
    let isStopping = false;

    if (cycleTime < 2.5) {
      speedFactor = 1.0;
    } else if (cycleTime < 3.5) {
      // Smooth cosine brake to 0
      const u = (cycleTime - 2.5) / 1.0;
      speedFactor = 0.5 * (1 + Math.cos(Math.PI * u));
    } else if (cycleTime < 8.0) {
      // Completely stationary in situ
      speedFactor = 0.0;
      isStopping = true;
    } else if (cycleTime < 9.0) {
      // Smooth cosine acceleration from 0 back to 1
      const u = (cycleTime - 8.0) / 1.0;
      speedFactor = 0.5 * (1 - Math.cos(Math.PI * u));
    } else {
      speedFactor = 1.0;
    }

    if (GPSStory.isPlaying) {
      const scaledDt = dt * GPSStory.playbackSpeed;
      this.carState.x += this.carState.speed * speedFactor * scaledDt;

      // Wrap around road bounds
      const minX = areaW * 0.16;
      const maxX = areaW * 0.82;
      if (this.carState.x > maxX) {
        this.carState.x = minX;
      }
    }

    return {
      pos: { x: this.carState.x, y: this.carState.y },
      isStopping
    };
  },

  render(dt) {
    const { ctx, width, height } = GPSDraw.setupHiDPI(this.canvas);
    this.ctx = ctx;
    this.wavePhase += dt * 30 * GPSStory.playbackSpeed;

    // Organic Hand-Drawn Blueprint Background
    GPSDraw.drawPaperBackground(ctx, width, height);

    const scene = GPSStory.getCurrentScene();
    if (!scene) return;

    switch (scene.id) {
      case '2d_1sat':
        this.render2D(ctx, width, height, 1, false, dt);
        break;
      case '2d_2sat':
        this.render2D(ctx, width, height, 2, false, dt);
        break;
      case '2d_3sat':
        this.render2D(ctx, width, height, 3, false, dt);
        break;
      case '2d_4sat_clock':
        this.render2D(ctx, width, height, 4, true, dt);
        break;
      case '2d_to_3d_1sat':
        this.render3D(ctx, width, height, 1, dt);
        break;
      case '3d_2sat':
        this.render3D(ctx, width, height, 2, dt);
        break;
      case '3d_3sat':
        this.render3D(ctx, width, height, 3, dt);
        break;
      case '3d_4sat':
        this.render3D(ctx, width, height, 4, dt);
        break;
      case 'velocity_doppler':
        this.renderVelocity(ctx, width, height, dt);
        break;
      case 'orbit_relativity':
        this.renderOrbitRelativity(ctx, width, height, dt);
        break;
      case 'multipath_echo':
        this.renderMultipath(ctx, width, height, dt);
        break;
      case 'jamming_spoofing':
        this.renderJamming(ctx, width, height, dt);
        break;
    }
  },

  /* ==========================================================================
     SCENARIOS 1 - 4: 2D TRILATERASJON MED MULTI-SATELLITT GEOMETRI OVERLAY
     ========================================================================== */
  render2D(ctx, width, height, satCount, showClockError, dt) {
    const areaW = width - 420;
    this.sats2D[0].x = areaW * 0.22; this.sats2D[0].y = height * 0.16;
    this.sats2D[1].x = areaW * 0.78; this.sats2D[1].y = height * 0.20;
    this.sats2D[2].x = areaW * 0.50; this.sats2D[2].y = height * 0.09;
    this.sats2D[3].x = areaW * 0.34; this.sats2D[3].y = height * 0.38;

    // Continuous Car Motion (Stops wherever it is!)
    const { pos: carPos, isStopping } = this.updateCar2D(dt, areaW, height, GPSStory.sceneTime);

    // Draw Highway Road
    this.drawHighway2D(ctx, areaW, height);

    // Clock Error (Pseudorange drift) & Error Triangle in Scenario 4
    let bias = 0;
    let isSynced = false;
    if (showClockError) {
      const sceneT = GPSStory.sceneTime;
      if (sceneT < 3.8) {
        // Phase 1: Receiver quartz clock drift δt ≈ +1.0 μs (+300 m pseudorange error)
        bias = 34 + Math.sin(sceneT * 2.5) * 3;
        isSynced = false;
      } else if (sceneT < 7.2) {
        // Phase 2: Satellitt 4 enters; receiver solves the 4-equation system for (x, y, δt)
        // Bias collapses smoothly from 34 down to 0
        const progress = GPSMath.clamp((sceneT - 3.8) / 3.4, 0, 1);
        const ease = GPSMath.easeInOutQuad(progress);
        bias = 34 * (1 - ease);
        isSynced = false;
      } else {
        // Phase 3: δt = 0! Error triangle completely collapsed to a single point!
        bias = 0;
        isSynced = true;
      }
    }

    // In Scenario 4, only 3 sats are active before Sat 4 arrives at sceneTime >= 3.5
    const activeSatCount = (showClockError && GPSStory.sceneTime < 3.5) ? 3 : satCount;
    const activeSats = this.sats2D.slice(0, activeSatCount);

    // 1. Draw Colored Circles with Entrance Expansion
    activeSats.forEach((sat, i) => {
      const { eased, isNew } = this.getSatEntrance(i, satCount, GPSStory.sceneTime);
      if (eased <= 0.001) return;
      const trueDist = GPSMath.dist2D(sat, carPos);
      const r = (trueDist + (showClockError ? bias : 0)) * eased;
      const circleOpacity = isNew ? eased : 1.0;

      GPSDraw.sketchColoredCircle2D(ctx, sat, r, sat.color, sat.fill, circleOpacity);
    });

    // 2. When Stopped: Draw Calculation Triangles and Equations for ALL Active Satellites!
    if (isStopping) {
      GPSDraw.drawMultiSatelliteCalculationOverlay2D(ctx, activeSats, carPos, activeSatCount, showClockError, bias);
    }

    // 3. Draw Intersections & Geometry per Scenario
    const latestEntrance = this.getSatEntrance(satCount - 1, satCount, GPSStory.sceneTime).eased;

    if (satCount === 1) {
      GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, 'Bilen (Uavklart posisjon)', '#00f0ff', 6);
    } else if (satCount === 2) {
      const r1 = GPSMath.dist2D(this.sats2D[0], carPos);
      const r2 = GPSMath.dist2D(this.sats2D[1], carPos);
      const pts = GPSMath.getCircleIntersections(this.sats2D[0], r1, this.sats2D[1], r2);

      if (pts.length === 2 && latestEntrance > 0.7) {
        // SOLID VIVID Chord between intersection points (NO DASHES!)
        ctx.save();
        GPSDraw.sketchLine(ctx, pts[0], pts[1], '#fbbf24', 2.2, 2);
        ctx.restore();

        pts.forEach((pt) => {
          const isCar = GPSMath.dist2D(pt, carPos) < 25;
          GPSDraw.drawTargetPoint(ctx, pt.x, pt.y, isCar ? 'Pkt A (Bilen)' : 'Pkt B (Speilpunkt)', isCar ? '#10b981' : '#fbbf24', 6);
        });
      } else {
        GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, 'Bilen', '#10b981', 6);
      }
    } else if (satCount === 3) {
      // Point B rejected, Point A locked
      GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, '✓ Posisjon Låst (x, y)', '#10b981', 7);
    } else if (satCount === 4) {
      // Calculate pairwise circle intersections near the car for satellites 1, 2, 3
      const s1 = this.sats2D[0];
      const s2 = this.sats2D[1];
      const s3 = this.sats2D[2];

      const r1 = GPSMath.dist2D(s1, carPos) + bias;
      const r2 = GPSMath.dist2D(s2, carPos) + bias;
      const r3 = GPSMath.dist2D(s3, carPos) + bias;

      function getClosest(pts, target) {
        if (!pts || !pts.length) return { x: target.x, y: target.y };
        if (pts.length === 1) return pts[0];
        const dist0 = GPSMath.dist2D(pts[0], target);
        const dist1 = GPSMath.dist2D(pts[1], target);
        return dist0 <= dist1 ? pts[0] : pts[1];
      }

      const p12 = getClosest(GPSMath.getCircleIntersections(s1, r1, s2, r2), carPos);
      const p23 = getClosest(GPSMath.getCircleIntersections(s2, r2, s3, r3), carPos);
      const p31 = getClosest(GPSMath.getCircleIntersections(s3, r3, s1, r1), carPos);

      // Draw the physical Error Triangle (Feiltrekant) and its animated collapse!
      GPSDraw.drawErrorTriangle2D(ctx, p12, p23, p31, carPos, bias, isSynced, GPSStory.sceneTime, areaW);
    }

    // Draw Satellites with Smooth Swoop-In Entrances
    this.sats2D.forEach((sat, i) => {
      const isActive = i < activeSatCount;
      const { eased, isNew } = this.getSatEntrance(i, satCount, GPSStory.sceneTime);

      const satY = (isActive && isNew) ? sat.y - (1 - eased) * 90 : sat.y;
      const satOpacity = isActive ? (isNew ? 0.2 + 0.8 * eased : 1.0) : 0.25;
      const satScale = (isActive && isNew) ? 0.7 + 0.3 * eased : 1.0;

      const angle = Math.atan2(carPos.y - satY, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, satY, sat.id, angle, isActive ? sat.color : '#334155', satScale, satOpacity);
    });

    // Draw Car
    GPSDraw.drawCar(
      ctx,
      carPos.x,
      carPos.y,
      0,
      (satCount >= 3 && (!showClockError || isSynced)) ? '#10b981' : '#fbbf24',
      1.2,
      (satCount >= 3 && (!showClockError || isSynced))
    );
  },

  drawHighway2D(ctx, areaW, height) {
    ctx.save();
    const roadY = height * 0.65;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(40, roadY);
    ctx.lineTo(areaW - 40, roadY);
    ctx.stroke();

    // Center dashed line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(50, roadY);
    ctx.lineTo(areaW - 50, roadY);
    ctx.stroke();
    ctx.restore();
  },

  /* ==========================================================================
     SCENARIOS 5 - 8: REGIONAL ZOOM-INN 3D MED TYDELIGE SFÆRER, FAST BAKKE OG BIL
     ========================================================================== */
  render3D(ctx, width, height, satCount, dt) {
    if (!this.isDragging3D && GPSStory.isPlaying) {
      this.camRotY += dt * 0.14 * GPSStory.playbackSpeed; // Subtle gentle orbital rotation
    }

    const rotX = this.camRotX;
    const rotY = this.camRotY;
    const areaW = width - 420;

    // 1. Draw Zoomed-In Regional Earth Surface & Curved Highway
    GPSDraw.drawZoomedEarthAndRoad3D(ctx, areaW, height, rotX, rotY);

    // Project user / car position on the ground
    const rotUser = GPSMath.rotate3D(this.userPos3D, rotX, rotY, 0);
    const projUser = GPSMath.project3D(rotUser, areaW, height, 1.05, 460);

    // Project 3D satellites and calculate distances
    const activeSats = this.sats3D.slice(0, satCount).map((sat, i) => {
      const { eased, isNew } = this.getSatEntrance(i, satCount, GPSStory.sceneTime);
      const rotPos = GPSMath.rotate3D(sat.pos, rotX, rotY, 0);
      const proj = GPSMath.project3D(rotPos, areaW, height, 1.05, 460);
      const dist = Math.hypot(
        sat.pos.x - this.userPos3D.x,
        sat.pos.y - this.userPos3D.y,
        sat.pos.z - this.userPos3D.z
      );
      return { ...sat, rotPos, proj, dist, eased, isNew };
    });

    // 2. Draw Rich, Luminous, Clearly Defined 3D Spheres (Translucent volume, visible rim)
    activeSats.forEach((sat) => {
      if (!sat.proj.visible) return;
      const sphereRadius = sat.dist * sat.proj.scale * sat.eased;
      const sphereAlpha = sat.isNew ? 0.34 * sat.eased : 0.34;
      GPSDraw.drawVolumetricSphere3D(ctx, sat.proj, sphereRadius, sat.color, sphereAlpha);
    });

    // 3. Draw SOLID VIVID 3D Intersection Ring (NO DASHES!)
    if (satCount >= 2 && activeSats[0] && activeSats[1]) {
      const ring3D = GPSMath.getSphereSphereIntersectionRing3D(
        this.sats3D[0].pos,
        activeSats[0].dist,
        this.sats3D[1].pos,
        activeSats[1].dist
      );
      const ringAlpha = satCount === 2
        ? GPSMath.clamp((GPSStory.sceneTime - 0.8) / 1.0, 0, 1)
        : 1.0;

      GPSDraw.drawExactSphereIntersectionRing3D(
        ctx,
        ring3D,
        areaW,
        height,
        rotX,
        rotY,
        '#00f0ff',
        satCount === 2 ? '✨ Skjæring: 3D Sirkelring i rommet' : '',
        ringAlpha
      );
    }

    // 4. Scenario 7: Three Spheres cut into 2 Discrete Points (Ground vs Space)
    if (satCount === 3 && projUser.visible && activeSats[2]) {
      const pts3D = GPSMath.getThreeSphereIntersections3D(
        this.sats3D[0].pos, activeSats[0].dist,
        this.sats3D[1].pos, activeSats[1].dist,
        this.sats3D[2].pos, activeSats[2].dist,
        this.userPos3D
      );

      const rotP1 = GPSMath.rotate3D(pts3D[0], rotX, rotY, 0);
      const projP1 = GPSMath.project3D(rotP1, areaW, height, 1.05, 460);

      const rotP2 = GPSMath.rotate3D(pts3D[1], rotX, rotY, 0);
      const projP2 = GPSMath.project3D(rotP2, areaW, height, 1.05, 460);

      const ptAlpha = GPSMath.clamp((GPSStory.sceneTime - 1.0) / 0.8, 0, 1);
      if (ptAlpha > 0.05) {
        GPSDraw.drawAltitudeRejectionGuide3D(ctx, projP1, projP2, areaW, height);
      }
    }

    // 5. Scenario 8: Four Spheres eliminate Space Point & lock Atomic Time
    if (satCount === 4 && projUser.visible) {
      const lockAlpha = GPSMath.clamp((GPSStory.sceneTime - 1.0) / 0.8, 0, 1);
      if (lockAlpha > 0.05) {
        GPSDraw.drawTargetPoint(
          ctx,
          projUser.x,
          projUser.y,
          '✓ 3D FIX: N 59°54\'50" E 10°45\'08" H: 84m (δt = 0)',
          '#10b981',
          8
        );

        // Explanatory card
        const cardX = projUser.x + 24;
        const cardY = projUser.y - 75;
        ctx.save();
        ctx.fillStyle = 'rgba(6, 12, 22, 0.94)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.fillRect(cardX, cardY, 280, 60);
        ctx.strokeRect(cardX, cardY, 280, 60);

        ctx.font = '700 10px "Fira Code", monospace';
        ctx.fillStyle = '#10b981';
        ctx.fillText('4. SFÆRE BEKREFTER PUNKT 1:', cardX + 12, cardY + 18);

        ctx.font = '9px "Fira Code", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('• Punkt 2 i rommet elimineres matematisk.', cardX + 12, cardY + 34);
        ctx.fillText('• Kvartsklokkens avvik δt er løst til null!', cardX + 12, cardY + 48);
        ctx.restore();
      }
    }

    // Line-of-sight Beams from Satellites to Car on Ground
    activeSats.forEach((sat) => {
      if (sat.proj.visible && projUser.visible) {
        ctx.save();
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = sat.isNew ? sat.eased : 1.0;
        GPSDraw.sketchLine(ctx, sat.proj, projUser, sat.color, 1.4, 1);
        ctx.restore();
      }
    });

    // Draw Car on the Ground in 3D
    if (projUser.visible) {
      GPSDraw.drawCar(
        ctx,
        projUser.x,
        projUser.y + 12,
        0,
        satCount >= 3 ? '#10b981' : '#fbbf24',
        1.1,
        satCount >= 3
      );
    }

    // Draw Satellites in the Sky
    activeSats.forEach((sat) => {
      if (sat.proj.visible) {
        const satScale = sat.proj.scale * (sat.isNew ? 0.65 + 0.35 * sat.eased : 1.0);
        const satOpacity = sat.isNew ? 0.3 + 0.7 * sat.eased : 1.0;
        GPSDraw.drawSatellite(ctx, sat.proj.x, sat.proj.y, sat.id, 0, sat.color, satScale, satOpacity);
      }
    });
  },

  /* ==========================================================================
     SCENARIO 9: HASTIGHETSBEREGNING & DOPPLER-MATEMATIKK PÅ CANVAS
     ========================================================================== */
  renderVelocity(ctx, width, height, dt) {
    const areaW = width - 420;
    const roadY = height * 0.65;
    const carX = (areaW * 0.48) + Math.sin(GPSStory.sceneTime * 1.2) * (areaW * 0.24);
    const carPos = { x: carX, y: roadY };

    // Highway
    this.drawHighway2D(ctx, areaW, height);

    // Satellites: Back (Receding) and Front (Approaching)
    const sat1 = { id: 1, x: areaW * 0.18, y: height * 0.22, color: '#38bdf8', name: 'SV 01 (Bak)' };
    const sat2 = { id: 2, x: areaW * 0.82, y: height * 0.22, color: '#00f0ff', name: 'SV 02 (Foran)' };

    [sat1, sat2].forEach((sat) => {
      const angle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, angle, sat.color, 1, 1);

      // Doppler wave along beam
      const dx = carPos.x - sat.x;
      const dy = carPos.y - sat.y;
      const dist = Math.hypot(dx, dy);
      const isApproaching = sat.id === 2;
      const waveSpacing = isApproaching ? 12 : 24;

      ctx.save();
      ctx.translate(sat.x, sat.y);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.strokeStyle = isApproaching ? '#00f0ff' : '#f43f5e';
      ctx.lineWidth = 1.8;

      const offset = (this.wavePhase % waveSpacing);
      for (let r = offset; r < dist; r += waveSpacing) {
        ctx.beginPath();
        ctx.moveTo(r, -9); ctx.lineTo(r, 9);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw Car
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, 0, '#10b981', 1.2, true);

    // DRAW FULL DOPPLER MATHEMATICS DIRECTLY ON THE ANIMATION CANVAS!
    GPSDraw.drawDopplerMathIllustration(ctx, areaW, height, carPos, [sat1, sat2], this.wavePhase, 90.0);
  },

  /* ==========================================================================
     SCENARIO 10: EGENPOSISJON, BAKKESTASJON & RELATIVITET (UiO)
     ========================================================================== */
  renderOrbitRelativity(ctx, width, height, dt) {
    const areaW = width - 420;
    const cx = areaW * 0.5;
    const cy = height * 0.52;
    const earthR = 85;
    const orbitR = 200;

    // Orbit Ring
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2D Earth Globe
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillStyle = 'rgba(7, 14, 28, 0.94)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const atmosGrad = ctx.createRadialGradient(cx, cy, earthR * 0.9, cx, cy, earthR + 14);
    atmosGrad.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
    atmosGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.06)');
    atmosGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + 14, 0, Math.PI * 2);
    ctx.fill();

    GPSDraw.drawHandwrittenTag(ctx, cx, cy + 4, 'JORDEN (R ≈ 6371 km)', '#38bdf8');
    ctx.restore();

    // Ground Station
    const stX = cx;
    const stY = cy - earthR;
    this.drawGroundStation(ctx, stX, stY);

    // Orbiting Satellite
    const orbitAngle = GPSStory.sceneTime * 0.45 - Math.PI / 2 + 0.4;
    const satX = cx + Math.cos(orbitAngle) * orbitR;
    const satY = cy + Math.sin(orbitAngle) * orbitR;

    // Radar Tracking Beam & Uplink
    ctx.save();
    GPSDraw.sketchLine(ctx, { x: stX, y: stY - 14 }, { x: satX, y: satY }, '#fbbf24', 1.4, 1);

    // Uplink pulse packet
    const pulseT = ((GPSStory.sceneTime * 2.5) % 1.0);
    const px = GPSMath.lerp(stX, satX, pulseT);
    const py = GPSMath.lerp(stY - 14, satY, pulseT);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Satellite
    GPSDraw.drawSatellite(ctx, satX, satY, 1, orbitAngle + Math.PI / 2, '#00f0ff', 1.1, 1);

    // Einstein Clock Comparison Card
    this.drawEinsteinRelativityCard(ctx, areaW * 0.08, height * 0.60);
  },

  drawGroundStation(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;

    // Dish
    ctx.beginPath();
    ctx.arc(0, -6, 16, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, -16);
    ctx.stroke();

    // Base
    ctx.beginPath();
    ctx.moveTo(-10, 8); ctx.lineTo(10, 8);
    ctx.lineTo(0, 0); ctx.closePath();
    ctx.stroke();

    GPSDraw.drawHandwrittenTag(ctx, 0, 22, 'BAKKESTASJON', '#fbbf24');
    ctx.restore();
  },

  drawEinsteinRelativityCard(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(x, y, 300, 120);
    ctx.strokeRect(x, y, 300, 120);

    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('EINSTEIN RELATIVITET (UiO)', x + 14, y + 22);

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• Spesiell Relativitet (Fart):   -7.1 μs/dag', x + 14, y + 44);
    ctx.fillText('• Generell Relativitet (Tyngde): +45.7 μs/dag', x + 14, y + 64);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('• Netto Tidsdrift:                +38.6 μs/dag', x + 14, y + 84);
    ctx.fillStyle = '#10b981';
    ctx.fillText('✓ Fabrikktunet til 10.22999999543 MHz', x + 14, y + 104);

    ctx.restore();
  },

  /* ==========================================================================
     SCENARIO 11: EKKO, URBAN CANYON & SPØKELSESPOSISJON
     Animerer bilen som kjører inn i området bak en glassbygning, direkte siktlinje
     som blokkeres, signalet som reflekteres av motstående glassfasade,
     og den resulterende spøkelsesposisjonen som oppstår inne i bygget!
     ========================================================================== */
  renderMultipath(ctx, width, height, dt) {
    const areaW = width - 420;
    const roadY = height * 0.68;
    const sceneT = GPSStory.sceneTime;

    // 1. Draw City Street Ground & Highway
    this.drawHighway2D(ctx, areaW, height);

    // 2. City Buildings Configuration
    // Building 1: Blocking Glass Skyscraper (Left/Center)
    const b1 = {
      x: areaW * 0.36,
      w: areaW * 0.16,
      y: height * 0.18,
      h: roadY - height * 0.18
    };

    // Building 2: Opposite Reflective Glass Facade (Right)
    const b2 = {
      x: areaW * 0.74,
      w: areaW * 0.15,
      y: height * 0.24,
      h: roadY - height * 0.24
    };

    // Satellite SV 01 (L1: 1575.42 MHz) in the upper sky
    const sat = { x: areaW * 0.16, y: height * 0.14, id: 1, color: '#00f0ff' };

    // 3. Smooth continuous driving motion across the city street
    // Over the 10-second scene:
    // t < 3.2s: drives in open space (x: 0.14 -> 0.38)
    // 3.2s - 7.6s: drives behind building 1 (x: 0.38 -> 0.68)
    // 7.6s - 10s: exits into open street (x: 0.68 -> 0.88)
    let carNormX = 0.14;
    if (sceneT < 3.2) {
      const u = sceneT / 3.2;
      carNormX = GPSMath.lerp(0.14, 0.38, u);
    } else if (sceneT < 7.6) {
      const u = (sceneT - 3.2) / 4.4;
      carNormX = GPSMath.lerp(0.38, 0.68, u);
    } else {
      const u = (sceneT - 7.6) / 2.4;
      carNormX = GPSMath.lerp(0.68, 0.88, u);
    }
    const carPos = { x: areaW * carNormX, y: roadY };

    // 4. Blockage & Reflection state
    const isEntering = (carPos.x >= b1.x - 10 && carPos.x < b1.x + 30);
    const isInsideCanyon = (carPos.x >= b1.x + 30 && carPos.x <= b2.x - 30);
    const isExiting = (carPos.x > b2.x - 30 && carPos.x <= b2.x + 20);

    let blockFactor = 0;
    if (isInsideCanyon) {
      blockFactor = 1.0;
    } else if (isEntering) {
      blockFactor = GPSMath.clamp((carPos.x - (b1.x - 10)) / 40, 0, 1);
    } else if (isExiting) {
      blockFactor = 1.0 - GPSMath.clamp((carPos.x - (b2.x - 30)) / 50, 0, 1);
    } else {
      blockFactor = 0.0;
    }

    const isBlocked = blockFactor > 0.05;

    // Specular Reflection point on Building 2's glass facade
    const reflectPt = {
      x: b2.x,
      y: height * 0.40 + Math.sin(sceneT * 0.8) * 8
    };

    // 5. Draw the two Glass Skyscrapers
    GPSDraw.drawGlassBuilding(
      ctx,
      b1.x,
      b1.y,
      b1.w,
      b1.h,
      'GLASSBYGNING 1 (BLOKKERER SIKTLINJE)',
      false,
      null,
      sceneT
    );

    GPSDraw.drawGlassBuilding(
      ctx,
      b2.x,
      b2.y,
      b2.w,
      b2.h,
      'GLASSBYGNING 2 (SPEILENDE FASADE)',
      isBlocked,
      isBlocked ? reflectPt : null,
      sceneT
    );

    // 6. Signal propagation & Rays
    if (!isBlocked) {
      // CLEAR LINE OF SIGHT (LOS):
      GPSDraw.sketchLine(ctx, sat, carPos, '#10b981', 2.4, 2);

      // Traveling carrier pulses along direct line
      const pulsePhase = (this.wavePhase * 0.04) % 1.0;
      for (let f = pulsePhase; f < 1.0; f += 0.25) {
        const px = sat.x + (carPos.x - sat.x) * f;
        const py = sat.y + (carPos.y - sat.y) * f;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tag on direct ray
      const midRay = { x: (sat.x + carPos.x) * 0.5, y: (sat.y + carPos.y) * 0.5 };
      GPSDraw.drawHandwrittenTag(ctx, midRay.x - 10, midRay.y - 14, '✓ SIKTLINJE DIREKTE (LOS)', '#10b981');

    } else {
      // BLOCKED LINE OF SIGHT (NLOS) + MULTIPATH REFLECTION:
      // 1. Direct beam blocked by Building 1
      ctx.save();
      ctx.setLineDash([5, 4]);
      GPSDraw.sketchLine(ctx, sat, carPos, 'rgba(244, 63, 94, 0.45)', 1.5, 1);
      ctx.setLineDash([]);

      // Collision marker where beam hits Building 1
      const hitX = b1.x + 10;
      const hitT = (hitX - sat.x) / (carPos.x - sat.x);
      const hitY = sat.y + (carPos.y - sat.y) * hitT;

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.0;
      const hSz = 6;
      ctx.beginPath();
      ctx.moveTo(hitX - hSz, hitY - hSz); ctx.lineTo(hitX + hSz, hitY + hSz);
      ctx.moveTo(hitX + hSz, hitY - hSz); ctx.lineTo(hitX - hSz, hitY + hSz);
      ctx.stroke();

      GPSDraw.drawHandwrittenTag(ctx, hitX - 10, hitY - 16, '❌ BLOKKERT (NLOS)', '#f43f5e');
      ctx.restore();

      // 2. Reflected Path: Sat -> Building 2 -> Car
      GPSDraw.sketchLine(ctx, sat, reflectPt, '#fbbf24', 2.4, 2);
      GPSDraw.sketchLine(ctx, reflectPt, carPos, '#fbbf24', 2.4, 2);

      // Traveling wave packets along the detour path
      const detourPulse = (this.wavePhase * 0.05) % 1.0;
      for (let f = detourPulse; f < 1.0; f += 0.22) {
        const px = sat.x + (reflectPt.x - sat.x) * f;
        const py = sat.y + (reflectPt.y - sat.y) * f;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let f = detourPulse; f < 1.0; f += 0.22) {
        const px = reflectPt.x + (carPos.x - reflectPt.x) * f;
        const py = reflectPt.y + (carPos.y - reflectPt.y) * f;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Detour measurement tag
      const midLeg1 = { x: (sat.x + reflectPt.x) * 0.5, y: (sat.y + reflectPt.y) * 0.5 };
      const midLeg2 = { x: (reflectPt.x + carPos.x) * 0.5, y: (reflectPt.y + carPos.y) * 0.5 };
      GPSDraw.drawHandwrittenTag(ctx, midLeg1.x, midLeg1.y - 12, 'Innfallende bølge d₁', '#fbbf24');
      GPSDraw.drawHandwrittenTag(ctx, midLeg2.x + 10, midLeg2.y, 'Reflektert ekko d₂', '#fbbf24');

      // 3. GHOST POSITION (SPØKELSESPOSISJON):
      // The false position calculation shifts backwards and into Building 1!
      const ghostOffset = {
        x: -72 * blockFactor,
        y: -36 * blockFactor
      };
      const ghostPos = {
        x: carPos.x + ghostOffset.x,
        y: carPos.y + ghostOffset.y
      };

      // Displacement vector from Real Car to Ghost Car
      ctx.setLineDash([4, 3]);
      GPSDraw.sketchPencilArrow(ctx, carPos, ghostPos, '#f43f5e', 10, 2.0);
      ctx.setLineDash([]);

      const midGhost = { x: (carPos.x + ghostPos.x) * 0.5, y: (carPos.y + ghostPos.y) * 0.5 };
      GPSDraw.drawHandwrittenTag(
        ctx,
        midGhost.x - 30,
        midGhost.y + 16,
        'Δr = +45 m (Forsinkelse τ = 150 ns)',
        '#f43f5e'
      );

      // Draw Ghost Car inside the building
      GPSDraw.drawGhostCar(ctx, ghostPos.x, ghostPos.y, 0, 1.15, 0.85 * blockFactor, sceneT);
      GPSDraw.drawTargetPoint(
        ctx,
        ghostPos.x,
        ghostPos.y,
        '👻 SPØKELSESPOSISJON (Inne i bygget!)',
        '#f43f5e',
        6
      );
    }

    // 7. Draw Satellite SV 01
    const satAngle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
    GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, satAngle, sat.color, 1.1, 1.0);

    // 8. Draw Real Car
    GPSDraw.drawCar(
      ctx,
      carPos.x,
      carPos.y,
      0,
      isBlocked ? '#fbbf24' : '#10b981',
      1.2,
      !isBlocked
    );
    GPSDraw.drawTargetPoint(
      ctx,
      carPos.x,
      carPos.y,
      isBlocked ? 'Virkelig bil (på veien)' : '✓ Posisjon Låst (x, y)',
      isBlocked ? '#fbbf24' : '#10b981',
      6
    );

    // 9. On-Canvas Notebook Card explaining how multipath & ghost positions work
    let boxTitle = '';
    let boxColor = '#10b981';
    let eqLines = [];

    if (!isBlocked && sceneT < 3.2) {
      boxTitle = 'ÅPEN GATE: DIREKTE SIKTLINJE (LOS)';
      boxColor = '#10b981';
      eqLines = [
        { text: '• Direkte siktlinje: d = c · Δt  (ingen hindringer)', color: '#10b981' },
        { text: '• Bilen kjører i åpent lende mot glassbygningene', color: '#94a3b8' },
        { text: '• Mottakeren beregner 100% nøyaktig posisjon', color: '#38bdf8' }
      ];
    } else if (isBlocked) {
      boxTitle = 'URBAN CANYON: EKKO & SPØKELSESPOSISJON';
      boxColor = '#f43f5e';
      eqLines = [
        { text: '• Direkte signal er blokkert av bygning 1 (NLOS)', color: '#f43f5e' },
        { text: '• Bølgen reflekteres av glassfasaden på bygning 2', color: '#fbbf24' },
        { text: '• Omvei: Δd = d₁ + d₂ - d_direkte = +45 meter', color: '#94a3b8' },
        { text: '• Tidsforsinkelse: τ = Δd / c = 150 nanosekunder', color: '#94a3b8' },
        { text: '⚠️ Mottakeren lures: Tegner spøkelsesbil inne i bygget!', color: '#f43f5e' }
      ];
    } else {
      boxTitle = '✓ SIKTLINJE GJENOPPRETTET (LOS)';
      boxColor = '#10b981';
      eqLines = [
        { text: '✓ Bilen ute av skyggen: Direkte siktlinje gjenopprettet', color: '#10b981' },
        { text: '✓ Spøkelsesposisjonen kollapset tilbake til bilen', color: '#10b981' },
        { text: '• Multi-frekvens (L1/L5) & 3D kart forkaster falske ekkoer', color: '#38bdf8' }
      ];
    }

    GPSDraw.sketchHandwrittenNotebookBox(
      ctx,
      30,
      86,
      370,
      120,
      boxTitle,
      eqLines,
      boxColor
    );
  },

  /* ==========================================================================
     SCENARIO 12: JAMMING & SPOOFING
     ========================================================================== */
  renderJamming(ctx, width, height, dt) {
    const areaW = width - 420;
    const carPos = { x: areaW * 0.7, y: height * 0.68 };
    const jammerPos = { x: areaW * 0.35, y: height * 0.68 };
    const sat = { x: areaW * 0.2, y: height * 0.16, id: 1, color: '#00f0ff' };

    // Faint Satellite Signal (-160 dBW)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1;
    for (let r = (this.wavePhase % 30); r < 240; r += 30) {
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    GPSDraw.drawSatellite(ctx, sat.x, sat.y, 1, 0, sat.color, 1, 1);

    // Powerful Red Jamming Wave (1W / 0 dBW)
    ctx.save();
    for (let r = (this.wavePhase * 1.8 % 24); r < 360; r += 24) {
      const a = Math.max(0, 1 - r / 360);
      ctx.strokeStyle = `rgba(244, 63, 94, ${a * 0.75})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(jammerPos.x, jammerPos.y - 25, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Jammer device
    ctx.save();
    ctx.translate(jammerPos.x, jammerPos.y);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -25);
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, -25, 4, 0, Math.PI * 2);
    ctx.fill();

    GPSDraw.drawHandwrittenTag(ctx, 0, 20, '1W STØYSENDER (JAMMER)', '#f43f5e');
    ctx.restore();

    // Car with Lost Lock
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, 0, '#f43f5e', 1.2, false);
    GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, '❌ SIGNAL TAPT (SNR < 15 dB-Hz)', '#f43f5e', 6);
  }
};

// Safe bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.App.init());
} else {
  window.App.init();
}
