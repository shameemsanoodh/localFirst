#!/bin/bash

echo "🚀 Deploy Backend to AWS Elastic Beanstalk"
echo "=========================================="
echo ""

cd backend

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "📦 Installing Elastic Beanstalk CLI..."
    pip install awsebcli --upgrade --user
    echo "✅ EB CLI installed"
fi

# Update package.json
cat > package.json.tmp << 'EOF'
{
  "name": "nearby-backend",
  "version": "1.0.0",
  "description": "NearBy Backend",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "build": "tsc",
    "offline": "serverless offline start",
    "deploy": "npm run build && serverless deploy",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.967.0",
    "@aws-sdk/client-cognito-identity-provider": "^3.700.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/client-location": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-sns": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",
    "aws-sdk": "^2.1693.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "ngeohash": "^0.6.3",
    "serverless-http": "^3.2.0",
    "uuid": "^11.0.5",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/ngeohash": "^0.6.8",
    "@types/node": "^22.13.5",
    "serverless": "^4.7.0",
    "serverless-dynamodb-local": "^0.2.40",
    "serverless-offline": "^14.4.0",
    "typescript": "^5.6.2"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF

mv package.json.tmp package.json

# Create .ebignore
cat > .ebignore << 'EOF'
node_modules/
.git/
.gitignore
*.md
test/
tests/
*.test.ts
*.test.js
.env.local
.env.development
EOF

# Create .elasticbeanstalk/config.yml
mkdir -p .elasticbeanstalk
cat > .elasticbeanstalk/config.yml << 'EOF'
branch-defaults:
  main:
    environment: nearby-backend-env
global:
  application_name: nearby-backend
  default_ec2_keyname: null
  default_platform: Node.js 18 running on 64bit Amazon Linux 2023
  default_region: ap-south-1
  include_git_submodules: true
  instance_profile: null
  platform_name: null
  platform_version: null
  profile: null
  sc: git
  workspace_type: Application
EOF

echo "📦 Installing dependencies..."
npm install express cors serverless-http

echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Ready to deploy to Elastic Beanstalk!"
echo ""
echo "📋 Deployment Steps:"
echo ""
echo "1. Initialize EB application:"
echo "   eb init -p node.js-18 nearby-backend --region ap-south-1"
echo ""
echo "2. Create environment:"
echo "   eb create nearby-backend-env --instance-type t2.micro"
echo ""
echo "3. Set environment variables:"
echo "   eb setenv \\"
echo "     AWS_REGION=ap-south-1 \\"
echo "     MERCHANTS_TABLE=merchants-dev \\"
echo "     SHOPS_TABLE=shops-dev \\"
echo "     USERS_TABLE=users-dev \\"
echo "     BROADCASTS_TABLE=broadcasts-dev \\"
echo "     RESPONSES_TABLE=responses-dev \\"
echo "     OFFERS_TABLE=offers-dev \\"
echo "     INTERACTIONS_TABLE=merchant-interactions-dev \\"
echo "     ANALYTICS_TABLE=analytics-dev"
echo ""
echo "4. Deploy:"
echo "   eb deploy"
echo ""
echo "5. Get URL:"
echo "   eb status"
echo ""
echo "⚡ Your backend will be live in ~10 minutes!"
echo ""
echo "💡 Tips:"
echo "   - View logs: eb logs"
echo "   - SSH to instance: eb ssh"
echo "   - Open in browser: eb open"
echo "   - Terminate: eb terminate"
echo ""

cd ..
