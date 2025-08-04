#!/bin/bash
# Migration script to V2

echo "🚀 Migrating Kaspa Ecosystem to V2..."

# Backup current version
echo "Backing up current files..."
cp public/index.html public/index.v1.backup.html

# Copy new files
echo "Installing V2 files..."
cp index.v2.html public/index.html

# Update backend dependencies
echo "Updating backend dependencies..."
cd backend
npm install express cors --save

# Create data directory for scraper
mkdir -p data

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Update admin credentials in admin.html"
echo "2. Configure environment variables for scraping"
echo "3. Commit and push to deploy"
echo "4. (Optional) Start scraper backend with: pm2 start backend/kaspa-ecosystem-scraper.js"
