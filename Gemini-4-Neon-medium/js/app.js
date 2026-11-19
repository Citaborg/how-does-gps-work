/* ==========================================================================
   js/app.js — Master Video Timeline, Transitions, Narration & Player Controls
   ========================================================================== */
(function (global) {
  'use strict';

  const GPSApp = (global.GPSApp = global.GPSApp || {});

  document.addEventListener('DOMContentLoaded', () => {
    const S = GPSApp.Sketch;
    const { CHAPTERS, totalDuration, pickBeat } = GPSApp.Scenes;

    const canvas = document.getElementById('stage');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const narrationTag = document.getElementById('narrationTag');
    const narrationContent = document.getElementById('narrationContent');
    const narrationHeading = document.getElementById('narrationHeading');
    const narrationBody = document.getElementById('narrationBody');
    const narrationNote = document.getElementById('narrationNote');

    const btnPlay = document.getElementById('btnPlay');
    const iconPlay = document.getElementById('iconPlay');
    const iconPause = document.getElementById('iconPause');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSpeed = document.getElementById('btnSpeed');
    const btnFullscreen = document.getElementById('btnFullscreen');
    const timeReadout = document.getElementById('timeReadout');

    const timelineWrap = document.getElementById('timelineWrap');
    const timelineProgress = document.getElementById('timelineProgress');
    const timelineThumb = document.getElementById('timelineThumb');
    const timelineMarkers = document.getElementById('timelineMarkers');
    const timelineTooltip = document.getElementById('timelineTooltip');

    const chapterMenuBtn = document.getElementById('chapterMenuBtn');
    const chapterPillIndex = document.getElementById('chapterPillIndex');
    const chapterPillTitle = document.getElementById('chapterPillTitle');
    const chapterPopover = document.getElementById('chapterPopover');

    // Playback state
    let currentTime = 0;
    let isPlaying = true;
    const speeds = [0.75, 1, 1.25, 1.5];
    let speedIdx = 1;
    let lastFrameTs = performance.now();
    let isScrubbing = false;

    // Narration state for smooth fade-in / fade-out
    let activeBeatKey = '';
    let fadeTimer = null;

    // Viewport dimensions
    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      canvas.style.width = viewW + 'px';
      canvas.style.height = viewH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function formatTime(sec) {
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r < 10 ? '0' : ''}${r}`;
    }

    function getChapterAt(time) {
      const clamped = S.clamp(time, 0, totalDuration - 0.0001);
      for (let i = 0; i < CHAPTERS.length; i++) {
        if (clamped < CHAPTERS[i].endTime) return CHAPTERS[i];
      }
      return CHAPTERS[CHAPTERS.length - 1];
    }

    // Populate chapter markers on timeline & chapter popover menu
    function buildChapterUI() {
      timelineMarkers.innerHTML = '';
      chapterPopover.innerHTML = '';

      CHAPTERS.forEach((ch, idx) => {
        if (idx > 0) {
          const mk = document.createElement('div');
          mk.className = 'timeline-marker';
          mk.style.left = `${(ch.startTime / totalDuration) * 100}%`;
          timelineMarkers.appendChild(mk);
        }

        const item = document.createElement('button');
        item.className = 'chapter-item';
        item.setAttribute('role', 'menuitem');
        item.dataset.idx = idx;
        item.innerHTML = `
          <span class="chapter-item-num">${idx + 1}.</span>
          <span class="chapter-item-name">${ch.shortTitle}</span>
          <span class="chapter-item-dur">${formatTime(ch.startTime)}</span>
        `;
        item.addEventListener('click', () => {
          jumpToChapter(idx);
          closePopover();
        });
        chapterPopover.appendChild(item);
      });
    }
    buildChapterUI();

    function updatePlayIcon() {
      iconPause.style.display = isPlaying ? 'block' : 'none';
      iconPlay.style.display = isPlaying ? 'none' : 'block';
    }

    function togglePlay() {
      if (!isPlaying && currentTime >= totalDuration - 0.05) {
        currentTime = 0;
      }
      isPlaying = !isPlaying;
      updatePlayIcon();
    }

    function jumpToChapter(idx) {
      const target = CHAPTERS[S.clamp(idx, 0, CHAPTERS.length - 1)];
      currentTime = target.startTime + 0.01;
      isPlaying = true;
      updatePlayIcon();
    }

    function openPopover() {
      chapterPopover.classList.add('open');
      chapterMenuBtn.setAttribute('aria-expanded', 'true');
    }
    function closePopover() {
      chapterPopover.classList.remove('open');
      chapterMenuBtn.setAttribute('aria-expanded', 'false');
    }

    chapterMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (chapterPopover.classList.contains('open')) closePopover();
      else openPopover();
    });
    document.addEventListener('click', (e) => {
      if (!chapterPopover.contains(e.target) && e.target !== chapterMenuBtn) {
        closePopover();
      }
    });

    btnPlay.addEventListener('click', togglePlay);
    btnPrev.addEventListener('click', () => {
      const ch = getChapterAt(currentTime);
      const localT = currentTime - ch.startTime;
      if (localT > 2.2) jumpToChapter(ch.index);
      else jumpToChapter(ch.index - 1);
    });
    btnNext.addEventListener('click', () => {
      const ch = getChapterAt(currentTime);
      jumpToChapter(ch.index + 1);
    });
    btnSpeed.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % speeds.length;
      btnSpeed.textContent = speeds[speedIdx] + 'x';
    });
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });

    // Timeline scrubbing + chapter hover preview
    function timeFromPointer(clientX) {
      const rect = timelineWrap.getBoundingClientRect();
      const frac = S.clamp((clientX - rect.left) / rect.width, 0, 1);
      return { frac, time: frac * totalDuration };
    }

    timelineWrap.addEventListener('pointerdown', (e) => {
      isScrubbing = true;
      timelineWrap.setPointerCapture(e.pointerId);
      const { time } = timeFromPointer(e.clientX);
      currentTime = time;
    });

    timelineWrap.addEventListener('pointermove', (e) => {
      const { frac, time } = timeFromPointer(e.clientX);
      const ch = getChapterAt(time);
      timelineTooltip.textContent = `${ch.index + 1}. ${ch.shortTitle} (${formatTime(time)})`;
      timelineTooltip.style.left = `${frac * 100}%`;
      timelineTooltip.classList.add('visible');
      if (isScrubbing) {
        currentTime = time;
      }
    });

    timelineWrap.addEventListener('pointerup', () => {
      isScrubbing = false;
    });
    timelineWrap.addEventListener('pointerleave', () => {
      timelineTooltip.classList.remove('visible');
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const ch = getChapterAt(currentTime);
        jumpToChapter(ch.index + 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const ch = getChapterAt(currentTime);
        jumpToChapter(ch.index - 1);
      } else if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < CHAPTERS.length) jumpToChapter(idx);
      } else if (e.key === 'f' || e.key === 'F') {
        btnFullscreen.click();
      }
    });

    // Calm right-side narration update with smooth fade out -> swap -> fade in
    function updateNarration(ch, u) {
      const beat = pickBeat(ch.beats, u);
      const key = `${ch.id}:${beat.at}`;
      if (key === activeBeatKey) return;
      activeBeatKey = key;

      if (fadeTimer) clearTimeout(fadeTimer);
      narrationContent.classList.add('is-fading');
      fadeTimer = setTimeout(() => {
        narrationTag.textContent = ch.tag;
        narrationHeading.textContent = beat.heading;
        narrationBody.textContent = beat.body;
        narrationNote.textContent = beat.note || '';
        narrationContent.classList.remove('is-fading');
      }, 240);
    }

    // Update bottom dock progress & active chapter highlight
    let lastActiveChapterIdx = -1;
    function updatePlayerUI(ch) {
      const pct = (currentTime / totalDuration) * 100;
      timelineProgress.style.width = `${pct}%`;
      timelineThumb.style.left = `${pct}%`;
      timeReadout.textContent = `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;

      if (ch.index !== lastActiveChapterIdx) {
        lastActiveChapterIdx = ch.index;
        chapterPillIndex.textContent = `${ch.index + 1}/${CHAPTERS.length}`;
        chapterPillTitle.textContent = ch.shortTitle;

        const items = chapterPopover.querySelectorAll('.chapter-item');
        items.forEach((el, idx) => {
          el.classList.toggle('active', idx === ch.index);
        });
      }
    }

    // Compute clean drawing stage rect (keeps right narration & bottom player clear)
    function getStageRect() {
      const rightReserve = viewW > 820 ? Math.min(390, viewW * 0.27) : 16;
      const topReserve = 82;
      const bottomReserve = viewW > 820 ? 96 : 210;
      return {
        x: 20,
        y: topReserve,
        w: Math.max(320, viewW - rightReserve - 24),
        h: Math.max(260, viewH - topReserve - bottomReserve),
      };
    }

    // Smooth cross-dissolve between distinct thematic chapters (chapters 1..4 flow seamlessly with no fade!)
    function needsCrossfade(idxA, idxB) {
      // Chapters 0->1->2->3 share the exact continuous 2D road & satellites
      if (idxA >= 0 && idxA <= 2 && idxB === idxA + 1) return false;
      return true;
    }

    // Main render loop
    function frame(now) {
      const dt = Math.min(0.05, (now - lastFrameTs) / 1000);
      lastFrameTs = now;

      if (isPlaying && !isScrubbing) {
        currentTime += dt * speeds[speedIdx];
        if (currentTime >= totalDuration) {
          currentTime = totalDuration;
          isPlaying = false;
          updatePlayIcon();
        }
      }

      const ch = getChapterAt(currentTime);
      const localT = currentTime - ch.startTime;
      const u = S.clamp(localT / ch.duration, 0, 1);
      const stage = getStageRect();

      // 1. Paint warm tactile sketchbook paper background
      S.drawPaperBackground(ctx, viewW, viewH);

      // 2. Render current chapter (with gentle paper cross-fade at scene boundaries)
      const fadeDur = 0.75;
      let fadeAlpha = 1;
      if (ch.index > 0 && localT < fadeDur && needsCrossfade(ch.index - 1, ch.index)) {
        const prevCh = CHAPTERS[ch.index - 1];
        const mix = S.easeInOutCubic(localT / fadeDur);
        ctx.save();
        ctx.globalAlpha = 1 - mix;
        prevCh.render(ctx, stage, 1, currentTime);
        ctx.restore();
        fadeAlpha = mix;
      }

      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      ch.render(ctx, stage, u, currentTime);
      ctx.restore();

      // 3. Sync narration & player UI
      updateNarration(ch, u);
      updatePlayerUI(ch);

      requestAnimationFrame(frame);
    }

    updatePlayIcon();
    requestAnimationFrame(frame);
  });
})(window);
