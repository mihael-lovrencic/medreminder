let translations = {};
let currentLang = 'en';

const defaultTranslations = {
    en: {
        continueBtn: 'Continue',
        signInGoogle: 'Sign in with Google',
        tryDemo: 'Try Demo Mode',
        enterName: 'Your name',
        addPatient: 'Add Patient',
        patientName: 'Patient Name',
        roomNumber: 'Room',
        savePatient: 'Save',
        cancel: 'Cancel',
        deletePatient: 'Delete',
        today: 'Today',
        allMedicines: 'Medicines',
        addMedicine: 'Add Medicine',
        medicineName: 'Medicine Name',
        dosage: 'Dosage',
        time: 'Time',
        notes: 'Notes',
        todaySchedule: "Today's Schedule",
        allPatients: 'Patients',
        noPatients: 'No patients yet',
        noMedicines: 'No medicines scheduled for today',
        noMedicinesAll: 'No medicines added yet',
        taken: 'Taken',
        pending: 'Pending',
        undo: 'Undo',
        take: 'Take',
        delete: 'Delete',
        connectGoogle: 'Connect Google Drive',
        uploadDrive: 'Upload',
        downloadDrive: 'Download',
        disconnectGoogle: 'Disconnect',
        switchUser: 'Switch User',
        close: 'Close',
        save: 'Save',
        edit: 'Edit',
        searchMedicine: 'Search or enter medicine',
        pleaseFillFields: 'Please fill in name, dosage, and time',
        enterPatientName: 'Please enter patient name',
        deleteConfirm: 'Delete this patient and all their medicines?',
        switchUserConfirm: 'Switch to a different user? All data will be cleared.',
        language: 'Language',
        noRoom: 'No room',
        editPatient: 'Edit Patient',
        stockQuantity: 'Stock (pills)',
        createOrganization: 'Create Organization',
        joinOrganization: 'Join Organization',
        leaveOrganization: 'Leave',
        orgName: 'Organization Name',
        orgCode: 'Organization Code',
        orgNotFound: 'Organization not found. Check the code and try again.',
        alreadyMember: 'You are already a member of this organization.',
        confirmLeaveOrg: 'Are you sure you want to leave this organization?',
        noOrg: 'You must be part of an organization first.',
        shareBackupOrg: 'Share Backup',
        loadBackupOrg: 'Load Backup',
        noBackups: 'No backups available in this organization.',
        confirmLoadBackup: 'Load backup from',
        pleaseEnterCode: 'Please enter organization code',
        create: 'Create',
        join: 'Join',
        enterUserName: 'Please enter your name',
        demoModeActive: 'Demo mode active!',
        leftOrganization: 'Left organization',
        backupShared: 'Backup shared',
        backupLoaded: 'Backup loaded',
        noBackupsShared: 'No backups shared yet',
        memberCount: 'member(s)',
        patientCount: 'patients',
        left: 'left',
        inStock: 'in stock',
        connectGoogleFirst: 'Please connect Google Drive first',
        googleNotConfigured: 'Google Client ID not configured',
        googleConnected: 'Connected to Google!',
        googleDisconnected: 'Google disconnected',
        dosagePlaceholder: 'e.g., 500mg',
        patientNamePlaceholder: 'e.g., John Doe',
        roomPlaceholder: 'e.g., Room 101',
        orgNamePlaceholder: 'e.g., City Hospital',
        orgCodePlaceholder: 'Enter code',
        copy: 'Copy',
        copied: 'Copied!',
        copyFailed: 'Failed to copy',
        backups: 'backups',
        team: 'Team',
        backup: 'Backup'
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
