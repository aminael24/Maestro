#!/bin/bash

echo "Creating Kafka topics..."

docker exec kafka kafka-topics \
  --create \
  --topic user-created \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 1

docker exec kafka kafka-topics \
  --create \
  --topic order-created \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 1

echo "Topics created."