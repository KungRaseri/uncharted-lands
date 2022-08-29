docker compose -f "docker-compose.debug.yml" down

docker build --pull --rm -f "api\Dockerfile" -t browsergame-api:latest "api"
docker build --pull --rm -f "client-app\Dockerfile" -t browsergame-client:latest "client-app"

docker compose -f "docker-compose.debug.yml" up -d
