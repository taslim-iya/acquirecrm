# Research Mode + Company Profiles

## Part 1 — Research mode (third pillar alongside Fundraising & Deal Sourcing)

Extend `useAppMode` to support a new `'research'` mode. Toggle in the sidebar header cycles through Fundraising / Deal Sourcing / Research. Research mode reveals a dedicated nav section and filters Contacts to research-relevant types.

**New pages under Research:**
1. **Sectors** (`/research/sectors`) — sector/SIC theses. Each row: industry, SIC codes, thesis notes, target multiple, status (active / monitoring / passed), linked companies count.
2. **Watchlist** (`/research/watchlist`) — companies you're studying but not yet targets. Re-uses `companies` table with a new `research_status` field (`watchlist | active_research | promoted_to_target | passed`). One-click "Promote to Target Universe".
3. **Expert Network** (`/research/experts`) — contacts tagged as `operator` / `advisor` / `river_guide`, with columns for expertise area, last call date, call notes. Re-uses contacts.
4. **Source Library** (`/research/sources`) — reports, articles, podcasts. New `research_sources` table: title, url, source_type (report/article/podcast/transcript), themes (tags), summary, linked sectors/companies.

## Part 2 — Company Detail page

New route `/companies/:id` with 4 tabs:

- **Overview** — name, website, industry, SIC codes (multi-select from existing 167-code map), size, revenue, HQ, founded year, description, research thesis, status. Inline-editable like contacts table.
- **Documents** — drag-and-drop upload scoped to this company. Reuses `documents` table (already has `company_id`). Same uploader + grid as Documents page, filtered by company.
- **Contacts** — all contacts where `company_id = :id`, plus advisers from `deal_advisers` joining deals where this company is the target.
- **Activity** — timeline of `activities`, `notes`, `emails`, `tasks`, `calendar_events` tied to the company or its linked contacts/deals. Reverse-chronological.

Company name in Contacts table, Target Universe, and Deal cards becomes a link to this page.

## Part 3 — Three high-leverage additions

1. **Investment Thesis tracker** — per sector and per company, a structured thesis (problem, why now, what good looks like, kill criteria). Surfaces in Sector and Company pages; when a deal is passed, the Decision Log can reference which thesis criterion failed. Closes the loop with your existing decision journaling.

2. **Comp-set / Peer view** — on a Company page, pick 3-8 peer companies; auto-renders a side-by-side table (revenue, size, multiple, SIC). Exportable. Free once company data is structured — pure query layer.

3. **Sector heatmap on Dashboard** — small grid: row = sector, columns = (# targets, # active deals, # passed, avg MLP, last activity). One glance shows where the pipeline is hot or cold. Drill-through to the sector page.

## Technical section

**Schema changes (one migration):**
- `app_mode` handled client-side only — no DB change.
- `companies`: add `research_status text default 'none'`, `thesis_problem text`, `thesis_why_now text`, `thesis_success text`, `thesis_kill_criteria text`, `peer_company_ids uuid[]`, `revenue numeric`, `employee_count int`, `hq_location text`, `founded_year int`, `website text` (skip any that already exist).
- New table `research_sectors` — user_id, industry, sic_codes text[], thesis_*, status, target_multiple numeric. Standard RLS + GRANTs.
- New table `research_sources` — user_id, title, url, source_type, themes text[], summary, sector_id fk, company_id fk. Standard RLS + GRANTs.
- Index: `companies(user_id, research_status)`, `documents(company_id)`.

**Frontend:**
- `useAppMode`: add `'research'` to `AppMode`, extend `MODE_CONTACT_TYPES`.
- `Sidebar`: render Research section when mode = research (Sectors, Watchlist, Experts, Sources, Companies).
- New hooks: `useResearchSectors`, `useResearchSources`, `useCompany(id)` (single-company fetch with joined contacts + docs + activities).
- New pages: `ResearchSectors`, `ResearchWatchlist`, `ResearchExperts`, `ResearchSources`, `CompanyProfile` (with Overview/Documents/Contacts/Activity tabs).
- `Documents` upload flow: pass `companyId` (already supported in `useDocuments.uploadDocument`).
- Wire company-name links in Contacts, TargetUniverse, DealSourcingDeals, InvestorCard.
- Dashboard: add `SectorHeatmap` widget.

**Out of scope (ask separately if wanted):**
- AI-generated thesis drafts from uploaded reports
- Automated SIC tagging via Gemini parser
- Public company financial data ingestion (would need an external API key)

## Build order

1. Migration (companies fields + 2 new tables)
2. `useAppMode` + Sidebar Research section
3. CompanyProfile page (highest immediate value)
4. Research pages (Sectors → Watchlist → Experts → Sources)
5. Thesis fields wired into Company + Sector pages
6. Peer comp-set view
7. Sector heatmap on Dashboard

Approve to start, or tell me to trim/reorder.