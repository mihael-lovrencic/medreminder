const GOOGLE_CLIENT_ID = '349821944609-gguobung0alaapdnnu9oevqef9952muh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const COMMON_MEDICINES = [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Panadol', 'Nurofen',
    'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Metronidazole', 'Doxycycline',
    'Lisinopril', 'Metoprolol', 'Amlodipine', 'Losartan', 'Hydrochlorothiazide',
    'Metformin', 'Glipizide', 'Insulin', 'Januvia', 'Ozempic',
    'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Famotidine', 'Misoprostol',
    'Sertraline', 'Escitalopram', 'Fluoxetine', 'Venlafaxine', 'Diazepam',
    'Lorazepam', 'Zopiclone', 'Melatonin', 'Stesin', 'Rivotril',
    'Prednisone', 'Dexamethasone', 'Hydrocortisone', 'Betnovate', 'Diprosone',
    'Furosemide', 'Spironolactone', 'Aldactone', 'Mannitol', 'Lasix',
    'Warfarin', 'Clopidogrel', 'Apixaban', 'Rivaroxaban', 'Heparin',
    'Atorvastatin', 'Simvastatin', 'Rosuvastatin', 'Ezetimibe', 'Fenofibrate',
    'Levothyroxine', 'Thyroxine', 'Methimazole', 'Propylthiouracil',
    'Gabapentin', 'Pregabalin', 'Amitriptyline', 'Carbamazepine', 'Levetiracetam',
    'Morphine', 'Tramadol', 'Codeine', 'Oxycodone', 'Fentanyl',
    'Diclofenac', 'Naproxen', 'Ketorolac', 'Celecoxib', 'Melfen',
    'Ventolin', 'Seretide', 'Symbicort', 'Pulmicort', 'Budesonide',
    'Loratadine', 'Cetirizine', 'Desloratadine', 'Hydroxyzine', 'Benadryl',
    'Cyclopentolate', 'Tropicamide', 'Timolol', 'Xalatan', 'Lumigan',
    'Neomycin', 'Polymyxin', 'Tobramycin', 'Ciprofloxacin eye drops', 'FML',
    'Ursodiol', 'Ursodeoxycholic acid', 'Spasmex', 'Detrol', 'Vesicare',
    'Motilium', 'Domperidone', 'Metoclopramide', 'Ondansetron', 'Granisetron',
    'Durogevic', 'Ketonal', 'Lidol', 'Midazolam', 'Fentanyl',
    'Propofol', 'Rocuronium', 'Succinylcholine', 'Ephedrine', 'Atropine',
    'Adrenaline', 'Noradrenaline', 'Dopamine', 'Dobutamine', 'Amiodarone',
    'Adenosin', 'Digoxin', 'Calcium gluconate', 'Magnesium sulfate', 'Potassium chloride'
].sort();

let currentUser = null;
let tokenClient = null;
let accessToken = null;
let patients = [];
let medicines = [];
let takenToday = {};
let currentPatientId = null;
let customMedicines = [];

function init() {
    const savedUser = localStorage.getItem('medreminder_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.accessToken) {
            accessToken = currentUser.accessToken;
        }
        loadPatients();
        loadCustomMedicines();
        showApp();
        setupMedicineDropdown();
    }
}

function loadCustomMedicines() {
    if (!currentUser) return;
    const key = `medreminder_custom_meds_${currentUser.id}`;
    customMedicines = JSON.parse(localStorage.getItem(key)) || [];
}

function saveCustomMedicines() {
    if (!currentUser) return;
    const key = `medreminder_custom_meds_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(customMedicines));
}

function getAllMedicines() {
    const custom = customMedicines.filter(m => !COMMON_MEDICINES.includes(m));
    return [...new Set([...COMMON_MEDICINES, ...custom])].sort();
}

function setupMedicineDropdown() {
    const input = document.getElementById('medName');
    const dropdown = document.getElementById('medicineDropdown');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }
        
        const allMeds = getAllMedicines();
        const matches = allMeds.filter(m => m.toLowerCase().includes(query));
        const showAddNew = !allMeds.some(m => m.toLowerCase() === query);
        
        let html = '';
        
        if (matches.length > 0) {
            html += matches.slice(0, 10).map(med => 
                `<div class="medicine-option" onclick="selectMedicine('${med.replace(/'/g, "\\'")}')">${med}</div>`
            ).join('');
        }
        
        if (showAddNew) {
            html += `<div class="medicine-option add-new" onclick="addNewMedicine('${query.replace(/'/g, "\\'")}')">+ Add "${query}" as new medicine</div>`;
        }
        
        if (html) {
            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    });
    
    input.addEventListener('blur', () => {
        setTimeout(() => dropdown.classList.add('hidden'), 200);
    });
    
    input.addEventListener('focus', () => {
        if (input.value.trim().length > 0) {
            input.dispatchEvent(new Event('input'));
        }
    });
}

function selectMedicine(name) {
    document.getElementById('medName').value = name;
    document.getElementById('medicineDropdown').classList.add('hidden');
}

function addNewMedicine(name) {
    if (!customMedicines.includes(name)) {
        customMedicines.push(name);
        saveCustomMedicines();
    }
    document.getElementById('medName').value = name;
    document.getElementById('medicineDropdown').classList.add('hidden');
}

function createUser() {
    const name = document.getElementById('userName').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    currentUser = { id: 'local_' + Date.now(), name: name, isGoogle: false };
    localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
    patients = [];
    savePatients();
    showApp();
}

function loadPatients() {
    const key = `medreminder_patients_${currentUser.id}`;
    patients = JSON.parse(localStorage.getItem(key)) || [];
}

function savePatients() {
    const key = `medreminder_patients_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(patients));
}

function getPatientStorageKey(patientId) {
    return `medreminder_data_${currentUser.id}_${patientId}`;
}

function loadPatientData(patientId) {
    const data = JSON.parse(localStorage.getItem(getPatientStorageKey(patientId))) || {};
    medicines = data.medicines || [];
    takenToday = data.takenToday || {};
}

function savePatientData() {
    if (!currentPatientId) return;
    localStorage.setItem(getPatientStorageKey(currentPatientId), JSON.stringify({ medicines, takenToday }));
    showSyncStatus('Saved: ' + new Date().toLocaleTimeString(), 'pending');
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('userNameDisplay').textContent = currentUser.name;

    if (currentUser.isGoogle) {
        document.getElementById('googleSignInBtn').classList.add('hidden');
        document.getElementById('syncToDriveBtn').classList.remove('hidden');
        document.getElementById('syncFromDriveBtn').classList.remove('hidden');
        document.getElementById('googleSignOutBtn').classList.remove('hidden');
    }

    renderPatientList();
    if (patients.length > 0 && !currentPatientId) {
        selectPatient(patients[0].id);
    } else if (patients.length > 0) {
        renderPatientSelector();
        renderLists();
    } else {
        showPatientModal();
    }
    
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
}

function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function switchUser() {
    if (confirm('Switch to a different user? All data will be cleared.')) {
        localStorage.removeItem('medreminder_user');
        localStorage.removeItem(`medreminder_patients_${currentUser.id}`);
        currentUser = null;
        patients = [];
        currentPatientId = null;
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('userName').value = '';
        closeSettings();
    }
}

function showSyncStatus(message, type = 'synced') {
    const el = document.getElementById('syncStatus');
    el.textContent = message;
    el.className = 'sync-status ' + type;
    el.classList.remove('hidden');
}

function renderPatientList() {
    const list = document.getElementById('patientList');
    if (patients.length === 0) {
        list.innerHTML = '<li class="empty-state"><p>No patients yet</p></li>';
    } else {
        list.innerHTML = patients.map(p => `
            <li class="patient-item ${p.id === currentPatientId ? 'active' : ''}" onclick="selectPatient(${p.id})">
                <div class="patient-info">
                    <div class="patient-name">${p.name}</div>
                    <div class="patient-room">${p.room || t('noRoom')}</div>
                </div>
                <button class="btn-delete" onclick="event.stopPropagation(); deletePatient(${p.id})">${t('delete')}</button>
            </li>
        `).join('');
    }
    renderPatientSelector();
}

function renderPatientSelector() {
    const selector = document.getElementById('patientSelector');
    const currentPatient = patients.find(p => p.id === currentPatientId);
    selector.innerHTML = patients.map(p => 
        `<option value="${p.id}" ${p.id === currentPatientId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
    
    if (currentPatient) {
        document.getElementById('currentPatientName').textContent = currentPatient.name;
    }
}

function selectPatient(id) {
    currentPatientId = id;
    loadPatientData(id);
    renderPatientList();
    renderLists();
}

function onPatientChange(e) {
    const id = parseInt(e.target.value);
    selectPatient(id);
}

function showPatientModal(editId = null) {
    const modal = document.getElementById('patientModal');
    const title = document.getElementById('patientModalTitle');
    const nameInput = document.getElementById('patientName');
    const roomInput = document.getElementById('patientRoom');
    const saveBtn = document.getElementById('savePatientBtn');
    const deleteBtn = document.getElementById('deletePatientBtn');
    
    if (editId) {
        const patient = patients.find(p => p.id === editId);
        title.textContent = 'Edit Patient';
        nameInput.value = patient.name;
        roomInput.value = patient.room || '';
        saveBtn.onclick = () => updatePatient(editId);
        deleteBtn.classList.remove('hidden');
        deleteBtn.onclick = () => deletePatient(editId);
    } else {
        title.textContent = 'Add Patient';
        nameInput.value = '';
        roomInput.value = '';
        saveBtn.onclick = addPatient;
        deleteBtn.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.add('hidden');
}

function addPatient() {
    const name = document.getElementById('patientName').value.trim();
    const room = document.getElementById('patientRoom').value.trim();
    
    if (!name) {
        alert('Please enter patient name');
        return;
    }
    
    const patient = {
        id: Date.now(),
        name: name,
        room: room
    };
    
    patients.push(patient);
    savePatients();
    closePatientModal();
    currentPatientId = patient.id;
    savePatientData();
    renderPatientList();
    renderLists();
}

function updatePatient(id) {
    const name = document.getElementById('patientName').value.trim();
    const room = document.getElementById('patientRoom').value.trim();
    
    if (!name) {
        alert('Please enter patient name');
        return;
    }
    
    const index = patients.findIndex(p => p.id === id);
    if (index !== -1) {
        patients[index].name = name;
        patients[index].room = room;
        savePatients();
        closePatientModal();
        renderPatientList();
        renderLists();
    }
}

function deletePatient(id) {
    if (!confirm('Delete this patient and all their medicines?')) return;
    
    patients = patients.filter(p => p.id !== id);
    localStorage.removeItem(getPatientStorageKey(id));
    savePatients();
    
    if (currentPatientId === id) {
        currentPatientId = patients.length > 0 ? patients[0].id : null;
        if (currentPatientId) {
            loadPatientData(currentPatientId);
        } else {
            medicines = [];
            takenToday = {};
        }
    }
    
    renderPatientList();
    renderLists();
}

function addMedicine() {
    const name = document.getElementById('medName').value.trim();
    const dosage = document.getElementById('medDosage').value.trim();
    const time = document.getElementById('medTime').value;
    const notes = document.getElementById('medNotes').value.trim();

    if (!name || !dosage || !time) {
        alert('Please fill in name, dosage, and time');
        return;
    }

    medicines.push({ id: Date.now(), name, dosage, time, notes });
    medicines.sort((a, b) => a.time.localeCompare(b.time));
    savePatientData();

    document.getElementById('medName').value = '';
    document.getElementById('medDosage').value = '';
    document.getElementById('medTime').value = '';
    document.getElementById('medNotes').value = '';
    renderLists();
}

function deleteMedicine(id) {
    medicines = medicines.filter(m => m.id !== id);
    savePatientData();
    renderLists();
}

function markAsTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    takenToday[today] = takenToday[today] || [];
    if (!takenToday[today].includes(id)) {
        takenToday[today].push(id);
        savePatientData();
    }
    renderLists();
}

function markAsNotTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    if (takenToday[today]) {
        takenToday[today] = takenToday[today].filter(mid => mid !== id);
        savePatientData();
    }
    renderLists();
}

function renderLists() {
    const today = new Date().toISOString().split('T')[0];
    const todayTaken = takenToday[today] || [];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayMedicines = medicines.filter(m => m.time <= currentTime);

    const render = (list) => {
        if (list.length === 0) return '<li class="empty-state"><p>No medicines added yet</p></li>';
        return list.map(med => {
            const isTaken = todayTaken.includes(med.id);
            return `<li class="medicine-item ${isTaken ? 'taken' : ''}">
                <div class="medicine-info">
                    <div class="medicine-name">${med.name}<span class="status-badge ${isTaken ? 'status-taken' : 'status-pending'}">${isTaken ? 'Taken' : 'Pending'}</span></div>
                    <div class="medicine-dosage">${med.dosage}</div>
                    <div class="medicine-time">${formatTime(med.time)}</div>
                    ${med.notes ? `<div class="medicine-notes">${med.notes}</div>` : ''}
                </div>
                <div class="btn-group" style="flex-direction: column;">
                    ${isTaken ? `<button class="btn-take" onclick="markAsNotTaken(${med.id})">Undo</button>` : `<button class="btn-take" onclick="markAsTaken(${med.id})">Take</button>`}
                    <button class="btn-delete" onclick="deleteMedicine(${med.id})">Delete</button>
                </div>
            </li>`;
        }).join('');
    };

    document.getElementById('allList').innerHTML = render(medicines);
    document.getElementById('todayList').innerHTML = render(todayMedicines);
}

function formatTime(time) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('today-tab').style.display = tab === 'today' ? 'block' : 'none';
    document.getElementById('all-tab').style.display = tab === 'all' ? 'block' : 'none';
}

function initGoogleSync() {
    if (!GOOGLE_CLIENT_ID) {
        alert('Google Client ID not configured');
        return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES + ' https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (response) => {
            if (response.access_token) {
                accessToken = response.access_token;

                try {
                    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { 'Authorization': 'Bearer ' + accessToken }
                    });
                    const userInfo = await userInfoResponse.json();

                    currentUser = {
                        id: 'google_' + userInfo.email,
                        name: userInfo.name || userInfo.email,
                        email: userInfo.email,
                        isGoogle: true,
                        accessToken: accessToken
                    };
                    localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
                    loadPatients();
                    showApp();
                    closeSettings();
                    showSyncStatus('Connected to Google!', 'synced');
                } catch (e) {
                    console.error('Failed to get user info:', e);
                    showSyncStatus('Connected but failed to get profile', 'pending');
                }
            }
        }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
}

async function syncToDrive() {
    if (!currentUser.isGoogle || !accessToken) {
        alert('Please connect Google Drive first');
        return;
    }

    try {
        const allData = {
            patients: patients,
            customMedicines: customMedicines,
            patientData: {}
        };
        
        patients.forEach(p => {
            const data = JSON.parse(localStorage.getItem(getPatientStorageKey(p.id))) || {};
            allData.patientData[p.id] = data;
        });

        const data = JSON.stringify(allData);

        const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="medreminder_backup.json"', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        const searchResult = await searchResponse.json();

        if (searchResult.files && searchResult.files.length > 0) {
            const fileId = searchResult.files[0].id;
            await fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media', {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: data
            });
        } else {
            const metadata = { name: 'medreminder_backup.json', mimeType: 'application/json' };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([data], { type: 'application/json' }));

            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + accessToken },
                body: form
            });
        }

        showSyncStatus('Uploaded to Google Drive!', 'synced');
    } catch (error) {
        console.error('Sync error:', error);
        showSyncStatus('Upload failed: ' + error.message, 'pending');
    }
}

async function syncFromDrive() {
    if (!currentUser.isGoogle || !accessToken) {
        alert('Please connect Google Drive first');
        return;
    }

    try {
        const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="medreminder_backup.json"', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        const searchResult = await searchResponse.json();

        if (!searchResult.files || searchResult.files.length === 0) {
            alert('No backup found on Google Drive');
            return;
        }

        const fileId = searchResult.files[0].id;
        const fileResponse = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        const allData = await fileResponse.json();

        patients = allData.patients || [];
        savePatients();
        
        customMedicines = allData.customMedicines || [];
        saveCustomMedicines();
        
        Object.keys(allData.patientData || {}).forEach(patientId => {
            localStorage.setItem(getPatientStorageKey(parseInt(patientId)), JSON.stringify(allData.patientData[patientId]));
        });

        if (patients.length > 0) {
            currentPatientId = patients[0].id;
            loadPatientData(currentPatientId);
        }

        showApp();
        showSyncStatus('Loaded from Google Drive!', 'synced');
    } catch (error) {
        console.error('Sync error:', error);
        showSyncStatus('Download failed: ' + error.message, 'pending');
    }
}

function signOutGoogle() {
    if (accessToken) {
        fetch('https://oauth2.googleapis.com/revoke?token=' + accessToken, { method: 'POST' })
            .catch(() => {});
    }
    accessToken = null;
    if (currentUser) {
        currentUser.isGoogle = false;
        delete currentUser.accessToken;
        localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
    }

    document.getElementById('googleSignInBtn').classList.remove('hidden');
    document.getElementById('syncToDriveBtn').classList.add('hidden');
    document.getElementById('syncFromDriveBtn').classList.add('hidden');
    document.getElementById('googleSignOutBtn').classList.add('hidden');

    showSyncStatus('Google disconnected', 'pending');
}

document.addEventListener('DOMContentLoaded', init);
