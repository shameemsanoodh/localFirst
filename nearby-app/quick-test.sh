#!/bin/bash

# NearBy Quick Test Script
# This script helps you quickly test the application

set -e

echo "🚀 NearBy Quick Test Script"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the nearby-app directory"
    exit 1
fi

# Menu
echo "Choose what to test:"
echo "1) Frontend only (recommended first)"
echo "2) Backend only"
echo "3) Full stack (frontend + backend)"
echo "4) Build test (check if everything compiles)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_step "Testing Frontend Only..."
        cd frontend
        
        if [ ! -d "node_modules" ]; then
            print_step "Installing dependencies..."
            npm install
        fi
        
        print_success "Starting frontend on http://localhost:5173"
        print_warning "Backend API calls will fail (expected)"
        print_warning "But UI will work perfectly!"
        echo ""
        echo "Press Ctrl+C to stop"
        npm run dev
        ;;
        
    2)
        print_step "Testing Backend Only..."
        cd backend
        
        if [ ! -d "node_modules" ]; then
            print_step "Installing dependencies..."
            npm install
        fi
        
        print_step "Building TypeScript..."
        npm run build
        
        if ! command -v serverless &> /dev/null; then
            print_warning "Serverless Framework not found. Installing..."
            npm install -g serverless
        fi
        
        print_step "Installing serverless-offline..."
        npm install -D serverless-offline
        
        print_success "Starting backend on http://localhost:3000"
        echo ""
        echo "Test endpoints:"
        echo "  POST http://localhost:3000/dev/auth/register"
        echo "  POST http://localhost:3000/dev/auth/login"
        echo "  GET  http://localhost:3000/dev/categories"
        echo ""
        echo "Press Ctrl+C to stop"
        serverless offline
        ;;
        
    3)
        print_step "Testing Full Stack..."
        
        # Check if backend is running
        if ! curl -s http://localhost:3000/dev/categories > /dev/null 2>&1; then
            print_warning "Backend not running. Please start it first:"
            echo "  cd backend && serverless offline"
            echo ""
            read -p "Press Enter when backend is ready, or Ctrl+C to cancel..."
        fi
        
        cd frontend
        
        if [ ! -d "node_modules" ]; then
            print_step "Installing dependencies..."
            npm install
        fi
        
        # Create .env if it doesn't exist
        if [ ! -f ".env" ]; then
            print_step "Creating .env file..."
            cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000/dev
VITE_WS_BASE_URL=ws://localhost:3000/dev
EOF
            print_success ".env file created"
        fi
        
        print_success "Starting frontend on http://localhost:5173"
        print_success "Connected to backend at http://localhost:3000"
        echo ""
        echo "Press Ctrl+C to stop"
        npm run dev
        ;;
        
    4)
        print_step "Running Build Tests..."
        
        # Test frontend build
        print_step "Building frontend..."
        cd frontend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run build
        print_success "Frontend build successful"
        
        # Test backend build
        print_step "Building backend..."
        cd ../backend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run build
        print_success "Backend build successful"
        
        echo ""
        print_success "All builds passed! ✨"
        ;;
        
    5)
        echo "Goodbye! 👋"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
