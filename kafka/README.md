# Kafka Setup

## Start Kafka
docker compose -f docker-compose.kafka.yml up -d
## Stop Kafka
docker compose -f docker-compose.kafka.yml down
## Create Topics
bash create-topics.sh