import { expect, test } from '@playwright/test'

const mockUser = {
  id: 2,
  name: 'Chefe Manutencao',
  email: 'chefe.grid@senai.local',
  role: 'grid_chefe',
  permissions: ['grid.access', 'grid.dashboard', 'grid.controle', 'grid.tickets.view', 'grid.tickets.manage'],
  application_slugs: ['grid'],
}

test.describe('Grid controle', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockUser }),
      })
    })

    await page.route('**/api/auth/permissions-catalog**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { roles: {}, role_permissions: {}, nav_permissions: {}, application_slugs_by_role: {} } }),
      })
    })

    await page.route('**/api/grid/tickets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              code: 'GRD-0001',
              title: 'Ar condicionado com vazamento',
              status: 'aberto',
              priority: 'alta',
              requester: 'Prof. Silva',
              room: '203',
              block: 'B',
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 150, total: 1 },
        }),
      })
    })

    await page.route('**/api/grid/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 10, name: 'Tecnico Joao', role: 'Técnico de manutenção' }],
          meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
        }),
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('senai_hub_token', 'e2e-grid-token')
      localStorage.setItem(
        'senai_hub_user',
        JSON.stringify({
          id: 2,
          name: 'Chefe Manutencao',
          email: 'chefe.grid@senai.local',
          role: 'grid_chefe',
          permissions: ['grid.access', 'grid.dashboard', 'grid.controle', 'grid.tickets.view', 'grid.tickets.manage'],
          application_slugs: ['grid'],
        }),
      )
    })
  })

  test('controle page lists tickets and shows workflow panel', async ({ page }) => {
    await page.goto('/grid/controle')

    await expect(page.getByText(/GRD-0001/i)).toBeVisible()
    await page.getByText(/GRD-0001/i).click()
    await expect(page.getByText(/Ar condicionado com vazamento/i)).toBeVisible()
    await expect(page.getByText(/Atribuir técnico|Assign technician/i)).toBeVisible()
  })
})
