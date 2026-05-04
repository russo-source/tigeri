# Tigeri Expense Dashboard

A TigerScale-branded expense tracker that reads and writes directly to your Notion database. Hosted on Vercel, password-protected, shareable with the team.

## What this gives you

- Live dashboard with Monthly Burn, Annual Run Rate, One-time Spend, Pending Info Count
- Category breakdown bars
- Sortable table of all expenses
- Add, edit, and cancel expenses (writes directly to Notion)
- Basic Auth so only your team can access
- Mobile-friendly

## Setup (about 30 minutes)

### 1. Create a Notion integration (5 min)

1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name it "Tigeri Expense Dashboard"
4. Workspace: select your workspace
5. Type: Internal
6. Save and copy the "Internal Integration Secret" (starts with `secret_`)

### 2. Share the database with the integration (1 min)

1. Open your Tigeri Expense Tracker database in Notion
2. Click the "..." menu in the top-right
3. Click "Connections" then "Connect to" and select "Tigeri Expense Dashboard"

### 3. Get your database ID (1 min)

The database URL looks like: `https://www.notion.so/<workspace>/437e88b1b1b14bb7ace0d455b251720b`

The database ID is the 32-character string at the end: `437e88b1b1b14bb7ace0d455b251720b`

(For your existing database, this is already known: `437e88b1-b1b1-4bb7-ace0-d455b251720b`)

### 4. Push to GitHub (5 min)

```bash
cd tigeri-dashboard
git init
git add .
git commit -m "Initial commit"
gh repo create tigeri-dashboard --private --source=. --push
```

Or use GitHub Desktop / the GitHub website to upload the folder.

### 5. Deploy to Vercel (5 min)

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework Preset: Next.js (auto-detected)
4. In "Environment Variables", add:
   - `NOTION_TOKEN` = the integration secret from step 1
   - `NOTION_DATABASE_ID` = `437e88b1-b1b1-4bb7-ace0-d455b251720b`
   - `BASIC_AUTH_USER` = `tigeri` (or any username)
   - `BASIC_AUTH_PASS` = a strong password you'll share with the team
5. Click "Deploy"

In about 2 minutes you'll get a URL like `https://tigeri-dashboard.vercel.app`. Anyone with that URL plus the username/password can use the dashboard.

### 6. Share with the team (1 min)

Send your team the URL and credentials. They'll be prompted to enter the username and password the first time they visit. Browser remembers it after that.

## Local development

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
npm install
npm run dev
```

Open http://localhost:3000.

## Customization

- **Branding**: All TigerScale design tokens are in `app/globals.css` as CSS variables
- **Schema changes**: If you add or rename a property in Notion, update `lib/types.ts` and `lib/notion.ts`
- **Auth upgrade**: For Google OAuth restricted to @tigeri.ai emails, swap the basic auth in `middleware.ts` for NextAuth

## Architecture

```
Browser  →  Next.js API routes  →  Notion API  →  Database
   ↑              (server-side, token never exposed to client)
   ↓
TigerScale UI (React + Tailwind)
```

The Notion integration token lives only in Vercel's server environment. The browser never sees it.

## Files

- `app/page.tsx` - Main dashboard
- `app/api/expenses/route.ts` - GET (list) and POST (create) endpoints
- `app/api/expenses/[id]/route.ts` - PATCH (update) and DELETE (soft-cancel) endpoints
- `lib/notion.ts` - Notion API wrapper
- `lib/types.ts` - TypeScript types
- `middleware.ts` - Basic Auth gate
- `components/` - Dashboard UI components
- `app/globals.css` - TigerScale brand tokens

## Troubleshooting

**"Database not found" on first load**

The integration isn't connected to the database. Re-do step 2 in setup.

**"Unauthorized" loop**

Browser cached the wrong credentials. Open in incognito or clear site data.

**Need to add a new property**

Add the property in Notion first, then update `lib/types.ts` (Expense interface), `lib/notion.ts` (mapping functions), and the form/table components.

## Costs

- Vercel: free tier is fine for an internal tool of this size
- Notion: uses your existing workspace, no extra cost

## License

Internal Tigeri AI use.
