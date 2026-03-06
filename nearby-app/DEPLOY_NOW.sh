#!/bin/bash

# ============================================
# NearBy Production Deployment - ONE COMMAND
# ============================================

echo "🚀 Starting NearBy Production Deployment..."
echo ""
echo "This will deploy:"
echo "  ✓ Backend to AWS Lambda"
echo "  ✓ Frontend to Vercel"
echo "  ✓ Configure all environment variables"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Run the deployment
./quick-deploy-prod.sh

echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "📖 Read PRODUCTION_DEPLOYMENT_SUMMARY.md for:"
echo "  - Post-deployment verification steps"
echo "  - Monitoring setup"
echo "  - Security checklist"
echo "  - Performance optimization"
echo ""
echo "🎉 Your app is now LIVE in production!"
echo ""
