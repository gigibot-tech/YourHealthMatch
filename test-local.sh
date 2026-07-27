#!/bin/bash

# Local Test Script for Telemedicine Backend
# Tests backend functionality without mobile app

set -e

echo "🧪 Telemedicine Backend Local Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠️  Please edit .env and add your Agora credentials:${NC}"
    echo "   AGORA_APP_ID=your_app_id"
    echo "   AGORA_APP_CERTIFICATE=your_certificate"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Check if Agora credentials are set
if grep -q "your_agora_app_id_here" .env; then
    echo -e "${RED}❌ Agora credentials not configured${NC}"
    echo "Please edit .env and add your real Agora credentials"
    exit 1
fi

echo -e "${GREEN}✅ Agora credentials configured${NC}"
echo ""

# Start Docker Compose
echo "🚀 Starting backend with Docker..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Test 1: Health Check
echo ""
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
    docker-compose logs api
    exit 1
fi

# Test 2: Token Generation
echo ""
echo "Test 2: Token Generation"
echo "------------------------"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123",
    "channelName": "test_channel",
    "uid": 1
  }')

if echo "$TOKEN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Token generation passed${NC}"
    echo "Token received (truncated):"
    echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | head -c 50
    echo "..."
else
    echo -e "${RED}❌ Token generation failed${NC}"
    echo "Response: $TOKEN_RESPONSE"
    docker-compose logs api
    exit 1
fi

# Test 3: Session Start
echo ""
echo "Test 3: Session Management"
echo "--------------------------"
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/video/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123"
  }')

if echo "$SESSION_RESPONSE" | grep -q "sessionId"; then
    echo -e "${GREEN}✅ Session start passed${NC}"
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
    echo "Session ID: $SESSION_ID"
else
    echo -e "${RED}❌ Session start failed${NC}"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

# Test 4: List Sessions
echo ""
echo "Test 4: List Sessions"
echo "---------------------"
SESSIONS_RESPONSE=$(curl -s http://localhost:3000/api/video/sessions)
if echo "$SESSIONS_RESPONSE" | grep -q "count"; then
    echo -e "${GREEN}✅ List sessions passed${NC}"
    echo "Response: $SESSIONS_RESPONSE"
else
    echo -e "${RED}❌ List sessions failed${NC}"
    echo "Response: $SESSIONS_RESPONSE"
    exit 1
fi

# Test 5: End Session
echo ""
echo "Test 5: End Session"
echo "-------------------"
END_RESPONSE=$(curl -s -X POST http://localhost:3000/api/video/session/end \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"duration\": 120,
    \"reason\": \"test_completed\"
  }")

if echo "$END_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ End session passed${NC}"
    echo "Response: $END_RESPONSE"
else
    echo -e "${RED}❌ End session failed${NC}"
    echo "Response: $END_RESPONSE"
    exit 1
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo "=================================="
echo ""
echo "Backend is running at: http://localhost:3000"
echo ""
echo "Next steps:"
echo "1. Keep backend running: docker-compose logs -f"
echo "2. Configure mobile app to use: http://YOUR_IP:3000"
echo "3. Test with two devices using TESTING_GUIDE.md"
echo ""
echo "To stop backend: docker-compose down"
echo ""

# Made with Bob
