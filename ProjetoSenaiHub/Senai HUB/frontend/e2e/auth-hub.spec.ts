import { expect, test } from '@playwright/test'

const mockUser = {
  id: 1,
  name: 'Administrador SENAI',
  email: 'admin@senaihub.local',
  role: 'admin',
  permissions: ['hub.access', 'connect.access', 'grid.access', 'safe.access'],
  application_slugs: ['connect', 'grid', 'safe'],
}

test.describe('Authenticated hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'e2e-test-token',
          user: mockUser,
        }),
      })
    })

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockUser }),
      })
    })

    await page.route('**/api/applications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { slug: 'connect', name: 'SENAI Connect' },
            { slug: 'grid', name: 'SENAI Grid' },
            { slug: 'safe', name: 'SENAI SAFE' },
          ],
        }),
      })
    })

    await page.route('**/api/auth/permissions-catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            roles: {},
            role_permissions: {},
            nav_permissions: {},
            application_slugs_by_role: {},
          },
        }),
      })
    })
  })

  test('login redirects to hub with applications', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail|email|correo/i).fill('admin@senaihub.local')
    await page.getByLabel(/^senha$|password|contraseña/i).fill('password')
    await page.getByRole('button', { name: /entrar|sign in|iniciar/i }).click()

    await expect(page).toHaveURL(/\/hub/)
    await expect(page.getByText(/SENAI Connect|SENAI Grid|SENAI SAFE/i).first()).toBeVisible()
  })
})
