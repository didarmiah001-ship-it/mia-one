#!/bin/bash
set -e

echo "=== Firestore Rules Deploy + Seed Script ==="
echo ""
echo "This script deploys Firestore security rules and seeds sample data."
echo ""

# Check for service account
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set."
  echo ""
  echo "To run this script, you need a Firebase service account key JSON file."
  echo ""
  echo "Steps to get the service account key:"
  echo "  1. Go to Firebase Console > Project Settings > Service Accounts"
  echo "  2. Click 'Generate New Private Key' and download the JSON file"
  echo "  3. Save it as service-account.json in the project root"
  echo "  4. Run: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json ./scripts/deploy-firestore.sh"
  echo ""
  exit 1
fi

echo "Using service account: $GOOGLE_APPLICATION_CREDENTIALS"
echo ""

# Step 1: Deploy Firestore rules
echo "--- Step 1: Deploying Firestore security rules ---"
npx firebase deploy --only firestore:rules --project mia-one-5554d
echo ""

# Step 2: Seed collections
echo "--- Step 2: Seeding missing collections ---"
npx tsx scripts/seed-firestore.ts
echo ""

echo "=== Done! ==="
