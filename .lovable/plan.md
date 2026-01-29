
# Cap Table Implementation Plan

## Overview
Add a dedicated "Cap Table" page below Analytics in the navigation that displays your fundraising progress with capital raised breakdowns by investor.

## What You'll Get

### 1. New Cap Table Page
A professional fundraising dashboard showing:
- **Total Capital Raised** - Sum of all committed investments
- **Number of Investors** - Count of committed/closed investors  
- **Average Investment Size** - Calculated from commitments
- **Fundraising Progress** - Visual progress bar toward your target

### 2. Investor Breakdown Table
A detailed table with columns:
- Investor Name
- Organization
- Commitment Amount
- Percentage of Total Raised
- Stage (Committed/Closed)
- Commitment Date

### 3. Visual Charts
- Pie chart showing capital distribution by investor
- Bar chart comparing commitment amounts

### 4. Empty State
When no commitments exist, shows a helpful prompt to add investors via the Investors page.

---

## Technical Implementation

### Files to Create

**`src/pages/CapTable.tsx`**
- New page component that fetches from `investor_deals` table
- Filters for investors with `stage` = 'committed' or 'closed'
- Uses `commitment_amount` field for calculations
- Includes search/filter functionality
- Mobile-responsive design matching existing pages

### Files to Modify

**`src/components/layout/Sidebar.tsx`**
- Add new navigation item after Analytics:
```typescript
{ name: 'Cap Table', href: '/cap-table', icon: PieChart }
```

**`src/App.tsx`**
- Add new route:
```typescript
<Route path="/cap-table" element={<CapTable />} />
```

### Data Source
The `investor_deals` table already has:
- `commitment_amount` (number) - The investment amount
- `stage` (enum) - Filter for 'committed' and 'closed' stages
- `name` and `organization` - Investor identification
- `created_at`/`updated_at` - For tracking commitment dates

No database changes required - we'll use existing data.

### UI Components Used
- Existing `PageHeader` component
- Existing `Card` components with `goldman-card` styling
- Recharts library (already installed) for pie/bar charts
- Existing table styling from other pages

---

## Page Layout

```text
+------------------------------------------+
|  Cap Table                    [Export]   |
|  Track your fundraising progress         |
+------------------------------------------+
|  +--------+  +--------+  +--------+      |
|  | $XXX K |  | XX     |  | $XX K  |      |
|  | Raised |  | Invest |  | Avg    |      |
|  +--------+  +--------+  +--------+      |
+------------------------------------------+
|  Progress: ████████░░░░ 65% of $1M goal  |
+------------------------------------------+
|  +-----------------+  +----------------+ |
|  | Pie Chart       |  | Bar Chart      | |
|  | (Distribution)  |  | (Commitments)  | |
|  +-----------------+  +----------------+ |
+------------------------------------------+
|  Investor Table                          |
|  Name | Org | Amount | % | Stage | Date  |
|  ----------------------------------------|
|  John  | ABC | $50K  | 25%| Commit| 1/29 |
|  Jane  | XYZ | $75K  | 37%| Closed| 1/28 |
+------------------------------------------+
```

---

## Summary
This implementation leverages existing investor data and UI patterns for a consistent experience. The cap table will automatically update as you move investors to "Committed" or "Closed" stages and enter their commitment amounts.

