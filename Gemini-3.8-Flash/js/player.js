/**
 * player.js
 * Tidslinje-, video- og avspillingskontroller for GPS-opplevelsen
 * Håndterer sømløs overgang mellom kapitler, 2D/3D-bytte, skrubbing og fortellertekst.
 */

import { CHAPTERS } from './narrative.js';

export class Player {
  constructor(scene2D, scene3D, uiElements) {
    this.scene2D = scene2D;
    this.scene3D = scene3D;
    this.ui = uiElements;

    this.chapters = CHAPTERS;
    this.currentChapterIndex = 0;

    // Tidslinje (i sekunder)
    this.totalDuration = this.chapters.reduce((sum, ch) => sum + ch.duration, 0);
    this.currentTime = 0;
    this.isPlaying = true;
    this.playbackRate = 1.0;

    // Interaktiv overstyring (hvis brukeren vil utforske manuelt)
    this.isInteractiveMode = false;

    this.lastTimestamp = performance.now();

    this.initUI();
    this.loadChapter(0, false);
  }

  initUI() {
    // 1. Play / Pause knapp
    if (this.ui.playBtn) {
      this.ui.playBtn.addEventListener('click', () => this.togglePlay());
    }

    // 2. Timeline scrubber
    if (this.ui.timelineScrubber) {
      this.ui.timelineScrubber.max = this.totalDuration;
      this.ui.timelineScrubber.value = 0;

      this.ui.timelineScrubber.addEventListener('input', (e) => {
        this.seekTo(parseFloat(e.target.value));
      });
    }

    // 3. Forrige / Neste kapittelknapper
    if (this.ui.prevBtn) {
      this.ui.prevBtn.addEventListener('click', () => this.previousChapter());
    }
    if (this.ui.nextBtn) {
      this.ui.nextBtn.addEventListener('click', () => this.nextChapter());
    }

    // 4. Hastighetsvelger (0.5x, 1x, 1.5x, 2x)
    if (this.ui.speedBtn) {
      const speeds = [0.5, 1.0, 1.5, 2.0];
      let speedIdx = 1;
      this.ui.speedBtn.addEventListener('click', () => {
        speedIdx = (speedIdx + 1) % speeds.length;
        this.playbackRate = speeds[speedIdx];
        this.ui.speedBtn.textContent = `${this.playbackRate}x`;
      });
    }

    // 5. Tastatursnarveier (Mellomrom = Play/Pause, Piler = spol)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.seekTo(Math.min(this.totalDuration, this.currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.seekTo(Math.max(0, this.currentTime - 5));
      }
    });

    // 6. Bygg kapittelmarkører på tidslinjen
    this.buildChapterTicks();
  }

  buildChapterTicks() {
    if (!this.ui.chapterTicksContainer) return;
    this.ui.chapterTicksContainer.innerHTML = '';

    let accumulatedTime = 0;
    this.chapters.forEach((ch, idx) => {
      const percent = (accumulatedTime / this.totalDuration) * 100;

      const tick = document.createElement('div');
      tick.className = 'chapter-tick';
      tick.style.left = `${percent}%`;
      tick.title = `${idx + 1}. ${ch.title}`;
      tick.addEventListener('click', (e) => {
        e.stopPropagation();
        this.jumpToChapter(idx);
      });

      this.ui.chapterTicksContainer.appendChild(tick);
      accumulatedTime += ch.duration;
    });
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.updatePlayButton();
  }

  updatePlayButton() {
    if (!this.ui.playBtn) return;
    if (this.isPlaying) {
      this.ui.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
        </svg>
      `;
      this.ui.playBtn.title = 'Pause (Mellomrom)';
    } else {
      this.ui.playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <polygon points="6,4 20,12 6,20"></polygon>
        </svg>
      `;
      this.ui.playBtn.title = 'Spill av (Mellomrom)';
    }
  }

  jumpToChapter(index) {
    if (index < 0 || index >= this.chapters.length) return;
    let targetTime = 0;
    for (let i = 0; i < index; i++) {
      targetTime += this.chapters[i].duration;
    }
    this.seekTo(targetTime + 0.1);
  }

  nextChapter() {
    if (this.currentChapterIndex < this.chapters.length - 1) {
      this.jumpToChapter(this.currentChapterIndex + 1);
    }
  }

  previousChapter() {
    if (this.currentChapterIndex > 0) {
      this.jumpToChapter(this.currentChapterIndex - 1);
    } else {
      this.seekTo(0);
    }
  }

  seekTo(seconds) {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, seconds));
    this.evaluateTimeline(true);
  }

  /**
   * Beregner hvilket kapittel og hvilken tilstand vi er i basert på currentTime
   */
  evaluateTimeline(forceUpdate = false) {
    let acc = 0;
    let foundIndex = 0;
    let localTime = 0;

    for (let i = 0; i < this.chapters.length; i++) {
      const ch = this.chapters[i];
      if (this.currentTime >= acc && this.currentTime < acc + ch.duration) {
        foundIndex = i;
        localTime = this.currentTime - acc;
        break;
      }
      acc += ch.duration;
    }

    if (this.currentTime >= this.totalDuration) {
      foundIndex = this.chapters.length - 1;
      localTime = this.chapters[foundIndex].duration;
    }

    // Hvis vi har skiftet kapittel eller forceUpdate er sann
    if (foundIndex !== this.currentChapterIndex || forceUpdate) {
      this.loadChapter(foundIndex, true);
    }

    // Oppdater kapitteldynamikk
    this.updateChapterDynamics(this.currentChapterIndex, localTime);

    // Oppdater UI
    this.updateUIProgress();
  }

  loadChapter(index, animateTransition = true) {
    this.currentChapterIndex = index;
    const ch = this.chapters[index];

    // 1. Bytte mellom 2D og 3D lerret
    if (ch.mode === '3D') {
      if (this.ui.container2D) this.ui.container2D.style.display = 'none';
      if (this.ui.container3D) {
        this.ui.container3D.style.display = 'block';
        this.scene3D.resize();
      }
    } else {
      if (this.ui.container3D) this.ui.container3D.style.display = 'none';
      if (this.ui.container2D) this.ui.container2D.style.display = 'block';
      this.scene2D.resize();
      this.scene2D.mode = ch.sceneMode || 'trilateration';
    }

    // 2. Oppdater fortellertekst på høyre side med myk innfading
    if (this.ui.narrativeBody) {
      const container = this.ui.narrativeBody;
      if (animateTransition) {
        container.style.opacity = '0';
        container.style.transform = 'translateX(20px)';
        setTimeout(() => {
          container.innerHTML = ch.text;
          this.renderKaTeX(container);
          container.style.opacity = '1';
          container.style.transform = 'translateX(0)';
        }, 220);
      } else {
        container.innerHTML = ch.text;
        this.renderKaTeX(container);
      }
    }

    // 3. Oppdater kapitteltittel
    if (this.ui.chapterTitle) {
      this.ui.chapterTitle.textContent = ch.title;
    }
    if (this.ui.chapterSubtitle) {
      this.ui.chapterSubtitle.textContent = ch.subtitle;
    }
  }

  /**
   * Tidsstyrt finjustering av animasjonene i hvert kapittel
   */
  updateChapterDynamics(chapterIndex, localTime) {
    const ch = this.chapters[chapterIndex];

    if (ch.id === 1) {
      // Kapittel 1: Kun Sat 1
      this.scene2D.satellites[0].active = true;
      this.scene2D.satellites[1].active = false;
      this.scene2D.satellites[2].active = false;
      this.scene2D.satellites[3].active = false;
      this.scene2D.showGeometryOverlay = true;
      this.scene2D.showErrorTriangle = false;
      this.scene2D.clockBias = 0;
      this.scene2D.car.isStopped = false;
    } else if (ch.id === 2) {
      // Kapittel 2: Trilaterasjon 2D steg-for-steg
      // 0 - 8s: Sat 1 & bil kjører
      // 8 - 18s: Sat 2 ankommer, bil stopper der den er, geometri tegnes opp
      // 18 - 26s: Sat 3 ankommer, eliminerer falskt punkt
      // 26 - 32s: Klokkefeil starter -> feiltrekant dannes
      // 32 - 38s: Sat 4 ankommer, løser for klokkefeil -> trekant krymper!
      if (localTime < 8) {
        this.scene2D.satellites[0].active = true;
        this.scene2D.satellites[1].active = false;
        this.scene2D.satellites[2].active = false;
        this.scene2D.satellites[3].active = false;
        this.scene2D.car.isStopped = false;
        this.scene2D.showErrorTriangle = false;
        this.scene2D.clockBias = 0;
      } else if (localTime < 18) {
        this.scene2D.satellites[0].active = true;
        this.scene2D.satellites[1].active = true;
        this.scene2D.satellites[2].active = false;
        this.scene2D.satellites[3].active = false;
        this.scene2D.car.isStopped = true; // Stopper der den er uten hopp
        this.scene2D.showGeometryOverlay = true;
        this.scene2D.showErrorTriangle = false;
        this.scene2D.clockBias = 0;
      } else if (localTime < 26) {
        this.scene2D.satellites[0].active = true;
        this.scene2D.satellites[1].active = true;
        this.scene2D.satellites[2].active = true;
        this.scene2D.satellites[3].active = false;
        this.scene2D.car.isStopped = true;
        this.scene2D.showGeometryOverlay = true;
        this.scene2D.showErrorTriangle = false;
        this.scene2D.clockBias = 0;
      } else if (localTime < 32) {
        // Klokkefeil bygges opp: feiltrekant
        this.scene2D.satellites[0].active = true;
        this.scene2D.satellites[1].active = true;
        this.scene2D.satellites[2].active = true;
        this.scene2D.satellites[3].active = false;
        this.scene2D.showErrorTriangle = true;

        const biasProgress = (localTime - 26) / 6;
        this.scene2D.clockBias = Math.sin(biasProgress * Math.PI * 0.5) * 22;
      } else {
        // Satellitt 4 ankommer og eliminerer klokkefeilen
        this.scene2D.satellites[0].active = true;
        this.scene2D.satellites[1].active = true;
        this.scene2D.satellites[2].active = true;
        this.scene2D.satellites[3].active = true;
        this.scene2D.showErrorTriangle = true;

        const fixProgress = Math.min(1, (localTime - 32) / 4);
        this.scene2D.clockBias = 22 * (1 - fixProgress);
      }
    } else if (ch.id === 3) {
      // Kapittel 3: 3D Trilaterasjon
      if (localTime < 7) {
        this.scene3D.setSatelliteCount(1);
      } else if (localTime < 16) {
        this.scene3D.setSatelliteCount(2); // Skjæringsring
      } else if (localTime < 25) {
        this.scene3D.setSatelliteCount(3); // To punkter
      } else {
        this.scene3D.setSatelliteCount(4); // Låst punkt
      }
    } else if (ch.id === 4) {
      // Kapittel 4: Doppler
      this.scene2D.car.isStopped = false;
      this.scene2D.car.speed = 75;
    } else if (ch.id === 5) {
      // Kapittel 5: Bakkekontroll & Relativitet
      this.scene2D.car.isStopped = true;
    } else if (ch.id === 6) {
      // Kapittel 6: Multipath / Ekko
      this.scene2D.car.isStopped = false;
    } else if (ch.id === 7) {
      // Kapittel 7: Jamming
      this.scene2D.car.isStopped = false;
      if (localTime > 10) {
        this.scene2D.jammingActive = true;
        this.scene2D.jammingPower = Math.min(1, (localTime - 10) / 4);
      } else {
        this.scene2D.jammingActive = false;
      }
    }
  }

  updateUIProgress() {
    if (this.ui.timelineScrubber) {
      this.ui.timelineScrubber.value = this.currentTime;
    }

    if (this.ui.timeDisplay) {
      const curM = Math.floor(this.currentTime / 60);
      const curS = Math.floor(this.currentTime % 60);
      const totM = Math.floor(this.totalDuration / 60);
      const totS = Math.floor(this.totalDuration % 60);

      const fmt = (m, s) => `${m}:${s < 10 ? '0' : ''}${s}`;
      this.ui.timeDisplay.textContent = `${fmt(curM, curS)} / ${fmt(totM, totS)}`;
    }
  }

  renderKaTeX(container) {
    if (typeof renderMathInElement !== 'undefined') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX rendering notice:', err);
      }
    }
  }

  /**
   * Hovedløkke som kalles på hver requestAnimationFrame
   */
  tick(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    if (this.isPlaying) {
      this.currentTime += dt * this.playbackRate;
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = this.totalDuration;
        this.isPlaying = false;
        this.updatePlayButton();
      }
      this.evaluateTimeline(false);
    }

    // Oppdater 2D scene
    if (this.ui.container2D && this.ui.container2D.style.display !== 'none') {
      this.scene2D.update(dt * this.playbackRate, !this.isPlaying);
      this.scene2D.render();
    }

    // Oppdater 3D scene
    if (this.ui.container3D && this.ui.container3D.style.display !== 'none') {
      this.scene3D.update(dt * this.playbackRate);
      this.scene3D.render();
    }
  }
}
