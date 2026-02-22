# Google Cloud Setup for MedReminder

## Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/projectcreate
2. Enter Project Name: `staracki-dom-legrad`
3. Click "CREATE"

## Step 2: Enable Google Drive API

1. Go to: https://console.cloud.google.com/apis/enable
2. Search for "Google Drive API"
3. Click "ENABLE"

## Step 3: Configure OAuth Consent

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Select "External"
3. Fill in:
   - App name: MedReminder
   - User support email: your email
   - Developer contact email: your email
4. Click "SAVE AND CONTINUE"
5. Click "ADD OR REMOVE SCOPES"
6. Search and add: `.../auth/drive.file`
7. Click "SAVE AND CONTINUE"
8. Add test users (your email)
9. Click "SAVE AND CONTINUE"

## Step 4: Create OAuth Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Application type: "Web application"
4. Name: MedReminder
5. Add "Authorized JavaScript origins":
   - `http://localhost:8080` (for local testing)
   - `http://127.0.0.1:8080` (alternative localhost)
6. Click "CREATE"
7. Copy the "Client ID"

## Step 5: Use in MedReminder

1. Open MedReminder app
2. Click "Settings"
3. Click "Connect Google Drive"
4. Enter your Client ID

## Quick Links

- Console: https://console.cloud.google.com/home/dashboard?project=staracki-dom-legrad
- OAuth: https://console.cloud.google.com/apis/credentials?project=staracki-dom-legrad
- Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=staracki-dom-legrad
