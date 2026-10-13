import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

const px = (page, selector, prop) => page.evaluate(([s, p]) => parseFloat(getComputedStyle(document.querySelector(s))[p]), [selector, prop]);
const NARROW = { width: 320, height: 800 };
const WIDE = { width: 1280, height: 800 };
const step4 = (base, ratio) => base * ratio ** 4;

test.describe('scale tokens', () => {
	test('steps interpolate base and ratio between the two viewports', async ({ page }) => {
		await page.setViewportSize(NARROW);
		const response = await page.goto('/test/browser/fixtures/scale.html');
		expect(response.status()).toBe(200);
		expect(await px(page, '#step-4', 'width')).toBeCloseTo(step4(16, 1.2), 0);
		expect(await px(page, '#space-md', 'width')).toBeCloseTo(16, 1);
		await page.setViewportSize(WIDE);
		expect(await px(page, '#step-4', 'width')).toBeCloseTo(step4(18, 1.333), 0);
		expect(await px(page, '#space-md', 'width')).toBeCloseTo(18, 1);
		expect(await px(page, '#space-md-static', 'width')).toBeCloseTo(16, 1);
	});

	test('changing --yeti-ratio live recomputes every step', async ({ page }) => {
		await page.setViewportSize(NARROW);
		await page.goto('/test/browser/fixtures/scale.html');
		await page.evaluate(() => document.documentElement.style.setProperty('--yeti-ratio', '2'));
		expect(await px(page, '#step-4', 'width')).toBeCloseTo(step4(16, 2), 0);
		await page.setViewportSize(WIDE);
		expect(await px(page, '#step-4', 'width')).toBeCloseTo(step4(18, 2), 0);
	});

	test('space above lg leaves the type ratio and doubles each stop, up to 4xl', async ({ page }) => {
		// A type ratio reaches a big heading in four steps and no further, so
		// the room between sections has its own ratio: each stop above lg is
		// twice the one before, which puts 4xl at sixteen times the body size.
		await page.setViewportSize(NARROW);
		await page.goto('/test/browser/fixtures/scale.html');
		for (const [stop, times] of [['xl', 2], ['2xl', 4], ['3xl', 8], ['4xl', 16]]) {
			expect(await px(page, `#space-${stop}`, 'width'), `${stop} narrow`).toBeCloseTo(16 * times, 1);
		}
		await page.setViewportSize(WIDE);
		for (const [stop, times] of [['xl', 2], ['2xl', 4], ['3xl', 8], ['4xl', 16]]) {
			expect(await px(page, `#space-${stop}`, 'width'), `${stop} wide`).toBeCloseTo(18 * times, 1);
		}
		expect(await px(page, '#space-4xl-static', 'width')).toBeCloseTo(16 * 16, 1);
	});

	test('changing --yeti-space-ratio live recomputes the stops above lg and nothing else', async ({ page }) => {
		await page.setViewportSize(NARROW);
		await page.goto('/test/browser/fixtures/scale.html');
		await page.evaluate(() => document.documentElement.style.setProperty('--yeti-space-ratio', '1.5'));
		for (const [stop, power] of [['xl', 1], ['2xl', 2], ['3xl', 3], ['4xl', 4]]) {
			expect(await px(page, `#space-${stop}`, 'width'), stop).toBeCloseTo(16 * 1.5 ** power, 1);
		}
		expect(await px(page, '#space-md', 'width')).toBeCloseTo(16, 1);
		expect(await px(page, '#step-4', 'width')).toBeCloseTo(step4(16, 1.2), 0);
	});

	test('radius and leading derive from the base', async ({ page }) => {
		await page.setViewportSize(NARROW);
		await page.goto('/test/browser/fixtures/scale.html');
		expect(await px(page, '#radius-md', 'width')).toBeCloseTo(8, 1);
		expect(await px(page, '#leading', 'lineHeight')).toBeCloseTo(16 + 8, 0);
	});

	test('has no accessibility violations', async ({ page }) => {
		await page.goto('/test/browser/fixtures/scale.html');
		expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	});
});
