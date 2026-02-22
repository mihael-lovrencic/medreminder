# MedReminder

A simple medicine tracking web app that helps you remember which medicines you've taken and which you need to take.

## Features

- Add medicines with name, dosage, and time
- Mark medicines as taken
- View today's schedule or all medicines
- User-specific data (each user has their own profile)
- Google Drive sync (requires Google Client ID setup)
- Responsive design works on mobile and desktop

## Running the App

### Option 1: Local Server (Recommended for Google Sync)

```bash
npm install
npm start
```

Then open http://localhost:8080 in your browser.

### Option 2: Direct File Open

Open `index.html` directly in your browser. Note: Google Drive sync won't work with this method.

### Running Tests

```bash
npm install
npm test
```

## Google Drive Sync Setup

To enable Google Drive sync:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web application)
5. Add your domain to authorized origins
6. Copy the Client ID
7. In the app, go to Settings > Connect Google Drive and enter your Client ID

## Tech Stack

- Plain HTML/CSS/JavaScript (no framework)
- localStorage for data persistence
- Playwright for testing

## License

MIT
