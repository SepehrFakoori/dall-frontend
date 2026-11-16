import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './sign-in';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});
test('directory restore reports errors inside the dialog and requires write access', async ({
  page,
}) => {
  await page.goto('/settings');
  const restoreButton = page.getByRole('button', { name: 'Restore sample directory' });
  await page.getByRole('button', { name: 'Fail next API request' }).click();
  await restoreButton.click();
  const dialog = page.getByRole('alertdialog');
  const confirm = dialog.getByRole('button', { name: 'Restore samples' });
  await confirm.click();
  await expect(dialog.getByRole('alert')).toContainText('Unable to reach the service');
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Sample directory restored', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Switch demo role/ }).click();
  await expect(restoreButton).toHaveCount(0);
});
test('failed form submission preserves input and duplicate errors are inline', async ({ page }) => {
  await page.goto('/members');
  await page.waitForSelector('tbody tr');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Fail next API request' }).click();
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await page.getByRole('link', { name: 'Add member', exact: true }).click();
  await page.getByLabel('Full name').fill('Recovery Person');
  await page.getByLabel('Username').fill('recovery.person');
  await page.getByLabel('Email address').fill('recovery@example.com');
  await page.getByRole('button', { name: 'Create member' }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to reach the service');
  await expect(page.getByLabel('Full name')).toHaveValue('Recovery Person');
  await page.getByRole('button', { name: 'Create member' }).click();
  await expect(page.getByRole('heading', { name: 'Recovery Person', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Edit member' }).click();
  await page.getByLabel('Email address').fill('sara.ahmadi@example.com');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('This email is already in the directory.')).toBeVisible();
});
test('regional controls, mobile navigation and keyboard dialog', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('combobox', { name: 'Interface language' }).selectOption('fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('radio', { name: 'تیره', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('combobox', { name: 'تقویم', exact: true }).selectOption('persian');
  await page.getByRole('combobox', { name: 'زبان رابط', exact: true }).selectOption('en');
  await expect(page.getByRole('combobox', { name: 'Calendar', exact: true })).toHaveValue(
    'persian',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Members', level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: 'Component library' }).click();
  await page.getByRole('button', { name: 'Open dialog', exact: true }).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).press('Escape');
  await expect(page.getByRole('button', { name: 'Open dialog', exact: true })).toBeFocused();
});
test('remaining screens are accessible and contained across regional layouts', async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [1440, 390])
    for (const language of ['en', 'fa'])
      for (const theme of ['light', 'dark']) {
        await page.addInitScript(
          ({ language, theme }) =>
            localStorage.setItem('dall.preferences', JSON.stringify({ language, theme })),
          { language, theme },
        );
        await page.setViewportSize({ width, height: 1000 });
        for (const route of ['/', '/members/new', '/members/M-0001', '/settings']) {
          await page.goto(route);
          await expect(page.locator('h1')).toBeVisible();
          const result = await new AxeBuilder({ page }).analyze();
          expect(result.violations, `${route}-${width}-${language}-${theme}`).toEqual([]);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            route,
          ).toBe(true);
          await page.screenshot({
            path: `test-results/screen-${route.replaceAll('/', '_') || 'overview'}-${width}-${language}-${theme}.png`,
            fullPage: true,
          });
        }
      }
});
test('directory search, filters, pagination and selection', async ({ page }) => {
  await page.goto('/members');
  await expect(page.getByText('1–8 of 24 members')).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('searchbox').fill('Sara');
  await expect(page.getByText('1–1 of 1 members')).toBeVisible();
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('inactive');
  await expect(page.getByText('No matching members')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select this page' }).check();
  await page.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm deactivation' }).click();
  await expect(page.getByText('Members deactivated', { exact: true })).toBeVisible();
});
test('validation, creation, edit, duplicate and unsaved change protection', async ({ page }) => {
  await page.goto('/members/new');
  await page.getByRole('button', { name: 'Create member' }).click();
  await expect(page.getByText('Enter at least two characters.')).toBeVisible();
  await page.getByLabel('Full name').fill('Integration Member');
  await page.getByLabel('Username').fill('integration.member');
  await page.getByLabel('Email address').fill('integration@example.com');
  await page.getByRole('button', { name: 'Create member' }).click();
  await expect(page.getByRole('heading', { name: 'Integration Member', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Edit member' }).click();
  await page.getByLabel('Full name').fill('Updated Member');
  await page.getByRole('link', { name: 'Back to members' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Updated Member', level: 1 })).toBeVisible();
});
test('failure recovery and read-only route guard', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Fail next API request' }).click();
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Unable to reach the service. Your changes have not been saved.',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: /Switch demo role/ }).click();
  await expect(page.getByRole('link', { name: 'Add member' })).toHaveCount(0);
  await page.goto('/members/new');
  /* Reload starts a fresh demo session. */ await page
    .getByRole('button', { name: 'Account menu' })
    .click();
  await page.getByRole('menuitem', { name: /Switch demo role/ }).click();
  await expect(page.getByText('You do not have permission to view this page.')).toBeVisible();
});
test('responsive light/dark LTR/RTL and accessibility', async ({ page }) => {
  for (const width of [1440, 820, 390]) {
    for (const language of ['en', 'fa']) {
      for (const theme of ['light', 'dark']) {
        await page.addInitScript(
          ({ language, theme }) =>
            localStorage.setItem('dall.preferences', JSON.stringify({ language, theme })),
          { language, theme },
        );
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/members');
        await page.waitForSelector('tbody tr');
        await page.evaluate(() => document.fonts.ready);
        if (language === 'fa') {
          expect(
            await page.locator('h1').evaluate((element) => getComputedStyle(element).fontFamily),
          ).toContain('IRANSansX');
          expect(
            await page.evaluate(() =>
              [...document.fonts].some(
                (font) => font.family === 'IRANSansX' && font.status === 'loaded',
              ),
            ),
          ).toBe(true);
        }
        await expect(page.locator('html')).toHaveAttribute(
          'dir',
          language === 'fa' ? 'rtl' : 'ltr',
        );
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
          console.log(
            await page.evaluate(() => ({
              width: innerWidth,
              scroll: document.documentElement.scrollWidth,
              elements: [...document.querySelectorAll('*')]
                .filter((el) => el.getBoundingClientRect().right > innerWidth)
                .map((el) => ({
                  tag: el.tagName,
                  cls: el.className,
                  width: el.getBoundingClientRect().width,
                }))
                .slice(0, 15),
            })),
          );
          await page.screenshot({ path: 'test-results/overflow.png', fullPage: true });
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${width}-${language}-${theme}`,
        ).toBe(true);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
        await page.screenshot({
          path: `test-results/directory-${width}-${language}-${theme}.png`,
          fullPage: true,
        });
      }
    }
  }
});
