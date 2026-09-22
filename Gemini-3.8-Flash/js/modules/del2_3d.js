/**
 * Del 2: 3D Sfærer & 4. Satellitt for Tidskorreksjon
 * Viser hvordan GPS utvides fra 2D til 3D kuler (sfærer) i rommet,
 * og hvorfor vi trenger 4 satellitter for å finne (x, y, z) + klokkeavvik dt.
 */

window.ModuleDel2 = {
  id: 'del2',
  tag: 'DEL 02 // 3D GEOMETRI & 4 SATELLITTER',
  title: '3D-Prinsippet: Sfærer & 4. Satellitt for Tid',

  // State
  state: {
    step: 4, // 1: 1 sfære, 2: 2 sfærer (sirkel), 3: 3 sfærer (2 punkter), 4: 4 sfærer (x,y,z,t)
    satCount: 4,
    rotX: 0.35,
    rotY: -0.65,
    autoRotate: true,
    isDragging3D: false,
    lastMouseX: 0,
    lastMouseY: 0,
    showSpheres: true,
    showEarth: true,
    pulsePhase: 0,
    userPos3D: { x: 0, y: 70, z: 50 } // On Earth surface
  },

  // 4 Satellites in 3D orbit space (normalized orbit radius ~180px)
  satellites3D: [
    { id: 1, pos: { x: -160, y: 150, z: 80 }, color: '#00f0ff', name: 'SV 01' },
    { id: 2, pos: { x: 170, y: 140, z: 90 }, color: '#38bdf8', name: 'SV 02' },
    { id: 3, pos: { x: 0, y: 190, z: -140 }, color: '#a855f7', name: 'SV 03' },
    { id: 4, pos: { x: 80, y: 80, z: 180 }, color: '#fbbf24', name: 'SV 04' }
  ],

  init(container) {
    this.container = container;
  },

  getNarrative() {
    return [
      {
        step: 1,
        title: '1. Én 3D-Sfære: Kuleflate i rommet',
        desc: 'I tre dimensjoner gir avstanden $d_1 = c \\cdot \\Delta t_1$ en kuleflate (sfære). Mottakeren kan være hvor som helst på overflaten av denne sfæren.'
      },
      {
        step: 2,
        title: '2. To Sfærer: Skjæring i en 2D-sirkel',
        desc: 'Når to kuler skjærer hverandre i rommet, danner kontaktflaten en perfekt sirkel. Posisjonen er nå begrenset til denne ringen.'
      },
      {
        step: 3,
        title: '3. Tre Sfærer: Nøyaktig to punkter',
        desc: 'En tredje sfære skjærer sirkelen i nøyaktig to punkter. Det ene punktet er på jordoverflaten, det andre ute i rommet. Men hva om mottakerklokken går feil?'
      },
      {
        step: 4,
        title: '4. Den 4. Satellitten: Fikser Kvartsklokken (x, y, z, t)',
        desc: 'Fordi mottakeren i telefonen/bilen har en billig klokke, har vi 4 ukjente: $x, y, z$ og tidsfeilen $\\delta t$. Den 4. satellitten tvinger alle 4 sfærene til å møtes i ett unikt felles punkt!'
      }
    ];
  },

  getMath() {
    return `
      <div class="math-formula-box">
        <span class="formula-main">(x - x_i)^2 + (y - y_i)^2 + (z - z_i)^2 = (ρ_i - c·δt)^2</span>
        <span class="formula-sub">GPS Grunnligning for satellitt i = 1, 2, 3, 4</span>
      </div>

      <ul class="math-point-list">
        <li><span class="highlight-text">4 Ligninger, 4 Ukjente:</span> Vi løser for $(x, y, z)$ i rommet samt mottakerens tidsavvik $\\delta t$.</li>
        <li><span class="highlight-text">Gratis Atomklokke:</span> GPS-mottakeren i en bil koster bare noen få kroner, men ved hjelp av matematisk trilaterasjon oppnår den nøyaktigheten til atomklokker verdt hundretusener!</li>
        <li><span class="highlight-text">Jorden som sfære:</span> Jordas overflate kan teoretisk fungere som en 'sfære', men fjerner ikke klokkefeil. 4 satellitter er nødvendig for robust 3D-posisjon.</li>
      </ul>
    `;
  },

  getControlsHTML() {
    return `
      <div class="control-group-title">3D Visningsmodus & Steg</div>
      <div class="toggle-group" style="margin-bottom: 0.8rem;">
        <button class="btn-toggle ${this.state.step === 1 ? 'active' : ''}" onclick="ModuleDel2.setStep(1)">1: Én Sfære</button>
        <button class="btn-toggle ${this.state.step === 2 ? 'active' : ''}" onclick="ModuleDel2.setStep(2)">2: To Sfærer (Sirkel)</button>
        <button class="btn-toggle ${this.state.step === 3 ? 'active' : ''}" onclick="ModuleDel2.setStep(3)">3: Tre Sfærer (2 Pkt)</button>
        <button class="btn-toggle ${this.state.step === 4 ? 'active' : ''}" onclick="ModuleDel2.setStep(4)">4: Fire Sfærer (Full 3D+Tid)</button>
      </div>

      <div class="control-grid">
        <div class="control-item">
          <label class="control-label">
            <span>3D Kamerarotasjon</span>
            <span class="control-val">${this.state.autoRotate ? 'Auto-rotasjon PÅ' : 'Dra for å rotere'}</span>
          </label>
          <div class="toggle-group">
            <button class="btn-toggle ${this.state.autoRotate ? 'active' : ''}" id="btnAutoRot" onclick="ModuleDel2.toggleAutoRotate()">🔄 Auto-rotasjon</button>
            <button class="btn-toggle ${this.state.showSpheres ? 'active' : ''}" id="btnSpheres" onclick="ModuleDel2.toggleSpheres()">🌐 Vis Sfærer</button>
            <button class="btn-toggle" onclick="ModuleDel2.resetView()">🎯 Nullstill Vinkel</button>
          </div>
        </div>

        <div class="control-item">
          <label class="control-label">
            <span>Ligningssystem Status</span>
            <span class="control-val" id="valEqStatus">${this.state.satCount >= 4 ? '4/4 Ukjente løst (x, y, z, t)' : `${this.state.satCount}/4 Satellitter`}</span>
          </label>
          <div class="hud-badge ${this.state.satCount >= 4 ? 'highlight-emerald' : 'highlight-amber'}" style="margin-top: 4px;">
            ${this.state.satCount >= 4 ? '✓ Full 3D Koordinat + Atomtid Synkronisert' : '⚠️ For få sfærer for entydig 3D-posisjon'}
          </div>
        </div>
      </div>
    `;
  },

  setStep(step) {
    this.state.step = step;
    this.state.satCount = step;
    if (window.App) {
      window.App.updateControls();
      window.App.updateNarrativeActiveStep(step);
    }
  },

  toggleAutoRotate() {
    this.state.autoRotate = !this.state.autoRotate;
    const btn = document.getElementById('btnAutoRot');
    if (btn) btn.classList.toggle('active', this.state.autoRotate);
  },

  toggleSpheres() {
    this.state.showSpheres = !this.state.showSpheres;
    const btn = document.getElementById('btnSpheres');
    if (btn) btn.classList.toggle('active', this.state.showSpheres);
  },

  resetView() {
    this.state.rotX = 0.35;
    this.state.rotY = -0.65;
  },

  update(dt) {
    this.state.pulsePhase += dt * 30;
    if (this.state.autoRotate && !this.state.isDragging3D) {
      this.state.rotY += dt * 0.25;
    }
  },

  render(ctx, width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;

    GPSDraw.drawGrid(ctx, width, height, 40);

    const rotX = this.state.rotX;
    const rotY = this.state.rotY;

    // Draw Earth Wireframe in center
    this.drawEarth3D(ctx, width, height, rotX, rotY);

    // Project satellites & user receiver
    const projectedSats = this.satellites3D.slice(0, this.state.satCount).map((sat) => {
      const rotPos = GPSMath.rotate3D(sat.pos, rotX, rotY, 0);
      const proj = GPSMath.project3D(rotPos, width, height, 1.1, 450);
      const distToUser = Math.hypot(
        sat.pos.x - this.state.userPos3D.x,
        sat.pos.y - this.state.userPos3D.y,
        sat.pos.z - this.state.userPos3D.z
      );
      return {
        ...sat,
        rotPos,
        proj,
        distToUser
      };
    });

    // Project Receiver / Car position on Earth
    const rotUser = GPSMath.rotate3D(this.state.userPos3D, rotX, rotY, 0);
    const projUser = GPSMath.project3D(rotUser, width, height, 1.1, 450);

    // Draw Spheres / Range Bubbles from Satellites
    if (this.state.showSpheres) {
      projectedSats.forEach((sat) => {
        if (!sat.proj.visible) return;
        this.drawSphereWireframe(ctx, sat.proj, sat.distToUser * sat.proj.scale, sat.color);
      });
    }

    // Draw Laser / Line-of-sight Beams to Car
    projectedSats.forEach((sat) => {
      if (sat.proj.visible && projUser.visible) {
        ctx.save();
        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sat.proj.x, sat.proj.y);
        ctx.lineTo(projUser.x, projUser.y);
        ctx.stroke();

        // Emitted pulse packet traveling down beam
        const pulseT = ((this.state.pulsePhase * 0.05 + sat.id * 0.25) % 1.0);
        const px = GPSMath.lerp(sat.proj.x, projUser.x, pulseT);
        const py = GPSMath.lerp(sat.proj.y, projUser.y, pulseT);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw 3D Satellites
    projectedSats.forEach((sat) => {
      if (sat.proj.visible) {
        GPSDraw.drawSatellite(ctx, sat.proj.x, sat.proj.y, sat.id, 0, sat.color, sat.proj.scale * 0.85, true);
      }
    });

    // Draw Target Car / Receiver Point
    if (projUser.visible) {
      const isLocked = (this.state.satCount >= 4);
      GPSDraw.drawTargetPoint(ctx, projUser.x, projUser.y, isLocked ? 'GPS Fiks: (x, y, z, t)' : 'Bilen / Mottaker', isLocked ? '#10b981' : '#fbbf24', 6);
    }

    // Update HUD
    this.updateHUD(this.state.satCount);
  },

  drawEarth3D(ctx, width, height, rotX, rotY) {
    const earthRadius = 85;
    const center = { x: 0, y: 0, z: 0 };
    const rotCenter = GPSMath.rotate3D(center, rotX, rotY, 0);
    const projCenter = GPSMath.project3D(rotCenter, width, height, 1.1, 450);

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;

    // Earth Sphere Outline
    ctx.beginPath();
    ctx.arc(projCenter.x, projCenter.y, earthRadius * projCenter.scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 20, 40, 0.7)';
    ctx.fill();
    ctx.stroke();

    // Latitude rings
    const latSteps = [-50, -25, 0, 25, 50];
    latSteps.forEach((lat) => {
      const r = earthRadius * Math.cos((lat * Math.PI) / 180);
      const y = earthRadius * Math.sin((lat * Math.PI) / 180);

      ctx.beginPath();
      for (let lon = 0; lon <= 360; lon += 15) {
        const rad = (lon * Math.PI) / 180;
        const pt = { x: r * Math.cos(rad), y: y, z: r * Math.sin(rad) };
        const rotPt = GPSMath.rotate3D(pt, rotX, rotY, 0);
        const proj = GPSMath.project3D(rotPt, width, height, 1.1, 450);
        if (lon === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.strokeStyle = lat === 0 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(56, 189, 248, 0.15)';
      ctx.stroke();
    });

    // Earth Center Label
    ctx.font = '600 10px "Fira Code", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('JORDEN (R ≈ 6371 km)', projCenter.x, projCenter.y + 4);

    ctx.restore();
  },

  drawSphereWireframe(ctx, projCenter, radius, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Outer circle
    ctx.beginPath();
    ctx.arc(projCenter.x, projCenter.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Horizontal & vertical wireframe ellipses for 3D depth
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.ellipse(projCenter.x, projCenter.y, radius, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(projCenter.x, projCenter.y, radius * 0.35, radius, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  updateHUD(satCount) {
    const hudTR = document.getElementById('hudTopRight');
    if (!hudTR) return;

    hudTR.innerHTML = `
      <div class="hud-badge ${satCount >= 4 ? 'highlight-emerald' : 'highlight-amber'}">
        <span>DIMENSJONER LØST:</span>
        <strong>${satCount >= 4 ? '4/4: (X, Y, Z, t)' : `${satCount}/4 (Ufullstendig)`}</strong>
      </div>
      <div class="hud-badge highlight-cyan">
        <span>SATELLITT-SFÆRER:</span>
        <strong>${satCount} Aktive</strong>
      </div>
    `;
  },

  onMouseDown(e, canvas) {
    this.state.isDragging3D = true;
    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;
  },

  onMouseMove(e) {
    if (!this.state.isDragging3D) return;
    const dx = e.clientX - this.state.lastMouseX;
    const dy = e.clientY - this.state.lastMouseY;
    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;

    this.state.rotY += dx * 0.008;
    this.state.rotX += dy * 0.008;
    this.state.rotX = GPSMath.clamp(this.state.rotX, -Math.PI * 0.45, Math.PI * 0.45);
  },

  onMouseUp() {
    this.state.isDragging3D = false;
  }
};
