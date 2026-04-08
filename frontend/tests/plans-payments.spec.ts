import { test, expect } from '@playwright/test';

test.describe('Gestión de Planes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    await page.goto('/admin/plans');
  });

  test('debería mostrar la página de planes', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Planes');
  });

  test('debería tener botón para crear plan', async ({ page }) => {
    await expect(page.locator('button:has-text("Crear plan")')).toBeVisible();
  });
});

test.describe('Gestión de Pagos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    await page.goto('/admin/payments');
  });

  test('debería mostrar la página de pagos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Pagos');
  });

  test('debería tener controles de filtro por mes y año', async ({ page }) => {
    await expect(page.locator('select').first()).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
  });

  test('debería mostrar el dashboard correctamente', async ({ page }) => {
    await expect(page.locator('.dashboard-title')).toContainText('Dashboard');
  });

  test('debería mostrar estadísticas en el dashboard', async ({ page }) => {
    await expect(page.locator('.dashboard-stats')).toBeVisible();
  });
});

test.describe('Ejercicios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    await page.goto('/admin/exercises');
  });

  test('debería mostrar la página de ejercicios', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ejercicios');
  });

  test('debería tener botón para crear ejercicio', async ({ page }) => {
    await expect(page.locator('button:has-text("Crear ejercicio")')).toBeVisible();
  });
});

test.describe('Rutinas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    await page.goto('/admin/routines');
  });

  test('debería mostrar la página de rutinas', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Rutinas');
  });

  test('debería tener botón para crear rutina', async ({ page }) => {
    await expect(page.locator('button:has-text("Crear rutina")')).toBeVisible();
  });
});
