#!/bin/bash

echo "🚀 Deploying Backend to EC2"
echo "============================"
echo ""

# This script helps you deploy to EC2
# You'll need to:
# 1. Launch an EC2 instance (t2.micro is free tier)
# 2. SSH into it
# 3. Run this script

cat > ec2-setup.sh << 'EOF'
#!/bin/bash

# Update system
sudo yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install git
sudo yum install -y git

# Clone your repo (replace with your repo URL)
# git clone YOUR_REPO_URL
# cd YOUR_REPO/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Set environment variables
export MERCHANTS_TABLE=merchants-dev
export SHOPS_TABLE=shops-dev
export USERS_TABLE=users-dev
export BROADCASTS_TABLE=broadcasts-dev
export RESPONSES_TABLE=responses-dev
export OFFERS_TABLE=offers-dev
export INTERACTIONS_TABLE=merchant-interactions-dev
export ANALYTICS_TABLE=analytics-dev
export AWS_REGION=ap-south-1

# Start with PM2
pm2 start dist/server.js --name nearby-backend
pm2 startup
pm2 save

# Install nginx for reverse proxy
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Backend deployed!"
echo "Configure nginx to proxy to port 3000"
EOF

chmod +x ec2-setup.sh

echo "📝 Instructions:"
echo ""
echo "1. Launch EC2 instance:"
echo "   - Go to EC2 console"
echo "   - Launch t2.micro (free tier)"
echo "   - Select Amazon Linux 2"
echo "   - Allow HTTP (80) and HTTPS (443) in security group"
echo ""
echo "2. SSH into instance:"
echo "   ssh -i your-key.pem ec2-user@your-instance-ip"
echo ""
echo "3. Copy and run ec2-setup.sh on the instance"
echo ""
echo "4. Your backend will be at: http://your-instance-ip:3000"
echo ""
