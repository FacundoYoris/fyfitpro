import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('debería mostrar la página de login correctamente', async ({ page }) => {
    await expect(page.locator('.login-logo')).toBeVisible();
    await expect(page.locator('.login-subtitle')).toContainText('Gestión integral del gimnasio');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debería iniciar sesión exitosamente con credenciales válidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin/dashboard', { timeout: 10000 });
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.alert-danger')).toContainText('Credenciales inválidas');
  });

  test('debería mostrar error con email vacío', async ({ page }) => {
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('input:invalid')).toBeVisible();
  });

  test('debería mostrar error con password vacío', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('input:invalid')).toBeVisible();
  });

  test('debería mantener los datos en los campos tras un error', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('input[type="email"]')).toHaveValue('test@test.com');
  });
});
