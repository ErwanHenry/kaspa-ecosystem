# 🔐 Security Setup Instructions

## After Getting New Google Cloud Credentials

### 1. Local Development Setup

1. **Create backend/.env file** (NEVER commit this!):
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Open the JSON file** downloaded from Google Cloud

3. **Copy the private_key value** and paste it in .env:
   - Find the "private_key" field in the JSON
   - Copy the ENTIRE value including quotes
   - Replace YOUR_PRIVATE_KEY_HERE in .env
   - Make sure to keep all the \n characters

4. **Test locally** (optional):
   ```bash
   cd backend
   node kaspa-ecosystem-scraper.js
   ```

### 2. Production Deployment

#### Option A: Environment Variables (Recommended)
- Set these in your hosting platform:
  - `SERVICE_ACCOUNT_EMAIL`
  - `SERVICE_ACCOUNT_KEY`
  - `GOOGLE_SHEET_ID`

#### Option B: Secure File Storage
- Use your platform's secret management
- Never store in public directories

### 3. Security Checklist

- [ ] Old key deleted from Google Cloud
- [ ] New key created and downloaded
- [ ] .env file created (not committed)
- [ ] .gitignore includes all sensitive files
- [ ] No credentials in any committed files
- [ ] Git history cleaned
- [ ] Admin password changed from default

### 4. Testing the Fix

1. **Check git history**:
   ```bash
   git log --all --full-history -- "**/kaspa-ecosystem-data.json"
   ```
   Should return nothing or only safe commits

2. **Search for secrets**:
   ```bash
   grep -r "BEGIN PRIVATE KEY" .
   ```
   Should only find .env.example

### 5. Frontend Works Without Credentials!

Remember: The frontend (on Netlify) works perfectly without any Google credentials.
Only the backend scraper needs them, and it's optional.
