#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Deploy NearBy Backend (Lambda Alternative)             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  AWS Lambda is disabled on your account"
echo "✅ Choose an alternative deployment method:"
echo ""
echo "1. Railway.app     - FASTEST (5 min) - FREE trial"
echo "2. Render.com      - FREE forever - Easy setup"
echo "3. AWS Beanstalk   - AWS native - Production ready"
echo "4. View comparison"
echo "5. Exit"
echo ""
read -p "Select option (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Deploying to Railway.app..."
    echo ""
    ./deploy-railway.sh
    ;;
  2)
    echo ""
    echo "🚀 Deploying to Render.com..."
    echo ""
    ./deploy-render.sh
    ;;
  3)
    echo ""
    echo "🚀 Deploying to AWS Elastic Beanstalk..."
    echo ""
    ./deploy-elasticbeanstalk.sh
    ;;
  4)
    echo ""
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                    Deployment Comparison                       ║
╚════════════════════════════════════════════════════════════════╝

┌─────────────┬──────────────┬──────────────┬──────────────────┐
│   Feature   │   Railway    │    Render    │ Elastic Beanstalk│
├─────────────┼──────────────┼──────────────┼──────────────────┤
│ Setup Time  │   5 minutes  │  10 minutes  │   30 minutes     │
│ Free Tier   │ $5 credit/mo │     Yes      │  12 months       │
│ HTTPS       │   Automatic  │   Automatic  │    Manual        │
│ Scaling     │   Automatic  │   Automatic  │    Manual        │
│ AWS Native  │      No      │      No      │      Yes         │
│ Ease        │   ⭐⭐⭐⭐⭐   │   ⭐⭐⭐⭐    │    ⭐⭐⭐        │
└─────────────┴──────────────┴──────────────┴──────────────────┘

RECOMMENDATION:
• For quick testing: Railway.app (Option 1)
• For free hosting: Render.com (Option 2)
• For AWS production: Elastic Beanstalk (Option 3)

All options connect to your existing AWS DynamoDB tables.

EOF
    echo ""
    read -p "Press Enter to continue..."
    ./DEPLOY_BACKEND_NOW.sh
    ;;
  5)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid option. Please try again."
    ./DEPLOY_BACKEND_NOW.sh
    ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📚 For detailed instructions, see:"
echo "   • DEPLOY_WITHOUT_LAMBDA.md"
echo "   • DEPLOYMENT_ALTERNATIVES.md"
echo ""
