/**
 * Del 6: GPS Jamming & Spoofing
 * Illustrerer hvorfor det svake GPS-signalet (-160 dBW) er sårbart for
 * støy-jamming (Denial of Service) og falske GPS-signaler (Spoofing).
 */

window.ModuleDel6 = {
  id: 'del6',
  tag: 'DEL 06 // ELEKTRONISK KRIGFØRING & SIKKERHET',
  title: 'GPS-Sårbarhet: Jamming & Spoofing',

  state: {
    step: 1, // 1: Svakt signal (-160 dBW), 2: Jamming (Støy), 3: Spoofing (Falsk posisjon)
    mode: 'none', // 'none', 'jamming', 'spoofing'
    jammerPower: 1.0, // Watts
    jammerPos: { x: 380, y: 350 },
    carPos: { x: 520, y: 360 },
    spoofedOffset: { x: 0, y: 0 },
    wavePhase: 0,
    jamPhase: 0,
    time: 0
  },

  satellites: [
    { id: 1, x: 180, y: 80, name: 'SV 01', color: '#00f0ff' },
    { id: 2, x: 650, y: 90, name: 'SV 02', color: '#38bdf8' },
    { id: 3, x: 420, y: 60, name: 'SV 03', color: '#a855f7' }
  ],

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Det ekstremt svake signalet (-160 dBW)',
        desc: 'GPS-satellitter sender fra $20\\ 200\\text{ km}$ avstand med en effekt tilsvarende en $50\\text{ W}$ lyspære. På bakken er signalstyrken bare ca. $10^{-16}\\text{ W}$ (-160 dBW) – svakere enn den naturlige bakgrunnsstøyen i luften!'
      },
      {
        step: 2,
        title: '2. Jamming: Overdøving med støy (Denial of Service)',
        desc: 'En bitteliten $1\\text{ W}$ jammer (f.eks. en ulovlig sigarettenner-plugg) overdøver satellittsignalet fullstendig. Mottakerens signal-til-støyforhold (SNR) stuper, og mottakeren mister "Lock" og viser intet GPS-signal.'
      },
      {
        step: 3,
        title: '3. Spoofing: Falske signaler kaprer navigasjonen',
        desc: 'En avansert spoofer sender syntetiske GPS-signaler med litt høyere styrke enn romsignalene. Mottakeren lures til å låse seg på de falske signalene, og angriperen kan gradvis flytte bilens beregnede posisjon og fart ut i grøfta eller på avveie!'
      }
    ];
  },

  getMath() {
    return `
      <div class="math-formula-box" style="border-color: rgba(244, 63, 94, 0.4);">
        <span class="formula-main">P_{mottatt} ≈ -160 dBW = 10^{-16} W (0.000 000 000 000 000 1 W)</span>
        <span class="formula-sub">Tilsvarer å se en 50 W lyspære fra New York til London!</span>
      </div>

      <div class="math-formula-box" style="border-color: rgba(251, 191, 36, 0.4);">
        <span class="formula-main">SNR = 10 · log_{10}(P_{signal} / P_{støy})</span>
        <span class="formula-sub">Normal C/N0: ~45 dB-Hz | Ved Jamming: < 20 dB-Hz (Signal mistes)</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">CDMA Prosesseringsgevinst:</span> GPS fungerer under støygulvet fordi koden ganges med en unik pseudotilfeldig støysekvens (PRN-kode) med 1023 biter.</li>
        <li><span class="highlight-text">Anti-Jamming:</span> CRPA (Controlled Radiation Pattern Antenna) bruker fase-styrte antenne-elementer til å forme "null-punkter" (døde vinkler) i retning av jammeren.</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">Angrepsmodus & Trusselsimulering</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.mode === 'none' ? 'active' : ''}" onclick="ModuleDel6.setMode('none')">🟢 Normal Dekning (-160 dBW)</button>
        <button class="btn-toggle ${this.state.mode === 'jamming' ? 'active' : ''}" onclick="ModuleDel6.setMode('jamming')">🔴 Jamming (Støysender)</button>
        <button class="btn-toggle ${this.state.mode === 'spoofing' ? 'active' : ''}" onclick="ModuleDel6.setMode('spoofing')">⚠️ Spoofing (Falsk GPS)</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>Jammer / Sender-effekt</span>
            <span class="control-val" id="valJammerPower">${this.state.jammerPower.toFixed(1)} Watt</span>
          </label>
          <input type="range" min="0.1" max="10" step="0.1" value="${this.state.jammerPower}" oninput="ModuleDel6.onPowerChange(this.value)">
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Mottakerens Tilstand</span>
            <span class="control-val">${this.state.mode === 'none' ? 'Låst til rommet' : (this.state.mode === 'jamming' ? 'SIGNAL TAPT' : 'KAPRET AV SPOOFER')}</span>
          </label>
          <div class="hud-badge ${this.state.mode === 'none' ? 'highlight-emerald' : (this.state.mode === 'jamming' ? 'highlight-rose' : 'highlight-amber')}" style="margin-top: 4px;">
            ${this.state.mode === 'none' ? '✓ Ekte GPS Signallås (SNR 46 dB-Hz)' : (this.state.mode === 'jamming' ? '❌ Jamming Oppdaget (SNR < 15 dB-Hz)' : '⚠️ Falsk GPS-Lås (Spoofing Angrep)')}
          </div>
        </div>
      </div>
    `;
  },

  setMode(mode) {
    this.state.mode = mode;
    if (mode === 'none') this.state.step = 1;
    else if (mode === 'jamming') this.state.step = 2;
    else if (mode === 'spoofing') this.state.step = 3;

    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(this.state.step);
    }
  },

  onPowerChange(val) {
    this.state.jammerPower = parseFloat(val);
    const badge = document.getElementById('valJammerPower');
    if (badge) badge.innerText = `${this.state.jammerPower.toFixed(1)} Watt`;
  },

  update(dt) {
    this.state.time += dt;
    this.state.wavePhase += dt * 35;
    this.state.jamPhase += dt * 65;

    // Spoofing drift animation
    if (this.state.mode === 'spoofing') {
      const targetOffX = Math.sin(this.state.time * 0.8) * 90 + 60;
      const targetOffY = Math.cos(this.state.time * 0.6) * 35 - 30;
      this.state.spoofedOffset.x = GPSMath.lerp(this.state.spoofedOffset.x, targetOffX, dt * 0.8);
      this.state.spoofedOffset.y = GPSMath.lerp(this.state.spoofedOffset.y, targetOffY, dt * 0.8);
    } else {
      this.state.spoofedOffset = { x: 0, y: 0 };
    }
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    GPSDraw.drawGrid(ctx, width, height, 40);

    // Reposition elements
    this.satellites[0].x = width * 0.2;
    this.satellites[0].y = height * 0.16;
    this.satellites[1].x = width * 0.8;
    this.satellites[1].y = height * 0.18;
    this.satellites[2].x = width * 0.5;
    this.satellites[2].y = height * 0.12;

    const carPos = { x: width * 0.7, y: height * 0.68 };
    this.state.carPos = carPos;

    const jammerPos = { x: width * 0.32, y: height * 0.68 };
    this.state.jammerPos = jammerPos;

    // Draw Satellites & Space signals
    this.satellites.forEach((sat) => {
      // Draw faint space waves
      if (this.state.mode !== 'jamming') {
        GPSDraw.drawWavefronts(ctx, sat, 350, 28, this.state.wavePhase, 'rgba(0, 240, 255, 0.4)');
      }

      const angle = Math.atan2(carPos.y - sat.y, carPos.x - sat.x) - Math.PI / 2;
      GPSDraw.drawSatellite(ctx, sat.x, sat.y, sat.id, angle, sat.color, 1, true);

      // Faint signal power badge
      GPSDraw.drawTag(ctx, sat.x - 30, sat.y + 24, 'SIGNAL', '-160 dBW', '#00f0ff');
    });

    // Draw Jammer / Spoofer Device on ground
    if (this.state.mode !== 'none') {
      this.drawJammerDevice(ctx, jammerPos.x, jammerPos.y, this.state.mode);
    }

    // 1. Jamming Attack Waves (Red Noise Cone)
    if (this.state.mode === 'jamming') {
      this.drawJammingCone(ctx, jammerPos, carPos, width, height);
    }

    // 2. Spoofing Attack Waves (Amber Fake Signals)
    if (this.state.mode === 'spoofing') {
      this.drawSpoofingBeams(ctx, jammerPos, carPos);
    }

    // Draw True Car Position
    const hasLock = (this.state.mode === 'none');
    GPSDraw.drawCar(ctx, carPos.x, carPos.y, 0, hasLock ? '#10b981' : '#64748b', 1.2, hasLock);
    GPSDraw.drawTargetPoint(ctx, carPos.x, carPos.y, 'Virkelig Bilposisjon', hasLock ? '#10b981' : '#64748b', 6);

    // Draw Spoofed / False Car Position if under spoofing attack
    if (this.state.mode === 'spoofing') {
      const fakeX = carPos.x + this.state.spoofedOffset.x;
      const fakeY = carPos.y + this.state.spoofedOffset.y;

      // Fake car wireframe
      GPSDraw.drawCar(ctx, fakeX, fakeY, 0.2, '#f43f5e', 1.1, true);
      GPSDraw.drawTargetPoint(ctx, fakeX, fakeY, 'FALSK SPOOFET GPS-POSISJON (I Grøfta!)', '#f43f5e', 6);

      // Manipulation Vector
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(carPos.x, carPos.y);
      ctx.lineTo(fakeX, fakeY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Signal Strength (C/N0) Bar
    this.drawSignalMeter(ctx, width, height, this.state.mode);

    // Update Top-Right HUD
    this.updateHUD(this.state.mode);
  },

  drawJammerDevice(ctx, x, y, mode) {
    ctx.save();
    ctx.translate(x, y);

    const isJamming = mode === 'jamming';
    const color = isJamming ? '#f43f5e' : '#fbbf24';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';

    // Tripod & transmitter box
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(0, 0);
    ctx.lineTo(12, 16);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();

    // Antenna whip
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -38);
    ctx.stroke();

    // Antenna tip spark
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -38, 4, 0, Math.PI * 2);
    ctx.fill();

    // Device label
    ctx.font = '700 10px "Fira Code", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(isJamming ? 'STØYSENDER (JAMMER)' : 'GPS SPOOFER (FALSK SENDER)', 0, 32);
    ctx.fillText(`${this.state.jammerPower}W (Mye sterkere enn GPS!)`, 0, 44);

    ctx.restore();
  },

  drawJammingCone(ctx, jammerPos, carPos, width, height) {
    ctx.save();
    // Radiating High-Power Noise Waves
    const maxRadius = width * 0.65;
    const waveSpacing = 24;

    for (let r = (this.state.jamPhase % waveSpacing); r < maxRadius; r += waveSpacing) {
      const alpha = Math.max(0, 1 - r / maxRadius) * 0.7;
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(jammerPos.x, jammerPos.y - 38, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Jamming Alert Banner in center
    ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    const bannerW = 320;
    const bannerH = 45;
    const bx = width / 2 - bannerW / 2;
    const by = 200;
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeRect(bx, by, bannerW, bannerH);

    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ GPS JAMMING AKTIV // BRED-BÅNDS STØY', width / 2, by + 18);
    ctx.font = '9px "Fira Code", monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('Mottakeren overdøves: Tap av bærebølge- og kodelås!', width / 2, by + 34);

    ctx.restore();
  },

  drawSpoofingBeams(ctx, jammerPos, carPos) {
    ctx.save();
    // Amber Fake Waves
    GPSDraw.drawWavefronts(ctx, { x: jammerPos.x, y: jammerPos.y - 38 }, 400, 24, this.state.jamPhase, '#fbbf24');

    // Beam directly to car
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(jammerPos.x, jammerPos.y - 38);
    ctx.lineTo(carPos.x, carPos.y);
    ctx.stroke();

    GPSDraw.drawTag(ctx, (jammerPos.x + carPos.x) / 2 - 40, (jammerPos.y + carPos.y) / 2 - 20, 'FALSK SATELLITTSIGNAL', 'Forfalsket Tid & Kode', '#fbbf24');
    ctx.restore();
  },

  drawSignalMeter(ctx, width, height, mode) {
    const barW = 220;
    const barH = 70;
    const x = 20;
    const y = height - barH - 20;

    const snr = mode === 'none' ? 46 : (mode === 'jamming' ? 12 : 52); // dB-Hz
    const isOk = mode === 'none';
    const isJam = mode === 'jamming';

    ctx.save();
    ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, barW, barH);
    ctx.strokeRect(x, y, barW, barH);

    ctx.font = '600 10px "Fira Code", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('SIGNALKVALITET (C/N₀)', x + 10, y + 18);

    // Progress Bar
    const meterX = x + 10;
    const meterY = y + 28;
    const meterW = barW - 20;
    const meterH = 14;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(meterX, meterY, meterW, meterH);

    const fillW = (snr / 60) * meterW;
    ctx.fillStyle = isOk ? '#10b981' : (isJam ? '#f43f5e' : '#fbbf24');
    ctx.fillRect(meterX, meterY, fillW, meterH);

    ctx.font = '700 10px "Fira Code", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${snr} dB-Hz ${isJam ? '(Tapt)' : (isOk ? '(Normal)' : '(Spoofed Kraftig)')}`, meterX + 6, meterY + 11);

    ctx.restore();
  },

  updateHUD(mode) {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    const statusText = mode === 'none' ? 'NORMAL DRIFT' : (mode === 'jamming' ? 'JAMMED (INGEN SIGNAL)' : 'SPOOFET (FALSKT)');
    const statusClass = mode === 'none' ? 'highlight-emerald' : (mode === 'jamming' ? 'highlight-rose' : 'highlight-amber');

    hudTR.innerHTML = `
      <div class="hud-badge ${statusClass}">
        <span>STATUS:</span>
        <strong>${statusText}</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>SIGNALSTYRKE:</span>
        <strong>${mode === 'jamming' ? 'Støy > Signal (Lock tapt)' : '-160 dBW (Ekstremt svakt)'}</strong>
      </div>
    `;
  },

  onMouseDown() {},
  onMouseMove() {},
  onMouseUp() {}
};
