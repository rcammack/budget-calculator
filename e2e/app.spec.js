import { expect, test } from '@playwright/test'

test.describe('Home Affordability Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so defaults are always used
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  // ── Page structure ─────────────────────────────────────────────
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

  // ── Mode toggle ────────────────────────────────────────────────
  test('defaults to Affordability mode', async ({ page }) => {
    const affordabilityBtn = page.getByRole('button', { name: 'Affordability' })
    await expect(affordabilityBtn).toHaveClass(/active/)
  })

  test('tax rate field is visible in Affordability mode and hidden in Lender mode', async ({ page }) => {
    await expect(page.getByLabel(/Effective tax rate/)).toBeVisible()

    await page.getByRole('button', { name: 'Lender' }).click()
    await expect(page.getByLabel(/Effective tax rate/)).not.toBeVisible()
  })

  test('result card shows take-home label in Affordability mode', async ({ page }) => {
    await expect(page.getByText(/Est\. monthly take-home/)).toBeVisible()
  })

  test('result card shows gross income label in Lender mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Lender' }).click()
    await expect(page.getByText(/Gross monthly income/)).toBeVisible()
  })

  test('Lender mode produces higher home prices than Affordability mode', async ({ page }) => {
    const getPrice = async () => {
      const text = await page.locator('tr.recommended td:nth-child(2)').first().textContent()
      return parseInt(text.replace(/[^0-9]/g, ''), 10)
    }

    const affordabilityPrice = await getPrice()

    await page.getByRole('button', { name: 'Lender' }).click()
    await page.waitForTimeout(100)

    const lenderPrice = await getPrice()

    expect(lenderPrice).toBeGreaterThan(affordabilityPrice)
  })

  // ── 401(k) ─────────────────────────────────────────────────────
  test('401k fields are visible', async ({ page }) => {
    await expect(page.getByLabel('Employee contribution ($/yr)').first()).toBeVisible()
    await expect(page.getByLabel('Employer match (%)').first()).toBeVisible()
  })

  test('401k deduction reduces the affordability home price', async ({ page }) => {
    const getPrice = async () => {
      const text = await page.locator('tr.recommended td:nth-child(2)').first().textContent()
      return parseInt(text.replace(/[^0-9]/g, ''), 10)
    }

    const withContribution = await getPrice()

    // Clear the 401k contribution so it has no effect
    await page.getByLabel('Employee contribution ($/yr)').first().fill('0')
    await page.getByLabel('Employee contribution ($/yr)').first().blur()
    await page.waitForTimeout(100)

    const withoutContribution = await getPrice()

    expect(withoutContribution).toBeGreaterThan(withContribution)
  })

  test('401k has no effect in Lender mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Lender' }).click()
    await page.waitForTimeout(100)

    const getPrice = async () => {
      const text = await page.locator('tr.recommended td:nth-child(2)').first().textContent()
      return parseInt(text.replace(/[^0-9]/g, ''), 10)
    }

    const before = await getPrice()

    await page.getByLabel('Employee contribution ($/yr)').first().fill('0')
    await page.getByLabel('Employee contribution ($/yr)').first().blur()
    await page.waitForTimeout(100)

    const after = await getPrice()

    expect(before).toBe(after)
  })

  test('investment returns do not affect Lender mode price', async ({ page }) => {
    await page.getByRole('button', { name: 'Lender' }).click()
    await page.waitForTimeout(100)

    const getPrice = async () => {
      const text = await page.locator('tr.recommended td:nth-child(2)').first().textContent()
      return parseInt(text.replace(/[^0-9]/g, ''), 10)
    }

    const before = await getPrice()

    // Enter a large HYSA balance — its return should not change lender mode price
    await page.getByRole('button', { name: /Investment Accounts/ }).click()
    // First input in first investment row is the HYSA balance field
    await page.locator('.investment-row').first().locator('input').first().fill('500000')
    await page.locator('.investment-row').first().locator('input').first().blur()
    await page.waitForTimeout(100)

    const after = await getPrice()
    expect(before).toBe(after)
  })

  test('lender mode note is visible and disappears in affordability mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Lender' }).click()
    await expect(page.locator('.mode-note')).toBeVisible()

    await page.getByRole('button', { name: 'Affordability' }).click()
    await expect(page.locator('.mode-note')).not.toBeVisible()
  })

  // ── Tax rate auto-adjust ───────────────────────────────────────
  test('tax rate auto-adjusts when partner is added', async ({ page }) => {
    const taxInput = page.getByLabel(/Effective tax rate/)
    await expect(taxInput).toHaveValue('30')

    await page.getByLabel('Add partner income').check()
    await expect(taxInput).toHaveValue('28')
  })

  test('tax rate does not auto-adjust if manually changed', async ({ page }) => {
    await page.getByLabel(/Effective tax rate/).fill('25')
    await page.getByLabel(/Effective tax rate/).blur()

    await page.getByLabel('Add partner income').check()
    await expect(page.getByLabel(/Effective tax rate/)).toHaveValue('25')
  })

  // ── Partner income ────────────────────────────────────────────
  test('shows combined income section when partner toggle is checked', async ({ page }) => {
    await expect(page.getByText('Combined Income')).not.toBeVisible()
    await page.getByLabel('Add partner income').check()
    await expect(page.getByText('Combined Income')).toBeVisible()
  })

  test('partner 401k fields appear when partner is added', async ({ page }) => {
    await page.getByLabel('Add partner income').check()
    // Two sets of contribution fields should now be visible
    await expect(page.getByLabel('Employee contribution ($/yr)')).toHaveCount(2)
  })

  // ── Investment accounts ───────────────────────────────────────
  test('investment accounts section can be expanded', async ({ page }) => {
    await expect(page.locator('.investment-inputs')).not.toBeVisible()
    await page.getByRole('button', { name: /Investment Accounts/ }).click()
    await expect(page.locator('.investment-inputs')).toBeVisible()
  })

  test('ESPP row is visible in investment accounts', async ({ page }) => {
    await page.getByRole('button', { name: /Investment Accounts/ }).click()
    await expect(page.getByText(/ESPP/)).toBeVisible()
  })

  // ── Misc ──────────────────────────────────────────────────────
  test('updates results when primary salary changes', async ({ page }) => {
    const firstPrice = await page.locator('tr.recommended td:nth-child(2)').first().textContent()

    await page.getByLabel('Primary annual salary').fill('200000')
    await page.getByLabel('Primary annual salary').blur()
    await page.waitForTimeout(100)

    const newPrice = await page.locator('tr.recommended td:nth-child(2)').first().textContent()
    expect(newPrice).not.toBe(firstPrice)
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
