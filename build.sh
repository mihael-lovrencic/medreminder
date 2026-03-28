#!/bin/bash
# Build script for MedReminder

# Install dependencies
npm install

# Copy web assets to www folder
mkdir -p www
cp index.html www/
cp -r css www/
cp -r js www/

# Sync with Capacitor
npx cap sync android

echo "Build prepared. Open Android Studio with: cd android && studio ."
