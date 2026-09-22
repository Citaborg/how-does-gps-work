/**
 * Del 5: Ekko, Flerveis-interferens (Multipath) & Atmosfæriske Forhold
 * Viser hvordan radiosignaler reflekteres fra bygninger/fjell,
 * ionosfæriske forsinkelser, og GDOP (geometrisk presisjonsforringelse).
 */

window.ModuleDel5 = {
  id: 'del5',
  tag: 'DEL 05 // EKKO & SIGNALFORHOLD',
  title: 'Ekko, Flervei (Multipath) & Atmosfærisk Støy',

  state: {
    step: 1, // 1: Direkte vs Reflektert (Multipath), 2: Urban Canyon, 3: GDOP Geometri
    buildingHeight: 200,
    buildingX: 420,
    showDirectPath: true,
    showReflectedPath: true,
    showIonosphere: true,
    multipathIntensity: 0.8,
    gdopMode: 'good', // 'good' or 'poor'
    wavePhase: 0,
    carPos: { x: 550, y: 380 }
  },

  satellites: [
    { id: 1, x: 200, y: 80, name: 'SV 01 (Høy)', color: '#00f0ff' },
    { id: 2, x: 680, y: 120, name: 'SV 02 (Lav)', color: '#38bdf8' },
    { id: 3, x: 320, y: 60, name: 'SV 03', color: '#a855f7' }
  ],

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Flerveis-ekko (Multipath): Den ekstra omveien',
        desc: 'GPS-signaler reflekteres av glassfasader, stålbygg og fjell. Det reflekterte signalet må reise en lengre vei enn det direkte signalet. Den ekstra tidsforsinkelsen lurer mottakeren til å tro at den er lenger unna enn den faktisk er!'
      },
      {
        step: 2,
        title: '2. "Urban Canyon" (Bygater med blokkerte siktlinjer)',
        desc: 'Når høye skyskrapere blokkerer den direkte siktlinjen (LOS), mottar bilen *kun* det reflekterte ekkoet. Bilen "hopper" plutselig 15-30 meter over i feil kjørefelt eller inn i en bygning!'
      },
      {
        step: 3,
        title: '3. GDOP: Geometrisk Presisjonsforringelse',
        desc: 'Hvis alle synlige satellitter står samlet i en trang klynge (høy GDOP), blir skjæringspunktet mellom avstandssirklene strukket ut til en stor, unøyaktig ellipse. Satellitter spredt vidt over himmelen gir optimal skarp geometri (lav GDOP).'
      }
    ];
  },

  getMath() {
    return `
      <div class="math-formula-box" style="border-color: rgba(244, 63, 94, 0.4);">
        <span class="formula-main">Δd_{multipath} = c · τ_{forsinkelse} = d_{reflektert} - d_{direkte}</span>
        <span class="formula-sub">Ekstra distanse gir falsk forlenget pseudorange</span>
      </div>

      <div class="math-formula-box" style="border-color: rgba(0, 240, 255, 0.35);">
        <span class="formula-main">Posisjonsusikkerhet = GDOP · σ_{målefeil}</span>
        <span class="formula-sub">Lav GDOP (< 2.0) = Optimal spredning | Høy GDOP (> 6.0) = Dårlig geometri</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">Ionosfære & Troposfære:</span> Laded partikler og fuktighet bremser signalet og gir 2-20 meter forsinkelse. Moderne mottakere bruker to frekvenser (L1 + L5) for å kansellere ionosfærisk forsinkelse ($1/f^2$-avhengighet).</li>
        <li><span class="highlight-text">Avbøtende teknologi:</span> Avanserte antenner (Choke-ring og polarisasjonsfiltre) avviser venstrehåndspolariserte (LHCP) reflekterte bølger.</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">Støy- og Geometriskener</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.step === 1 ? 'active' : ''}" onclick="ModuleDel5.setStep(1)">1: Direkte vs Ekko</button>
        <button class="btn-toggle ${this.state.step === 2 ? 'active' : ''}" onclick="ModuleDel5.setStep(2)">2: Urban Canyon (Blokkert LOS)</button>
        <button class="btn-toggle ${this.state.step === 3 ? 'active' : ''}" onclick="ModuleDel5.setStep(3)">3: GDOP Geometri</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>Bygningsposisjon & Refleksjonspunkt</span>
            <span class="control-val">Skyskraper X: ${this.state.buildingX}px</span>
          </label>
          <input type="range" min="300" max="500" step="5" value="${this.state.buildingX}" oninput="ModuleDel5.onBuildingChange(this.value)">
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Satellitt-konstellasjon (GDOP)</span>
            <span class="control-val">${this.state.gdopMode === 'good' ? 'Lav GDOP (God spredning)' : 'Høy GDOP (Klynge)'}</span>
          </label>
          <div class="toggle-group">
            <button class="btn-toggle ${this.state.gdopMode === 'good' ? 'active' : ''}" onclick="ModuleDel5.setGDOP('good')">🌐 God Geometri (GDOP ≈ 1.6)</button>
            <button class="btn-toggle ${this.state.gdopMode === 'poor' ? 'active' : ''}" onclick="ModuleDel5.setGDOP('poor')">⚠️ Dårlig Geometri (GDOP ≈ 7.8)</button>
          </div>
        </div>
      </div>
    `;
  },

  setStep(step) {
    this.state.step = step;
    if (step === 1) {
      this.state.showDirectPath = true;
      this.state.showReflectedPath = true;
      this.state.gdopMode = 'good';
    } else if (step === 2) {
      this.state.showDirectPath = false; // Blocked direct path
      this.state.showReflectedPath = true;
      this.state.gdopMode = 'poor';
    } else if (step === 3) {
      this.state.showDirectPath = true;
      this.state.showReflectedPath = false;
    }

    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(step);
    }
  },

  onBuildingChange(val) {
    this.state.buildingX = parseFloat(val);
  },

  setGDOP(mode) {
    this.state.gdopMode = mode;
    if (window.App) window.App.updateControls();
  },

  update(dt) {
    this.state.wavePhase += dt * 35;
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    GPSDraw.drawGrid(ctx, width, height, 40);

    const carPos = { x: width * 0.72, y: height * 0.72 };
    this.state.carPos = carPos;

    // Reposition satellites based on GDOP mode
    if (this.state.gdopMode === 'good') {
      this.satellites[0].x = width * 0.18;
      this.satellites[0].y = height * 0.16;
      this.satellites[1].x = width * 0.85;
      this.satellites[1].y = height * 0.2;
      this.satellites[2].x = width * 0.5;
      this.satellites[2].y = height * 0.12;
    } else {
      // Clustered tightly in poor GDOP
      this.satellites[0].x = width * 0.42;
      this.satellites[0].y = height * 0.15;
      this.satellites[1].x = width * 0.58;
      this.satellites[1].y = height * 0.16;
      this.satellites[2].x = width * 0.5;
      this.satellites[2].y = height * 0.12;
    }

    // Draw Atmosphere Layers at top (Ionosphere & Troposphere bands)
    this.drawAtmosphere(ctx, width, height);

    // Draw Skyscraper Building
    const bldgX = this.state.buildingX;
    const bldgY = carPos.y + 10;
    const bldgH = 220;
    const bldgW = 70;
    GPSDraw.drawBuilding(ctx, bldgX, bldgY, bldgW, bldgH);

    // Primary Satellite SV 01 (causes multipath)
    const sat1 = this.satellites[0];

    // Reflection Point on Building Facade
    const bouncePoint = {
      x: bldgX + bldgW / 2,
      y: bldgY - bldgH * 0.65
    };

    // 1. Direct Line-of-sight Path
    if (this.state.showDirectPath) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sat1.x, sat1.y);
      ctx.lineTo(carPos.x, carPos.y);
      ctx.stroke();

      const dDirect = GPSMath.dist2D(sat1, carPos);
      GPSDraw.drawTag(ctx, (sat1.x + carPos.x) / 2 - 40, (sat1.y + carPos.y) / 2 - 10, 'DIREKTE BANE', `${(dDirect * 10).toFixed(0)} km`, '#00f0ff');
      ctx.restore();
    } else {
      // Blocked Direct LOS indicator
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sat1.x, sat1.y);
      ctx.lineTo(carPos.x, carPos.y);
      ctx.stroke();

      // Blokkert kryss
      ctx.font = '700 12px "Fira Code", monospace';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('❌ BLOKKERT SIKTLINJE (LOS)', (sat1.x + carPos.x) / 2, (sat1.y + carPos.y) / 2);
      ctx.restore();
    }

    // 2. Reflected Multipath
    if (this.state.showReflectedPath) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Ray from sat to building
      ctx.beginPath();
      ctx.moveTo(sat1.x, sat1.y);
      ctx.lineTo(bouncePoint.x, bouncePoint.y);
      ctx.lineTo(carPos.x, carPos.y);
      ctx.stroke();

      // Reflection spark
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(bouncePoint.x, bouncePoint.y, 4, 0, Math.PI * 2);
      ctx.fill();

      const d1 = GPSMath.dist2D(sat1, bouncePoint);
      const d2 = GPSMath.dist2D(bouncePoint, carPos);
      const dReflected = d1 + d2;
      const dDirect = GPSMath.dist2D(sat1, carPos);
      const errorMeters = Math.round((dReflected - dDirect) * 8);

      GPSDraw.drawTag(ctx, bouncePoint.x + 10, bouncePoint.y - 10, 'REFLEKTERT EKKO', `+${errorMeters} m feil!`, '#f43f5e');
      ctx.restore();

      // Ghost Car (Spøkelsesposisjon skapt av feil avstand)
      const ghostOffset = 45;
      GPSDraw.drawCar(ctx, carPos.x + ghostOffset, carPos.y, 0, 'rgba(244, 63, 94, 0.6)', 1.0, false);
      GPSDraw.drawTargetPoint(ctx, carPos.x + ghostOffset, carPos.y, 'Spøkelses-posisjon', '#f43f5e', 5);
    }

    // Draw Satellites
    this.satellites.forEach((sat) => {
      const angle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, angle, sat.color, 1, true);
    });

    // Draw Car (True Position)
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, 0, '#10b981', 1.2, this.state.showDirectPath);
    GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, 'Virkelig Posisjon', '#10b981', 6);

    // Draw GDOP Uncertainty Ellipse around Car
    this.drawGDOPEllipse(ctx, carPos, this.state.gdopMode);

    // Update Top-Right HUD
    this.updateHUD();
  },

  drawAtmosphere(ctx, width, height) {
    ctx.save();
    // Ionosphere layer
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.fillRect(0, 0, width, height * 0.22);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.22);
    ctx.lineTo(width, height * 0.22);
    ctx.stroke();

    ctx.font = '600 9px "Fira Code", monospace';
    ctx.fillStyle = '#c084fc';
    ctx.fillText('IONOSFÆRE (60 - 1000 km) // Frekvensavhengig forsinkelse ∝ 1/f²', 15, 20);

    // Troposphere layer
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.fillRect(0, height * 0.22, width, height * 0.15);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.37);
    ctx.lineTo(width, height * 0.37);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TROPOSFÆRE (0 - 60 km) // Fuktighet & Barometrisk forsinkelse', 15, height * 0.22 + 18);

    ctx.restore();
  },

  drawGDOPEllipse(ctx, carPos, mode) {
    ctx.save();
    ctx.strokeStyle = mode === 'good' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.7)';
    ctx.fillStyle = mode === 'good' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.15)';
    ctx.lineWidth = 1.5;

    const rx = mode === 'good' ? 18 : 65;
    const ry = mode === 'good' ? 14 : 22;
    const angle = mode === 'good' ? 0 : -0.4;

    ctx.beginPath();
    ctx.ellipse(carPos.x, carPos.y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 10px "Fira Code", monospace';
    ctx.fillStyle = mode === 'good' ? '#10b981' : '#f43f5e';
    ctx.fillText(
      mode === 'good' ? 'Liten usikkerhetsellipse (GDOP ≈ 1.6)' : 'Strukket usikkerhetsellipse (GDOP ≈ 7.8)',
      carPos.x - 70,
      carPos.y + 40
    );
    ctx.restore();
  },

  updateHUD() {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    const isGood = this.state.showDirectPath && this.state.gdopMode === 'good';
    hudTR.innerHTML = `
      <div class="hud-badge ${isGood ? 'highlight-emerald' : 'highlight-rose'}">
        <span>SIGNALKVALITET:</span>
        <strong>${isGood ? 'HØY KVALITET' : (this.state.showDirectPath ? 'MULTIPATH STØY' : 'BLOKKERT LOS (KUN EKKO)')}</strong>
      </div>
      <div class="hud-badge highlight-amber">
        <span>GDOP VERDI:</span>
        <strong>${this.state.gdopMode === 'good' ? '1.6 (Optimal)' : '7.8 (Dårlig Geometri)'}</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>MULTIFREKVENS:</span>
        <strong>L1 (1575 MHz) + L5 (1176 MHz)</strong>
      </div>
    `;
  },

  onMouseDown() {},
  onMouseMove() {},
  onMouseUp() {}
};
