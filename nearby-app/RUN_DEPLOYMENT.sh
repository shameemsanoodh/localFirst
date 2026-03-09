#!/bin/bash

# NearBy Apps - AWS HTTPS Deployment Runner
# This script guides you through the deployment process

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        NearBy Apps - AWS HTTPS Deployment                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi
echo "✅ AWS CLI installed"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi
echo "✅ AWS credentials configured"

# Check region
REGION=$(aws configure get region)
if [ "$REGION" != "ap-south-1" ]; then
    echo "⚠️  Warning: Your AWS region is $REGION"
    echo "   This project is configured for ap-south-1"
    echo "   Do you want to continue? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi
echo "✅ AWS region: $REGION"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first:"
    echo "   https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js installed: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install it first"
    exit 1
fi
echo "✅ npm installed: $(npm --version)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Show deployment options
echo "📋 Deployment Options:"
echo ""
echo "1. Deploy both apps with HTTPS (Recommended)"
echo "2. Deploy merchant app only"
echo "3. Deploy customer app only"
echo "4. Check existing deployments"
echo "5. Exit"
echo ""
echo -n "Select option (1-5): "
read -r option

case $option in
    1)
        echo ""
        echo "🚀 Deploying both apps with HTTPS..."
        echo ""
        echo "This will:"
        echo "  • Build and deploy merchant app to S3"
        echo "  • Create CloudFront distribution (HTTPS)"
        echo "  • Build and deploy customer app to S3"
        echo "  • Create CloudFront distribution (HTTPS)"
        echo "  • Configure 'Register Your Shop' button"
        echo ""
        echo "⏱️  Estimated time: 5-10 minutes"
        echo "⏳ CloudFront propagation: 15-20 minutes"
        echo ""
        echo "Continue? (y/n)"
        read -r confirm
        if [ "$confirm" = "y" ]; then
            ./deploy-all-https.sh
            echo ""
            echo "════════════════════════════════════════════════════════════"
            echo ""
            echo "📝 Your deployment URLs have been saved to:"
            echo "   • merchant-app-urls.txt"
            echo "   • customer-app-urls.txt"
            echo ""
            echo "📖 View them with:"
            echo "   cat merchant-app-urls.txt"
            echo "   cat customer-app-urls.txt"
            echo ""
        fi
        ;;
    2)
        echo ""
        echo "🚀 Deploying merchant app only..."
        echo ""
        ./deploy-merchant-https.sh
        ;;
    3)
        echo ""
        echo "🚀 Deploying customer app only..."
        echo ""
        echo "Enter merchant app URL (or press Enter to use default):"
        read -r merchant_url
        if [ -z "$merchant_url" ]; then
            ./deploy-customer-https.sh
        else
            ./deploy-customer-https.sh "$merchant_url"
        fi
        ;;
    4)
        echo ""
        echo "📊 Checking existing deployments..."
        echo ""
        
        # Check S3 buckets
        echo "S3 Buckets:"
        aws s3 ls | grep nearby || echo "  No NearBy buckets found"
        echo ""
        
        # Check CloudFront distributions
        echo "CloudFront Distributions:"
        aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`NearBy Merchant App Distribution` || Comment==`NearBy Customer App Distribution`].[Comment,DomainName,Status]' --output table 2>/dev/null || echo "  No NearBy distributions found"
        echo ""
        
        # Check saved URLs
        if [ -f merchant-app-urls.txt ]; then
            echo "Merchant App URLs:"
            cat merchant-app-urls.txt
            echo ""
        fi
        
        if [ -f customer-app-urls.txt ]; then
            echo "Customer App URLs:"
            cat customer-app-urls.txt
            echo ""
        fi
        ;;
    5)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Done!"
echo ""
echo "📚 For more information, see:"
echo "   • DEPLOY_NOW.md - Quick reference"
echo "   • HTTPS_DEPLOYMENT_GUIDE.md - Complete guide"
echo "   • DEPLOYMENT_COMPLETE.md - What was created"
echo ""

