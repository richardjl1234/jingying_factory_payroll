#!/bin/bash
# Build frontend for cloud deployment

echo "Building frontend for cloud deployment..."

# Copy cloud environment file
cp frontend/.env.cloud frontend/.env

# Build frontend
cd frontend
npm run build

echo "Frontend built for cloud deployment."
echo "API base URL set to: http://124.220.108.154/api"
