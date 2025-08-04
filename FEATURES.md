# Kaspa Ecosystem Directory V2 - Features Documentation

## 🚀 New Features Overview

### 1. **Wallet Integration**
- Support for 3 major Kaspa wallets:
  - Kasware Wallet
  - Kastle Wallet  
  - KSPR Wallet
- Users must connect their wallet to:
  - Submit new projects
  - Rate existing projects
  - Leave comments and reviews

### 2. **Project Rating System**
- 5-star rating system
- Community-driven reviews and comments
- Scam warning flags
- Average rating display
- Total rating count per project

### 3. **Featured Projects Carousel**
- Showcase 2+ featured projects
- Auto-rotating carousel on homepage
- Admin can select which projects to feature

### 4. **Enhanced Project Display**
- Logo support for all projects
- Improved card layout
- Social links (Twitter, GitHub, Discord)
- Category badges
- Rating display

### 5. **Automated Scraping System**
- Daily automatic scraping from multiple sources:
  - Kaspa.org
  - GitHub (kaspa topics)
  - CoinGecko Kaspa ecosystem
  - DeFiLlama
  - Reddit r/kaspa
  - Twitter searches
- Configurable schedule (default: 2 AM daily)
- Intelligent categorization
- Duplicate detection

### 6. **Admin Panel**
- Secure Web 2.0 login (username/password)
- Project moderation:
  - Approve/Reject/Delete projects
  - Edit project details
  - Mark as verified
  - Set featured status
- Rating moderation:
  - View all ratings and comments
  - Investigate scam reports
  - Remove inappropriate content
- Scraping configuration:
  - Enable/disable sources
  - Configure schedule
  - Manual trigger
  - View results
- System settings:
  - Update admin credentials
  - Export data
  - Configure moderation rules

## 📁 File Structure

```
kaspa-ecosystem/
├── public/
│   ├── index.html          # Main application (V2)
│   ├── admin.html          # Admin panel
│   ├── _redirects          # Netlify routing
│   └── kaspa-ecosystem-data.json
├── backend/
│   ├── kaspa-ecosystem-scraper.js  # Auto-scraping system
│   ├── kaspa-backend.js    # Original backend
│   └── package.json        # Dependencies
└── netlify.toml           # Deployment config
```

## 🔐 Security Features

1. **Wallet Authentication**
   - Only connected wallets can submit/rate
   - Wallet address stored with submissions

2. **Admin Protection**
   - Separate admin login system
   - Session-based authentication
   - Hidden admin link

3. **Data Validation**
   - Input sanitization
   - URL validation
   - Image upload restrictions

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, IndexedDB
- **Styling**: Custom CSS with Kaspa theme
- **Storage**: IndexedDB for local data
- **Backend**: Node.js with Express
- **Scraping**: Puppeteer, Cheerio, Axios
- **Scheduling**: node-cron
- **Deployment**: Netlify (frontend), PM2 (backend)

## 📝 Usage Instructions

### For Users:
1. Connect wallet to participate
2. Browse projects by category
3. Rate projects (1-5 stars)
4. Flag potential scams
5. Submit new projects

### For Admins:
1. Access admin panel via hidden link
2. Login with credentials (default: admin/kaspa2024)
3. Review pending projects
4. Moderate ratings and comments
5. Configure scraping settings
6. Export data as needed

## 🚦 Deployment Steps

1. **Frontend (Netlify)**:
   ```bash
   git add .
   git commit -m "Add V2 features"
   git push
   ```

2. **Backend (Optional - for scraping)**:
   ```bash
   cd backend
   npm install express cors
   pm2 start kaspa-ecosystem-scraper.js
   ```

## 🔧 Configuration

### Environment Variables:
```env
GOOGLE_SHEET_ID=your_sheet_id
SERVICE_ACCOUNT_EMAIL=your_service_email
SERVICE_ACCOUNT_KEY=your_private_key
PORT=3001
```

### Admin Credentials:
- Default: admin/kaspa2024
- Change immediately after deployment!

## 📊 Database Schema

### Projects:
- id, name, category, description
- url, twitter, github, discord
- logo, submittedBy, timestamp
- status, verified, featured

### Ratings:
- id, projectId, walletAddress
- rating (1-5), comment
- scamWarning, timestamp

## 🎯 Future Enhancements

1. Token-gated features
2. On-chain verification
3. DAO governance
4. API for third-party integrations
5. Mobile app

