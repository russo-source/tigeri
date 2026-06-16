# Tigeri Invoice & Reimbursement Tracker

A TigerScale-branded dashboard over a **Google Sheet** invoice ledger. It shows per-person
spend (Russo / Tim), tracks reimbursements, and lets you upload new invoices straight into the
right Google Drive folder + a new sheet row. Hosted on Vercel, password-protected for the team.

> This replaced an earlier Notion-backed *subscription* tracker. The single source of truth is now
> the Google Sheet "Invoice Summary — Paid by Tim & Russo".

## What it does

- **Dashboard** — total spend, split by person (Tim / Russo), spend by vendor, recent invoices, with All/Russo/Tim and month filters
- **Invoices** — the full ledger: sortable, filterable (person / reimbursement / search), CSV export, and the **+ Add invoice** drop-zone
- **Reimbursements** — Tim reimburses Russo's out-of-pocket costs on the 15th; shows what's outstanding, settled history, and a one-click **Mark settled**
- **Add invoice** — drop a PDF + fill the fields → the file is saved to `Tigeri Expenses / {Person} / {Period} / {Vendor}/` in Drive and a row is appended to the sheet with a link to the PDF

## Architecture

```
Browser ──► Next.js API routes ──► Google Sheet (read)  via CSV export
                  │
                  └──────────────► Apps Script web app ──► Google Sheet (write) + Google Drive
```

- **Reads** use the sheet's public CSV export (`/export?format=csv`) — no credentials, parsed server-side in `lib/sheets.ts` (handles the row-9 header, FX'd USD amounts, `DD Mon YYYY` dates, and skips the total/footnote rows).
- **Writes** (mark reimbursed, add invoice, delete) go through a Google **Apps Script web app** that runs as the sheet owner — this sidesteps Google Cloud service-account key restrictions. See `scripts/sheets-webapp.gs`.
- **Auth**: HTTP Basic Auth via `middleware.ts`.

## Data model

Sheet columns (header is on row 9): `Paid By · Reimbursed · Vendor · Description · Invoice # · Date · Status · Orig. Amount · Cur. · Amount (USD) · Invoice Link`

- `Paid By` = `Russo` | `Tim`
- `Reimbursed` = blank (Tim's own) · `Pending` (Tim owes Russo) · `Tim` (settled)
- `Amount (USD)` is the canonical, FX-converted figure; the dashboard always re-sums line items itself.

Drive layout: `Tigeri Expenses / {Person} / {Period e.g. "May-June"} / {Vendor} / invoice.pdf`

## Environment variables

| Var | Where | Purpose |
|-----|-------|---------|
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` | Vercel + `.env.local` | Team login gate (omit locally to skip auth) |
| `SHEETS_WEBAPP_URL` | Vercel + `.env.local` | Apps Script web-app `/exec` URL (writes) |
| `SHEETS_WEBAPP_SECRET` | Vercel + `.env.local` | Shared secret the web app checks |
| `GOOGLE_SHEET_ID` | optional | Override the source sheet (defaults to the baked-in ID) |
| `SHEET_CSV_URL` | optional | Override the CSV read URL entirely |

`.env.local` is gitignored — secrets never get committed.

## The Apps Script web app (`scripts/sheets-webapp.gs`)

Deployed from the sheet (**Extensions → Apps Script**) as a **Web app** (*Execute as: Me*, *Who has access: Anyone*). It exposes three secret-gated `doPost` actions:

- `reimburse` — set the `Reimbursed` cell on a Russo row
- `addInvoice` — save a base64 PDF to `Person/Period/Vendor/` + append a row
- `deleteInvoice` — trash the PDF + delete the row (data rows only)

> When the script gains a new capability (e.g. Drive), re-authorize by running a function that
> exercises it (a `createFile` call) and approving the Drive permission. Editing code doesn't
> publish — redeploy via **Manage deployments → Edit → New version**.

## Local development

```bash
cp .env.local.example .env.local   # then fill in the values
npm install
npm run dev
```

Open http://localhost:3000. Reads work immediately; the write features need `SHEETS_WEBAPP_*` set.

## Deploy

Push to `main` → Vercel auto-deploys. Make sure the `SHEETS_WEBAPP_URL` / `SHEETS_WEBAPP_SECRET`
env vars are set in the Vercel project, otherwise the write buttons error on the live site.

## Project layout

- `app/page.tsx` — orchestrator (sidebar + views, `?view=` routing)
- `app/api/invoices/route.ts` — GET (list + summary), POST (mark reimbursed)
- `app/api/invoices/add/route.ts` — POST a PDF + fields (add invoice)
- `lib/sheets.ts` — sheet parsing + write client
- `components/` — `Sidebar`, `TopBar`, `InvoiceDashboard`, `InvoicesTable`, `AddInvoice`, `ReimbursementsView`, `StatCard`, `ProfileTabs`, `MonthSelector`, `Toast`
- `scripts/sheets-webapp.gs` — the Apps Script web app (source of truth; paste into Apps Script)

## License

Internal Tigeri AI use.
