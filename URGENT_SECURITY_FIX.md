# 🚨 URGENT: Security Fix Instructions

## Problem
Google detected exposed service account credentials in our GitHub repository.

## Solution Steps

### 1. Clean Git History
```bash
# Option A: Using BFG Repo-Cleaner (recommended)
brew install bfg
bfg --delete-files kaspa-ecosystem-data.json
git push origin --force --all

# Option B: Using git filter-branch
./remove-secrets.sh
git push origin --force --all
```

### 2. Create New Service Account Key
1. Go to https://console.cloud.google.com
2. Navigate to IAM & Admin > Service Accounts
3. Find: kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com
4. Create new key (JSON format)
5. Delete old key: 08f6620c50134cf77e781ecd75a0b9aa63bd2311

### 3. Update Backend Configuration
1. Create backend/.env file (NEVER commit this!)
2. Add the new credentials:
```
GOOGLE_SHEET_ID=1qZS7aQXCYoQcSODJbkbrr-hi5BFOXnjbGOypT8en2vQ
SERVICE_ACCOUNT_EMAIL=kaspa-ecosystem-service@annuairekaspa.iam.gserviceaccount.com
SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n[NEW_KEY_HERE]\n-----END PRIVATE KEY-----"
```

### 4. Update .gitignore
Ensure these are in .gitignore:
```
backend/.env
backend/service-account.json
*.json
```

### 5. Deploy Safely
- Frontend: Works without credentials
- Backend: Deploy only if needed for scraping
- Use environment variables on server

## Prevention
- NEVER commit credentials
- Always use .env files
- Review files before committing
- Use git-secrets tool
