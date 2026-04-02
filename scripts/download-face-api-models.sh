#!/usr/bin/env bash
set -euo pipefail

mkdir -p public/models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

for file in "${FILES[@]}"; do
  echo "Downloading $file..."
  curl -L "$BASE_URL/$file" -o "public/models/$file"
done

echo "Downloaded face-api.js weights to public/models"
