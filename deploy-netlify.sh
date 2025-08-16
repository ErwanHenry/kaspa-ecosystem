#!/bin/bash

# 🚀 Netlify Deployment Script for Kaspa Ecosystem

echo "🚀 Deploying to Netlify..."

# Check if netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
    
    if ! command -v netlify &> /dev/null; then
        echo "❌ Failed to install Netlify CLI"
        echo "📋 Manual deployment options:"
        echo "   1. Go to netlify.com"
        echo "   2. Click 'New site from Git'"
        echo "   3. Connect your GitHub repository"
        echo "   4. Deploy automatically"
        exit 1
    fi
fi

# Login to Netlify (if not already logged in)
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    netlify login
fi

# Deploy to Netlify
echo "📤 Deploying to production..."
netlify deploy --prod --dir=public

echo "✅ Deployment complete!"
echo "🌐 Your site should be live shortly"
echo ""
echo "⚙️  Don't forget to set environment variables in Netlify dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY" 
echo "   - SUPABASE_SERVICE_KEY"
echo "   - JWT_SECRET"
echo "   - ADMIN_PASSWORD_HASH"
echo ""
echo "🔗 Access your environment variables at:"
echo "   https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment-variables"