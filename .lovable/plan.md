# Acquire CRM: Relational Rebuild

This is a 4-phase plan. Each phase builds on the previous one — we have to do them in order. I'll pause for your approval between phases.

## Phase 1 — Fix the data model (foundation)

Right now Contacts, Deals and Companies are loose entities with text fields instead of references. Nothing joins. We fix that.

**Schema changes**

- `contacts.company_id` → FK to `companies.id` (keep `organization` text as fallback during migration, then drop later)
- `deals.broker_id` → FK to `contacts.id` (broker is a contact, not a separate brokers table — collapse `brokers` into `contacts` with `contact_type='intermediary'`)
- `deals.target_company_id` → FK to `companies.id` (the company being acquired)
- New join table `deal_advisers` → (deal_id, contact_id, role enum: legal, financial, tax, commercial, other, notes) — one deal, many advisers
- `companies.sic_codes` → text[] (pulls from the existing 167-code map; add a constant file `src/lib/sicCodes.ts`)
- New `activities` table is already present — extend it: ensure (entity_type: 'contact'|'deal'|'company', entity_id, user_id, action, metadata jsonb, created_at). Backfill from existing activity hooks.

**Migration approach**

- Add new FK columns as nullable, backfill by matching `contacts.organization` → `companies.name` (case-insensitive)
- Keep old text columns for one release, mark deprecated in code
- Add indexes on every new FK

**Code changes**

- Update `useContacts`, `useDeals`, `useCompanies` hooks to select joined data
- Replace `brokers` references with contacts filtered by type
- One new hook `useDealAdvisers(dealId)`

## Phase 2 — Make the mode toggle real

The Fundraising / Deal Sourcing toggle currently reskins nav. It should filter data.

- Centralise filter logic in `useAppMode` — expose `contactTypeFilter` and `defaultColumns` per mode
- Contacts page: Fundraising → default filter `investor`; Deal Sourcing → default filter `intermediary, owner, advisor, operator`
- Different default column sets per mode (Fundraising shows warmth/likelihood/commitment; Sourcing shows company/role/SIC)
- Pipeline page: Fundraising → investor_deals kanban; Sourcing → deals kanban (already split, just route from toggle)

No new tables. Pure frontend work on top of Phase 1's joins.

## Phase 3 — Roles, required fields, activity UI

- Add `'intern'` to the existing `app_role` enum (admin, member, intern already partly exists — confirm and extend)
- Gate `/cap-table` and investor commitment amounts behind `has_role('admin')` — both in RLS and route guards
- Contact form: make `contact_type`, `company_id` (or new company name), and `source` required at form-validation level
- Activity log UI: new tab on Contact and Deal detail pages showing the activities table filtered to that entity
- Admin view: cross-user activity feed (already exists in admin analytics — extend to per-intern breakdown)

## Phase 4 — Earned views

Once the joins exist these are short:

- Pipeline board column for MLP score (Money / Likelihood / Proximity — confirm the formula you want)
- Adviser track record page: group `deal_advisers` by contact, count deals, win rate, avg size
- Target Universe industry filter using `companies.sic_codes`

---

## Technical notes

- Phase 1 is one migration + ~6 hook updates + drops/renames in forms. Biggest risk: backfill accuracy on `organization → company_id`. We'll do fuzzy match + manual review queue.
- `brokers` table consolidation into `contacts` is a one-way migration — we copy then drop. Confirm before we run it.
- All FKs use `ON DELETE SET NULL` so deleting a company doesn't cascade-kill deals.
- RLS policies extended for `deal_advisers` (owner of the deal can manage).

## Question before I start

**1. The `brokers` table** — collapse it into `contacts` (cleaner) or keep it separate and just add the FK from deals (less disruptive)? I recommend collapse.

**2. MLP score formula** — what are the inputs and weights? I'll stub it as `warmth_score * likelihood * (1/days_since_last_contact)` unless you specify.

**3. Backfill review** — for contacts whose `organization` text doesn't match an existing company, should I (a) auto-create the company, or (b) leave `company_id` null and surface a "needs review" list?

Approve Phase 1 and I'll write the migration.