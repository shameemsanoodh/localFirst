#!/bin/bash

# NearBy Credentials Setup Script
# Generates required credentials and creates .env file

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔐 NearBy Credentials Setup"
echo "==========================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the nearby-app directory"
    exit 1
fi

cd backend

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

print_step "Generating JWT_SECRET..."

# Generate JWT secret
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
elif command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
else
    print_warning "Neither openssl nor node found. Using fallback method."
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

print_success "JWT_SECRET generated"

# Get AWS region
print_step "Setting AWS region..."
read -p "Enter AWS region [us-east-1]: " aws_region
aws_region=${aws_region:-us-east-1}

# Create .env file
print_step "Creating .env file..."

cat > .env << EOF
# ============================================
# NearBy Backend Environment Variables
# ============================================

# Required Credentials
# --------------------
JWT_SECRET=$JWT_SECRET
AWS_REGION=$aws_region

# Optional: AWS Cognito (for user management)
# -------------------------------------------
# Uncomment and fill these if you set up Cognito
# COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
# COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Amazon SNS (for push notifications)
# ---------------------------------------------
# Uncomment and fill these if you set up SNS
# SNS_USER_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:nearby-user-notifications
# SNS_MERCHANT_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:nearby-merchant-notifications

# Optional: Amazon Bedrock (for AI features)
# ------------------------------------------
# Uncomment and fill these if you set up Bedrock
# BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
# BEDROCK_REGION=us-east-1

# Optional: Amazon Location Service (for maps)
# --------------------------------------------
# Uncomment and fill these if you set up Location Service
# LOCATION_PLACE_INDEX=nearby-places
# LOCATION_ROUTE_CALCULATOR=nearby-routes

# Optional: S3 (auto-created by serverless)
# -----------------------------------------
# S3_BUCKET=nearby-backend-dev-assets
# S3_REGION=us-east-1

# ============================================
# Notes:
# - JWT_SECRET is required for authentication
# - All other services are optional
# - See CREDENTIALS_SETUP_GUIDE.md for setup instructions
# ============================================
EOF

print_success ".env file created successfully!"

echo ""
echo "📋 Summary:"
echo "==========="
echo "✅ JWT_SECRET: Generated (32 characters)"
echo "✅ AWS_REGION: $aws_region"
echo ""
print_warning "Optional services are commented out in .env"
echo ""
echo "To add optional services:"
echo "1. See CREDENTIALS_SETUP_GUIDE.md for instructions"
echo "2. Uncomment and fill the relevant lines in backend/.env"
echo ""
echo "Your app is ready to deploy with basic authentication!"
echo ""
echo "Next steps:"
echo "1. cd backend"
echo "2. npm install"
echo "3. npm run build"
echo "4. serverless deploy --stage dev"
echo ""

# Ask if user wants to set up optional services
echo "Would you like to set up optional services now?"
echo "1) Set up Cognito (user management)"
echo "2) Set up SNS (notifications)"
echo "3) Set up Bedrock (AI)"
echo "4) Set up Location Service (maps)"
echo "5) No, I'll do it later"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        print_step "Setting up Cognito..."
        echo ""
        echo "Run these commands:"
        echo ""
        echo "# Create user pool"
        echo "aws cognito-idp create-user-pool \\"
        echo "  --pool-name nearby-users \\"
        echo "  --auto-verified-attributes email \\"
        echo "  --username-attributes email \\"
        echo "  --region $aws_region"
        echo ""
        echo "# Then create app client with the pool ID"
        echo "aws cognito-idp create-user-pool-client \\"
        echo "  --user-pool-id YOUR_POOL_ID \\"
        echo "  --client-name nearby-web-client \\"
        echo "  --no-generate-secret \\"
        echo "  --region $aws_region"
        echo ""
        echo "Then add the IDs to .env file"
        ;;
    2)
        echo ""
        print_step "Setting up SNS..."
        echo ""
        echo "Run these commands:"
        echo ""
        echo "# Create user notifications topic"
        echo "aws sns create-topic \\"
        echo "  --name nearby-user-notifications \\"
        echo "  --region $aws_region"
        echo ""
        echo "# Create merchant notifications topic"
        echo "aws sns create-topic \\"
        echo "  --name nearby-merchant-notifications \\"
        echo "  --region $aws_region"
        echo ""
        echo "Then add the ARNs to .env file"
        ;;
    3)
        echo ""
        print_step "Setting up Bedrock..."
        echo ""
        echo "1. Go to https://console.aws.amazon.com/bedrock"
        echo "2. Click 'Model access' in left sidebar"
        echo "3. Click 'Enable specific models'"
        echo "4. Enable 'Claude 3 Haiku'"
        echo "5. Wait for approval (usually instant)"
        echo "6. Uncomment Bedrock lines in .env"
        ;;
    4)
        echo ""
        print_step "Setting up Location Service..."
        echo ""
        echo "Run these commands:"
        echo ""
        echo "# Create place index"
        echo "aws location create-place-index \\"
        echo "  --index-name nearby-places \\"
        echo "  --data-source Esri \\"
        echo "  --region $aws_region"
        echo ""
        echo "# Create route calculator"
        echo "aws location create-route-calculator \\"
        echo "  --calculator-name nearby-routes \\"
        echo "  --data-source Esri \\"
        echo "  --region $aws_region"
        echo ""
        echo "Then uncomment Location Service lines in .env"
        ;;
    5)
        echo ""
        print_success "No problem! You can set up optional services anytime."
        echo "See CREDENTIALS_SETUP_GUIDE.md for instructions."
        ;;
esac

echo ""
print_success "Setup complete! 🎉"
