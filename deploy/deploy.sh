#!/bin/bash
set -e

# Deployment script for the image generator app
# Usage: ./deploy/deploy.sh [--build] [--restart]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Image Generator Deployment ===${NC}"

# Check if running from project root
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# Check for required files
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Create it from .env.example:"
    echo "  cp .env.example .env.production"
    echo "  # Edit .env.production with your values"
    exit 1
fi

# Check for required environment variables
source .env.production

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: DOMAIN not set in .env.production${NC}"
    exit 1
fi

if [ -z "$REPLICATE_API_TOKEN" ]; then
    echo -e "${RED}Error: REPLICATE_API_TOKEN not set in .env.production${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}Error: JWT_SECRET not set in .env.production${NC}"
    exit 1
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo -e "${RED}Error: ADMIN_PASSWORD not set in .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}Environment validated${NC}"
echo -e "Domain: ${YELLOW}$DOMAIN${NC}"

# Parse arguments
BUILD=false
RESTART=false

for arg in "$@"; do
    case $arg in
        --build)
            BUILD=true
            shift
            ;;
        --restart)
            RESTART=true
            shift
            ;;
    esac
done

# Build if requested
if [ "$BUILD" = true ]; then
    echo -e "${GREEN}Building Docker images...${NC}"
    docker compose -f docker-compose.prod.yml build
fi

# Restart if requested
if [ "$RESTART" = true ]; then
    echo -e "${GREEN}Restarting services...${NC}"
    docker compose -f docker-compose.prod.yml down
fi

# Start/update services
echo -e "${GREEN}Starting services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for health check
echo -e "${GREEN}Waiting for app to be healthy...${NC}"
sleep 5

# Check container status
docker compose -f docker-compose.prod.yml ps

# Show logs (last 20 lines)
echo -e "${GREEN}Recent logs:${NC}"
docker compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "Your app should be available at: ${YELLOW}https://$DOMAIN${NC}"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.prod.yml logs -f     # Follow logs"
echo "  docker compose -f docker-compose.prod.yml down        # Stop services"
echo "  docker compose -f docker-compose.prod.yml restart     # Restart services"
