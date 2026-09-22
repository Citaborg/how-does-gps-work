import { expect, test } from '@playwright/test';
import { chapters } from '../src/story.js';

const errors = (page) => {
  const messages = [];
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(`console: ${message.text()}`);
  });
  return messages;
};

async function openStory(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await expect(page.locator('#sketch')).toBeVisible();
  await expect(page.locator('#timeline')).toBeVisible();
}

async function setTimeline(page, seconds) {
  await page.locator('#timeline').evaluate((input, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, seconds);
}

test('autoplay advances and Pause freezes the public timeline', async ({ page }) => {
  const runtimeErrors = errors(page);
  await openStory(page, { width: 1440, height: 900 });
  const timeline = page.locator('#timeline');
  const initial = Number(await timeline.inputValue());
  await page.waitForTimeout(700);
  const advanced = Number(await timeline.inputValue());
  expect(advanced).toBeGreaterThan(initial + 0.25);

  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = Number(await timeline.inputValue());
  await page.waitForTimeout(500);
  expect(Number(await timeline.inputValue())).toBeCloseTo(paused, 1);
  expect(runtimeErrors).toEqual([]);
  await page.screenshot({ path: 'test-results/autoplay-paused.png', fullPage: true });
});

test('chapter dialog lists all chapters and seeks through its public controls', async ({ page }) => {
  const runtimeErrors = errors(page);
  await openStory(page, { width: 1440, height: 900 });
  await page.getByRole('button', { name: /Begynnelsen/ }).click();
  const dialog = page.locator('#chapters-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.chapter-option')).toHaveCount(17);

  await dialog.locator('.chapter-option').nth(10).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.locator('#chapter-number')).toHaveText('11');
  await expect(page.locator('#current-chapter-name')).toHaveText('En liten takk til Einstein');
  const value = Number(await page.locator('#timeline').inputValue());
  expect(value).toBeGreaterThanOrEqual(187);
  expect(value).toBeLessThan(188);
  expect(runtimeErrors).toEqual([]);
  await page.screenshot({ path: 'test-results/chapter-dialog-selection.png', fullPage: true });
});

test('speed control cycles through the documented playback rates', async ({ page }) => {
  await openStory(page, { width: 1440, height: 900 });
  const speed = page.getByRole('button', { name: /Avspillingshastighet/ });
  await expect(speed).toHaveText('1×');
  for (const expected of ['1.25×', '1.5×', '2×', '0.75×', '1×']) {
    await speed.click();
    await expect(speed).toHaveText(expected);
  }
});

test('seeking each chapter keeps canvas and WebGL rendering error-free', async ({ page }) => {
  const runtimeErrors = errors(page);
  await openStory(page, { width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  for (const chapter of chapters) {
    await setTimeline(page, chapter.start + 10);
    await expect(page.locator('#timeline')).toHaveValue(String(chapter.start + 10));
    await expect(page.locator('#app')).toHaveAttribute('data-chapter', chapter.id);
    await expect(page.locator('#sketch')).toBeVisible();
    await page.waitForTimeout(80);
    await page.screenshot({ path: `test-results/chapter-${chapter.id}.png` });
  }
  await expect(page.locator('#space canvas')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
  await page.screenshot({ path: 'test-results/all-chapters-final.png', fullPage: true });
});

test('keyboard navigation seeks, reaches end, and replay returns to the start', async ({ page }) => {
  const runtimeErrors = errors(page);
  await openStory(page, { width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('body').click({ position: { x: 10, y: 300 } });
  const initial = Number(await page.locator('#timeline').inputValue());
  await page.keyboard.press('ArrowRight');
  expect(Number(await page.locator('#timeline').inputValue())).toBeCloseTo(initial + 5, 3);
  await page.keyboard.press('ArrowLeft');
  expect(Number(await page.locator('#timeline').inputValue())).toBeCloseTo(initial, 3);
  await page.keyboard.press('End');
  await expect(page.locator('#timeline')).toHaveValue('345');
  await expect(page.getByRole('button', { name: 'Neste kapittel', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Spill på nytt', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Spill på nytt', exact: true }).click();
  await page.waitForTimeout(100);
  expect(Number(await page.locator('#timeline').inputValue())).toBeLessThan(1);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('reduced motion starts paused', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const runtimeErrors = errors(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Spill', exact: true })).toBeVisible();
  const initial = await page.locator('#timeline').inputValue();
  await page.waitForTimeout(400);
  await expect(page.locator('#timeline')).toHaveValue(initial);
  expect(runtimeErrors).toEqual([]);
  await context.close();
});

test('fullscreen keeps the paper background and exits through the same control', async ({ page }) => {
  await openStory(page, {width:1920,height:1080});
  await page.getByRole('button', {name:'Fullskjerm',exact:true}).click();
  await expect(page.getByRole('button', {name:'Avslutt fullskjerm',exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.fullscreenElement?.id)).toBe('app');
  await expect(page.locator('#app')).toHaveCSS('background-color','rgb(244, 240, 231)');
  await page.getByRole('button', {name:'Avslutt fullskjerm',exact:true}).click();
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
});

test('desktop and mobile keep story controls and narrative within the viewport without overlap', async ({ page }) => {
  const runtimeErrors = errors(page);
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    await openStory(page, viewport);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await setTimeline(page, 6);
    await expect(page.locator('#narrative-content')).toBeVisible();
    await expect(page.locator('.player')).toBeVisible();
    const layout = await page.evaluate(() => {
      const rect = (selector) => {
        const { left, top, right, bottom } = document.querySelector(selector).getBoundingClientRect();
        return { left, top, right, bottom };
      };
      return {
        viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
        drawing: rect('.drawing'),
        narrative: rect('#narrative-content'),
        player: rect('.player'),
      };
    });
    expect(layout.viewport.scrollWidth).toBeLessThanOrEqual(layout.viewport.width);
    for (const box of [layout.narrative, layout.player]) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(layout.viewport.width);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(layout.viewport.height);
    }
    if (viewport.width > 700) {
      expect(layout.drawing.right).toBeLessThanOrEqual(layout.narrative.left);
    } else {
      expect(layout.narrative.bottom).toBeLessThanOrEqual(layout.player.top);
    }
    await page.screenshot({ path: `test-results/layout-${viewport.width}x${viewport.height}.png`, fullPage: true });
  }
  expect(runtimeErrors).toEqual([]);
});
