/**
 * app.js
 * Inngangspunkt for applikasjonen
 * Binder sammen 2D-scene, 3D-scene, spiller, brukergrensesnitt og interaktive kontroller.
 */

import { Scene2D } from './scene-2d.js';
import { Scene3D } from './scene-3d.js';
import { Player } from './player.js';

window.addEventListener('DOMContentLoaded', () => {
  // DOM-elementer
  const canvas2D = document.getElementById('canvas2d');
  const container2D = document.getElementById('view-2d');
  const container3D = document.getElementById('view-3d');

  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const speedBtn = document.getElementById('speed-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  const timelineScrubber = document.getElementById('timeline-scrubber');
  const timeDisplay = document.getElementById('time-display');
  const chapterTicksContainer = document.getElementById('chapter-ticks');

  const narrativeBody = document.getElementById('narrative-body');
  const chapterTitle = document.getElementById('chapter-title');
  const chapterSubtitle = document.getElementById('chapter-subtitle');
  const toggleNarrativeBtn = document.getElementById('toggle-narrative-btn');
  const narrativePanel = document.getElementById('narrative-panel');

  // Interaktive kontroller i sandkasse-modus
  const modeFilmBtn = document.getElementById('mode-film');
  const modeInteractiveBtn = document.getElementById('mode-interactive');
  const interactiveToolbar = document.getElementById('interactive-toolbar');

  const satCountSlider = document.getElementById('sat-count-slider');
  const satCountValue = document.getElementById('sat-count-val');
  const clockBiasSlider = document.getElementById('clock-bias-slider');
  const clockBiasValue = document.getElementById('clock-bias-val');
  const carSpeedSlider = document.getElementById('car-speed-slider');
  const carSpeedValue = document.getElementById('car-speed-val');
  const jammerToggle = document.getElementById('jammer-toggle');

  // 1. Initialiser 2D Scene
  const scene2D = new Scene2D(canvas2D);

  // 2. Initialiser 3D Scene
  const scene3D = new Scene3D(container3D);

  // 3. Initialiser Master Spiller
  const uiElements = {
    canvas2D,
    container2D,
    container3D,
    playBtn,
    prevBtn,
    nextBtn,
    speedBtn,
    timelineScrubber,
    timeDisplay,
    chapterTicksContainer,
    narrativeBody,
    chapterTitle,
    chapterSubtitle
  };

  const player = new Player(scene2D, scene3D, uiElements);

  // Fullscreen håndtering
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Skjul / vis fortellerpanel
  if (toggleNarrativeBtn && narrativePanel) {
    toggleNarrativeBtn.addEventListener('click', () => {
      narrativePanel.classList.toggle('collapsed');
      toggleNarrativeBtn.textContent = narrativePanel.classList.contains('collapsed') ? '◀ Vis tekst' : '▶ Skjul';
    });
  }

  // Modus-bytte: Film vs Fri Utforskning
  if (modeFilmBtn && modeInteractiveBtn) {
    modeFilmBtn.addEventListener('click', () => {
      modeFilmBtn.classList.add('active');
      modeInteractiveBtn.classList.remove('active');
      if (interactiveToolbar) interactiveToolbar.style.display = 'none';
      player.isInteractiveMode = false;
      player.isPlaying = true;
      player.updatePlayButton();
    });

    modeInteractiveBtn.addEventListener('click', () => {
      modeInteractiveBtn.classList.add('active');
      modeFilmBtn.classList.remove('active');
      if (interactiveToolbar) interactiveToolbar.style.display = 'flex';
      player.isInteractiveMode = true;
      player.isPlaying = false;
      player.updatePlayButton();
    });
  }

  // Kobling av interaktive sandkasse-kontroller
  if (satCountSlider) {
    satCountSlider.addEventListener('input', (e) => {
      const count = parseInt(e.target.value);
      if (satCountValue) satCountValue.textContent = count;
      if (player.chapters[player.currentChapterIndex].mode === '3D') {
        scene3D.setSatelliteCount(count);
      } else {
        for (let i = 0; i < 4; i++) {
          scene2D.satellites[i].active = i < count;
          scene2D.satellites[i].progress = i < count ? 1 : 0;
        }
      }
    });
  }

  if (clockBiasSlider) {
    clockBiasSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (clockBiasValue) clockBiasValue.textContent = `${val > 0 ? '+' : ''}${val} μs`;
      scene2D.clockBias = val;
      scene2D.showErrorTriangle = Math.abs(val) > 0.5;
    });
  }

  if (carSpeedSlider) {
    carSpeedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (carSpeedValue) carSpeedValue.textContent = `${val} km/t`;
      scene2D.car.speed = val;
    });
  }

  if (jammerToggle) {
    jammerToggle.addEventListener('change', (e) => {
      scene2D.jammingActive = e.target.checked;
    });
  }

  // Tilpass lerreter ved vindusendring
  window.addEventListener('resize', () => {
    scene2D.resize();
    scene3D.resize();
  });

  // Hovedanimasjonsløkke
  function animationLoop(timestamp) {
    player.tick(timestamp);
    requestAnimationFrame(animationLoop);
  }

  requestAnimationFrame(animationLoop);
});
