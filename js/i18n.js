let translations = {};
let currentLang = 'en';

const defaultTranslations = {
    en: {
        welcome: 'Welcome to MedReminder',
        subtitle: 'Track medicines for multiple patients',
        enterName: 'Enter your name (nurse/caregiver)',
        continueBtn: 'Continue',
        signInGoogle: 'Sign in with Google',
        tryDemo: 'Try Demo',
        settings: 'Settings',
        currentPatient: 'Current Patient',
        addPatient: 'Add Patient',
        patientName: 'Patient Name',
        roomNumber: 'Room Number (optional)',
        savePatient: 'Save Patient',
        cancel: 'Cancel',
        deletePatient: 'Delete Patient',
        today: 'Today',
        allMedicines: 'All Medicines',
        addMedicine: 'Add Medicine',
        medicineName: 'Medicine Name',
        dosage: 'Dosage',
        time: 'Time',
        notes: 'Notes (optional)',
        notesPlaceholder: 'e.g., Take with food',
        todaySchedule: "Today's Schedule",
        allPatients: 'All Patients',
        noPatients: 'No patients yet',
        noMedicines: 'No medicines scheduled for today',
        noMedicinesAll: 'No medicines added yet',
        taken: 'Taken',
        pending: 'Pending',
        undo: 'Undo',
        take: 'Take',
        delete: 'Delete',
        syncGoogleDrive: 'Sync your data with Google Drive',
        connectGoogle: 'Connect Google Drive',
        uploadDrive: 'Upload to Google Drive',
        downloadDrive: 'Download from Google Drive',
        disconnectGoogle: 'Disconnect Google',
        switchUser: 'Switch User',
        close: 'Close',
        save: 'Save',
        edit: 'Edit',
        searchMedicine: 'Search medicine...',
        addNewMedicine: 'Add as new medicine',
        saved: 'Saved',
        connected: 'Connected to Google!',
        disconnected: 'Google disconnected',
        uploaded: 'Uploaded to Google Drive!',
        downloaded: 'Loaded from Google Drive!',
        uploadFailed: 'Upload failed',
        downloadFailed: 'Download failed',
        noBackup: 'No backup found on Google Drive',
        pleaseFillFields: 'Please fill in name, dosage, and time',
        enterPatientName: 'Please enter patient name',
        deleteConfirm: 'Delete this patient and all their medicines?',
        switchUserConfirm: 'Switch to a different user? All data will be cleared.',
        language: 'Language',
        noRoom: 'No room',
        editPatient: 'Edit Patient'
    }
};

async function loadLanguage(lang) {
    if (lang === 'en') {
        translations = defaultTranslations.en;
        currentLang = 'en';
        return;
    }
    
    try {
        const response = await fetch(`js/lang/${lang}.js`);
        if (response.ok) {
            const script = await response.text();
            const fn = new Function(script + '; return window.translations;');
            const result = fn();
            if (result && result[lang]) {
                translations = result[lang];
                currentLang = lang;
                return;
            }
        }
    } catch (e) {
        console.log('Language file error:', e);
    }
    
    translations = defaultTranslations.en;
    currentLang = 'en';
}

function detectLanguage() {
    const savedLang = localStorage.getItem('medreminder_lang');
    if (savedLang) {
        return savedLang;
    }
    
    const browserLang = navigator.language.split('-')[0];
    return browserLang;
}

async function initI18n() {
    const lang = detectLanguage();
    await loadLanguage(lang);
}

function setLanguage(lang) {
    loadLanguage(lang).then(() => {
        localStorage.setItem('medreminder_lang', lang);
        applyTranslations();
        if (typeof renderPatientList === 'function') renderPatientList();
        if (typeof renderLists === 'function') renderLists();
    });
}

function t(key) {
    return translations[key] || defaultTranslations.en[key] || key;
}

function applyTranslations() {
    const langSelector = document.getElementById('langSelector');
    if (langSelector) {
        langSelector.value = currentLang;
    }
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
}

function onLangChange(event) {
    setLanguage(event.target.value);
}

window.initI18n = initI18n;
window.setLanguage = setLanguage;
window.loadLanguage = loadLanguage;
window.t = t;
window.applyTranslations = applyTranslations;
window.onLangChange = onLangChange;
window.currentLang = () => currentLang;
