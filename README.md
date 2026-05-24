# Home Affordability Calculator

Progressive Web App (PWA) for estimating home affordability in Honolulu, HI. Supports two calculation modes — one for personal budgeting, one for lender qualification — with investment account tracking and a market race projection.

## Modes

### Affordability Mode
Answers: *"What can I actually afford each month?"*

Applies your effective tax rate to gross income, then limits housing to **25% of monthly take-home** after 401(k) deductions. A cost-of-living adjustment (default 10%) trims the budget further to account for Honolulu's elevated non-housing expenses. This mode also unlocks the Spending panel, Budget Breakdown chart, Down Payment Advice, and Market Race sections.

Use this mode to understand real cash-flow impact before committing to a purchase.

### Lender Mode
Answers: *"What will a bank approve me for?"*

Uses the standard **28/36 DTI rule** on gross income — no tax haircut, no COL adjustment. This mirrors how lenders qualify borrowers and typically produces a 30–40% higher number than Affordability mode. Investment returns are excluded since lenders require a 2-year documented history.

Use this mode to understand your maximum loan approval ceiling.

## Features

- **Dual modes** — Affordability (take-home / 25% rule) and Lender (gross / 28/36 rule)
- **Solo and combined income** — toggle partner income for a side-by-side comparison
- **Investment accounts** — HYSA, CDs, stocks, savings, and ESPP with weighted return rate
- **401(k) modeling** — pre-tax employee contribution reduces taxable income; employer match displayed separately
- **Down payment scenarios** — 10%, 20%, 25%, 30%
- **Credit score impact** — rate factor applied per credit band
- **Spending panel** — track recurring expenses (monthly or annual); feeds into budget breakdown and market race
- **Budget Breakdown chart** — donut chart showing housing / spending / leftover as a share of take-home
- **Down Payment Advice** — compares putting 20% down vs investing the difference
- **Market Race** — projects whether your portfolio grows fast enough to keep the mortgage affordable as home prices appreciate
- **Honolulu-specific defaults** — property tax (0.28%), HOA ($750/mo), insurance, cost-of-living adjustment
- **Input persistence** — all inputs saved to localStorage
- **Installable PWA** with offline support

## Calculation Details

### Affordability Mode — Monthly Take-Home

```
take-home = (salary + investment returns − 401k contribution) × (1 − effective tax rate)
```

- **Investment returns** are included because they represent real recurring income.
- **401(k) contribution** is subtracted *before* applying the tax rate — it reduces your taxable income, so you get the tax benefit.
- **Effective tax rate** should be your blended rate: federal + Hawaii state + FICA. ~30% is typical for Hawaii at a $150k salary.

### Housing Budget

```
max monthly housing = take-home × 25% × (1 − COL adjustment)
```

The 25% rule is a personal finance guideline for avoiding being "house poor." The cost-of-living adjustment (default 10%) trims further because non-housing expenses in Honolulu are ~10% higher than the mainland — groceries, gas, utilities — leaving less room for housing.

The budget is then multiplied by a credit score factor: a 760+ score unlocks the best mortgage rate, which increases purchasing power slightly.

### Max Home Price (per down payment %)

Given a max monthly housing budget, the app solves algebraically for the largest home price where:

```
P&I payment + property tax + HOA + insurance ≤ monthly housing budget
```

Property tax and fixed costs are subtracted first, leaving a residual for principal and interest. That residual is fed into the standard loan amortization formula to find the maximum loan size, then divided by `(1 − down%)` to get the home price.

### Lender Mode — 28/36 Rule

```
front-end cap = gross monthly income × 28%
back-end cap  = gross monthly income × 36% − monthly debts
housing budget = min(front-end cap, back-end cap)
```

No tax haircut is applied. Investment returns are excluded since lenders require a 2-year documented history. This produces a higher number than Affordability mode — it's the bank's ceiling, not a comfortable floor.

### Investment Account Returns

Each account earns `balance × rate%` annually, except ESPP:

```
ESPP: purchase at 10% discount → shares worth balance / 0.90
gain = (shares − balance) + shares × stock appreciation rate
```

The weighted return rate across all accounts is used in the Market Race projection.

### Market Race — Mortgage Affordability Gap

For each projected year:

1. **Home price** grows at the housing appreciation rate (default 5%/yr, Oahu historical avg).
2. **Required down payment** is calculated as the minimum down needed so the monthly P&I + tax fits your current housing budget at that year's home price. As prices rise, more down is needed.
3. **Portfolio** compounds at the weighted investment return rate, plus annual investable income (take-home minus spending).
4. **Gap** = required down − portfolio. Negative means the mortgage is already affordable.

The verdict is "getting more affordable" if the gap is shrinking — your portfolio is outpacing the rising down payment hurdle. It's "getting less affordable" if home prices are rising faster in absolute dollar terms than your portfolio.

### Down Payment Advice

Compares two scenarios at the recommended home price:
- **Put 20% down** — lower monthly payment, no PMI, standard loan.
- **Put 10% down, invest the difference** — higher monthly payment, but the saved down payment compounds in your investment portfolio.

The break-even point is the year at which the invested difference surpasses the cumulative mortgage savings from the larger down payment.



```bash
npm install
npm run dev
```

## Test

```bash
npm test -- --run        # unit tests
npm run build
npm run test:e2e         # end-to-end tests (requires build)
```

## Build

```bash
npm run build
```

## Deploy

The app is configured for GitHub Pages at [https://rcammack.github.io/budget-calculator/](https://rcammack.github.io/budget-calculator/) with base path `/budget-calculator/`.

Deployments are triggered automatically on every push to `main` via GitHub Actions. If the page appears blank after a new deployment, do a hard refresh (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows/Linux) to bypass the browser cache.
