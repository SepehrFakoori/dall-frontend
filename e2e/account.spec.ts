import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { signIn } from './sign-in';

test('requires credentials, returns to the requested URL, and ends the session on sign-out', async ({
  page,
}) => {
  await page.goto('/members?status=active');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('link', { name: 'Members' })).toHaveCount(0);
  await page.getByLabel('Username', { exact: true }).fill('demo');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('wrong');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('The username or password is incorrect.');
  await password.fill('Dall-Demo-2026');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/members?status=active');
  await page.getByRole('link', { name: 'My account' }).click();
  await page.getByLabel('First name').fill('نیلوفر');
  await page.getByLabel('Last name').fill('Rezaei');
  await page.getByLabel('Email address').fill('invalid');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Email address').fill('nila@example.com');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Changes saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('First name')).toHaveValue('نیلوفر');
  await expect(page.getByLabel('Email address')).toHaveValue('nila@example.com');
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/login');
  await page.goBack();
  await expect(page).toHaveURL('/login');
  await expect(page.getByLabel('First name')).toHaveCount(0);
});

const directionOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).direction);
const startEdge = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().left);
for (const width of [390, 1440]) {
  test(`login and account follow the selected language at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    for (const lang of ['fa', 'en']) {
      await page
        .getByRole('button', { name: lang === 'fa' ? 'فارسی' : 'English', exact: true })
        .click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
      expect(await directionOf(page.locator('.login-fields'))).toBe(lang === 'fa' ? 'rtl' : 'ltr');
      const brandOnRight =
        (await startEdge(page.locator('.brand'))) >
        (await startEdge(page.locator('.login-masthead button')));
      expect(brandOnRight).toBe(lang === 'fa');
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    await signIn(page);
    await page.goto('/settings');
    await page.getByRole('combobox', { name: 'Interface language' }).selectOption('fa');
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'حساب من' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page
        .getByRole('heading', { level: 1 })
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain('IRANSansX');
    const firstName = page.getByLabel('نام', { exact: true });
    await firstName.fill('نیلوفر');
    expect(await directionOf(firstName)).toBe('rtl');
    await firstName.fill('Nila');
    expect(await directionOf(firstName)).toBe('ltr');
    expect(await directionOf(page.locator('input[type=email]'))).toBe('ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'منوی حساب' }).click();
    expect(await directionOf(page.getByRole('menu'))).toBe('rtl');
    await page.keyboard.press('Escape');
    await page.goto('/components');
    const general = page.getByRole('tab', { name: 'عمومی' });
    await general.focus();
    await general.press('ArrowLeft');
    await expect(page.getByRole('tab').nth(1)).toBeFocused();
    await page.goto('/settings');
    await page.getByRole('combobox', { name: 'زبان رابط' }).selectOption('en');
    await page.goto('/account');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.goto('/components');
    const englishTab = page.getByRole('tab', { name: 'General' });
    await englishTab.focus();
    await englishTab.press('ArrowRight');
    await expect(page.getByRole('tab').nth(1)).toBeFocused();
  });
}
