#!/bin/bash

# Deploy CloudFront distributions using Terraform

set -e

echo "🚀 Deploying CloudFront distributions with Terraform..."
echo ""

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    echo ""
    echo "Install Terraform:"
    echo "  Ubuntu/Debian: sudo apt-get install terraform"
    echo "  macOS: brew install terraform"
    echo "  Or download from: https://www.terraform.io/downloads"
    exit 1
fi

cd "$(dirname "$0")"

echo "📦 Initializing Terraform..."
terraform init

echo ""
echo "📋 Planning deployment..."
terraform plan -out=tfplan

echo ""
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

echo ""
echo "✅ CloudFront distributions created!"
echo ""
echo "📊 Outputs:"
terraform output

echo ""
echo "⏳ Distributions will take 15-20 minutes to fully deploy"
echo ""
echo "🔍 Check status:"
echo "   terraform output"
echo "   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table"
