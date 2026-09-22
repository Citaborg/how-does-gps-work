/**
 * scene-2d.js
 * 2D Canvas-visualiseringsmotor for GPS:
 * - Trilaterasjon med 1, 2, 3 og 4 satellitter
 * - Feiltrekant og klokkebias
 * - Bilen som stopper der den er med full geometrisk overlay (trekanter, vinkler, avstander)
 * - Doppler-effekt og hastighetsmåling
 * - Bakkekontroll, baneovervåking og relativitet (UiO AST2000)
 * - Flerveisbølger (Multipath), glassbygning og spøkelsesposisjon
 * - Jamming og signaltap
 */

import {
  getCircleCircleIntersections,
  calculateErrorTriangle,
  calculateDopplerShift,
  calculateRelativityEffects,
  calculateMultipathEcho,
  C_LIGHT,
  GPS_L1_FREQ
} from './math-utils.js';

import {
  drawSketchLine,
  drawSketchCircle,
  drawSketchArrow,
  drawDimensionLine,
  drawSketchTriangle,
  drawSketchAngle,
  drawSketchCar,
  drawSketchSatellite,
  drawGlassBuilding,
  drawJammer,
  drawDopplerWaves,
  drawSketchNote,
  drawBlueprintGrid
} from './sketch.js';

export class Scene2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = canvas.width;
    this.height = canvas.height;

    // Satellitter i 2D
    this.satellites = [
      { id: 1, name: 'SAT 1 (Azur)', x: 0, y: 0, color: '#38bdf8', active: true, progress: 1 },
      { id: 2, name: 'SAT 2 (Gull)', x: 0, y: 0, color: '#fbbf24', active: false, progress: 0 },
      { id: 3, name: 'SAT 3 (Rosa)', x: 0, y: 0, color: '#f472b6', active: false, progress: 0 },
      { id: 4, name: 'SAT 4 (Grønn)', x: 0, y: 0, color: '#34d399', active: false, progress: 0 }
    ];

    // Bilens tilstand
    this.car = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 60, // km/t
      angle: 0,
      isStopped: false,
      isDragging: false,
      pathT: 0.35
    };

    // Scenemodus: 'trilateration', 'doppler', 'orbit_relativity', 'multipath', 'jamming'
    this.mode = 'trilateration';

    // Spesifikke parametere
    this.clockBias = 0; // Mikrosekunder / forskyvning
    this.showGeometryOverlay = true;
    this.showErrorTriangle = false;
    this.jammingActive = false;
    this.jammingPower = 1.0;
    this.multipathActive = false;

    // Glassbygning
    this.building = {
      x: 0,
      y: 0,
      w: 90,
      h: 220
    };

    // Bakkestasjon
    this.groundStation = {
      x: 0,
      y: 0,
      radarAngle: -Math.PI / 4
    };

    this.relativityData = calculateRelativityEffects();
    this.animTime = 0;

    this.resize();
    this.initInteraction();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;

    this.updateLayoutPositions();
  }

  updateLayoutPositions() {
    const w = this.width;
    const h = this.height;

    // Plasser satellittene godt spredt i himmelhvelvingen
    this.satellites[0].x = w * 0.16;
    this.satellites[0].y = h * 0.18;

    this.satellites[1].x = w * 0.84;
    this.satellites[1].y = h * 0.20;

    this.satellites[2].x = w * 0.50;
    this.satellites[2].y = h * 0.12;

    this.satellites[3].x = w * 0.32;
    this.satellites[3].y = h * 0.30;

    // Glassbygning plassert i byscenarioet
    this.building.x = w * 0.52;
    this.building.y = h * 0.45;
    this.building.w = Math.min(100, w * 0.12);
    this.building.h = h * 0.32;

    // Bakkestasjon
    this.groundStation.x = w * 0.25;
    this.groundStation.y = h * 0.78;

    // Veibane for bil
    if (!this.car.isDragging) {
      this.updateCarPath(this.car.pathT);
    }
  }

  updateCarPath(t) {
    const w = this.width;
    const h = this.height;

    // Elegant kurvet vei over nedre halvdel av lerretet
    const roadY = h * 0.72;
    const roadAmp = h * 0.08;

    // Posisjon
    const x = (t % 1.0) * (w * 0.7) + w * 0.15;
    const y = roadY + Math.sin(t * Math.PI * 2) * roadAmp;

    // Retningsvektor (tangent)
    const dt = 0.005;
    const nextX = ((t + dt) % 1.0) * (w * 0.7) + w * 0.15;
    const nextY = roadY + Math.sin((t + dt) * Math.PI * 2) * roadAmp;

    const dx = nextX - x;
    const dy = nextY - y;
    const angle = Math.atan2(dy, dx);

    const speedMs = (this.car.speed * 1000) / 3600;
    this.car.vx = Math.cos(angle) * speedMs;
    this.car.vy = Math.sin(angle) * speedMs;

    this.car.x = x;
    this.car.y = y;
    this.car.angle = angle;
  }

  initInteraction() {
    let isDown = false;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const onStart = (e) => {
      const pos = getPos(e);
      const distToCar = Math.hypot(pos.x - this.car.x, pos.y - this.car.y);
      if (distToCar < 40) {
        isDown = true;
        this.car.isDragging = true;
        this.car.isStopped = true;
      }
    };

    const onMove = (e) => {
      if (!isDown) return;
      const pos = getPos(e);
      this.car.x = Math.max(30, Math.min(this.width - 30, pos.x));
      this.car.y = Math.max(100, Math.min(this.height - 40, pos.y));
    };

    const onEnd = () => {
      isDown = false;
      this.car.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  /**
   * Oppdaterer tilstand for hvert bilde (frame)
   */
  update(dt, masterPaused = false) {
    this.animTime += dt;

    // Satellitt-innfading og bevegelse
    this.satellites.forEach((sat) => {
      if (sat.active && sat.progress < 1) {
        sat.progress = Math.min(1, sat.progress + dt * 1.5);
      } else if (!sat.active && sat.progress > 0) {
        sat.progress = Math.max(0, sat.progress - dt * 2.0);
      }
    });

    // Biloppdatering: Kun hvis ikke stoppet eller dratt
    if (!masterPaused && !this.car.isStopped && !this.car.isDragging) {
      const pathSpeed = (this.car.speed / 60) * 0.05 * dt;
      this.car.pathT = (this.car.pathT + pathSpeed) % 1.0;
      this.updateCarPath(this.car.pathT);
    }

    // Bakkestasjonsradar roterer rolig
    this.groundStation.radarAngle = -Math.PI / 4 + Math.sin(this.animTime * 1.2) * 0.35;
  }

  /**
   * Hovedtegnefunksjon for 2D Canvas
   */
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Skissepapir/chalkboard bakgrunn og rutenett
    drawBlueprintGrid(ctx, w, h);

    // 2. Tegn veibane
    this.drawRoad(ctx);

    // 3. Render spesifikk modus
    switch (this.mode) {
      case 'trilateration':
        this.renderTrilateration(ctx);
        break;
      case 'doppler':
        this.renderDoppler(ctx);
        break;
      case 'orbit_relativity':
        this.renderOrbitRelativity(ctx);
        break;
      case 'multipath':
        this.renderMultipath(ctx);
        break;
      case 'jamming':
        this.renderJamming(ctx);
        break;
      default:
        this.renderTrilateration(ctx);
    }

    // 4. Tegn bil og satellitter
    this.drawSatellites(ctx);
    this.drawCar(ctx);
  }

  drawRoad(ctx) {
    const w = this.width;
    const h = this.height;
    const roadY = h * 0.72;
    const roadAmp = h * 0.08;

    ctx.save();
    // Veikant øverst og nederst
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) {
      const t = (x - w * 0.15) / (w * 0.7);
      const y = roadY + Math.sin(t * Math.PI * 2) * roadAmp;
      if (x === 0) ctx.moveTo(x, y - 22);
      else ctx.lineTo(x, y - 22);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) {
      const t = (x - w * 0.15) / (w * 0.7);
      const y = roadY + Math.sin(t * Math.PI * 2) * roadAmp;
      if (x === 0) ctx.moveTo(x, y + 22);
      else ctx.lineTo(x, y + 22);
    }
    ctx.stroke();

    // Senterstriper med skissestil
    ctx.setLineDash([12, 16]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) {
      const t = (x - w * 0.15) / (w * 0.7);
      const y = roadY + Math.sin(t * Math.PI * 2) * roadAmp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawSatellites(ctx) {
    this.satellites.forEach((sat) => {
      if (sat.progress <= 0) return;

      ctx.save();
      ctx.globalAlpha = sat.progress;

      // Tegn satellittfigur med animert innflyvning
      const currentY = sat.y - (1 - sat.progress) * 40;
      drawSketchSatellite(ctx, sat.x, currentY, 0, sat.name, sat.color, 1.0);

      ctx.restore();
    });
  }

  drawCar(ctx) {
    if (this.mode === 'orbit_relativity') return; // Bakkestasjon i fokus
    drawSketchCar(ctx, this.car.x, this.car.y, this.car.angle, '#f8fafc', false);
  }

  /**
   * TEGNER TRILATERASJON (1, 2, 3 og 4 satellitter + feiltrekant)
   */
  renderTrilateration(ctx) {
    const activeSats = this.satellites.filter((s) => s.progress > 0.1);
    if (activeSats.length === 0) return;

    // Regn ut avstander (pseudoradier) fra satellitter til bilen
    const satsWithRadius = activeSats.map((sat) => {
      const trueDist = Math.hypot(this.car.x - sat.x, this.car.y - sat.y);
      // Klokkebias forskyver alle radier like mye: r' = r + c*dt
      const r = (trueDist + this.clockBias) * sat.progress;
      return { ...sat, r, trueDist };
    });

    // 1. Tegn avstandssirkler med egne farger og myk skissestil
    satsWithRadius.forEach((sat) => {
      ctx.save();
      ctx.globalAlpha = sat.progress * 0.85;
      // Farget sirkel med skissert omkrets
      drawSketchCircle(ctx, sat.x, sat.y, sat.r, sat.color, 2.2, null, sat.id * 77);
      ctx.restore();
    });

    // 2. Skjæringspunkter og geometri ved 2 satellitter
    if (satsWithRadius.length >= 2) {
      const s1 = satsWithRadius[0];
      const s2 = satsWithRadius[1];
      const intersections = getCircleCircleIntersections(s1.x, s1.y, s1.r, s2.x, s2.y, s2.r);

      if (intersections) {
        intersections.forEach((pt, idx) => {
          const isActual = Math.hypot(pt.x - this.car.x, pt.y - this.car.y) < 25;
          const ptColor = isActual ? '#38bdf8' : '#ef4444';

          ctx.save();
          // Skissepunkt for skjæring
          drawSketchCircle(ctx, pt.x, pt.y, 7, ptColor, 2.5, isActual ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.3)');

          // Etikett
          ctx.font = 'bold 12px "Courier New", monospace';
          ctx.fillStyle = ptColor;
          ctx.textAlign = 'left';
          const label = isActual ? `P${idx + 1} (Faktisk posisjon)` : `P${idx + 1} (Falsk kandidat)`;
          ctx.fillText(label, pt.x + 12, pt.y + 4);
          ctx.restore();
        });
      }
    }

    // 3. Hvis bilen er stoppet: Vis geometriske trekanter og målestreker til ALLE aktive satellitter
    if (this.showGeometryOverlay && (this.car.isStopped || !this.showErrorTriangle)) {
      satsWithRadius.forEach((sat, idx) => {
        ctx.save();
        ctx.globalAlpha = 0.75;
        // Håndtegnet siktlinje / dimensjon
        drawSketchLine(ctx, sat.x, sat.y, this.car.x, this.car.y, sat.color, 1.8, 80 + idx * 5);

        // Målestokk med avstand
        const distKm = Math.round(sat.trueDist * 50); // Skalert til km for realisme
        const label = `r${sat.id} = ${distKm} km`;
        drawDimensionLine(ctx, sat.x, sat.y, this.car.x, this.car.y, label, sat.color, (idx % 2 === 0 ? 1 : -1) * 16);
        ctx.restore();
      });

      // Vis vinkelbuer ved mottakeren dersom minst to satellitter er aktive
      if (satsWithRadius.length >= 2) {
        const pCar = { x: this.car.x, y: this.car.y };
        const pSat1 = { x: satsWithRadius[0].x, y: satsWithRadius[0].y };
        const pSat2 = { x: satsWithRadius[1].x, y: satsWithRadius[1].y };
        drawSketchAngle(ctx, pCar, pSat1, pSat2, 'α', '#fbbf24', 32);
      }
    }

    // 4. FEILTREKANTEN (når det er klokkefeil med 3 eller 4 satellitter)
    if (this.showErrorTriangle && Math.abs(this.clockBias) > 0.5 && satsWithRadius.length >= 3) {
      const errTriangle = calculateErrorTriangle(satsWithRadius);
      if (errTriangle) {
        const [A, B, C] = errTriangle.points;
        // Tegn feiltrekant med skravert varsel-oransje flate
        drawSketchTriangle(ctx, A, B, C, '#f97316', 'rgba(249, 115, 22, 0.3)', true);

        // Marker senter og infotekst
        ctx.save();
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#fb923c';
        ctx.textAlign = 'center';
        ctx.fillText('FEILTREKANT (Klokkebias Δt)', errTriangle.center.x, errTriangle.center.y - 14);

        const errorMeters = Math.round(Math.abs(this.clockBias) * 300);
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#fed7aa';
        ctx.fillText(`Usikkerhet: ~${errorMeters} meter`, errTriangle.center.x, errTriangle.center.y + 20);
        ctx.restore();
      }
    }
  }

  /**
   * TEGNER HASTIGHET OG DOPPLER-EFFEKT
   */
  renderDoppler(ctx) {
    const sat = this.satellites[0]; // SAT 1 i fokus
    sat.active = true;
    sat.progress = 1;

    const doppler = calculateDopplerShift(
      [this.car.x, this.car.y],
      [this.car.vx, this.car.vy],
      [sat.x, sat.y],
      GPS_L1_FREQ
    );

    // 1. Tegn animerte Doppler-bølger fra satellitt til bil
    drawDopplerWaves(ctx, [sat.x, sat.y], [this.car.x, this.car.y], doppler.vRadial, this.animTime);

    // 2. Bilens hastighetsvektor
    const vScale = 1.2;
    const vEndX = this.car.x + this.car.vx * vScale;
    const vEndY = this.car.y + this.car.vy * vScale;
    drawSketchArrow(ctx, this.car.x, this.car.y, vEndX, vEndY, '#4ade80', `v = ${Math.round(doppler.speedKmh)} km/t`, 2.5);

    // 3. Matematikken tegnet direkte på lerretet med håndskrevet stil
    const noteX = Math.max(20, this.width * 0.05);
    const noteY = Math.max(70, this.height * 0.35);

    const shiftSign = doppler.deltaF >= 0 ? '+' : '';
    const shiftHz = doppler.deltaF.toFixed(1);
    const radialKmH = (doppler.vRadial * 3.6).toFixed(1);

    const lines = [
      'DOPPLER HASTIGHETSBEREGNING:',
      '---------------------------------',
      `Bærebølge (L1) f₀: 1575.42 MHz`,
      `Radialfart (mot sat): ${radialKmH} km/t`,
      `Frekvensskift Δf: ${shiftSign}${shiftHz} Hz`,
      `Mottatt frekvens: ${(doppler.fReceived / 1e6).toFixed(6)} MHz`,
      '',
      'Formel: Δf = f₀ · (v_radial / c)',
      '4 satellitter gir nøyaktig 3D-vektor (vx, vy, vz) momentant!'
    ];

    drawSketchNote(ctx, lines, noteX, noteY, '#e2e8f0', 'rgba(15, 23, 42, 0.92)');
  }

  /**
   * TEGNER BAKKEKONTROLL, RADAR, EFEMERIDER OG RELATIVITET (UiO AST2000)
   */
  renderOrbitRelativity(ctx) {
    const w = this.width;
    const h = this.height;

    // 1. Jordklode-segment nederst
    const earthRadius = w * 0.8;
    const earthCenterY = h + earthRadius - 90;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.arc(w / 2, earthCenterY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Jordoverflate-bue
    drawSketchCircle(ctx, w / 2, earthCenterY, earthRadius, '#38bdf8', 2.5, null, 999);
    ctx.restore();

    // 2. Satellittbane i 20 200 km høyde (skisset bue over jorden)
    const orbitRadius = earthRadius + h * 0.45;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(w / 2, earthCenterY, orbitRadius, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    ctx.restore();

    // Satellitt i bane
    const satAngle = -Math.PI * 0.5 + Math.sin(this.animTime * 0.4) * 0.35;
    const satX = w / 2 + Math.cos(satAngle) * orbitRadius;
    const satY = earthCenterY + Math.sin(satAngle) * orbitRadius;
    drawSketchSatellite(ctx, satX, satY, satAngle + Math.PI / 2, 'GPS SAT (20 200 km)', '#38bdf8', 1.1);

    // 3. Bakkestasjon (Kontrollsegment) med radar
    const stationX = w * 0.35;
    const stationY = earthCenterY - Math.sqrt(earthRadius * earthRadius - Math.pow(stationX - w / 2, 2));

    // Tegn radarantenne på bakken
    ctx.save();
    ctx.translate(stationX, stationY);
    // Sokkel
    drawSketchLine(ctx, -15, 0, 15, 0, '#94a3b8', 2, 1101);
    drawSketchLine(ctx, 0, 0, 0, -18, '#94a3b8', 2.5, 1102);
    // Parabol
    ctx.rotate(this.groundStation.radarAngle);
    ctx.beginPath();
    ctx.arc(0, -18, 16, Math.PI * 0.2, Math.PI * 0.8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Radarlasersignal / Uplink til satellitt
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(stationX, stationY - 18);
    ctx.lineTo(satX, satY);
    ctx.stroke();

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('RADAROVERVÅKING & EFEMERIDE-UPLINK', (stationX + satX) / 2 - 20, (stationY + satY) / 2);
    ctx.restore();

    // 4. EINSTEIN & RELATIVITETSTEORIEN (UiO AST2000 Pensum)
    const rel = this.relativityData;
    const relNoteX = Math.max(20, w * 0.58);
    const relNoteY = Math.max(50, h * 0.22);

    const relLines = [
      'RELATIVITETSTEORI (UiO AST2000):',
      '==================================',
      `Banehastighet v: ~${Math.round(rel.vSat)} m/s`,
      `Banehøyde h: 20 200 km`,
      '',
      '1. Spesiell relativitet (fart):',
      `   Klokken går TREGERE: ${rel.dtSR_microsecPerDay.toFixed(2)} μs/dag`,
      '2. Generell relativitet (gravitasjon):',
      `   Svakere gravitasjon -> RASKERE: +${rel.dtGR_microsecPerDay.toFixed(2)} μs/dag`,
      '----------------------------------',
      `NETTO TIDSAVVIK: +${rel.netDt_microsecPerDay.toFixed(2)} μs/dag!`,
      `Uten korreksjon: FEIL PÅ ${rel.posErrorKmPerDay.toFixed(2)} KM PER DAG!`,
      '',
      'Fabrikkløsning:',
      `Atomuret stilles til ${(rel.factoryPreAdjustedFreq / 1e6).toFixed(8)} MHz`,
      'slik at det tikker nøyaktig 10.23 MHz i bane!'
    ];

    drawSketchNote(ctx, relLines, relNoteX, relNoteY, '#f8fafc', 'rgba(15, 23, 42, 0.94)');
  }

  /**
   * TEGNER FLERVEISBØLGER (MULTIPATH), GLASSFASADE OG SPØKELSESPOSISJON
   */
  renderMultipath(ctx) {
    const sat = this.satellites[1]; // SAT 2 i vinkel
    sat.active = true;
    sat.progress = 1;

    const b = this.building;
    drawGlassBuilding(ctx, b.x, b.y, b.w, b.h, true);

    const multipath = calculateMultipathEcho(
      [this.car.x, this.car.y],
      [sat.x, sat.y],
      b.x,
      [b.y, b.y + b.h]
    );

    // 1. Direkte siktlinje (blokkert av bygget eller svak)
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sat.x, sat.y);
    ctx.lineTo(this.car.x, this.car.y);
    ctx.stroke();

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#f87171';
    ctx.fillText('BLOKKERT DIREKTELINJE', (sat.x + this.car.x) / 2 - 30, (sat.y + this.car.y) / 2 - 15);
    ctx.restore();

    // 2. Reflektert signal (Multipath)
    if (multipath && multipath.hitsWall) {
      const rp = multipath.reflectPoint;

      // Stråle fra satellitt til glassvegg
      drawSketchLine(ctx, sat.x, sat.y, rp.x, rp.y, '#e879f9', 2.5, 1201);
      // Stråle fra glassvegg til bil
      drawSketchLine(ctx, rp.x, rp.y, this.car.x, this.car.y, '#e879f9', 2.5, 1202);

      // Refleksjonspunkt-glød
      drawSketchCircle(ctx, rp.x, rp.y, 6, '#f472b6', 2, 'rgba(244, 114, 182, 0.5)', 1205);

      // 3. Spøkelsesposisjon (falsk posisjon pga ekstra forsinkelse)
      const ghost = multipath.ghostPos;
      drawSketchCar(ctx, ghost.x, ghost.y, this.car.angle, '#c084fc', true);

      // Stiplet linje mellom reell bil og spøkelse
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.car.x, this.car.y);
      ctx.lineTo(ghost.x, ghost.y);
      ctx.stroke();
      ctx.restore();

      // Info-boks
      const lines = [
        'FLERVEISFEIL (MULTIPATH & EKKO):',
        '----------------------------------',
        'Signalet spretter på glassfasaden!',
        `Ekstra distanse: +${Math.round(multipath.extraDistance * 1.5)} meter`,
        'Bilen tror satellitten er lenger unna,',
        'og hopper til en SPØKELSE-posisjon!'
      ];
      drawSketchNote(ctx, lines, Math.max(20, this.width * 0.05), Math.max(50, this.height * 0.25), '#e879f9');
    }
  }

  /**
   * TEGNER JAMMING OG SIGNALSTYRKE
   */
  renderJamming(ctx) {
    const jammerX = this.width * 0.45;
    const jammerY = this.height * 0.72;

    drawJammer(ctx, jammerX, jammerY, this.jammingActive, this.jammingPower);

    // Satellittsignal (ekstremt svakt)
    this.satellites.forEach((sat) => {
      if (!sat.active) return;
      ctx.save();
      if (this.jammingActive) {
        // Svakt, forstyrret signal
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([2, 8]);
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.setLineDash([6, 6]);
      }
      ctx.beginPath();
      ctx.moveTo(sat.x, sat.y);
      ctx.lineTo(this.car.x, this.car.y);
      ctx.stroke();
      ctx.restore();
    });

    // Varselboks for mottakerstatus på bil
    const alertX = Math.max(20, this.width * 0.05);
    const alertY = Math.max(60, this.height * 0.28);

    if (this.jammingActive) {
      const lines = [
        '⚠️ GPS JAMMING DETEKTERT!',
        '==================================',
        'Satellittsignal på bakken: -160 dBW',
        '(Under 10⁻¹⁶ Watt - ekstremt svakt!)',
        'Jammer på 1 Watt overdøver satellitten',
        'med over 50 dB støy!',
        '----------------------------------',
        'STATUS: SIGNAL TAPT (Carrier Lock Lost)',
        'Bilen har INGEN posisjon eller fart!'
      ];
      drawSketchNote(ctx, lines, alertX, alertY, '#ef4444', 'rgba(30, 10, 10, 0.94)');
    } else {
      const lines = [
        'SIGNALFORHOLD: NORMAL DRIFT',
        '----------------------------------',
        'Signalstyrke (C/N₀): 42 dB-Hz (Sterk)',
        'Mottakeren lytter passivt.',
        'Jammer er DEAKTIVERT.'
      ];
      drawSketchNote(ctx, lines, alertX, alertY, '#34d399', 'rgba(10, 30, 20, 0.92)');
    }
  }
}
