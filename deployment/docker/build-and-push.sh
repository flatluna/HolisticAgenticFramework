#!/bin/bash
# Build and push Docker images to ACR

ACR_NAME="aetpregistry"
REGISTRY="${ACR_NAME}.azurecr.io"
VERSION=${1:-latest}

echo "Building Docker images..."

docker build -f deployment/docker/Dockerfile.api -t ${REGISTRY}/aetp-api:${VERSION} .
docker build -f deployment/docker/Dockerfile.web -t ${REGISTRY}/aetp-web:${VERSION} .

echo "Logging into ACR..."
az acr login --name ${ACR_NAME}

echo "Pushing images to ACR..."
docker push ${REGISTRY}/aetp-api:${VERSION}
docker push ${REGISTRY}/aetp-web:${VERSION}

echo "✓ Images built and pushed successfully"
