# MedReminder

Medicine tracking app for nursing homes and caregivers - track multiple patients and their medications.

## Features

- **Multi-Patient Management** - Add, edit, and delete patients with room numbers
- **Medicine Scheduling** - Track medications with dosage, time, and notes
- **Daily Tracking** - Mark medicines as taken/pending with visual indicators
- **Stock Management** - Track pill inventory with low-stock warnings
- **Multi-Language Support** - 20 European languages
- **Demo Mode** - Try the app instantly with sample data
- **Google Drive Sync** - Backup and restore data to Google Drive
- **Responsive Design** - Works on mobile, tablet, and desktop
- **PWA Ready** - Can be installed as an Android app

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open http://localhost:8080 in your browser.

Or double-click `start.bat` (Windows) to launch the server.

## Demo Mode

Click "Try Demo" on the login screen to explore the app with pre-loaded sample patients and medicines.

## Android App

The app is automatically built as an Android APK on every commit to `main`. 

Download the latest release from the [Releases page](https://github.com/mihael-lovrencic/medreminder/releases/latest).

## Testing

```bash
npm test
```

Runs 24 Playwright e2e tests covering all major features.

## Google Drive Sync Setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Drive API
3. Create OAuth 2.0 credentials (Web application)
4. Add `http://localhost:8080` to authorized JavaScript origins
5. In Settings, enter your Client ID to connect

See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for detailed instructions.

## Tech Stack

- HTML/CSS/JavaScript (vanilla)
- Capacitor (Android)
- Playwright (testing)
- localStorage for persistence
- Google Drive API for cloud backup

## Project Structure

```
├── index.html          # Main app
├── css/
│   └── style.css       # Styles
├── js/
│   ├── app.js          # Main application logic
│   ├── i18n.js        # Internationalization
│   └── lang/          # Language files (20 languages)
├── tests/
│   └── app.spec.js     # Playwright e2e tests
├── android/            # Capacitor Android project
└── .github/
    └── workflows/      # CI/CD for APK builds
```

## License

MIT
