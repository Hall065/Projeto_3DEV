import { expect, test } from '@playwright/test'

const mockAqv = {
  id: 30,
  name: 'Ana AQV',
  email: 'ana.aqv@safe.senai.local',
  role: 'safe_aqv',
  permissions: ['safe.access', 'safe.dashboard', 'safe.students.manage', 'safe.authorizations.manage'],
  application_slugs: ['safe'],
}

test.describe('SAFE module', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockAqv }),
      })
    })

    await page.route('**/api/auth/permissions-catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { roles: {}, role_permissions: {}, nav_permissions: {}, application_slugs_by_role: {} } }),
      })
    })

    await page.route('**/api/safe/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            pending_teacher: 2,
            pending_portaria: 1,
            finalized_today: 3,
            students_total: 12,
          },
        }),
      })
    })

    await page.route('**/api/safe/authorizations**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 1,
                protocol: 'SAFE-2026-0001',
                student_name: 'Joao Silva',
                type: 'saida',
                status: 'aguardando_professor',
                scheduled_at: new Date().toISOString(),
              },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
          }),
        })
        return
      }
      await route.continue()
    })

    await page.addInitScript(() => {
      localStorage.setItem('senai_hub_token', 'e2e-safe-token')
      localStorage.setItem(
        'senai_hub_user',
        JSON.stringify({
          id: 30,
          name: 'Ana AQV',
          email: 'ana.aqv@safe.senai.local',
          role: 'safe_aqv',
          permissions: ['safe.access', 'safe.dashboard', 'safe.students.manage', 'safe.authorizations.manage'],
          application_slugs: ['safe'],
        }),
      )
    })
  })

  test('SAFE dashboard and authorizations list render', async ({ page }) => {
    await page.goto('/safe')

    await expect(page.getByText(/SAFE-2026-0001|Joao Silva|autoriza/i).first()).toBeVisible({ timeout: 15_000 })

    await page.goto('/safe/autorizacoes')
    await expect(page.getByText(/SAFE-2026-0001/i)).toBeVisible()
  })

  test('SAFE authorizations archive filter is available', async ({ page }) => {
    await page.goto('/safe/autorizacoes')
    await expect(page.getByLabel(/Situação|Status/i)).toBeVisible()
    await page.getByLabel(/Situação|Status/i).selectOption('finalizado')
    await expect(page.getByLabel(/Situação|Status/i)).toHaveValue('finalizado')
  })
})
