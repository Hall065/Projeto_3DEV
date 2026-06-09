import { expect, test } from '@playwright/test'

test.describe('SENAI HUB smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /entrar|sign in|login/i }).first()).toBeVisible()
  })

  test('login page shows access request link', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /acesse|sign in|acceda/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /solicitar|request access/i })).toBeVisible()
  })

  test('request access form submits', async ({ page }) => {
    await page.route('**/api/access-requests', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Solicitacao recebida.', data: { id: 1 } }),
      })
    })

    await page.goto('/solicitar-acesso')
    await page.getByLabel(/nome|name/i).fill('Usuario Teste')
    await page.getByLabel(/e-mail|email|correo/i).fill('teste@example.com')
    await page.getByRole('button', { name: /enviar|submit/i }).click()
    await expect(page.getByText(/recebida|received/i)).toBeVisible()
  })
})
