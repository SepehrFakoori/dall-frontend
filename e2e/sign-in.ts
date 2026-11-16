import { expect, type Page } from '@playwright/test';

export async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill('demo');
  await page.getByLabel('Password', { exact: true }).fill('Dall-Demo-2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
}
