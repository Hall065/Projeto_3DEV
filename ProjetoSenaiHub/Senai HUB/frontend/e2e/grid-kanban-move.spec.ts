import { expect, test } from '@playwright/test'

const mockUser = {
  id: 2,
  name: 'Chefe Manutencao',
  email: 'chefe.grid@senai.local',
  role: 'grid_chefe',
  permissions: ['grid.access', 'grid.dashboard', 'grid.tickets.view', 'grid.tickets.manage'],
  application_slugs: ['grid'],
}

const mockTicket = {
  id: 1,
  code: 'GRD-0001',
  title: 'Ar condicionado com vazamento',
  status: 'aberto',
  priority: 'alta',
  requester: 'Prof. Silva',
  room: '203',
  block: 'B',
  assignee: null,
  workflow_locked: false,
  opened_at: new Date().toISOString(),
}

test.describe('Grid kanban move confirm', () => {
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

    await page.route('**/api/grid/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { kpis: {}, kpi_sparklines: {}, report_kpis: {} } }),
      })
    })

    await page.route('**/api/grid/tickets**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { ...mockTicket, status: 'pendente' } }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockTicket],
          meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
        }),
      })
    })

    await page.addInitScript(() => {
      localStorage.setItem('senai_hub_token', 'e2e-kanban-token')
      localStorage.setItem('senai_hub_user', JSON.stringify(mockUser))
    })
  })

  test('dragging ticket shows confirm modal with assignee warning', async ({ page }) => {
    await page.goto('/grid/chamados')

    await expect(page.getByText(/GRD-0001/i)).toBeVisible()

    const card = page.locator('[data-kanban-card="1"]')
    const pendingColumn = page.locator('[data-kanban-column="pendente"]')

    await card.dragTo(pendingColumn)

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Confirmar|Confirm/i)).toBeVisible()
  })
})
