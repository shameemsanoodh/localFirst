#!/bin/bash

echo "🔄 Restarting backend..."
echo ""

# Kill any existing serverless offline processes
pkill -f "serverless offline" || true
sleep 2

# Start backend
cd backend
echo "Starting serverless offline..."
npm run offline
