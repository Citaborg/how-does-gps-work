/**
 * Del 4: Hvordan vet satellitten sin egen posisjon?
 * Viser Keplers banemekanikk, Bakkestasjonenes radarsporing og efemeride-opplasting,
 * samt Einstein sin Spesielle og Generelle Relativitetsteori (UiO-referansen).
 */

window.ModuleDel4 = {
  id: 'del4',
  tag: 'DEL 04 // SATELLITT-POSISJON & RELATIVITET',
  title: 'Satellittens Egenposisjon & Relativitetsteori',

  state: {
    step: 1, // 1: Kepler & Bakkestasjon, 2: Efemeride Uplink, 3: Relativitet (UiO)
    simDays: 0,
    orbitAngle: 0,
    orbitSpeed: 0.4,
    showUplink: true,
    showRelativityPanel: true,
    uplinkPulse: 0,
    relativityCompensation: true
  },

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Keplers lover & Bakkestasjoner (Sporing)',
        desc: 'Satellittene går i stabile baner $20\\ 200\\text{ km}$ over Jorden med omløpstid på $11\\text{t } 58\\text{m}$. Men gravitasjonsforskjeller, månens tiltrekning og solstråling gir små baneavvik. Bakkestasjoner sporer banene kontinuerlig med radar!'
      },
      {
        step: 2,
        title: '2. Efemeride-opplasting (Uplink)',
        desc: 'Hovedkontrollstasjonen beregner oppdaterte baneparametere (kalt **efemerider**) og atomklokke-justeringer. Dette sendes opp til satellittene 1-2 ganger i døgnet. Satellitten kringkaster disse dataene direkte til telefonen/bilen.'
      },
      {
        step: 3,
        title: '3. Relativitetsteori: Einsteins avgjørende rolle (UiO)',
        desc: 'Spesiell relativitet (fart) sakker klokken med $-7.1\\ \\mu\\text{s/dag}$. Generell relativitet (svakere gravitasjon i rommet) gjør at klokken går $+45.7\\ \\mu\\text{s/dag}$ fortere! Netto: $+38.6\\ \\mu\\text{s/dag}$. Uten korreksjon ville GPS feilet med **11.6 km per dag**!'
      }
    ];
  },

  getMath() {
    const rel = GPSMath.getRelativityStats();
    return `
      <div class="math-formula-box" style="border-color: rgba(251, 191, 36, 0.4);">
        <span class="formula-main">Δt_{net} = Δt_{GR} + Δt_{SR} = +45.7 μs - 7.1 μs = +38.6 μs/dag</span>
        <span class="formula-sub">Generell Relativitet (GR: Gravitasjon) + Spesiell Relativitet (SR: Fart)</span>
      </div>

      <div class="math-formula-box" style="border-color: rgba(244, 63, 94, 0.4);">
        <span class="formula-main">Posisjonsfeil = c · Δt_{net} ≈ 11.57 km / dag</span>
        <span class="formula-sub">Uten relativistisk korreksjon blir GPS ubrukelig etter få minutter! (~482 m/time)</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">Ingeniørløsningen:</span> Satellittenes atomklokker settes til å tikke på <span class="highlight-text">10.22999999543 MHz</span> før oppskytning (i stedet for 10.23 MHz), slik at de i bane tikker med nøyaktig 10.23 MHz sett fra Jorden!</li>
        <li><span class="highlight-text">Efemerider:</span> Inneholder 16 Kepler-baneparametere som beskriver satellittens ellipseformede bane med centimeter-nøyaktighet.</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">Satellittkontroll & Relativitetstest</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.step === 1 ? 'active' : ''}" onclick="ModuleDel4.setStep(1)">1: Bane & Bakkestasjon</button>
        <button class="btn-toggle ${this.state.step === 2 ? 'active' : ''}" onclick="ModuleDel4.setStep(2)">2: Efemeride Uplink</button>
        <button class="btn-toggle ${this.state.step === 3 ? 'active' : ''}" onclick="ModuleDel4.setStep(3)">3: Einsteins Relativitet (UiO)</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>Relativistisk Korreksjon</span>
            <span class="control-val">${this.state.relativityCompensation ? 'Kompensert (10.229999 MHz)' : 'AV (Feil akkumuleres)'}</span>
          </label>
          <div class="toggle-group">
            <button class="btn-toggle ${this.state.relativityCompensation ? 'active' : ''}" id="btnRelComp" onclick="ModuleDel4.toggleRelativityComp()">⏱️ Relativitets-kompensasjon</button>
          </div>
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Tid Siden Siste Bakkekorreksjon</span>
            <span class="control-val" id="valSimDays">${this.state.simDays.toFixed(1)} dager (${(this.state.simDays * 24).toFixed(0)} timer)</span>
          </label>
          <input type="range" id="sliderSimDays" min="0" max="5" step="0.1" value="${this.state.simDays}" oninput="ModuleDel4.onDaysChange(this.value)">
        </div>
      </div>
    `;
  },

  setStep(step) {
    this.state.step = step;
    if (step === 3 && this.state.simDays === 0) {
      this.state.simDays = 1.0;
    }
    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(step);
    }
  },

  toggleRelativityComp() {
    this.state.relativityCompensation = !this.state.relativityCompensation;
    const btn = document.getElementById('btnRelComp');
    if (btn) btn.classList.toggle('active', this.state.relativityCompensation);
  },

  onDaysChange(val) {
    this.state.simDays = parseFloat(val);
    const badge = document.getElementById('valSimDays');
    if (badge) {
      badge.innerText = `${this.state.simDays.toFixed(1)} dager (${(this.state.simDays * 24).toFixed(0)} timer)`;
    }
  },

  update(dt) {
    this.state.orbitAngle += dt * this.state.orbitSpeed;
    this.state.uplinkPulse += dt * 3;
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    GPSDraw.drawGrid(ctx, width, height, 40);

    const centerX = width * 0.48;
    const centerY = height * 0.52;
    const earthRadius = 90;
    const orbitRadius = 210;

    // Draw Orbit Path
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Orbit dimension tag
    GPSDraw.drawTag(ctx, centerX + orbitRadius * 0.7, centerY - orbitRadius * 0.7, 'BANEHØYDE', '20 200 km (MEO)', '#38bdf8');
    ctx.restore();

    // Draw Earth in center
    this.drawEarth2D(ctx, centerX, centerY, earthRadius);

    // Ground station on Earth surface (top of Earth)
    const stationAngle = -Math.PI / 2 + 0.15;
    const stationX = centerX + Math.cos(stationAngle) * (earthRadius - 5);
    const stationY = centerY + Math.sin(stationAngle) * (earthRadius - 5);
    GPSDraw.drawGroundStation(ctx, stationX, stationY, 'MASTER CONTROL (SCHRIEVER)', '#fbbf24', 0.85);

    // Satellite position along orbit
    const satX = centerX + Math.cos(this.state.orbitAngle) * orbitRadius;
    const satY = centerY + Math.sin(this.state.orbitAngle) * orbitRadius;
    const satAngle = this.state.orbitAngle + Math.PI / 2;

    // Radar Tracking & Uplink Stream from Ground Station
    const distToSat = Math.hypot(satX - stationX, satY - stationY);
    const isVisibleToStation = satY < centerY + 40; // Line of sight check

    if (isVisibleToStation) {
      // Radar Tracking Beam
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(stationX, stationY - 18);
      ctx.lineTo(satX, satY);
      ctx.stroke();

      // Uplink Data Pulses
      const pulseT = ((this.state.uplinkPulse * 0.5) % 1.0);
      const px = GPSMath.lerp(stationX, satX, pulseT);
      const py = GPSMath.lerp(stationY - 18, satY, pulseT);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Uplink data packet tag
      GPSDraw.drawTag(ctx, (stationX + satX) / 2 - 40, (stationY + satY) / 2 - 15, 'UPLINK', 'EFEMERIDER & TIDSKORREKSJON', '#fbbf24');
      ctx.restore();
    }

    // Draw Satellite
    GPSDraw.drawSatellite(ctx, satX, satY, 1, satAngle, '#00f0ff', 1.1, true);

    // Draw Relativistic Clock Drift Card Overlay
    this.drawRelativityCard(ctx, width, height);

    // Update Top-Right HUD
    this.updateHUD();
  },

  drawEarth2D(ctx, cx, cy, r) {
    ctx.save();
    // Earth glow & fill
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    grad.addColorStop(0, '#0c1b33');
    grad.addColorStop(1, '#050a14');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Atmosphere Ring (Ionosphere & Troposphere)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Earth wireframe longitude lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * (i * 0.3), r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText('JORDEN', cx, cy - 8);
    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.fillText('R = 6371 km', cx, cy + 8);

    ctx.restore();
  },

  drawRelativityCard(ctx, width, height) {
    const cardW = 340;
    const cardH = 155;
    const cardX = 20;
    const cardY = height - cardH - 20;

    const rel = GPSMath.getRelativityStats();
    const driftPerDay = this.state.relativityCompensation ? 0 : rel.netDrift_us_day;
    const totalDriftUs = driftPerDay * this.state.simDays;
    const totalErrorKm = (GPSMath.SPEED_OF_LIGHT * (totalDriftUs * 1e-6)) / 1000;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
    ctx.strokeStyle = this.state.relativityCompensation ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Header
    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = this.state.relativityCompensation ? '#10b981' : '#f43f5e';
    ctx.fillText(
      this.state.relativityCompensation ? '✓ EINSTEIN-KORREKSJON AKTIV' : '⚠️ UREGULERT RELATIVITETSDRIFT',
      cardX + 12,
      cardY + 18
    );

    // Detail lines
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`• Spesiell Relativitet (Fart):       -7.1 μs/dag (senere)`, cardX + 12, cardY + 40);
    ctx.fillText(`• Generell Relativitet (Gravitasjon): +45.7 μs/dag (fort)`, cardX + 12, cardY + 58);
    ctx.fillText(`• Netto Relativistisk Tidsdrift:    +38.6 μs/dag`, cardX + 12, cardY + 76);

    // Position Error Output
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(cardX + 10, cardY + 88, cardW - 20, 1);

    ctx.font = '700 11px "Fira Code", monospace';
    if (this.state.relativityCompensation) {
      ctx.fillStyle = '#10b981';
      ctx.fillText(`Posisjonsfeil akkumulert: 0.0 meter (Kompensert)`, cardX + 12, cardY + 110);
      ctx.font = '9px "Fira Code", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Klokkefrekvens ombord: 10.22999999543 MHz`, cardX + 12, cardY + 130);
    } else {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`Posisjonsfeil etter ${this.state.simDays.toFixed(1)} dager: ${totalErrorKm.toFixed(1)} km!`, cardX + 12, cardY + 110);
      ctx.font = '9px "Fira Code", monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Feilen øker med ~482 meter hver eneste time!`, cardX + 12, cardY + 130);
    }

    ctx.restore();
  },

  updateHUD() {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    hudTR.innerHTML = `
      <div class="hud-badge highlight-amber">
        <span>BANEHASTIGHET:</span>
        <strong>3.87 km/s (13 950 km/t)</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>ATOMKLOKKE:</span>
        <strong>Rubidium / Cesium Standard</strong>
      </div>
      <div class="hud-badge ${this.state.relativityCompensation ? 'highlight-emerald' : 'highlight-rose'}">
        <span>RELATIVITET:</span>
        <strong>${this.state.relativityCompensation ? 'GR/SR KOMPENSERT (+38.6 μs/d)' : 'UKORRIGERT'}</strong>
      </div>
    `;
  },

  onMouseDown() {},
  onMouseMove() {},
  onMouseUp() {}
};
