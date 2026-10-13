import { test, expect } from 'playwright/test';
import { stage, rect, rects, style, px, token, axe } from '../lib/layout.js';
import { PAGE_HELPERS, expectAA } from '../lib/contrast.js';

const open = async (page, width = 1000) => {
	await page.addInitScript(PAGE_HELPERS);
	const response = await page.goto('/test/browser/fixtures/components/affix.html');
	expect(response.status()).toBe(200);
	await stage(page, width);
};

test.describe('affix', () => {
	test('members share one border and the control grows', async ({ page }) => {
		await open(page);
		const [group, unit, price, apply] = await Promise.all([rect(page, '#group'), rect(page, '#unit'), rect(page, '#price'), rect(page, '#apply')]);
		const border = await token(page, '--yeti-border-width');
		expect(price.left - unit.right).toBeCloseTo(-border, 1);
		expect(apply.left - price.right).toBeCloseTo(-border, 1);
		expect(price.width).toBeGreaterThan(group.width / 2);
		expect(unit.height).toBeCloseTo(price.height, 0);
		expect(await px(page, '#unit', 'border-top-right-radius')).toBe(0);
		expect(await px(page, '#price', 'border-top-left-radius')).toBe(0);
		expect(await px(page, '#price', 'border-top-right-radius')).toBe(0);
		expect(await px(page, '#apply', 'border-top-left-radius')).toBe(0);
		expect(await px(page, '#unit', 'border-top-left-radius')).toBeGreaterThan(0);
	});

	test('reads the size of the field around it', async ({ page }) => {
		await open(page);
		expect(await px(page, '#domain', 'font-size')).toBeGreaterThan(await px(page, '#unit', 'font-size'));
		expect((await rect(page, '#site')).height).toBeGreaterThan((await rect(page, '#price')).height);
	});

	for (const scheme of ['light', 'dark']) {
		test(`text meets AA in ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await open(page);
			for (const sel of await page.evaluate(() => [...document.querySelectorAll('[data-contrast]')].map((el, i) => { el.dataset.contrastId = String(i); return `[data-contrast-id="${i}"]`; }))) {
				await expectAA(page, sel, { large: await page.evaluate((s) => document.querySelector(s).dataset.contrast === 'large', sel), label: `${sel} ${scheme}` });
			}
		});
	}

	test('two controls join into one row and both grow', async ({ page }) => {
		await open(page);
		const [pair, code, phone] = await Promise.all([rect(page, '#pair'), rect(page, '#code'), rect(page, '#phone')]);
		const border = await token(page, '--yeti-border-width');
		expect(code.top).toBeCloseTo(phone.top, 1);
		expect(phone.left - code.right).toBeCloseTo(-border, 1);
		expect(code.width + phone.width).toBeGreaterThan(pair.width - 2);
		expect(await px(page, '#code', 'border-top-right-radius')).toBe(0);
		expect(await px(page, '#phone', 'border-top-left-radius')).toBe(0);
	});

	test('a focused member draws its ring inside its own box, off the seam', async ({ page }) => {
		await open(page);
		// A text control matches :focus-visible however it is focused, so a
		// click lands the ring too; the ring outside the box would cross the
		// shared border onto the neighbour, with the neighbour showing between.
		for (const id of ['#price', '#apply', '#code']) {
			await page.focus(id);
			await page.keyboard.press('Shift+Tab');
			await page.keyboard.press('Tab');
			expect(await page.evaluate(() => document.activeElement.id)).toBe(id.slice(1));
			const [width, offset, color] = await Promise.all([px(page, id, 'outline-width'), px(page, id, 'outline-offset'), style(page, id, 'outline-color')]);
			expect(width, `${id} keeps a ring`).toBeGreaterThan(0);
			expect(color, `${id} ring is the focus color`).toBe(await page.evaluate(() => { const p = document.createElement('div'); p.style.color = 'var(--yeti-color-focus)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }));
			expect(offset + width, `${id} ring stays inside the border box`).toBeLessThanOrEqual(0);
		}
	});

	test('has no accessibility violations', async ({ page }) => {
		await open(page);
		expect(await axe(page)).toEqual([]);
	});
});
