#!/bin/bash
# Script để dừng local development environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 Stopping Local Development Environment...${NC}"

# Stop database container
echo -e "${BLUE}🐘 Stopping PostgreSQL database...${NC}"
if docker-compose stop db; then
    echo -e "${GREEN}✅ Database stopped successfully${NC}"
else
    echo -e "${RED}❌ Failed to stop database${NC}"
fi

# Show status
echo -e "\n${CYAN}📊 Container Status:${NC}"
docker-compose ps

echo -e "\n${BLUE}📝 Commands for cleanup:${NC}"
echo -e "   ${WHITE}Remove containers: docker-compose down${NC}"
echo -e "   ${WHITE}Remove volumes (delete data): docker-compose down -v${NC}"
echo -e "   ${WHITE}Remove everything: docker-compose down -v --remove-orphans${NC}"

echo -e "\nDo you want to remove containers and data? (y/N)"
read -r cleanup
if [[ $cleanup =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️ Removing containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi 