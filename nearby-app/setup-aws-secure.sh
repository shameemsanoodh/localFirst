#!/bin/bash

# NearBy - Secure AWS Setup Script
# This script helps you configure AWS credentials securely

set -e

echo "🚀 NearBy - Secure AWS Setup"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "  unzip awscliv2.zip"
    echo "  sudo ./aws/install"
    echo ""
    exit 1
fi

echo "✅ AWS CLI is installed"
echo ""

# Check if AWS credentials are configured
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials are already configured"
    echo ""
    aws sts get-caller-identity
    echo ""
    read -p "Do you want to reconfigure? (y/N): " reconfigure
    if [[ ! $reconfigure =~ ^[Yy]$ ]]; then
        echo "Skipping AWS configuration..."
    else
        echo ""
        echo "Run: aws configure"
        echo "Then run this script again."
        exit 0
    fi
else
    echo "❌ AWS credentials are not configured"
    echo ""
    echo "Please run: aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (use: us-east-1)"
    echo "  - Default output format (use: json)"
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js $(node --version) is installed"
echo ""

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed"
    echo ""
    read -p "Install Serverless Framework globally? (Y/n): " install_sls
    if [[ ! $install_sls =~ ^[Nn]$ ]]; then
        npm install -g serverless
        echo "✅ Serverless Framework installed"
    else
        echo "Please install manually: npm install -g serverless"
        exit 1
    fi
fi

echo "✅ Serverless Framework is installed"
echo ""

# Generate JWT secret if .env doesn't exist
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating backend/.env file..."
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    
    cat > .env << EOF
# NearBy Backend Configuration
# Generated on $(date)

# Required - JWT Authentication
JWT_SECRET=$JWT_SECRET
AWS_REGION=us-east-1

# Optional - Uncomment and configure after creating these services
# COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
# COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
# SNS_USER_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:nearby-user-notifications
# SNS_MERCHANT_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:nearby-merchant-notifications
# BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
# BEDROCK_REGION=us-east-1
# LOCATION_PLACE_INDEX=nearby-places
# LOCATION_ROUTE_CALCULATOR=nearby-routes
# LOCATION_MAP_NAME=nearby-map
EOF
    
    echo "✅ Created backend/.env with JWT_SECRET"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "================================"
echo "🎯 Ready to Deploy!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Install backend dependencies:"
echo "   cd backend"
echo "   npm install"
echo ""
echo "2. Build TypeScript:"
echo "   npm run build"
echo ""
echo "3. Deploy to AWS:"
echo "   serverless deploy --stage dev"
echo ""
echo "This will create:"
echo "  ✅ 8 Lambda functions"
echo "  ✅ API Gateway with REST endpoints"
echo "  ✅ 8 DynamoDB tables"
echo "  ✅ S3 bucket for assets"
echo "  ✅ CloudWatch log groups"
echo "  ✅ IAM roles and permissions"
echo ""
echo "Estimated time: 3-5 minutes"
echo "Estimated cost: ~$2-5/month"
echo ""

read -p "Deploy now? (Y/n): " deploy_now

if [[ ! $deploy_now =~ ^[Nn]$ ]]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    
    echo ""
    echo "🔨 Building TypeScript..."
    npm run build
    
    echo ""
    echo "🚀 Deploying to AWS..."
    echo "This will take 3-5 minutes..."
    echo ""
    
    serverless deploy --stage dev
    
    echo ""
    echo "================================"
    echo "🎉 Deployment Complete!"
    echo "================================"
    echo ""
    echo "Your API is now live!"
    echo ""
    echo "Next steps:"
    echo "1. Copy the API URL from the output above"
    echo "2. Add it to frontend/.env:"
    echo "   VITE_API_BASE_URL=https://your-api-url.execute-api.us-east-1.amazonaws.com/dev"
    echo ""
    echo "3. Test the API:"
    echo "   curl \$API_URL/categories"
    echo ""
    echo "4. Start the frontend:"
    echo "   cd ../frontend"
    echo "   npm install"
    echo "   npm run dev"
    echo ""
else
    echo ""
    echo "Skipping deployment. Run manually when ready:"
    echo "  cd backend"
    echo "  npm install"
    echo "  npm run build"
    echo "  serverless deploy --stage dev"
    echo ""
fi
