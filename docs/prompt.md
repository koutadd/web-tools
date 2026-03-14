# Web Tools – Project Documentation

## Project Overview

A platform for free website diagnostic tools. Each tool collects user input via a form, submits to a backend, and returns a structured report.

---

## Project Structure

```
web-tools/
  index.html               # Root landing page — lists all available tools
  styles.css               # Shared styles (used by all tools)
  app.js                   # Shared JS utilities

  tools/                   # One subfolder per tool
    site-diagnosis/
      index.html           # Input form
      form.js              # Validation and fetch submission
      report.html          # Report display page

  backend/
    apps-script.gs         # Google Apps Script — POST endpoint + Sheets storage

  docs/
    prompt.md              # This file
```

---

## Tech Stack

- Frontend: HTML / CSS / Vanilla JS (no frameworks)
- Backend: Google Apps Script (Web App)
- Storage: Google Spreadsheet

---

## How to Create a New Tool

### 1. Create the folder

Add a new subfolder under `tools/` using kebab-case:

```
tools/
  lp-diagnosis/
  ad-diagnosis/
```

### 2. Create required files

Each tool needs three files:

| File | Purpose |
|------|---------|
| `index.html` | Input form |
| `form.js` | Validation and POST submission |
| `report.html` | Report display |

Minimal structure:

```
tools/
  lp-diagnosis/
    index.html
    form.js
    report.html
```

### 3. Link shared styles

Reference the root stylesheet from each HTML file:

```html
<link rel="stylesheet" href="../../styles.css">
```

### 4. Add to the root landing page

Add a new tool card in `index.html`:

```html
<article class="tool-card">
  <div class="tool-card__icon"><!-- svg icon --></div>
  <div class="tool-card__body">
    <h3 class="tool-card__title">LP Diagnosis</h3>
    <p class="tool-card__description">Short description of what this tool does.</p>
  </div>
  <div class="tool-card__footer">
    <a href="tools/lp-diagnosis/index.html" class="btn btn--primary">Start</a>
  </div>
</article>
```

### 5. Set the API endpoint

In `form.js`, set the `API_ENDPOINT` constant to the deployed Apps Script URL:

```js
const API_ENDPOINT = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

---

## Naming Rules

| Thing | Convention | Example |
|-------|-----------|---------|
| Tool folder | kebab-case | `lp-diagnosis` |
| HTML files | lowercase | `index.html`, `report.html` |
| JS files | kebab-case | `form.js` |
| CSS classes | BEM-style kebab-case | `tool-card__title` |
| API fields | camelCase | `businessName`, `websiteUrl` |

---

## Backend Deploy (Google Apps Script)

1. Open [script.google.com](https://script.google.com) and create a new project
2. Paste the contents of `backend/apps-script.gs`
3. Bind to a Google Spreadsheet (or use `SpreadsheetApp.openById()`)
4. Deploy → **New deployment** → Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Paste the deployment URL into the tool's `form.js` as `API_ENDPOINT`

---

## Future Tools

- [ ] `lp-diagnosis/` — Landing page structure analysis
- [ ] `ad-diagnosis/` — Ad creative and copy review
- [ ] `seo-check/` — Basic on-page SEO audit
