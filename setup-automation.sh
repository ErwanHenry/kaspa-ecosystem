#!/bin/bash

# 🚀 Kaspa Ecosystem Automated Setup Script
# This script automates as much of the deployment process as possible

set -e

echo "🚀 Kaspa Ecosystem Deployment Automation"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}📋 Checking dependencies...${NC}"
    
    dependencies=("git" "node" "npm")
    for dep in "${dependencies[@]}"; do
        if ! command -v $dep &> /dev/null; then
            echo -e "${RED}❌ $dep is not installed${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ $dep is installed${NC}"
        fi
    done
}

# Generate secure secrets
generate_secrets() {
    echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
    
    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo -e "${GREEN}✅ JWT Secret generated${NC}"
    
    # Prompt for admin password
    echo -e "${YELLOW}🔑 Please enter admin password:${NC}"
    read -s ADMIN_PASSWORD
    
    # Generate password hash
    ADMIN_PASSWORD_HASH=$(node -e "
        const bcrypt = require('bcrypt');
        console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));
    " 2>/dev/null || echo "BCRYPT_NOT_AVAILABLE")
    
    if [ "$ADMIN_PASSWORD_HASH" = "BCRYPT_NOT_AVAILABLE" ]; then
        echo -e "${YELLOW}⚠️  bcrypt not available, installing...${NC}"
        npm install bcrypt
        ADMIN_PASSWORD_HASH=$(node -e "
            const bcrypt = require('bcrypt');
            console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));
        ")
    fi
    
    echo -e "${GREEN}✅ Admin password hash generated${NC}"
}

# Create environment variables file
create_env_file() {
    echo -e "${BLUE}📝 Creating environment variables template...${NC}"
    
    cat > .env.example << EOF
# 🔐 Kaspa Ecosystem Environment Variables
# Copy this file to .env and fill in your actual values

# Database Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Authentication (Required)
JWT_SECRET=$JWT_SECRET
ADMIN_PASSWORD_HASH=$ADMIN_PASSWORD_HASH

# Email Configuration (Optional)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key_here
RESEND_API_KEY=your_resend_key_here
FROM_EMAIL=notifications@your-domain.com

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_token_here

# Deployment
URL=https://your-site.netlify.app
EOF

    echo -e "${GREEN}✅ Environment variables template created (.env.example)${NC}"
    echo -e "${YELLOW}📝 Please edit .env.example with your actual values${NC}"
}

# Prepare Git repository
prepare_git() {
    echo -e "${BLUE}📦 Preparing Git repository...${NC}"
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        git init
        echo -e "${GREEN}✅ Git repository initialized${NC}"
    fi
    
    # Create .gitignore
    cat > .gitignore << EOF
# Environment variables
.env
.env.local
.env.production

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Netlify
.netlify/

# Temporary files
*.tmp
*.temp
EOF

    echo -e "${GREEN}✅ .gitignore created${NC}"
    
    # Stage all files
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    else
        git commit -m "🚀 Complete Kaspa Ecosystem enhancement implementation

✅ Multi-wallet integration (Kasware, Kastle, KSPR)
✅ AI-powered project discovery with trending algorithms
✅ Comprehensive 6-dimensional rating system
✅ Email notification system with beautiful templates
✅ Advanced filtering with 9+ criteria types
✅ RSS feeds in RSS/Atom/JSON formats
✅ Social sharing across 6 platforms
✅ Enhanced security with JWT authentication
✅ Mobile-optimized responsive design
✅ Performance optimizations and caching

🤖 Generated with Claude Code
🏆 Ready for production deployment"
        echo -e "${GREEN}✅ Changes committed to Git${NC}"
    fi
}

# Install Netlify CLI
install_netlify_cli() {
    if ! command -v netlify &> /dev/null; then
        echo -e "${BLUE}📦 Installing Netlify CLI...${NC}"
        npm install -g netlify-cli
        echo -e "${GREEN}✅ Netlify CLI installed${NC}"
    else
        echo -e "${GREEN}✅ Netlify CLI already installed${NC}"
    fi
}

# Create Netlify deployment script
create_netlify_script() {
    echo -e "${BLUE}📝 Creating Netlify deployment script...${NC}"
    
    cat > deploy-netlify.sh << 'EOF'
#!/bin/bash

# 🚀 Netlify Deployment Script for Kaspa Ecosystem

echo "🚀 Deploying to Netlify..."

# Check if netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Please install it first:"
    echo "npm install -g netlify-cli"
    exit 1
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
EOF

    chmod +x deploy-netlify.sh
    echo -e "${GREEN}✅ Netlify deployment script created (deploy-netlify.sh)${NC}"
}

# Create Supabase setup script
create_supabase_script() {
    echo -e "${BLUE}📝 Creating Supabase setup guide...${NC}"
    
    cat > setup-supabase.md << 'EOF'
# 🗄️ Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project
4. Note down your project URL and API keys

## Step 2: Run SQL Scripts
Execute these scripts in order in the Supabase SQL Editor:

### 1. Enhanced Categories
```sql
-- Copy and paste contents of: supabase/enhanced-categories.sql
```

### 2. Security Policies  
```sql
-- Copy and paste contents of: supabase/security-policies.sql
```

### 3. Email Subscriptions
```sql
-- Copy and paste contents of: supabase/email-subscriptions.sql
```

### 4. Comprehensive Rating System
```sql
-- Copy and paste contents of: supabase/comprehensive-rating-system.sql
```

## Step 3: Configure Environment Variables
Update your `.env` file with:
- `SUPABASE_URL=https://your-project.supabase.co`
- `SUPABASE_ANON_KEY=your_anon_key`
- `SUPABASE_SERVICE_KEY=your_service_key`

## Step 4: Test Connection
Run the test script to verify everything works:
```bash
node test-supabase-connection.js
```
EOF

    echo -e "${GREEN}✅ Supabase setup guide created (setup-supabase.md)${NC}"
}

# Create Supabase connection test
create_supabase_test() {
    echo -e "${BLUE}📝 Creating Supabase connection test...${NC}"
    
    cat > test-supabase-connection.js << 'EOF'
// 🧪 Supabase Connection Test
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testing Supabase connection...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Missing environment variables');
        console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
        return;
    }
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test basic connection
        const { data, error } = await supabase
            .from('projects')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            console.log('❌ Connection failed:', error.message);
        } else {
            console.log('✅ Connection successful!');
            console.log(`📊 Found ${data || 0} projects in database`);
        }
        
        // Test categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name')
            .limit(5);
            
        if (!catError && categories) {
            console.log('✅ Categories table accessible');
            console.log(`📁 Sample categories: ${categories.map(c => c.name).join(', ')}`);
        }
        
    } catch (error) {
        console.log('❌ Connection test failed:', error.message);
    }
}

testConnection();
EOF

    echo -e "${GREEN}✅ Supabase connection test created (test-supabase-connection.js)${NC}"
}

# Create package.json if it doesn't exist
create_package_json() {
    if [ ! -f "package.json" ]; then
        echo -e "${BLUE}📦 Creating package.json...${NC}"
        
        cat > package.json << 'EOF'
{
  "name": "kaspa-ecosystem",
  "version": "2.0.0",
  "description": "Enhanced Kaspa Ecosystem with AI-powered discovery, multi-wallet support, and comprehensive rating system",
  "scripts": {
    "dev": "netlify dev",
    "build": "echo 'Build complete - static site ready'",
    "deploy": "./deploy-netlify.sh",
    "test:supabase": "node test-supabase-connection.js",
    "setup": "./setup-automation.sh"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "dotenv": "^16.3.1"
  },
  "keywords": ["kaspa", "blockchain", "ecosystem", "wallet", "defi"],
  "author": "Kaspa Community",
  "license": "MIT"
}
EOF
        echo -e "${GREEN}✅ package.json created${NC}"
    else
        echo -e "${GREEN}✅ package.json already exists${NC}"
    fi
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Create summary with next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Automation setup complete!${NC}"
    echo "================================="
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo ""
    echo -e "${BLUE}1. Setup Supabase:${NC}"
    echo "   • Follow instructions in: setup-supabase.md"
    echo "   • Run SQL scripts in Supabase dashboard"
    echo ""
    echo -e "${BLUE}2. Configure Environment:${NC}"
    echo "   • Copy .env.example to .env"
    echo "   • Fill in your Supabase credentials"
    echo "   • Test with: npm run test:supabase"
    echo ""
    echo -e "${BLUE}3. Deploy to Netlify:${NC}"
    echo "   • Push to GitHub: git push origin main"
    echo "   • Or run: npm run deploy"
    echo "   • Set environment variables in Netlify dashboard"
    echo ""
    echo -e "${BLUE}4. Verify Deployment:${NC}"
    echo "   • Test all features work"
    echo "   • Check wallet integration"
    echo "   • Verify rating system"
    echo ""
    echo -e "${GREEN}🚀 Your enhanced Kaspa Ecosystem is ready to deploy!${NC}"
}

# Main execution
main() {
    check_dependencies
    generate_secrets
    create_package_json
    install_dependencies
    create_env_file
    prepare_git
    install_netlify_cli
    create_netlify_script
    create_supabase_script
    create_supabase_test
    show_next_steps
}

# Run main function
main