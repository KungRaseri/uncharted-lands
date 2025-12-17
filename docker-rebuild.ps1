cd c:\code\uncharted-lands; 
docker-compose -f docker-compose.e2e.yml down; 
docker-compose -f docker-compose.e2e.yml build; 
docker-compose -f docker-compose.e2e.yml up -d;