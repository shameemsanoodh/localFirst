#!/bin/bash

# Quick deployment to Netlify for HTTPS mobile access
# This solves the mobile browser HTTP blocking issue

set -e

echo "🚀 Deploying NearBy apps to Netlify with HTTPS..."
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
    echo ""
fi

# Function to deploy an app
deploy_app() {
    local APP_DIR=$1
    local APP_NAME=$2
    
    echo "📦 Building and deploying $APP_NAME..."
    cd "$APP_DIR"
    
    # Build the app
    npm run build
    
    # Deploy to Netlify
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    cd ..
    echo ""
}

# Deploy all three apps
deploy_app "customer-app" "Customer App"
deploy_app "merchant-app" "Merchant App"
deploy_app "admin-app" "Admin App"

echo "✅ All apps deployed!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the Netlify URLs from above"
echo "2. Update .env.production files with new HTTPS URLs"
echo "3. Rebuild and redeploy if needed"
echo ""
echo "🎉 Your apps now work on mobile devices with HTTPS!"
