# Noor AL Reef -- Netlify Hosting and GitHub Secrets Setup Guide

**Prepared by:** G.Duggirala, Raaya Global UG

---

## Step 1: Create a GitHub Repository

1. Go to https://github.com and sign in.
2. Click the "+" icon at the top right, then "New repository".
3. Name it: `nooralreef-intelligence`
4. Set visibility to **Private**.
5. Do NOT initialize with README (your project already has files).
6. Click "Create repository".

---

## Step 2: Push Your Local Code to GitHub

Open Terminal and run these commands from inside the project folder:

```bash
cd /Users/saidurgagowthamd/Desktop/MyClaude/NOORALREEF
git init
git add .
git commit -m "Initial commit: Noor AL Reef Executive Intelligence V6"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/nooralreef-intelligence.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

**IMPORTANT: Before pushing, check your .gitignore file includes `.env`**

Your `.gitignore` should contain:
```
.env
.env.local
.DS_Store
node_modules/
dist/
```

This ensures your passwords and API keys are never committed to GitHub.

---

## Step 3: Get Your Groq API Keys (4 Keys)

1. Go to https://console.groq.com
2. Sign in or create a free account.
3. Navigate to **API Keys** in the left sidebar.
4. Create 4 keys with these names (for your own reference):
   - `NAR-Egg-News`
   - `NAR-Egg-Data`
   - `NAR-Rice-News`
   - `NAR-Rice-Data`
5. Copy and save each key securely (you will only see them once).

---

## Step 4: Connect Repository to Netlify

1. Go to https://app.netlify.com and sign in (create account if needed).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Select **GitHub** as your provider.
4. Authorize Netlify to access your GitHub account.
5. Select the `nooralreef-intelligence` repository.
6. Netlify will auto-detect the build settings. Verify:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
7. Click **"Deploy site"**.

---

## Step 5: Add Environment Variables in Netlify

After the site is created:

1. Go to your Netlify site dashboard.
2. Click **Site configuration** (left sidebar) → **Environment variables**.
3. Click **"Add a variable"** and add each of the following:

| Key | Value |
|-----|-------|
| `VITE_ADMIN_USER` | `vishnu@nooralreef.com` |
| `VITE_ADMIN_PASS` | `@ChaithuVS05@` |
| `VITE_GROQ_EGG_NEWS_KEY` | (your NAR-Egg-News Groq key) |
| `VITE_GROQ_EGG_DATA_KEY` | (your NAR-Egg-Data Groq key) |
| `VITE_GROQ_RICE_NEWS_KEY` | (your NAR-Rice-News Groq key) |
| `VITE_GROQ_RICE_DATA_KEY` | (your NAR-Rice-Data Groq key) |

4. After adding all variables, go to **Deploys** and click **"Trigger deploy"** → **"Deploy site"**.

This redeploy picks up the new environment variables.

---

## Step 6: Verify Your Deployment

1. Netlify will give you a URL like `https://your-site-name.netlify.app`.
2. Open that URL in your browser.
3. Log in with `vishnu@nooralreef.com` and your password.
4. Click "Start Dashboard Monitoring" in either module.
5. Verify news loads and Groq analysis runs.

---

## Step 7: Custom Domain (Optional)

If you want `intelligence.nooralreef.com` or similar:

1. In Netlify → **Domain management** → **Add custom domain**.
2. Enter your domain.
3. Follow Netlify's instructions to add a CNAME record in your DNS provider.

---

## Step 8: Keeping Secrets Safe (Ongoing)

**Never do this:**
- Do not commit `.env` to GitHub. The `.gitignore` prevents this, but double-check.
- Do not share Groq API keys in Slack, WhatsApp, or email in plain text.
- Do not screenshot Netlify environment variable values.

**Do this instead:**
- Store master copies of all keys in a password manager (Bitwarden, 1Password, or similar).
- If a key is compromised, rotate it immediately at https://console.groq.com.
- Only share keys via secure channels (encrypted message or password manager sharing).

**To update a secret later:**
1. Netlify → Site configuration → Environment variables → find the variable → Edit.
2. Update the value.
3. Go to Deploys → Trigger deploy → Deploy site.

---

## Step 9: Updating the App After Changes

When you make code changes locally:

```bash
cd /Users/saidurgagowthamd/Desktop/MyClaude/NOORALREEF
git add .
git commit -m "Describe your change here"
git push origin main
```

Netlify auto-detects the push and redeploys within 1-2 minutes.

---

## Local Development Reference

To run the app locally at any time:

```bash
cd /Users/saidurgagowthamd/Desktop/MyClaude/NOORALREEF
npm run dev
```

Open http://localhost:5173 in your browser.

To stop the local server: press `Ctrl + C` in the terminal.

---

## Troubleshooting

**Login not working:**
- Check `VITE_ADMIN_USER` and `VITE_ADMIN_PASS` in Netlify match exactly (case-sensitive).
- Redeploy after any environment variable change.

**News shows fallback data:**
- The live scraper depends on third-party websites. If they block the CORS proxy, fallback data is shown automatically. This is expected behavior -- the fallback data is still valid for demonstration.

**Groq analysis not running:**
- Check that your Groq keys are active at https://console.groq.com.
- Verify the correct key is in the correct Netlify environment variable.
- Free tier keys expire after inactivity -- log in to Groq and re-activate if needed.

**Excel export is empty:**
- Excel export only works if a XLSX file has been uploaded and processed first. Upload a trade data file, wait for "Dataset Synchronized", then export.
