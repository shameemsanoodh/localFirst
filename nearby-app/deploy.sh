#!/bin/bash

# NearBy AWS Deployment Script
# This script automates the deployment process

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the nearby-app directory"
    exit 1
fi

echo "🚀 NearBy AWS Deployment Script"
echo "================================"
echo ""

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 20+"
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI"
    echo "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi
print_success "AWS CLI found: $(aws --version)"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi
print_success "AWS credentials configured"

# Check Serverless Framework
if ! command -v serverless &> /dev/null; then
    print_warning "Serverless Framework not found. Installing..."
    npm install -g serverless
fi
print_success "Serverless Framework found: $(serverless --version | head -1)"

echo ""
echo "Choose deployment option:"
echo "1) Deploy backend only"
echo "2) Deploy frontend only (requires backend URL)"
echo "3) Deploy both (full deployment)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_step "Deploying Backend..."
        cd backend
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
            print_warning "Creating .env file..."
            cat > .env << 'EOF'
JWT_SECRET=change-this-secret-key-in-production
AWS_REGION=us-east-1
EOF
            print_warning "⚠️  Remember to change JWT_SECRET in production!"
        fi
        
        # Install dependencies
        if [ ! -d "node_modules" ]; then
            print_step "Installing dependencies..."
            npm install
        fi
        
        # Build
        print_step "Building TypeScript..."
        npm run build
        
        # Deploy
        print_step "Deploying to AWS..."
        read -p "Enter stage (dev/prod) [dev]: " stage
        stage=${stage:-dev}
        
        serverless deploy --stage $stage
        
        print_success "Backend deployed!"
        echo ""
        print_warning "IMPORTANT: Save your API URL from the output above!"
        echo "You'll need it for frontend deployment."
        echo ""
        echo "Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/$stage"
        ;;
        
    2)
        print_step "Deploying Frontend..."
        cd frontend
        
        # Get API URL
        read -p "Enter your backend API URL: " api_url
        
        if [ -z "$api_url" ]; then
            print_error "API URL is required"
            exit 1
        fi
        
        # Create .env.production
        print_step "Creating .env.production..."
        cat > .env.production << EOF
VITE_API_BASE_URL=$api_url
VITE_WS_BASE_URL=${api_url/https/wss}
EOF
        
        # Install dependencies
        if [ ! -d "node_modules" ]; then
            print_step "Installing dependencies..."
            npm install
        fi
        
        # Build
        print_step "Building frontend..."
        npm run build
        
        print_success "Frontend built successfully!"
        echo ""
        echo "Choose deployment target:"
        echo "1) Vercel (easiest)"
        echo "2) AWS S3"
        echo "3) Skip (I'll deploy manually)"
        echo ""
        read -p "Enter choice (1-3): " deploy_choice
        
        case $deploy_choice in
            1)
                if ! command -v vercel &> /dev/null; then
                    print_step "Installing Vercel CLI..."
                    npm install -g vercel
                fi
                
                print_step "Deploying to Vercel..."
                vercel --prod
                ;;
            2)
                read -p "Enter S3 bucket name: " bucket_name
                
                if [ -z "$bucket_name" ]; then
                    print_error "Bucket name is required"
                    exit 1
                fi
                
                print_step "Creating S3 bucket..."
                aws s3 mb s3://$bucket_name 2>/dev/null || true
                
                print_step "Configuring bucket for static hosting..."
                aws s3 website s3://$bucket_name \
                  --index-document index.html \
                  --error-document index.html
                
                print_step "Setting bucket policy..."
                cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$bucket_name/*"
    }
  ]
}
EOF
                aws s3api put-bucket-policy \
                  --bucket $bucket_name \
                  --policy file:///tmp/bucket-policy.json
                
                print_step "Uploading files..."
                aws s3 sync dist/ s3://$bucket_name/ --delete
                
                print_success "Frontend deployed to S3!"
                echo ""
                echo "Website URL: http://$bucket_name.s3-website-us-east-1.amazonaws.com"
                ;;
            3)
                print_warning "Skipping deployment. Build files are in dist/"
                ;;
        esac
        ;;
        
    3)
        print_step "Full Deployment (Backend + Frontend)..."
        
        # Deploy backend first
        print_step "Step 1: Deploying Backend..."
        cd backend
        
        if [ ! -f ".env" ]; then
            cat > .env << 'EOF'
JWT_SECRET=change-this-secret-key-in-production
AWS_REGION=us-east-1
EOF
        fi
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        npm run build
        
        read -p "Enter stage (dev/prod) [dev]: " stage
        stage=${stage:-dev}
        
        print_step "Deploying backend to AWS..."
        serverless deploy --stage $stage > /tmp/deploy-output.txt
        
        # Extract API URL from output
        api_url=$(grep -oP 'https://[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com/[a-z]+' /tmp/deploy-output.txt | head -1)
        
        if [ -z "$api_url" ]; then
            print_error "Could not extract API URL from deployment output"
            cat /tmp/deploy-output.txt
            exit 1
        fi
        
        print_success "Backend deployed!"
        echo "API URL: $api_url"
        
        # Deploy frontend
        print_step "Step 2: Deploying Frontend..."
        cd ../frontend
        
        cat > .env.production << EOF
VITE_API_BASE_URL=$api_url
VITE_WS_BASE_URL=${api_url/https/wss}
EOF
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        npm run build
        
        if command -v vercel &> /dev/null; then
            print_step "Deploying to Vercel..."
            vercel --prod
        else
            print_warning "Vercel CLI not found. Install with: npm install -g vercel"
            print_warning "Then run: vercel --prod"
        fi
        
        print_success "Deployment complete!"
        ;;
        
    4)
        echo "Goodbye! 👋"
        exit 0
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Deployment completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. Test your deployed application"
echo "2. Set up custom domain (optional)"
echo "3. Configure monitoring and alerts"
echo "4. Review security settings"
echo ""
echo "For more information, see:"
echo "- AWS_DEPLOYMENT_SIMPLE.md"
echo "- DEPLOYMENT_GUIDE.md"
