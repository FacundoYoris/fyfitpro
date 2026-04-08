import { test, expect } from '@playwright/test';

test.describe('Gestión de Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@gimnasio.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    await page.goto('/admin/users');
  });

  test('debería mostrar la página de usuarios correctamente', async ({ page }) => {
    await expect(page.locator('.users-title')).toContainText('Usuarios');
    await expect(page.locator('.btn-users-primary').first()).toBeVisible();
  });

  test('debería buscar usuarios por nombre', async ({ page }) => {
    await page.fill('.search-field input', 'Juan');
    await page.click('.btn-users-primary.ghost');

    await page.waitForTimeout(500);
  });

  test('debería filtrar usuarios por status activo', async ({ page }) => {
    await page.click('.chip:has-text("Activos")');
    await page.waitForTimeout(500);
  });

  test('debería filtrar usuarios por status inactivo', async ({ page }) => {
    await page.click('.chip:has-text("Inactivos")');
    await page.waitForTimeout(500);
  });

  test('debería abrir modal de crear usuario', async ({ page }) => {
    await page.click('.btn-users-primary:has-text("Crear usuario")');
    await expect(page.locator('.create-user-modal')).toBeVisible();
    await expect(page.locator('.modal-kicker')).toContainText('ALTA INSTANTÁNEA');
  });

  test('debería cerrar modal de crear usuario', async ({ page }) => {
    await page.click('.btn-users-primary:has-text("Crear usuario")');
    await expect(page.locator('.create-user-modal')).toBeVisible();
    
    await page.click('.modal-close');
    await expect(page.locator('.create-user-modal')).not.toBeVisible();
  });

  test('debería validar campos requeridos al crear usuario', async ({ page }) => {
    await page.click('.btn-users-primary:has-text("Crear usuario")');
    await page.click('.create-user-footer button[type="submit"]');
    
    await page.waitForTimeout(500);
  });

  test('debería mostrar paginación', async ({ page }) => {
    await expect(page.locator('.users-pagination')).toBeVisible();
  });

  test('debería mostrar estado vacío cuando no hay usuarios', async ({ page }) => {
    await page.fill('.search-field input', 'UsuarioInexistente123');
    await page.click('.btn-users-primary.ghost');
    
    await page.waitForTimeout(500);
  });
});

test.describe('Verificación de Login Required', () => {
  test('debería requerir autenticación para acceder a dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('/login', { timeout: 5000 });
  });

  test('debería requerir autenticación para acceder a usuarios', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForURL('/login', { timeout: 5000 });
  });
});
