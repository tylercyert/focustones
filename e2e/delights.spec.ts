import { expect, test, type Page } from '@playwright/test';

// Desktop delights (issue #14), in the real desktop at 1280×800 (mouse and keyboard) and 375×812 (touch): two Playwright
// projects. They also write the evidence screenshots under docs/evidence/14-delights/.
const phone = (page: Page) => page.viewportSize()!.width < 700;
const win = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const icon = (page: Page, label: string) => page.locator('nav .dicon').filter({ hasText: label });
const trashIcon = (page: Page) => page.locator('nav .dicon[data-icon="trash"]');

async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
  });
  await page.waitForTimeout(150);
}
const shot = async (page: Page, name: string) => {
  await settle(page);
  await page.screenshot({ path: `docs/evidence/14-delights/${name}-${page.viewportSize()!.width}x${page.viewportSize()!.height}.png` });
};

/** Taps on a phone, clicks elsewhere. */
const press = async (page: Page, target: ReturnType<Page['locator']>) => (phone(page) ? target.tap() : target.click());
async function menu(page: Page, name: string, item: string) {
  await press(page, page.getByRole('menuitem', { name, exact: true }));
  await press(page, page.getByRole('menu').getByRole('menuitem', { name: item, exact: true }));
}
async function closeAll(page: Page) { await menu(page, 'File', 'Close All Windows'); await expect(page.getByRole('dialog')).toHaveCount(0); }
/** Opens a window from its desktop icon: one tap on a phone, a double-click with a mouse. */
async function openIcon(page: Page, label: string) {
  if (phone(page)) await icon(page, label).tap();
  else await icon(page, label).dblclick();
  await expect(win(page, label)).toBeVisible();
}
/** Counts the sounds the delights make: oscillators and noise bursts created on any audio context. */
const sounds = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __sounds: { osc: number; buf: number; oscGone: number; targets: number[] } }).__sounds }));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('focustones.startup.seen', '1');
    const s = { osc: 0, buf: 0, oscGone: 0, targets: [] as number[] };
    (window as unknown as { __sounds: typeof s }).__sounds = s;
    const P = BaseAudioContext.prototype;
    const osc = P.createOscillator, buf = P.createBufferSource;
    P.createOscillator = function (this: BaseAudioContext) { s.osc++; return osc.call(this); };
    P.createBufferSource = function (this: BaseAudioContext) { s.buf++; return buf.call(this); };
    // Teardown and live volume: oscillators fully disconnected, and every gain target set while sounds play.
    const disconnect = AudioNode.prototype.disconnect as (this: AudioNode, ...a: unknown[]) => unknown;
    AudioNode.prototype.disconnect = function (this: AudioNode, ...a: unknown[]) { if (!a.length && this instanceof OscillatorNode) s.oscGone++; return disconnect.apply(this, a); } as typeof AudioNode.prototype.disconnect;
    const target = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (this: AudioParam, v: number, t: number, c: number) { s.targets.push(v); return target.call(this, v, t, c); };
  });
  const problems: string[] = [];
  page.on('request', (r) => { if (new URL(r.url()).hostname !== 'localhost' && !/^(data|blob):/.test(r.url())) problems.push(`outside request: ${r.url()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  (page as Page & { problems: string[] }).problems = problems;
});
test.afterEach(({ page }) => { expect((page as Page & { problems: string[] }).problems).toEqual([]); });

test.describe('Distractions → Trash', () => {
  test('items and the folder go in the Trash, it bulges, Empty Trash crumples and says so, and they come back next visit', async ({ page }) => {
    await page.goto('/');
    await closeAll(page);
    await expect(trashIcon(page)).toBeVisible();
    const emptyArt = await trashIcon(page).locator('svg').innerHTML();
    await openIcon(page, 'Distractions');
    const folder = win(page, 'Distractions');
    await expect(folder.getByRole('option')).toHaveCount(5);
    await expect(folder.getByText('5 items, none of them urgent')).toBeVisible();
    await shot(page, 'distractions');

    if (phone(page)) {
      // Touch: select, then Move to Trash.
      await folder.getByRole('option', { name: 'Notifications' }).tap();
      await folder.getByRole('button', { name: 'Move to Trash', exact: true }).tap();
      await expect(folder.getByRole('option')).toHaveCount(4);
    } else {
      // Mouse: drag an item from the folder onto the Trash icon.
      await win(page, 'Distractions').locator('.win-title').dragTo(page.locator('.surface'), { targetPosition: { x: 200, y: 200 }, sourcePosition: { x: 120, y: 10 } });
      const item = folder.getByRole('option', { name: 'Just one more video' });
      const from = (await item.boundingBox())!, to = (await trashIcon(page).boundingBox())!;
      await page.mouse.move(from.x + from.width / 2, from.y + 20);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + 20, { steps: 12 });
      await expect(trashIcon(page)).toHaveAttribute('data-drop', '');
      await page.mouse.up();
      await expect(trashIcon(page)).not.toHaveAttribute('data-drop', '');
      await expect(folder.getByRole('option', { name: 'Just one more video' })).toHaveCount(0);
      // The listbox keyboard model: one Tab stop; arrows, Home/End and typeahead move focus and selection together.
      const opt = (n: string) => folder.getByRole('option', { name: n });
      await opt('Notifications').focus();
      await expect(folder.locator('[role="option"][tabindex="0"]')).toHaveCount(1);
      await page.keyboard.press('ArrowRight');
      await expect(opt('Inbox (99+)')).toBeFocused();
      await expect(opt('Inbox (99+)')).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('End');
      await expect(opt('47 open tabs')).toBeFocused();
      await page.keyboard.press('Home');
      await expect(opt('Notifications')).toBeFocused();
      await page.keyboard.press('ArrowUp'); // stays at the first
      await expect(opt('Notifications')).toBeFocused();
      await page.keyboard.press('g');
      await expect(opt('Group chat')).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(600); // a new search after a pause
      await page.keyboard.press('4');
      await expect(opt('47 open tabs')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(folder.getByText('You will read them someday.')).toBeVisible();
      await expect(folder.locator('[role="option"][tabindex="0"]')).toHaveCount(1);
      // Keyboard: select an item and press Ctrl+Delete.
      await folder.getByRole('option', { name: 'Inbox (99+)' }).click();
      await page.keyboard.press('Control+Delete');
      await expect(folder.getByRole('option')).toHaveCount(3);
      // File ▸ Move to Trash acts on the selected item, twice in a row.
      await folder.getByRole('option', { name: 'Group chat' }).click();
      await menu(page, 'File', 'Move to Trash');
      await folder.getByRole('option', { name: 'Notifications' }).click();
      await menu(page, 'File', 'Move to Trash');
      await expect(folder.getByRole('option')).toHaveCount(1);
      await expect(folder.getByText('1 item, not urgent')).toBeVisible();
    }

    // The Trash bulges and lists what went in.
    await expect.poll(() => trashIcon(page).locator('svg').innerHTML()).not.toBe(emptyArt);
    const fullArt = await trashIcon(page).locator('svg').innerHTML();
    if (phone(page)) {
      await folder.getByRole('button', { name: 'Move Folder to Trash' }).tap();
    } else {
      // Drag the folder icon itself onto the Trash.
      await closeAll(page);
      const f = (await icon(page, 'Distractions').boundingBox())!, t = (await trashIcon(page).boundingBox())!;
      await page.mouse.move(f.x + f.width / 2, f.y + 20);
      await page.mouse.down();
      await page.mouse.move(t.x + t.width / 2, t.y + 20, { steps: 12 });
      await page.mouse.up();
    }
    await expect(icon(page, 'Distractions')).toHaveCount(0);
    await expect(folder).toHaveCount(0);
    await expect(trashIcon(page).locator('svg')).toHaveJSProperty('innerHTML', fullArt);
    if (phone(page)) await press(page, page.getByRole('navigation', { name: 'Open windows' }).getByRole('button', { name: 'Desktop', exact: true }));
    await openIcon(page, 'Trash');
    await expect(win(page, 'Trash').getByRole('list', { name: 'In the Trash' }).getByRole('listitem')).not.toHaveCount(0);
    await expect(win(page, 'Trash').getByRole('button', { name: 'Empty Trash' })).toBeInViewport({ ratio: 1 });
    if (!phone(page)) await page.mouse.click(700, 700); // deselect, so the bulging Trash shows in the screenshot
    await shot(page, 'trash-full');

    // Special ▸ Empty Trash: a crumple (noise bursts, from the click) and the alert.
    const before = await sounds(page);
    if (phone(page)) await win(page, 'Trash').getByRole('button', { name: 'Empty Trash' }).tap(); // phones keep the menu bar to one row: no Special menu
    else await menu(page, 'Special', 'Empty Trash');
    const alert = page.getByRole('alertdialog');
    await expect(alert).toContainText('Distractions emptied. Enjoy the quiet.');
    expect((await sounds(page)).buf - before.buf).toBeGreaterThan(10);
    await shot(page, 'emptied');
    // Modal: focus starts on OK and Tab / Shift-Tab cannot leave; the desktop behind is inert and its shortcuts wait.
    const ok = alert.getByRole('button', { name: 'OK' });
    await expect(ok).toBeFocused();
    if (!phone(page)) {
      for (const k of ['Tab', 'Shift+Tab', 'Tab', 'Tab']) { await page.keyboard.press(k); await expect(ok).toBeFocused(); }
      await expect(page.locator('.menubar')).toHaveAttribute('inert', '');
      await expect(page.locator('.surface')).toHaveAttribute('inert', '');
      await page.keyboard.press('Control+w');
      await expect(win(page, 'Trash')).toBeVisible(); // Ctrl+W did not reach the shell
      await page.keyboard.press('Escape');
      await expect(alert).toHaveCount(0);
      await expect(win(page, 'Trash')).toBeFocused(); // back to where it was opened from (the menu has closed)
      await expect(page.locator('.menubar')).not.toHaveAttribute('inert', '');
    } else {
      await press(page, ok);
    }
    await expect(alert).toHaveCount(0);
    await expect(win(page, 'Trash').getByText('The Trash is empty.')).toBeVisible();
    if (!phone(page)) {
      await press(page, page.getByRole('menuitem', { name: 'Special', exact: true }));
      await expect(page.getByRole('menuitem', { name: 'Empty Trash' })).toHaveAttribute('aria-disabled', 'true');
      await page.keyboard.press('Escape');
    }

    // About This Desktop's memory bar has emptied too.
    await menu(page, 'FocusTones menu', 'About This Desktop…');
    await expect(page.getByTestId('memory-summary')).toHaveText('Focus: 100% · Distractions: 0%');

    // Next visit: the distractions are back.
    await page.reload();
    await expect(icon(page, 'Distractions')).toHaveCount(1);
  });
});

test('Today’s One Thing: editable, kept on the device, resizable', async ({ page }) => {
  await page.goto('/');
  await closeAll(page);
  await openIcon(page, 'Today’s One Thing');
  const note = win(page, 'Today’s One Thing');
  const box = note.getByRole('textbox', { name: 'Today’s one thing' });
  await box.fill('Write the chapter outline 📝');
  await expect(note).toHaveCSS('background-color', /./);
  if (!phone(page)) {
    const b0 = (await note.boundingBox())!;
    const grow = (await note.locator('.win-grow').boundingBox())!;
    await page.mouse.move(grow.x + 8, grow.y + 8);
    await page.mouse.down();
    await page.mouse.move(grow.x + 68, grow.y + 48, { steps: 6 });
    await page.mouse.up();
    const b1 = (await note.boundingBox())!;
    expect(b1.width).toBeGreaterThan(b0.width + 40);
  }
  await shot(page, 'note');
  await page.reload();
  if (phone(page)) await closeAll(page);
  await openIcon(page, 'Today’s One Thing');
  await expect(win(page, 'Today’s One Thing').getByRole('textbox')).toHaveValue('Write the chapter outline 📝');
});

test('Beat Calculator: beat, band and color from two ears; Hear It plays the pair and pauses Listen', async ({ page }) => {
  await page.goto('/');
  const listen = win(page, 'Listen');
  await press(page, listen.getByRole('button', { name: 'Play' }));
  await expect(listen.getByTestId('status')).toHaveText(/Fading in|Playing/);
  await menu(page, 'FocusTones menu', 'Beat Calculator');
  const calc = win(page, 'Beat Calculator');
  const readout = calc.getByTestId('beat-readout');
  await expect(readout).toContainText('10.0 Hz');
  await expect(readout).toContainText('Alpha');
  await calc.getByRole('spinbutton', { name: 'Left ear' }).fill('200');
  await calc.getByRole('spinbutton', { name: 'Right ear' }).fill('206');
  await expect(readout).toContainText('6.0 Hz');
  await expect(readout).toContainText('Theta');
  const before = await sounds(page);
  await press(page, calc.getByRole('button', { name: 'Hear It' }));
  await expect(calc.getByRole('button', { name: 'Stop' })).toHaveAttribute('aria-pressed', 'true');
  expect((await sounds(page)).osc - before.osc).toBe(2);
  await shot(page, 'beat-calculator');
  await press(page, calc.getByRole('button', { name: 'Stop' }));
  await expect(calc.getByRole('button', { name: 'Hear It' })).toBeVisible();
  // Out of range and junk input: a message, and nothing to play.
  await calc.getByRole('spinbutton', { name: 'Right ear' }).fill('300');
  await expect(readout).toContainText('Out of range: the bands run from 0.5 to 45 Hz.');
  await expect(calc.getByRole('button', { name: 'Hear It' })).toBeDisabled();
  await calc.getByRole('spinbutton', { name: 'Left ear' }).fill('');
  await expect(readout).toContainText('Enter two frequencies from 80 to 1000 Hz.');
  // The slider drives the same value from the keyboard.
  await calc.getByRole('spinbutton', { name: 'Left ear' }).fill('290');
  await calc.getByRole('slider', { name: 'Right ear' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(readout).toContainText('10.5 Hz');
  // Hear It paused the Listen session (one sound at a time).
  if (phone(page)) await press(page, page.getByRole('navigation', { name: 'Open windows' }).getByRole('button', { name: 'Listen' }));
  await expect(listen.getByTestId('status')).toHaveText('Paused');
});

test('Beat Calculator: muting the desktop silences a running Hear It, and closing the window tears its sound down', async ({ page }) => {
  await page.goto('/');
  await menu(page, 'FocusTones menu', 'Beat Calculator');
  const calc = win(page, 'Beat Calculator');
  await press(page, calc.getByRole('button', { name: 'Hear It' }));
  await expect(calc.getByRole('button', { name: 'Stop' })).toBeVisible();
  const before = await sounds(page);
  await press(page, page.getByRole('button', { name: /^Volume/ }));
  await page.getByRole('slider', { name: 'Volume' }).fill('0');
  await expect.poll(async () => (await sounds(page)).targets.slice(before.targets.length)).toContain(0); // the bus's gain heads to 0 now
  await page.keyboard.press('Escape');
  // Closing the window mid-sound stops it and disconnects both oscillators.
  await press(page, calc.getByRole('button', { name: 'Close' }));
  await expect.poll(async () => { const n = await sounds(page); return n.oscGone - n.osc; }, { timeout: 3000 }).toBe(0);
});

test.describe('screen saver', () => {
  test('starts after 2 idle minutes, wakes on input, Off keeps it away, Test starts it', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.clock.fastForward('01:50');
    await expect(page.getByTestId('screen-saver')).toHaveCount(0);
    await page.clock.fastForward('00:15');
    const saver = page.getByTestId('screen-saver');
    await expect(saver).toBeVisible();
    await shot(page, 'screen-saver');
    await page.clock.fastForward('00:02'); // past the grace period
    await page.keyboard.press('Shift');
    await expect(saver).toHaveCount(0);
    await expect(win(page, 'Listen')).toBeVisible();

    await menu(page, 'FocusTones menu', 'Screen Saver');
    const panel = win(page, 'Screen Saver');
    await press(page, panel.getByRole('radio', { name: 'Off' }));
    await shot(page, 'screen-saver-panel');
    await page.clock.fastForward('03:00');
    await expect(saver).toHaveCount(0);
    await page.reload();
    await page.clock.fastForward('03:00');
    await expect(saver).toHaveCount(0); // remembered
    await menu(page, 'FocusTones menu', 'Screen Saver');
    await press(page, win(page, 'Screen Saver').getByRole('button', { name: 'Test' }));
    await expect(saver).toBeVisible();
    await page.clock.fastForward('00:02');
    if (phone(page)) await page.touchscreen.tap(40, 400);
    else await page.mouse.click(40, 400);
    await expect(saver).toHaveCount(0);
  });

  test('a wheel wakes it without a console error and scrolls nothing underneath', async ({ page }) => {
    test.skip(phone(page), 'A wheel is a desktop input.');
    await page.goto('/');
    const body = win(page, 'Get FocusTones').locator('.win-body');
    const top = await body.evaluate((el) => el.scrollTop);
    await menu(page, 'Special', 'Start Screen Saver');
    const saver = page.getByTestId('screen-saver');
    await expect(saver).toBeVisible();
    await page.waitForTimeout(900); // past the grace period
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 120);
    await expect(saver).toHaveCount(0);
    expect(await body.evaluate((el) => el.scrollTop)).toBe(top);
  });

  test('holds still with Reduce Motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    if (phone(page)) { await menu(page, 'FocusTones menu', 'Screen Saver'); await win(page, 'Screen Saver').getByRole('button', { name: 'Test' }).tap(); }
    else await menu(page, 'Special', 'Start Screen Saver');
    const saver = page.getByTestId('screen-saver');
    await expect(saver).toHaveAttribute('data-still', 'true');
    expect(await saver.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  });
});

test('Desktop Patterns: pick one, tinted by the band, remembered; the startup chord plays once on the first Play', async ({ page }) => {
  await page.goto('/');
  await menu(page, 'FocusTones menu', 'Desktop Patterns');
  const panel = win(page, 'Desktop Patterns');
  await expect(panel.getByRole('radio')).toHaveCount(8);
  await expect(panel.getByRole('radio', { name: 'Default' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.surface')).not.toHaveAttribute('data-pattern');
  if (!phone(page)) {
    // Radio-group keys (WAI-ARIA): arrows move and select, wrapping; Home and End jump to the ends.
    await panel.getByRole('radio', { name: 'Default' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByRole('radio', { name: 'Waveform' })).toBeFocused();
    await expect(page.locator('.surface')).toHaveAttribute('data-pattern', 'waveform');
    await page.keyboard.press('End');
    await expect(panel.getByRole('radio', { name: 'Drizzle' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByRole('radio', { name: 'Default' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Home');
    await expect(panel.getByRole('radio', { name: 'Default' })).toBeFocused();
    await expect(page.locator('.surface')).not.toHaveAttribute('data-pattern');
  }
  await press(page, panel.getByRole('radio', { name: 'Ripple' }));
  await expect(page.locator('.surface')).toHaveAttribute('data-pattern', 'ripple');
  const tint = () => page.locator('.surface').evaluate((el) => (el as HTMLElement).style.getPropertyValue('--dx-band'));
  const beta = await tint();
  await shot(page, 'patterns');
  // The pattern follows the band chosen in Listen.
  if (phone(page)) await press(page, page.getByRole('navigation', { name: 'Open windows' }).getByRole('button', { name: 'Listen' }));
  await press(page, win(page, 'Listen').getByTestId('band-delta'));
  await expect.poll(tint).not.toBe(beta);
  await page.reload();
  await expect(page.locator('.surface')).toHaveAttribute('data-pattern', 'ripple');

  // Startup chord: nothing on load, ten voices (5 notes × 2) on the first Play, nothing on the second.
  expect((await sounds(page)).osc).toBe(0);
  const listen = win(page, 'Listen');
  await press(page, listen.getByRole('button', { name: 'Play' }));
  await expect.poll(async () => (await sounds(page)).osc).toBe(10);
  await press(page, listen.getByRole('button', { name: 'Pause' }));
  await press(page, listen.getByRole('button', { name: /Play/ }));
  await page.waitForTimeout(200);
  expect((await sounds(page)).osc).toBe(10);
  // Turned off, the next visit's first Play is silent apart from the tone.
  await menu(page, 'FocusTones menu', 'Desktop Patterns');
  await win(page, 'Desktop Patterns').getByRole('checkbox', { name: 'Play a startup chord on the first Play' }).uncheck();
  await page.reload();
  await press(page, win(page, 'Listen').getByRole('button', { name: 'Play' }));
  await page.waitForTimeout(300);
  expect((await sounds(page)).osc).toBe(0);
});

test.describe('small eggs', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the Konami code waves the icons and reveals Credits; About This Desktop shows the memory bar', async ({ page }) => {
    await page.goto('/');
    await closeAll(page);
    await expect(page.getByRole('menuitem', { name: /Credits/ })).toHaveCount(0); // hidden until found
    if (phone(page)) expect((await page.locator('.menubar').boundingBox())!.height).toBeLessThanOrEqual(46); // the menu bar stays one row
    if (phone(page)) {
      // Native touch through Chromium's input pipeline (not synthetic events): the browser may take a swipe as a pan and
      // cancel its pointer events, so this checks the egg still hears it. Swipes ↑↑↓↓←→←→ on bare desktop, then two taps.
      const cdp = await page.context().newCDPSession(page);
      const icons = await page.locator('nav .dicon').evaluateAll((els) => Math.max(...els.map((e) => e.getBoundingClientRect().bottom)));
      const x0 = 188, y0 = Math.round(icons + 70);
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
        cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      for (const [dx, dy] of [[0, -50], [0, -50], [0, 50], [0, 50], [-90, 0], [90, 0], [-90, 0], [90, 0], [0, 0], [0, 0]]) {
        await touch('touchStart', x0, y0);
        for (let i = 1; i <= 6; i++) await touch('touchMove', x0 + (dx * i) / 6, y0 + (dy * i) / 6);
        await touch('touchEnd', x0 + dx, y0 + dy);
      }
    } else {
      for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(k);
      await expect(page.locator('.desktop')).toHaveAttribute('data-wave', '');
    }
    await expect(win(page, 'Credits')).toBeVisible();
    await expect(win(page, 'Credits')).toContainText('You found the credits');
    await shot(page, 'credits');

    await menu(page, 'FocusTones menu', 'About This Desktop…');
    await expect(page.getByTestId('memory-summary')).toHaveText('Focus: 98% · Distractions: 2%');
    await shot(page, 'about-desktop');
  });

  test('icons drag and stay where dropped; View ▸ Clean Up puts them back', async ({ page }) => {
    test.skip(phone(page), 'Phones lay icons out in a grid; dragging is for a mouse or pen.');
    await page.goto('/');
    await closeAll(page);
    const tune = icon(page, 'Tune');
    const a = (await tune.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + 20);
    await page.mouse.down();
    await page.mouse.move(a.x - 400, a.y + 160, { steps: 10 });
    await page.mouse.up();
    const b = (await tune.boundingBox())!;
    expect(b.x).toBeLessThan(a.x - 350);
    await expect(win(page, 'Tune')).toHaveCount(0); // a drag never opens
    // Far past the edge, an icon stops at the desktop's edge.
    await page.mouse.move(b.x + b.width / 2, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(-500, b.y + 20, { steps: 10 });
    await page.mouse.up();
    expect((await tune.boundingBox())!.x).toBeGreaterThanOrEqual(0);
    await shot(page, 'icons-moved');
    await page.reload();
    await closeAll(page);
    expect((await tune.boundingBox())!.x).toBeLessThan(a.x - 350); // remembered
    await menu(page, 'View', 'Clean Up Desktop');
    await expect.poll(async () => Math.round((await tune.boundingBox())!.x)).toBe(Math.round(a.x));
    // Keyboard selection still opens it.
    await tune.focus();
    await page.keyboard.press('Enter');
    await expect(win(page, 'Tune')).toBeVisible();
  });

  test('a desktop position never strands an icon: phones ignore it, smaller windows clamp it, and it returns intact', async ({ page }) => {
    test.skip(phone(page), 'Starts with a mouse drag on the desktop layout.');
    await page.goto('/');
    await closeAll(page);
    const tune = icon(page, 'Tune');
    const a = (await tune.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + 20);
    await page.mouse.down();
    await page.mouse.move(a.x - 480, a.y + 420, { steps: 10 }); // far left and low
    await page.mouse.up();
    const dragged = (await tune.boundingBox())!;
    // Phone layout: the grid ignores the desktop offset and the icon is fully on screen.
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(tune).toHaveCSS('transform', 'none');
    const p = (await tune.boundingBox())!;
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x + p.width).toBeLessThanOrEqual(375);
    // A smaller desktop window: the icon is shown clamped inside the surface.
    await page.setViewportSize({ width: 900, height: 520 });
    await expect.poll(async () => { const b = (await tune.boundingBox())!; return b.x >= 0 && b.y + b.height <= 520 && b.x + b.width <= 900; }).toBe(true);
    // Back at full size, the saved position is intact.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect.poll(async () => { const b = (await tune.boundingBox())!; return [Math.round(b.x), Math.round(b.y)]; }).toEqual([Math.round(dragged.x), Math.round(dragged.y)]);
  });
});

test.describe('touch tablet', () => {
  test.use({ hasTouch: true });

  test('a native finger drag carries a Distractions item to the Trash without the browser cancelling it as a pan', async ({ page }) => {
    test.skip(phone(page), 'Phones select and press Move to Trash; item dragging is for the desktop layout.');
    await page.goto('/');
    await closeAll(page);
    await openIcon(page, 'Distractions');
    const folder = win(page, 'Distractions');
    const cdp = await page.context().newCDPSession(page);
    const from = (await folder.getByRole('option', { name: 'Group chat' }).boundingBox())!;
    const to = (await trashIcon(page).boundingBox())!;
    const cancels = await page.evaluateHandle(() => { const c = { n: 0 }; window.addEventListener('pointercancel', () => c.n++); return c; });
    const point = (x: number, y: number) => [{ x: Math.round(x), y: Math.round(y) }];
    const [x0, y0, x1, y1] = [from.x + from.width / 2, from.y + 20, to.x + to.width / 2, to.y + 20];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x0, y0) });
    for (let i = 1; i <= 14; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x0 + ((x1 - x0) * i) / 14, y0 + ((y1 - y0) * i) / 14) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await cancels.evaluate((c) => c.n)).toBe(0);
    await expect(folder.getByRole('option', { name: 'Group chat' })).toHaveCount(0);
    await expect(folder.getByRole('option')).toHaveCount(4);
  });
});
