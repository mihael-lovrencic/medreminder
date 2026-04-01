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
        editPatient: 'Edit Patient',
        stockQuantity: 'Stock Quantity (pills)',
        stockHint: 'Leave empty if tracking not needed',
        medicines: 'medicines',
        pillsLeft: 'pills left',
        orderNow: 'ORDER NOW!',
        lowStockWarning: 'Low Stock Warning',
        organization: 'Organization',
        createOrganization: 'Create Organization',
        joinOrganization: 'Join Organization',
        leaveOrganization: 'Leave Organization',
        orgName: 'Organization Name',
        orgCode: 'Organization Code',
        orgNotFound: 'Organization not found. Check the code and try again.',
        alreadyMember: 'You are already a member of this organization.',
        confirmLeaveOrg: 'Are you sure you want to leave this organization?',
        noOrg: 'You must be part of an organization first.',
        backup: 'Backup & Sync',
        shareBackupOrg: 'Share Backup to Organization',
        loadBackupOrg: 'Load Backup from Organization',
        noBackups: 'No backups available in this organization.',
        confirmLoadBackup: 'Load backup from',
        confirmOverwrite: 'This will replace your current data.',
        pleaseEnterCode: 'Please enter organization code',
        create: 'Create',
        join: 'Join',
        enterUserName: 'Please enter your name',
        medReminder: '💊 MedReminder',
        demoModeActive: 'Demo mode active - try editing and managing!',
        saved: 'Saved',
        savedAt: 'Saved',
        leftOrganization: 'Left organization',
        backupShared: 'Backup shared to organization',
        backupLoaded: 'Backup loaded from organization',
        noBackupsShared: 'No backups shared yet',
        memberCount: 'member(s)',
        patientCount: 'patients',
        left: 'left',
        inStock: 'in stock',
        connectGoogleFirst: 'Please connect Google Drive first',
        googleNotConfigured: 'Google Client ID not configured',
        googleConnected: 'Connected to Google!',
        googleProfileFailed: 'Connected but failed to get profile',
        googleDisconnected: 'Google disconnected',
        dosagePlaceholder: 'e.g., 1 tablet',
        patientNamePlaceholder: 'e.g., John Doe',
        roomPlaceholder: 'e.g., Room 101',
        orgNamePlaceholder: 'e.g., City Hospital Ward A',
        orgCodePlaceholder: 'Enter organization code',
        switchUserConfirm: 'Switch to a different user? All data will be cleared.',
        confirmDeletePatient: 'Please enter patient name',
        addNewMedicineOption: 'Add',
        asNewMedicine: 'as new medicine'
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
