# Noor AL Reef Executive Intelligence -- Implementation Plan V6

**Document Classification:** Internal Technical Blueprint
**Prepared by:** G.Duggirala, Raaya Global UG
**Date:** 2026-04-10
**Status:** Production-Grade Specification

This document is the definitive implementation plan for the Noor AL Reef Business Intelligence portal. It supersedes all prior versions (V1-V5). Every decision documented here was confirmed through a structured interview process. No assumptions have been made.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend Application (Vite + React SPA)](#2-frontend-application-vite--react-spa)
3. [Backend: GitHub Actions Workflow Engine](#3-backend-github-actions-workflow-engine)
4. [Netlify Function Proxy Layer](#4-netlify-function-proxy-layer)
5. [Groq AI Integration (4-Key Strict Assignment)](#5-groq-ai-integration-4-key-strict-assignment)
6. [Dashboard Module: Egg Intelligence (HS 0407)](#6-dashboard-module-egg-intelligence-hs-0407)
7. [Dashboard Module: Rice Intelligence (HS 1006)](#7-dashboard-module-rice-intelligence-hs-1006)
8. [Dashboard Module: FMCG (Coming Soon)](#8-dashboard-module-fmcg-coming-soon)
9. [Data Compaction Engine (Web Worker)](#9-data-compaction-engine-web-worker)
10. [News Scraping and Deduplication](#10-news-scraping-and-deduplication)
11. [Export System: PDF and Excel](#11-export-system-pdf-and-excel)
12. [WhatsApp Integration](#12-whatsapp-integration)
13. [Brand Identity and UI Specifications](#13-brand-identity-and-ui-specifications)
14. [Environment Variables and Deployment](#14-environment-variables-and-deployment)

---

## 1. System Architecture Overview

### High-Level Data Flow

```
User (Browser)
  |
  v
Netlify (Static SPA + Serverless Functions)
  |
  +---> Netlify Function: /api/trigger-workflow
  |       |
  |       +---> GitHub Actions (workflow_dispatch)
  |               |
  |               +---> Scrape news (India + Gulf media)
  |               +---> Scrape benchmarks (NECC, IndiaMART)
  |               +---> Scrape currency rates (Google)
  |               +---> Commit results as JSON to repo
  |
  +---> Netlify Function: /api/fetch-results
  |       |
  |       +---> Read committed JSON from GitHub repo
  |       +---> Return to frontend
  |
  +---> Client-side Web Worker
  |       |
  |       +---> Process uploaded XLSX (70k+ rows)
  |       +---> Compact to ~50 records
  |       +---> Send compacted signal to Groq (via Netlify Function)
  |
  +---> Groq API (via Netlify Functions, 4 separate keys)
          |
          +---> Analyze news (per dashboard)
          +---> Analyze dataset (per dashboard)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vite + React 18.3.1 (SPA) | Internal tool, no SSR/SEO needed |
| Hosting | Netlify | Static files + serverless functions |
| Backend | GitHub Actions | Scraping workflows triggered via workflow_dispatch |
| Proxy | Netlify Functions | Keeps GitHub PAT and Groq keys server-side |
| AI | Groq API (free tier) | News analysis + dataset intelligence |
| Data Processing | Web Workers + xlsx 0.18.5 | Client-side XLSX parsing without UI blocking |
| PDF | jspdf 2.5.1 + jspdf-autotable 3.8.2 | Branded report generation |
| Excel | xlsx (write mode) | Processed results export |
| Auth | Static .env credentials | Single admin user |

### No-Cache Policy

Real-time data only. The user can wait 1-5 minutes for fresh results. Old/stale data must never be displayed. Every dashboard activation triggers a fresh workflow run. There is no local cache, no sessionStorage persistence of market data, and no TTL-based reuse.

---

## 2. Frontend Application (Vite + React SPA)

### Current File Structure

```
src/
  App.jsx                    -- Root routing (splash -> login -> hub -> dashboard)
  components/
    SplashScreen.jsx         -- Brand splash (3 seconds)
    LoginHub.jsx             -- Static admin authentication
    DashboardHub.jsx         -- Hub with 3 dashboard cards
    EggDashboard.jsx         -- Active egg dashboard (template for rice)
    RiceDashboard.jsx        -- [NEW] Rice dashboard
    PDFExportModal.jsx       -- PDF/Excel export configuration modal
  services/
    groqService.js           -- Groq API calls (placeholder, needs real implementation)
    marketScrapers.js        -- Market data fetching (placeholder, needs real implementation)
    pdfService.js            -- PDF generation with jsPDF
    excelService.js          -- [NEW] Excel export of processed results
    netlifyProxy.js          -- [NEW] Client-side functions to call Netlify Functions
  workers/
    dataWorker.js            -- XLSX processing + compaction (exists, needs HS code filtering)
  assets/
    logo.png                 -- Noor AL Reef logo
```

### Routing Logic (App.jsx)

Current state: Only `EggDashboard` is wired. Changes needed:

```
SplashScreen (3s) -> LoginHub -> DashboardHub
                                   |
                                   +-- egg  -> EggDashboard
                                   +-- rice -> RiceDashboard [NEW]
                                   +-- fmcg -> blocked (Coming Soon)
```

Add a condition in App.jsx:
- `currentDashboard === 'rice'` renders `<RiceDashboard onBack={handleBackToHub} />`
- No condition for `fmcg` since the DashboardHub card has no click action

### DashboardHub.jsx Changes

Current state: Rice card has `active: false`. Changes needed:
- Set Rice card `active: true`
- Change Rice card color from `'#aaa'` to `'var(--nar-teal)'`
- Keep FMCG card `active: false`
- Change FMCG badge text from `RESTRICTED` to `COMING SOON`

---

## 3. Backend: GitHub Actions Workflow Engine

### Why GitHub Actions

The application has no traditional backend server. GitHub Actions serves as the sole backend compute layer. Workflows are triggered on-demand via `workflow_dispatch` from the frontend (through a Netlify Function proxy). Results are committed as JSON files to the repository, which the frontend then fetches.

### Workflow: `scrape-egg-data.yml`

**Trigger:** `workflow_dispatch` with no inputs (or optional `force_refresh: true`)

**Steps:**
1. Checkout repository
2. Set up Node.js 20
3. Install scraping dependencies (cheerio, node-fetch)
4. Run egg scraping script:
   - Scrape NECC website (e-necc.com) for Namakkal daily egg price
   - Scrape 3-5 India/Gulf news sources for egg-related keywords
   - Scrape Google for currency rates (AED-INR, USD-INR, EUR-INR)
5. Read existing `data/egg-results.json` for deduplication (compare news titles/IDs)
6. Write new `data/egg-results.json` with fresh data (replaces old file entirely)
7. Commit and push the JSON file to the repository

**Output JSON schema (`data/egg-results.json`):**

```json
{
  "timestamp": "2026-04-10T14:30:00Z",
  "namakkal": "5.42",
  "trend": "UP",
  "rates": {
    "aed_inr": "22.84",
    "usd_inr": "83.92",
    "eur_inr": "91.45"
  },
  "news": [
    {
      "id": "egg_20260410_001",
      "title": "Poultry Ban Implemented in Southern Clusters",
      "source": "Financial Express",
      "url": "https://...",
      "date": "2026-04-10",
      "keywords_matched": ["poultry ban"]
    }
  ]
}
```

### Workflow: `scrape-rice-data.yml`

**Trigger:** `workflow_dispatch`

**Steps:** Same structure as egg workflow but with:
- Scrape IndiaMART or commodity exchange APIs for rice benchmark prices
- Scrape news sources for rice-specific keywords (rice export ban, basmati policy, HS 1006)
- Write to `data/rice-results.json`

**Output JSON schema (`data/rice-results.json`):**

```json
{
  "timestamp": "2026-04-10T14:30:00Z",
  "riceBenchmark": "68.50",
  "unit": "INR/kg",
  "trend": "STABLE",
  "rates": {
    "aed_inr": "22.84",
    "usd_inr": "83.92",
    "eur_inr": "91.45"
  },
  "news": [
    {
      "id": "rice_20260410_001",
      "title": "India Lifts Basmati Export Floor Price",
      "source": "Economic Times",
      "url": "https://...",
      "date": "2026-04-10",
      "keywords_matched": ["basmati", "export"]
    }
  ]
}
```

### Deduplication Logic

Before each workflow run:
1. Read the existing JSON file from the repo
2. Extract all existing `news[].id` values
3. After scraping new news, generate deterministic IDs based on source + title hash
4. Filter out any news items whose IDs already exist in the old file
5. Write the complete new JSON file (old file is fully replaced, not appended)

This prevents duplicate news from appearing when the same stories persist across multiple scraping cycles.

### GitHub Actions Secrets Required

| Secret Name | Purpose |
|------------|---------|
| `GITHUB_TOKEN` | Auto-provided, used for committing JSON results |

No Groq keys are stored in GitHub Actions. AI analysis happens client-side through Netlify Functions.

---

## 4. Netlify Function Proxy Layer

### Why a Proxy

The GitHub Personal Access Token (PAT) and Groq API keys must never be exposed to the browser. Netlify Functions act as a thin proxy layer that:
- Stores secrets as Netlify environment variables
- Forwards requests from the frontend to GitHub/Groq APIs
- Returns results to the frontend

### Function: `netlify/functions/trigger-workflow.js`

**Purpose:** Trigger a GitHub Actions workflow run

**Request from frontend:**
```
POST /.netlify/functions/trigger-workflow
Body: { "workflow": "scrape-egg-data.yml" }
```

**Server-side logic:**
1. Read `GITHUB_PAT` from Netlify environment variables
2. Call GitHub API: `POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches`
3. Return `{ "status": "triggered", "run_id": "..." }`

### Function: `netlify/functions/fetch-results.js`

**Purpose:** Fetch the latest scraped JSON from the repository

**Request from frontend:**
```
GET /.netlify/functions/fetch-results?type=egg
```

**Server-side logic:**
1. Read `GITHUB_PAT` from Netlify environment variables
2. Call GitHub API: `GET /repos/{owner}/{repo}/contents/data/egg-results.json`
3. Decode base64 content
4. Return parsed JSON to frontend

### Function: `netlify/functions/groq-proxy.js`

**Purpose:** Forward Groq API requests without exposing keys to the browser

**Request from frontend:**
```
POST /.netlify/functions/groq-proxy
Body: { "keyType": "egg-news", "messages": [...] }
```

**Server-side logic:**
1. Map `keyType` to the correct Groq key environment variable:
   - `egg-news` -> `GROQ_EGG_NEWS_KEY`
   - `egg-data` -> `GROQ_EGG_DATA_KEY`
   - `rice-news` -> `GROQ_RICE_NEWS_KEY`
   - `rice-data` -> `GROQ_RICE_DATA_KEY`
2. Forward the request to `https://api.groq.com/openai/v1/chat/completions`
3. Return the Groq response to the frontend

### Function: `netlify/functions/poll-workflow.js`

**Purpose:** Check if a triggered workflow has completed

**Request from frontend:**
```
GET /.netlify/functions/poll-workflow?run_id=12345
```

**Server-side logic:**
1. Call GitHub API: `GET /repos/{owner}/{repo}/actions/runs/{run_id}`
2. Return `{ "status": "completed" | "in_progress" | "failed" }`

### Frontend Polling Flow

When the user clicks "Start Dashboard Monitoring":
1. Frontend calls `trigger-workflow` with the appropriate workflow file
2. Frontend polls `poll-workflow` every 5 seconds until status is `completed` (timeout after 5 minutes)
3. Frontend calls `fetch-results` to get the fresh JSON
4. Frontend sends news items to `groq-proxy` for AI analysis
5. Dashboard renders with live data

---

## 5. Groq AI Integration (4-Key Strict Assignment)

### Key Assignment Table

| Key Variable (Netlify) | Groq Key Purpose | Used By |
|------------------------|-----------------|---------|
| `GROQ_EGG_NEWS_KEY` | Analyze egg-related news articles | Egg Dashboard news analysis |
| `GROQ_EGG_DATA_KEY` | Analyze compacted egg dataset | Egg Dashboard bulk analytics |
| `GROQ_RICE_NEWS_KEY` | Analyze rice-related news articles | Rice Dashboard news analysis |
| `GROQ_RICE_DATA_KEY` | Analyze compacted rice dataset | Rice Dashboard bulk analytics |

### Strict Key Isolation

Each key is used exclusively for its assigned purpose. There is no key sharing, no fallback rotation, and no cross-dashboard key usage. If one key hits its daily limit, only that specific function degrades. The other three continue operating.

### Rate Limit Protection

Groq free tier has daily request limits. To avoid exhaustion:
- News analysis: Send all news items in a single batch prompt (not one request per article)
- Dataset analysis: Send the compacted signal (50 records max) in a single prompt
- Maximum Groq calls per dashboard activation: 2 (one for news, one for data)
- Total maximum calls per full session (both dashboards): 4

### News Analysis Prompt Template

```
You are an executive trade intelligence analyst for a Gulf-based general trading company.

Analyze the following news articles related to [egg/rice] trade (HS [0407/1006]).
For each article, provide:
1. IMPACT: A short severity label (HIGH RISK, CRITICAL, MODERATE, LOW, POSITIVE)
2. ACTION: A specific operational directive for a Dubai-based importer

Articles:
[JSON array of scraped news]

Respond in JSON format:
[{ "id": "...", "aiImpact": "...", "aiAction": "..." }]
```

### Dataset Analysis Prompt Template

```
You are a data intelligence analyst for a Gulf-based trading company.

Current [NECC egg price / rice benchmark]: [price]
Compacted dataset summary (top 50 importers by volume):
[JSON compacted signal]

Provide:
1. Price Audit: How many importers are buying above/below the current market index
2. Churn Assessment: Commentary on inactive importers and revenue risk
3. Monetization Directive: One specific, actionable strategy to convert overpaying importers

Respond in JSON format matching this structure:
{
  "priceAudit": { "overMarketCount": N, "underMarketCount": N, "insight": "..." },
  "churnStatus": { "inactive30_90Days": N, "commentary": "..." },
  "monetizationDirective": "..."
}
```

---

## 6. Dashboard Module: Egg Intelligence (HS 0407)

### Source File

`src/components/EggDashboard.jsx` (exists, needs integration with real backend)

### Current State

- Header with logo, "BACK TO HUB" button, currency rates display, action buttons
- News cards with source, title, impact badge, operational directive
- Right sidebar: Namakkal live price, bulk analytics panel, file upload
- PDF export modal
- Uses Web Worker for XLSX processing
- All data is currently hardcoded/placeholder

### Required Changes

1. **Replace `scrapeMarketData()` call** with Netlify Function proxy calls:
   - Call `trigger-workflow` with `scrape-egg-data.yml`
   - Poll until complete
   - Call `fetch-results?type=egg`

2. **Replace `analyzeNewsIntelligence()` call** with Groq proxy:
   - Call `groq-proxy` with `keyType: "egg-news"`
   - Pass scraped news articles for analysis

3. **Replace `analyzeDataIntelligence()` call** with Groq proxy:
   - Call `groq-proxy` with `keyType: "egg-data"`
   - Pass compacted signal from Web Worker

4. **Add EUR-INR** to the currency rates display (currently only shows AED-INR and USD-INR)

5. **Add WhatsApp share button** next to each news card (see Section 12)

6. **Add Excel export button** alongside the PDF export button

### Egg-Specific Benchmark

- **Source:** NECC (National Egg Coordination Committee) at e-necc.com
- **Data Point:** Namakkal daily egg price (INR per egg)
- **Display:** Large green number in the right sidebar card
- **Label:** "Live Market Index (Namakkal)"

### News Keywords for Egg Scraping

`poultry ban`, `bird flu`, `avian influenza`, `egg import ban`, `egg export`, `poultry import`, `HS 0407`, `egg price`, `NECC rate`, `poultry trade`, `GCC poultry`, `Saudi egg import`, `UAE egg import`, `Qatar poultry`, `Oman egg`, `Bahrain poultry`, `Kuwait egg import`

---

## 7. Dashboard Module: Rice Intelligence (HS 1006)

### Source File

`src/components/RiceDashboard.jsx` -- NEW file, cloned from EggDashboard.jsx

### Structure

Identical layout to EggDashboard with these substitutions:

| EggDashboard | RiceDashboard |
|-------------|--------------|
| Namakkal daily egg price (NECC) | Rice benchmark price (IndiaMART/commodity exchange) |
| HS 0407 | HS 1006 |
| `scrape-egg-data.yml` | `scrape-rice-data.yml` |
| `egg-results.json` | `rice-results.json` |
| `GROQ_EGG_NEWS_KEY` | `GROQ_RICE_NEWS_KEY` |
| `GROQ_EGG_DATA_KEY` | `GROQ_RICE_DATA_KEY` |
| "Egg Executive Intelligence" | "Rice Intelligence" |
| "Global Risk Intelligence (HS 0407)" | "Global Risk Intelligence (HS 1006)" |
| Egg-related news keywords | Rice-related news keywords |

### Rice-Specific Benchmark

- **Source:** IndiaMART or commodity exchange APIs
- **Data Point:** Current rice price (INR per kg, likely basmati and non-basmati variants)
- **Display:** Large green number in the right sidebar card
- **Label:** "Live Market Index (Rice)"

### News Keywords for Rice Scraping

`rice export ban`, `basmati price`, `non-basmati export`, `rice import policy`, `HS 1006`, `India rice export`, `rice floor price`, `APEDA rice`, `rice trade policy`, `GCC rice import`, `Saudi rice`, `UAE rice import`, `rice shortage`, `rice tariff`, `broken rice export`

### Dataset Processing

The Web Worker (`dataWorker.js`) processes the same XLSX structure for both dashboards. The uploaded SAMPLE_DATA.xlsx (15,711 rows, 39 columns) is rice data. Differentiation happens by HS code column in the dataset. The worker must:
- Read the HS code column from each row
- Filter to only HS 1006 rows for Rice Dashboard, HS 0407 rows for Egg Dashboard
- Apply the same compaction logic (top 50 importers, churn registry, price deviations)

The Web Worker must accept an `hsCode` parameter in the message:
```
workerRef.current.postMessage({ action: 'PROCESS_DATA', file: uploadedFile, hsCode: '1006' });
```

---

## 8. Dashboard Module: FMCG (Coming Soon)

### DashboardHub Card

- Title: "FMCG Intelligence"
- Description: "Fast Moving Consumer Goods Performance Analytics"
- Badge: "COMING SOON" (not "RESTRICTED")
- `active: false`
- `cursor: not-allowed`
- No `onClick` handler fires
- Opacity: 0.6
- Color: `#ccc`

No component, no routing, no backend workflow. This is a static placeholder card only.

---

## 9. Data Compaction Engine (Web Worker)

### Source File

`src/workers/dataWorker.js` (exists, needs HS code filtering)

### Current Logic (Preserved)

1. Parse XLSX using the `xlsx` library
2. Filter for bulk importers (quantity >= 100)
3. Aggregate by importer name: total volume, total value, shipment count, last seen date
4. Sort by volume descending, take top 50
5. Compute churn registry: importers not seen in last 3 months of dataset
6. Compute price deviations: importers paying >15% above median

### Required Changes

1. **Add HS code parameter** to the worker message interface
2. **Filter rows by HS code** before any processing:
   ```
   const hsFiltered = jsonData.filter(row => {
     const hs = String(row['HS Code'] || row['HSCode'] || row['hs_code'] || '');
     return hs.startsWith(hsCode);
   });
   ```
3. **Inactive importer logic** must be variable per dataset context. A large importer with only 1 shipment in the dataset timeframe should be flagged as potentially inactive, even if their last shipment is recent. The churn detection should consider both recency AND frequency:
   - Primary churn: last shipment older than 3 months from dataset max date
   - Secondary flag: any importer with only 1 shipment in the entire dataset, regardless of date

### Compacted Signal Output (unchanged structure)

```json
{
  "topImporters": [
    { "name": "...", "volume": "1,234", "avgPrice": "$0.12", "lastShipment": "2026-01-15" }
  ],
  "churnRegistry": [
    { "name": "...", "volume": 500, "totalValue": 60, "count": 1, "lastSeen": "2025-12-01" }
  ],
  "overpayers": [
    { "name": "...", "deviation": "18.5%" }
  ],
  "summary": "Dataset from 4/10/2026 processed. 15711 records compacted."
}
```

---

## 10. News Scraping and Deduplication

### Scraping Strategy (GitHub Actions)

Each workflow scrapes 3-5 reliable sources. The scraping scripts run in Node.js within the GitHub Actions environment.

#### Egg News Sources

| Source | Region | URL Pattern | Method |
|--------|--------|------------|--------|
| Financial Express | India | financialexpress.com | HTML scrape (cheerio) |
| Economic Times | India | economictimes.indiatimes.com | HTML scrape (cheerio) |
| Arab News | Gulf | arabnews.com | HTML scrape (cheerio) |
| Gulf News | Gulf | gulfnews.com | HTML scrape (cheerio) |
| Khaleej Times | Gulf | khaleejtimes.com | HTML scrape (cheerio) |

#### Rice News Sources

Same sources as above, but filtered with rice-specific keywords (see Section 7).

#### Currency Rates

- Source: Google search result parsing or a free API (e.g., exchangerate-api.com)
- Rates needed: AED-INR, USD-INR, EUR-INR
- Scraped in every workflow run (both egg and rice)

### Deduplication Process

Runs inside each GitHub Actions workflow:

1. **Before scraping:** Read the existing `data/[egg|rice]-results.json` from the repo
2. **Extract existing IDs:** Collect all `news[].id` values
3. **Generate IDs for new articles:** Use a deterministic hash of `source + title` (e.g., first 8 chars of SHA-256)
4. **Filter duplicates:** Remove any new article whose ID matches an existing one
5. **After scraping:** Write the complete new JSON file. The old file is fully replaced (not appended). This means old news that is no longer being scraped will naturally disappear.

### Groq Limit Budgeting

Groq free tier: ~30 requests/day (varies by model).

Budget per dashboard activation:
- 1 request for news analysis
- 1 request for dataset analysis (only if a file is uploaded)

Budget per full session (user opens both dashboards and uploads data for both):
- 4 requests maximum

With batch prompts (all news in one request, all data in one request), daily usage stays well under the limit even with multiple sessions.

---

## 11. Export System: PDF and Excel

### PDF Export

#### Source File

`src/services/pdfService.js` (exists, needs modifications)

#### Current State

- Uses jsPDF + jspdf-autotable
- Branded header with "Noor AL Reef Executive Intelligence"
- Confidential notice
- Namakkal rate display
- News table with 4 columns
- Text-based authorized signature
- Footer with copyright

#### Two Export Modes (via PDFExportModal)

**Standard Insight Digest (NEWS mode):**
- Branded header
- Confidential classification
- News intelligence table only (Source, Alert Title, Impact, Directive)
- Director signature
- Footer

**Comprehensive Performance Audit (FULL mode):**
- Everything in NEWS mode
- Performance audit summary heading
- Namakkal/Rice benchmark price
- Bulk analytics results (price audit, churn status, monetization directive)
- Overpayer table

#### Director Signature (Text Only)

The PDF footer signature section must use text only. Do NOT embed Director.jpeg.

```
Authorized by:
Vishnu Vardhan Nithyanandam
DIRECTOR OF OPERATIONS
Noor AL Reef General Trading LLC
```

#### Required PDF Changes

1. Remove `doc.text('Surveillance condensation active...')` line
2. Replace with proper director name and title text block
3. For Rice Dashboard PDFs, replace "Namakkal Daily Index Benchmark" with "Rice Market Index Benchmark"
4. Add HS code to the confidential notice (HS 0407 for egg, HS 1006 for rice)
5. The `generateProfessionalPDF` function must accept a `dashboardType` parameter ('egg' | 'rice') to customize labels

### Excel Export

#### Source File

`src/services/excelService.js` -- NEW file

#### Purpose

Export the processed/ranked results (not raw uploaded data) as a downloadable .xlsx file.

#### Contents

The Excel file contains only the compacted, AI-analyzed results:

**Sheet 1: "Top Importers"**
| Rank | Importer Name | Volume | Avg Price | Last Shipment | Price vs Index |
|------|--------------|--------|-----------|---------------|---------------|

**Sheet 2: "Churn Registry"**
| Importer Name | Volume | Shipment Count | Last Seen | Days Inactive |
|--------------|--------|---------------|-----------|--------------|

**Sheet 3: "Overpayers"**
| Importer Name | Avg Price | Market Median | Deviation % |
|--------------|-----------|--------------|-------------|

**Sheet 4: "AI Summary"**
| Field | Value |
|-------|-------|
| Market Index | (current benchmark price) |
| Over-Market Importers | (count) |
| Under-Market Importers | (count) |
| Inactive Partners (90D) | (count) |
| Monetization Directive | (AI-generated text) |

#### Implementation

Use the existing `xlsx` dependency (already in package.json) in write mode:

```javascript
import * as XLSX from 'xlsx';

export const generateExcelReport = (dashboardData, dataIntelligence, dashboardType) => {
  const wb = XLSX.utils.book_new();
  // Add sheets from processed data
  // ...
  XLSX.writeFile(wb, `NoorAlReef_${dashboardType}_Report_${date}.xlsx`);
};
```

#### UI Integration

Add an "Export Excel" option to the PDFExportModal (rename component to `ExportModal`). The modal should present three options:
1. Standard Insight Digest (PDF)
2. Comprehensive Performance Audit (PDF)
3. Processed Data Export (Excel)

---

## 12. WhatsApp Integration

### Method

Use `wa.me` deep links. No WhatsApp Business API. No server-side integration. The link opens the user's phone WhatsApp app (or WhatsApp Web) with a pre-filled message.

### Link Format

```
https://wa.me/<PHONE_NUMBER>?text=<URL_ENCODED_MESSAGE>
```

The phone number field can be left empty to let the user choose the recipient:
```
https://wa.me/?text=<URL_ENCODED_MESSAGE>
```

### Contextual Pre-filled Messages

#### For News Alerts

```
[NOOR AL REEF ALERT]
{news.title}
Source: {news.source}
Impact: {news.aiImpact}
Directive: {news.aiAction}
-- Noor AL Reef Executive Intelligence
```

#### For Market Index

```
[NOOR AL REEF MARKET UPDATE]
{Egg/Rice} Market Index: {price}
Trend: {trend}
AED/INR: {rate}
USD/INR: {rate}
EUR/INR: {rate}
-- Noor AL Reef Executive Intelligence
```

### UI Placement

- Small WhatsApp share icon button on each news card (top-right corner)
- WhatsApp share button on the market index sidebar card
- Clicking the button constructs the `wa.me` URL with the contextual message and opens it via `window.open(url, '_blank')`

---

## 13. Brand Identity and UI Specifications

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--nar-teal` | `#00685f` | Headers, positive indicators, secondary accents |
| `--nar-orange` | `#e17726` | Primary action buttons, alerts, active states |
| `--nar-black` | `#000000` | Text, dark backgrounds |
| `--nar-emerald` | (same as teal) | Large numbers, positive metrics |
| `--nar-white` | `#ffffff` | Backgrounds, card surfaces |

### Typography

| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| Headings | Cera Pro Medium | Montserrat | 500-700 |
| Body | Poppins Light | sans-serif | 300-400 |

Both fonts must be loaded via Google Fonts (Montserrat as Cera Pro substitute, Poppins directly available).

### Component Styling Conventions

- Card border radius: 24px-32px
- Button border radius: 12px
- Box shadows: subtle (`rgba(0,0,0,0.02)` to `rgba(0,0,0,0.05)`)
- Hover transitions: `all 0.4s cubic-bezier(0.23, 1, 0.32, 1)`
- Orange accent shadows on active cards: `rgba(225, 119, 38, 0.08)`
- Button class: `.nar-button` (orange background, white text, hover darkens)

### Code File Signature

Every source file must begin with:
```
//Built for Noor AL Reef by G.Duggirala from Raaya Global UG//
```

### Anti-Slop Rules

- No EM dashes anywhere in the UI or generated text
- No filler phrases ("leveraging", "cutting-edge", "state-of-the-art")
- All labels must be specific and actionable
- No placeholder "Lorem ipsum" text in production

---

## 14. Environment Variables and Deployment

### Netlify Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `GITHUB_PAT` | Personal Access Token for triggering workflows and reading repo contents | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | Repository owner | `username` |
| `GITHUB_REPO` | Repository name | `nooralreef-intelligence` |
| `GROQ_EGG_NEWS_KEY` | Groq API key for egg news analysis | `gsk_xxxxxxxxxxxx` |
| `GROQ_EGG_DATA_KEY` | Groq API key for egg dataset analysis | `gsk_xxxxxxxxxxxx` |
| `GROQ_RICE_NEWS_KEY` | Groq API key for rice news analysis | `gsk_xxxxxxxxxxxx` |
| `GROQ_RICE_DATA_KEY` | Groq API key for rice dataset analysis | `gsk_xxxxxxxxxxxx` |

### Frontend Environment Variables (.env for local dev)

| Variable | Purpose | Current Value |
|----------|---------|--------------|
| `VITE_ADMIN_USER` | Login username | `Vishnu@nooralreef.com` |
| `VITE_ADMIN_PASS` | Login password | (set in .env, not committed) |
| `VITE_NETLIFY_BASE` | Base URL for Netlify Functions | `/.netlify/functions` |

Note: The 4 Groq keys move from VITE_ frontend variables to Netlify server-side variables. They must NOT be exposed to the browser. The current `VITE_GROQ_NEWS_KEY` and `VITE_GROQ_DATA_KEY` in `.env` will be removed and replaced by the Netlify Function proxy.

### Netlify Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deployment Checklist

1. Push code to GitHub repository
2. Connect repository to Netlify
3. Set all Netlify environment variables (see table above)
4. Set GitHub Actions secrets (none required beyond auto-provided GITHUB_TOKEN)
5. Generate a GitHub PAT with `repo` and `workflow` scopes, add to Netlify as `GITHUB_PAT`
6. Obtain 4 Groq API keys from console.groq.com, add to Netlify
7. Verify Netlify build succeeds
8. Test workflow trigger from the deployed frontend
9. Verify JSON results are committed to the repo
10. Verify Groq analysis returns valid responses through the proxy

### GitHub PAT Scopes Required

- `repo` (full control of private repositories) -- needed to read/write JSON files
- `workflow` -- needed to trigger workflow_dispatch

### New Dependencies to Add

```json
{
  "dependencies": {
    "@netlify/functions": "^2.0.0"
  }
}
```

The Netlify Functions are written in the `netlify/functions/` directory at the project root (not inside `src/`).

---

## Appendix: Files to Create

| File | Purpose |
|------|---------|
| `src/components/RiceDashboard.jsx` | Rice dashboard (clone of EggDashboard with rice-specific data) |
| `src/services/excelService.js` | Excel export of processed results |
| `src/services/netlifyProxy.js` | Client-side helpers to call Netlify Functions |
| `netlify/functions/trigger-workflow.js` | Trigger GitHub Actions workflow |
| `netlify/functions/fetch-results.js` | Fetch scraped JSON from repo |
| `netlify/functions/groq-proxy.js` | Forward Groq API requests with server-side keys |
| `netlify/functions/poll-workflow.js` | Check workflow completion status |
| `.github/workflows/scrape-egg-data.yml` | GitHub Actions workflow for egg data |
| `.github/workflows/scrape-rice-data.yml` | GitHub Actions workflow for rice data |
| `netlify.toml` | Netlify build and function configuration |
| `data/egg-results.json` | Scraped egg market data (auto-generated by workflow) |
| `data/rice-results.json` | Scraped rice market data (auto-generated by workflow) |

## Appendix: Files to Modify

| File | Changes |
|------|---------|
| `src/App.jsx` | Add RiceDashboard import and routing condition |
| `src/components/DashboardHub.jsx` | Activate Rice card, change FMCG to "COMING SOON" |
| `src/components/EggDashboard.jsx` | Replace placeholder calls with Netlify proxy calls, add WhatsApp + Excel buttons |
| `src/components/PDFExportModal.jsx` | Rename to ExportModal, add Excel export option |
| `src/services/groqService.js` | Replace placeholder with calls to groq-proxy Netlify Function |
| `src/services/marketScrapers.js` | Replace placeholder with calls to trigger-workflow + fetch-results |
| `src/services/pdfService.js` | Add dashboardType param, fix director signature to text-only, add EUR-INR |
| `src/workers/dataWorker.js` | Add HS code filtering parameter |
| `.env` | Remove VITE_GROQ keys (moved to Netlify), add VITE_NETLIFY_BASE |
| `package.json` | Add @netlify/functions dependency |
