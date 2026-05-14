import { expect, test } from '@playwright/test'

test.describe('Home Affordability Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads and displays the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Home Affordability Calculator/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Home Affordability Calculator',
    )
  })

  test('shows income and affordability input sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Income Inputs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Affordability Inputs' })).toBeVisible()
  })

  test('displays a results table with 4 down payment rows', async ({ page }) => {
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(4)
  })

  test('highlights exactly one recommended row', async ({ page }) => {
    const recommended = page.locator('tr.recommended')
    await expect(recommended).toHaveCount(1)
  })

  test('updates results when primary salary changes', async ({ page }) => {
    const firstPrice = await page.locator('tr.recommended td:nth-child(2)').textContent()

    await page.getByLabel('Primary annual salary').fill('200000')
    await page.getByLabel('Primary annual salary').blur()

    const newPrice = await page.locator('tr.recommended td:nth-child(2)').textContent()
    expect(newPrice).not.toBe(firstPrice)
  })

  test('shows combined income section when partner toggle is checked', async ({ page }) => {
    await expect(page.getByText('Combined Income')).not.toBeVisible()

    await page.getByLabel('Add partner income').check()

    await expect(page.getByText('Combined Income')).toBeVisible()
  })

  test('theme switcher changes the data-theme attribute', async ({ page }) => {
    await page.getByLabel('Color theme').selectOption('dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByLabel('Color theme').selectOption('hc')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'hc')

    await page.getByLabel('Color theme').selectOption('light')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('persists inputs across page reload', async ({ page }) => {
    await page.getByLabel('Primary annual salary').fill('150000')
    await page.reload()
    await expect(page.getByLabel('Primary annual salary')).toHaveValue('150000')
  })
})
