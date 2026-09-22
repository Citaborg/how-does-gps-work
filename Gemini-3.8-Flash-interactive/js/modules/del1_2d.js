/**
 * Del 1: 2D Trilaterasjon & Tidsforsinkelse
 * Demonstrerer hvordan tidsforsinkelse d = c * delta_t oversettes til avstandssirkler,
 * og hvordan 1 -> 2 -> 3 satellitter gradvis fjerner tvetydighet og løser klokkeavvik.
 */

window.ModuleDel1 = {
  id: 'del1',
  tag: 'DEL 01 // 2D GEOMETRI & TID',
  title: '2D-Prinsippet: Trilaterasjon & Tidsmåling',

  // State
  state: {
    step: 1, // 1: 1 sat, 2: 2 sats, 3: 3 sats, 4: Klokkeavvik (Pseudorange)
    satCount: 1,
    clockBias: 0, // meters of error (c * dt)
    autoDrive: true,
    carSpeed: 0.8,
    carProgress: 0,
    carPos: { x: 380, y: 320 },
    carHeading: 0,
    isDraggingCar: false,
    wavePhase: 0,
    showPulses: true,
    showDimensions: true
  },

  // Satellites in 2D space (relative to canvas width/height)
  satellites: [
    { id: 1, x: 160, y: 100, name: 'SV 01', color: '#00f0ff' },
    { id: 2, x: 620, y: 110, name: 'SV 02', color: '#38bdf8' },
    { id: 3, x: 400, y: 70, name: 'SV 03', color: '#a855f7' }
  ],

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Én Satellitt: Sirkel av mulige posisjoner',
        desc: 'Satellitten sender et tidssignal $t_{sendt}$. Mottakeren måler mottakstid $t_{mottatt}$. Avstanden beregnes: $d = c \\cdot \\Delta t$. Dette gir én sirkel (sfære i 3D) med uendelig mange mulige oppholdssteder.'
      },
      {
        step: 2,
        title: '2. To Satellitter: To skjæringspunkter',
        desc: 'Ved å legge til satellitt 2 får vi to overlappende sirkler. De krysser hverandre i nøyaktig to punkter. Vi har halvert tvetydigheten, men vet ennå ikke hvilket av de to punktene som er bilen.'
      },
      {
        step: 3,
        title: '3. Tre Satellitter: Entydig 2D-posisjon',
        desc: 'En 3. satellitt gir en tredje sirkel. Alle tre sirkler møtes i nøyaktig ett felles krysningspunkt. Bilen er nå entydig låst i 2D-planet!'
      },
      {
        step: 4,
        title: '4. Klokkefeil i Mottakeren (Pseudorange)',
        desc: 'Satellittene har atomklokker, men bilen har en billig kvartsklokke med feil $\\delta t$. Målte avstander blir for lange eller korte (pseudoranger) og sirklene bommer på hverandre i en trekant. Geometrien tvinger klokkeavviket til å bli nullstilt!'
      }
    ];
  },

  getMath() {
    return `
      <div class="math-formula-box">
        <span class="formula-main">d = c · Δt</span>
        <span class="formula-sub">c = 299 792 458 m/s (Lysets hastighet) | Δt = t_{mottatt} - t_{sendt}</span>
      </div>

      <div class="math-formula-box" style="border-color: rgba(168, 85, 247, 0.35);">
        <span class="formula-main">ρ_i = d_i + c · δt_{mottaker}</span>
        <span class="formula-sub">ρ_i = Målt pseudorange | δt = Mottakerens klokkeavvik</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">Tidsnøyaktighet:</span> 1 nanosekund ($10^{-9}$ s) feil i klokken tilsvarer omtrent <span class="highlight-text">30 cm feil</span> i posisjonen ($c \\cdot 10^{-9} \\text{ s} \\approx 0.30 \\text{ m}$).</li>
        <li><span class="highlight-text">Sirkelligninger i 2D:</span> $(x - x_i)^2 + (y - y_i)^2 = (c \\cdot \\Delta t_i)^2$. Tre ukjente ($x, y, \\delta t$) krever 3 satellitter i 2D for å løses matematisk.</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">Pedagogiske Steg & Konfigurasjon</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.step === 1 ? 'active' : ''}" onclick="ModuleDel1.setStep(1)">1: Én Satellitt</button>
        <button class="btn-toggle ${this.state.step === 2 ? 'active' : ''}" onclick="ModuleDel1.setStep(2)">2: To Satellitter</button>
        <button class="btn-toggle ${this.state.step === 3 ? 'active' : ''}" onclick="ModuleDel1.setStep(3)">3: Tre Satellitter (Låst)</button>
        <button class="btn-toggle ${this.state.step === 4 ? 'active' : ''}" onclick="ModuleDel1.setStep(4)">4: Klokkeavvik (Pseudorange)</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>Mottakerens Klokkeavvik (δt)</span>
            <span class="control-val" id="valClockBias">${this.state.clockBias.toFixed(1)} m (${(this.state.clockBias / 0.3).toFixed(0)} ns)</span>
          </label>
          <input type="range" id="sliderClockBias" min="-80" max="80" step="1" value="${this.state.clockBias}" oninput="ModuleDel1.onClockBiasChange(this.value)">
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Bilkjøring & Bevegelse</span>
            <span class="control-val" id="valDrive">${this.state.autoDrive ? 'Autopilot PÅ' : 'Manuell / Dra'}</span>
          </label>
          <div class="toggle-group">
            <button class="btn-toggle ${this.state.autoDrive ? 'active' : ''}" id="btnAutoDrive" onclick="ModuleDel1.toggleAutoDrive()">🚗 Autopilot Bane</button>
            <button class="btn-toggle ${this.state.showPulses ? 'active' : ''}" id="btnPulses" onclick="ModuleDel1.togglePulses()">📡 Bølgepulser</button>
          </div>
        </div>
      </div>
    `;
  },

  setStep(step) {
    this.state.step = step;
    if (step === 1) {
      this.state.satCount = 1;
      this.state.clockBias = 0;
    } else if (step === 2) {
      this.state.satCount = 2;
      this.state.clockBias = 0;
    } else if (step === 3) {
      this.state.satCount = 3;
      this.state.clockBias = 0;
    } else if (step === 4) {
      this.state.satCount = 3;
      if (this.state.clockBias === 0) this.state.clockBias = 35;
    }

    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(step);
    }
  },

  onClockBiasChange(val) {
    this.state.clockBias = parseFloat(val);
    const badge = document.getElementById('valClockBias');
    if (badge) {
      const ns = (this.state.clockBias / 0.299792458).toFixed(0);
      badge.innerText = `${this.state.clockBias > 0 ? '+' : ''}${this.state.clockBias.toFixed(1)} m (${ns} ns)`;
    }
  },

  toggleAutoDrive() {
    this.state.autoDrive = !this.state.autoDrive;
    const btn = document.getElementById('btnAutoDrive');
    const badge = document.getElementById('valDrive');
    if (btn) btn.classList.toggle('active', this.state.autoDrive);
    if (badge) badge.innerText = this.state.autoDrive ? 'Autopilot PÅ' : 'Manuell / Dra';
  },

  togglePulses() {
    this.state.showPulses = !this.state.showPulses;
    const btn = document.getElementById('btnPulses');
    if (btn) btn.classList.toggle('active', this.state.showPulses);
  },

  update(dt) {
    this.state.wavePhase += dt * 45;

    // Auto drive along scenic smooth curve
    if (this.state.autoDrive && !this.state.isDraggingCar) {
      this.state.carProgress += dt * 0.08 * this.state.carSpeed;
      const t = this.state.carProgress;
      const width = this.canvasWidth || 800;
      const height = this.canvasHeight || 500;

      // Figure-8 road pattern
      const centerX = width * 0.5;
      const centerY = height * 0.68;
      const rx = width * 0.32;
      const ry = height * 0.18;

      const newX = centerX + Math.sin(t) * rx;
      const newY = centerY + Math.sin(t * 2) * 0.5 * ry;

      const dx = newX - this.state.carPos.x;
      const dy = newY - this.state.carPos.y;
      if (Math.hypot(dx, dy) > 0.01) {
        this.state.carHeading = Math.atan2(dy, dx);
      }

      this.state.carPos = { x: newX, y: newY };
    }
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    // Draw background grid
    GPSDraw.drawGrid(ctx, width, height, 40);

    // Responsive positioning of satellites
    this.satellites[0].x = width * 0.2;
    this.satellites[0].y = height * 0.18;

    this.satellites[1].x = width * 0.8;
    this.satellites[1].y = height * 0.2;

    this.satellites[2].x = width * 0.5;
    this.satellites[2].y = height * 0.12;

    const activeSats = this.satellites.slice(0, this.state.satCount);
    const carPos = this.state.carPos;
    const clockBias = this.state.clockBias;

    // Draw Road under car
    this.drawRoad(ctx, width, height);

    // Draw Wavefronts radiating from satellites
    if (this.state.showPulses) {
      activeSats.forEach((sat) => {
        const trueDist = GPSMath.dist2D(sat, carPos);
        GPSDraw.drawWavefronts(ctx, sat, trueDist + 80, 32, this.state.wavePhase, sat.color);
      });
    }

    // Draw Trilateration Circles / Pseudorange Circles
    activeSats.forEach((sat) => {
      const trueDist = GPSMath.dist2D(sat, carPos);
      const measuredDist = trueDist + clockBias;

      // True distance circle (dashed blueprint)
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, trueDist, 0, Math.PI * 2);
      ctx.stroke();

      // Measured Pseudorange Circle (Solid / Glowing)
      ctx.setLineDash([]);
      ctx.strokeStyle = clockBias === 0 ? sat.color : (clockBias > 0 ? '#f43f5e' : '#fbbf24');
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, measuredDist, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent fill
      ctx.fillStyle = clockBias === 0 ? 'rgba(0, 240, 255, 0.03)' : 'rgba(244, 63, 94, 0.03)';
      ctx.fill();

      // Dimension Line from Satellite to Car
      if (this.state.showDimensions) {
        const timeMicroSec = ((measuredDist / 300) * 1.0).toFixed(1); // Scaled time
        const label = clockBias === 0 
          ? `d = ${Math.round(measuredDist * 10)} km` 
          : `ρ = ${Math.round(measuredDist * 10)} km (Δt feil!)`;
        GPSDraw.drawDimensionLine(ctx, sat, carPos, label, sat.color, 0);
      }
      ctx.restore();
    });

    // Draw Intersections
    this.drawIntersections(ctx, activeSats, carPos, clockBias);

    // Draw Satellites
    this.satellites.forEach((sat, i) => {
      const isActive = i < this.state.satCount;
      const angle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, angle, isActive ? sat.color : '#475569', 1, isActive);
    });

    // Draw Car
    const isLocked = (this.state.satCount >= 3 && Math.abs(clockBias) < 5);
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, this.state.carHeading, isLocked ? '#10b981' : '#f43f5e', 1.1, isLocked);

    // Car Position label
    GPSDraw.drawTag(ctx, carPos.x - 30, carPos.y + 36, isLocked ? 'POSISJON LÅST' : (this.state.satCount === 1 ? 'UAVKLART' : 'TVETYDIG'), isLocked ? 'OK' : 'USIKKER', isLocked ? '#10b981' : '#f43f5e');

    // Update Top-Right HUD
    this.updateHUD(activeSats, carPos, clockBias, isLocked);
  },

  drawRoad(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerX = width * 0.5;
    const centerY = height * 0.68;
    const rx = width * 0.32;
    const ry = height * 0.18;

    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2 + 0.1; t += 0.05) {
      const x = centerX + Math.sin(t) * rx;
      const y = centerY + Math.sin(t * 2) * 0.5 * ry;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Road dashed centerline
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.restore();
  },

  drawIntersections(ctx, activeSats, carPos, clockBias) {
    if (activeSats.length === 1) {
      // 1 satellite: Draw circular orbit of possibility
      ctx.save();
      ctx.font = '600 11px "Fira Code", monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('1 Satellitt: Uendelig mange posisjoner langs sirkelbuen', 30, this.canvasHeight - 30);
      ctx.restore();
    } else if (activeSats.length === 2) {
      // 2 satellites: 2 intersection points
      const r1 = GPSMath.dist2D(activeSats[0], carPos) + clockBias;
      const r2 = GPSMath.dist2D(activeSats[1], carPos) + clockBias;
      const points = GPSMath.getCircleIntersections(activeSats[0], r1, activeSats[1], r2);

      points.forEach((p, idx) => {
        const isCar = GPSMath.dist2D(p, carPos) < 20;
        GPSDraw.drawTargetPoint(ctx, p.x, p.y, `Mulig Pkt ${idx + 1} ${isCar ? '(Bilen)' : '(Speilpunkt)'}`, isCar ? '#10b981' : '#fbbf24', 5);
      });
    } else if (activeSats.length >= 3) {
      if (Math.abs(clockBias) < 3) {
        // Perfect lock
        GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, 'Entydig GPS-Fiks (x, y)', '#10b981', 7);
      } else {
        // Error Triangle from clock bias
        const r1 = GPSMath.dist2D(activeSats[0], carPos) + clockBias;
        const r2 = GPSMath.dist2D(activeSats[1], carPos) + clockBias;
        const r3 = GPSMath.dist2D(activeSats[2], carPos) + clockBias;

        const p12 = GPSMath.getCircleIntersections(activeSats[0], r1, activeSats[1], r2);
        const p23 = GPSMath.getCircleIntersections(activeSats[1], r2, activeSats[2], r3);
        const p13 = GPSMath.getCircleIntersections(activeSats[0], r1, activeSats[2], r3);

        const closePoints = [];
        [...p12, ...p23, ...p13].forEach((pt) => {
          if (GPSMath.dist2D(pt, carPos) < Math.abs(clockBias) * 2 + 50) {
            closePoints.push(pt);
            GPSDraw.drawTargetPoint(ctx, pt.x, pt.y, '', '#f43f5e', 3);
          }
        });

        // Error Triangle area highlight
        if (closePoints.length >= 3) {
          ctx.save();
          ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
          ctx.strokeStyle = '#f43f5e';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(closePoints[0].x, closePoints[0].y);
          ctx.lineTo(closePoints[1].x, closePoints[1].y);
          ctx.lineTo(closePoints[2].x, closePoints[2].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.font = '600 11px "Fira Code", monospace';
          ctx.fillStyle = '#f43f5e';
          ctx.fillText('Feiltrekant pga. klokkeavvik! (Juster slider)', carPos.x + 20, carPos.y - 20);
          ctx.restore();
        }
      }
    }
  },

  updateHUD(activeSats, carPos, clockBias, isLocked) {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    hudTR.innerHTML = `
      <div class="hud-badge ${isLocked ? 'highlight-emerald' : 'highlight-rose'}">
        <span>STATUS:</span>
        <strong>${isLocked ? '3D FIX (LÅST)' : (activeSats.length < 3 ? 'MANGLER SATELLITTER' : 'KLOKKEFEIL')}</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>AKTIVE SATELLITTER:</span>
        <strong>${activeSats.length} / 3</strong>
      </div>
      <div class="hud-badge highlight-amber">
        <span>BILENS POSISJON:</span>
        <strong>X: ${Math.round(carPos.x)} | Y: ${Math.round(carPos.y)}</strong>
      </div>
    `;
  },

  // Mouse & Touch handling
  onMouseDown(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (GPSMath.dist2D({ x: mx, y: my }, this.state.carPos) < 40) {
      this.state.isDraggingCar = true;
      this.state.autoDrive = false;
      const btn = document.getElementById('btnAutoDrive');
      const badge = document.getElementById('valDrive');
      if (btn) btn.classList.remove('active');
      if (badge) badge.innerText = 'Manuell (Dratt)';
    }
  },

  onMouseMove(e, canvas) {
    if (!this.state.isDraggingCar) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - this.state.carPos.x;
    const dy = my - this.state.carPos.y;
    if (Math.hypot(dx, dy) > 1) {
      this.state.carHeading = Math.atan2(dy, dx);
    }

    this.state.carPos = { x: mx, y: my };
  },

  onMouseUp() {
    this.state.isDraggingCar = false;
  }
};
