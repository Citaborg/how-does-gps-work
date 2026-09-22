/**
 * Del 3: Nøyaktig Fartsberegning via Doppler-effekten
 * Viser hvordan en bil finner sin eksakte hastighet ved å måle
 * frekvensforskyvningen (Doppler-effekten) på satellittenes bærebølger (L1 = 1575.42 MHz).
 */

window.ModuleDel3 = {
  id: 'del3',
  tag: 'DEL 03 // HASTIGHET & DOPPLER',
  title: 'Fartsberegning: Doppler-effekten på Bærebølgen',

  state: {
    step: 1, // 1: Stillestående vs Bevegelse, 2: Doppler Kompresjon, 3: Full 3D Fartsvektor
    carSpeedKmh: 90, // km/h
    carHeadingDeg: 0, // degrees (0 is rightward)
    carPos: { x: 300, y: 340 },
    roadY: 340,
    time: 0,
    wavePhase: 0,
    showSpectrum: true,
    showWaveCompress: true
  },

  satellites: [
    { id: 1, x: 150, y: 80, name: 'SV 01 (Bak)', color: '#38bdf8' },
    { id: 2, x: 650, y: 90, name: 'SV 02 (Foran)', color: '#00f0ff' },
    { id: 3, x: 400, y: 60, name: 'SV 03 (Topp)', color: '#a855f7' }
  ],

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Hvorfor ikke bare derivere posisjonen?',
        desc: 'Å regne fart som $\\Delta s / \\Delta t$ fra GPS-posisjoner gir støy og unøyaktighet fordi hver posisjon har meter-feil. Bilen ville vist hoppende og hakkete fart!'
      },
      {
        step: 2,
        title: '2. Doppler-effekten på Bærebølgen',
        desc: 'GPS-signalet sendes på en ren radiobølge ($L_1 = 1575.42\\text{ MHz}$). Når bilen kjører mot en satellitt, presses bølgetoppene sammen og frekvensen øker ($+\\Delta f$). Kjører den vekk, strekkes bølgene ($-\\Delta f$).'
      },
      {
        step: 3,
        title: '3. Fartsvektor med millimeterpresisjon',
        desc: 'Ved å måle Doppler-forskyvningen fra flere satellitter samtidig, regner mottakeren ut 3D-fartsvektoren $(v_x, v_y, v_z)$ med en nøyaktighet ned til under $0.05\\text{ km/t}$!'
      }
    ];
  },

  getMath() {
    return `
      <div class="math-formula-box">
        <span class="formula-main">Δf = -f_0 · (v · u_{LOS}) / c</span>
        <span class="formula-sub">f_0 = 1575.42 MHz (L1) | v = Bilens fartsvektor | u_{LOS} = Siktlinje-enhetsvektor</span>
      </div>

      <div class="math-formula-box" style="border-color: rgba(16, 185, 129, 0.35);">
        <span class="formula-main">v_{LOS} = -Δf · (c / f_0) = -Δf · λ</span>
        <span class="formula-sub">λ ≈ 19.03 cm (GPS L1 bølgelengde)</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">Eksempel:</span> En bil i $100\\text{ km/t}$ ($27.8\\text{ m/s}$) mot satellitten gir en Doppler-forskyvning på ca. <span class="highlight-text">+146 Hz</span> på $1.575\\text{ GHz}$.</li>
        <li><span class="highlight-text">Øyeblikkelig måling:</span> Mottakeren trenger ikke vente for å se hvor langt bilen har flyttet seg; farten leses av kontinuerlig og lynraskt via fase-låsing (PLL).</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">Fartskontroll & Doppler-analyse</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.step === 1 ? 'active' : ''}" onclick="ModuleDel3.setStep(1)">1: Posisjon vs Doppler</button>
        <button class="btn-toggle ${this.state.step === 2 ? 'active' : ''}" onclick="ModuleDel3.setStep(2)">2: Bølgekompresjon</button>
        <button class="btn-toggle ${this.state.step === 3 ? 'active' : ''}" onclick="ModuleDel3.setStep(3)">3: 3D Fartsvektor</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>Bilens Fart (v)</span>
            <span class="control-val" id="valSpeed">${this.state.carSpeedKmh} km/t (${(this.state.carSpeedKmh / 3.6).toFixed(1)} m/s)</span>
          </label>
          <input type="range" id="sliderSpeed" min="-150" max="180" step="5" value="${this.state.carSpeedKmh}" oninput="ModuleDel3.onSpeedChange(this.value)">
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Hurtigvalg Fart</span>
            <span class="control-val">Presets</span>
          </label>
          <div class="toggle-group">
            <button class="btn-toggle" onclick="ModuleDel3.setPresetSpeed(0)">0 km/t (Stille)</button>
            <button class="btn-toggle" onclick="ModuleDel3.setPresetSpeed(60)">60 km/t (By)</button>
            <button class="btn-toggle" onclick="ModuleDel3.setPresetSpeed(110)">110 km/t (Motorvei)</button>
            <button class="btn-toggle" onclick="ModuleDel3.setPresetSpeed(-80)">-80 km/t (Rygge)</button>
          </div>
        </div>
      </div>
    `;
  },

  setStep(step) {
    this.state.step = step;
    if (step === 1 && this.state.carSpeedKmh === 0) {
      this.state.carSpeedKmh = 70;
    }
    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(step);
    }
  },

  onSpeedChange(val) {
    this.state.carSpeedKmh = parseFloat(val);
    const badge = document.getElementById('valSpeed');
    if (badge) {
      badge.innerText = `${this.state.carSpeedKmh} km/t (${(this.state.carSpeedKmh / 3.6).toFixed(1)} m/s)`;
    }
  },

  setPresetSpeed(kmh) {
    this.state.carSpeedKmh = kmh;
    const slider = document.getElementById('sliderSpeed');
    if (slider) slider.value = kmh;
    this.onSpeedChange(kmh);
  },

  update(dt) {
    this.state.time += dt;
    const speedMs = this.state.carSpeedKmh / 3.6;
    const width = this.canvasWidth || 800;

    // Move car horizontally across road
    const simSpeed = speedMs * 1.5; // Visual scaling
    this.state.carPos.x += simSpeed * dt;

    // Wrap around canvas
    if (this.state.carPos.x > width + 50) this.state.carPos.x = -50;
    if (this.state.carPos.x < -50) this.state.carPos.x = width + 50;

    this.state.wavePhase += dt * 30;
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    GPSDraw.drawGrid(ctx, width, height, 40);

    // Satellites positions
    this.satellites[0].x = width * 0.18;
    this.satellites[0].y = height * 0.16;

    this.satellites[1].x = width * 0.82;
    this.satellites[1].y = height * 0.18;

    this.satellites[2].x = width * 0.5;
    this.satellites[2].y = height * 0.11;

    const carPos = this.state.carPos;
    carPos.y = height * 0.65;

    // Velocity vector (m/s)
    const vVector = {
      x: this.state.carSpeedKmh / 3.6,
      y: 0
    };

    // Draw straight Highway Road
    this.drawHighway(ctx, width, carPos.y);

    // Calculate and draw Doppler beams for each satellite
    const dopplerData = this.satellites.map((sat) => {
      const dop = GPSMath.calculateDoppler(sat, carPos, vVector);
      return { sat, dop };
    });

    // Draw Doppler compressed/expanded carrier waves
    dopplerData.forEach(({ sat, dop }) => {
      this.drawDopplerBeam(ctx, sat, carPos, dop);
    });

    // Draw Satellites
    this.satellites.forEach((sat) => {
      const angle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, angle, sat.color, 1, true);
    });

    // Draw Car
    const heading = this.state.carSpeedKmh >= 0 ? 0 : Math.PI;
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, heading, '#10b981', 1.2, true);

    // Draw Velocity Vector Arrow on Car
    if (Math.abs(this.state.carSpeedKmh) > 2) {
      const arrowLength = (this.state.carSpeedKmh / 180) * 80;
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(carPos.x, carPos.y);
      ctx.lineTo(carPos.x + arrowLength, carPos.y);
      ctx.stroke();

      // Arrowhead
      const headSize = 7;
      const dir = Math.sign(arrowLength);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(carPos.x + arrowLength, carPos.y);
      ctx.lineTo(carPos.x + arrowLength - dir * headSize, carPos.y - headSize * 0.7);
      ctx.lineTo(carPos.x + arrowLength - dir * headSize, carPos.y + headSize * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.font = '700 11px "Fira Code", monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(`v = ${Math.abs(this.state.carSpeedKmh)} km/t`, carPos.x + arrowLength / 2, carPos.y - 14);
      ctx.restore();
    }

    // Draw Spectrum Analyzer Mini-HUD
    this.drawSpectrumAnalyzer(ctx, width, height, dopplerData);

    // Update Top-Right HUD
    this.updateHUD(this.state.carSpeedKmh, dopplerData);
  },

  drawHighway(ctx, width, roadY) {
    ctx.save();
    ctx.fillStyle = 'rgba(14, 22, 38, 0.8)';
    ctx.fillRect(0, roadY - 24, width, 48);

    // Guard rails
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, roadY - 24);
    ctx.lineTo(width, roadY - 24);
    ctx.moveTo(0, roadY + 24);
    ctx.lineTo(width, roadY + 24);
    ctx.stroke();

    // Dashed center divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(width, roadY);
    ctx.stroke();

    ctx.restore();
  },

  drawDopplerBeam(ctx, sat, carPos, dop) {
    ctx.save();
    const dx = carPos.x - sat.x;
    const dy = carPos.y - sat.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Center beam line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sat.x, sat.y);
    ctx.lineTo(carPos.x, carPos.y);
    ctx.stroke();

    // Wave crests along the ray
    ctx.setLineDash([]);
    ctx.translate(sat.x, sat.y);
    ctx.rotate(angle);

    // Base wavelength modified by Doppler
    // Approaching sat: compressed wavelength (shorter spacing)
    // Moving away: expanded wavelength (longer spacing)
    const baseWavelength = 18;
    const compFactor = 1 - (dop.vLOS / 60); // Visual compression factor
    const wavelength = Math.max(6, baseWavelength * compFactor);

    const isApproaching = dop.deltaF_real > 1;
    const isReceding = dop.deltaF_real < -1;
    const waveColor = isApproaching ? '#00f0ff' : (isReceding ? '#f43f5e' : '#10b981');

    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1.5;

    const waveOffset = (this.state.wavePhase % wavelength);
    for (let r = waveOffset; r < dist; r += wavelength) {
      const alpha = Math.sin((r / dist) * Math.PI) * 0.8 + 0.2;
      ctx.strokeStyle = waveColor.replace('#00f0ff', `rgba(0, 240, 255, ${alpha})`)
                                 .replace('#f43f5e', `rgba(244, 63, 94, ${alpha})`)
                                 .replace('#10b981', `rgba(16, 185, 129, ${alpha})`);
      ctx.beginPath();
      ctx.moveTo(r, -10);
      ctx.lineTo(r, 10);
      ctx.stroke();
    }

    ctx.restore();

    // Doppler Shift Label on Beam
    const midX = (sat.x + carPos.x) / 2;
    const midY = (sat.y + carPos.y) / 2;
    const sign = dop.deltaF_real >= 0 ? '+' : '';
    const label = `Δf: ${sign}${dop.deltaF_real.toFixed(1)} Hz`;
    GPSDraw.drawTag(ctx, midX - 30, midY, sat.name.split(' ')[0], label, waveColor);
  },

  drawSpectrumAnalyzer(ctx, width, height, dopplerData) {
    const specW = 280;
    const specH = 90;
    const specX = 20;
    const specY = height - specH - 20;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(specX, specY, specW, specH);
    ctx.strokeRect(specX, specY, specW, specH);

    // Title
    ctx.font = '600 10px "Fira Code", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('FREKVENS-SPEKTRUM (L1 = 1575.42 MHz)', specX + 10, specY + 16);

    // Center Baseline (1575.42 MHz)
    const centerX = specX + specW / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(centerX, specY + 24);
    ctx.lineTo(centerX, specY + specH - 12);
    ctx.stroke();

    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('f₀ (0 Hz)', centerX, specY + specH - 3);

    // Draw Frequency Spikes for each satellite
    ctx.setLineDash([]);
    dopplerData.forEach(({ sat, dop }) => {
      // Scale: +/- 300 Hz spans specW/2
      const offsetPx = (dop.deltaF_real / 300) * (specW * 0.42);
      const spikeX = GPSMath.clamp(centerX + offsetPx, specX + 15, specX + specW - 15);
      const spikeH = 45;

      ctx.strokeStyle = sat.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(spikeX, specY + specH - 14);
      ctx.lineTo(spikeX, specY + specH - 14 - spikeH);
      ctx.stroke();

      // Peak dot
      ctx.fillStyle = sat.color;
      ctx.beginPath();
      ctx.arc(spikeX, specY + specH - 14 - spikeH, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = '8px "Fira Code", monospace';
      ctx.fillText(sat.name.split(' ')[0], spikeX, specY + specH - 18 - spikeH);
    });

    ctx.restore();
  },

  updateHUD(speedKmh, dopplerData) {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    hudTR.innerHTML = `
      <div class="hud-badge highlight-emerald">
        <span>GPS SPEEDOMETER:</span>
        <strong>${Math.abs(speedKmh).toFixed(1)} km/t</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>PRESET NØYAKTIGHET:</span>
        <strong>±0.03 km/t (0.01 m/s)</strong>
      </div>
      <div class="hud-badge highlight-amber">
        <span>METODE:</span>
        <strong>Bærebølge Doppler (L1)</strong>
      </div>
    `;
  },

  onMouseDown() {},
  onMouseMove() {},
  onMouseUp() {}
};
