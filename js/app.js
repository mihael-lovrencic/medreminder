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
let editingPatientId = null;

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
    currentUser = { id: 'user_' + Date.now(), name: name, isGoogle: false };
    localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
    patients = [];
    savePatients();
    showApp();
}

function startDemoMode() {
    currentUser = { id: 'demo_user', name: 'Demo User', isGoogle: false, isDemo: true };
    localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
    
    const demoPatients = [
        { id: 'p_demo_1', name: 'Ivan Horvat', room: 'Room 101' },
        { id: 'p_demo_2', name: 'Marija Kovačević', room: 'Room 102' },
        { id: 'p_demo_3', name: 'Stjepan Novak', room: 'Room 103' }
    ];
    
    const demoMedicines = {
        'p_demo_1': [
            { id: 'm_1', name: 'Metformin', dosage: '500mg', time: '08:00', notes: 'With breakfast', stock: 25, dailyDoses: 1 },
            { id: 'm_2', name: 'Lisinopril', dosage: '10mg', time: '08:00', notes: '', stock: 60, dailyDoses: 1 },
            { id: 'm_3', name: 'Metformin', dosage: '500mg', time: '20:00', notes: 'With dinner', stock: 25, dailyDoses: 1 }
        ],
        'p_demo_2': [
            { id: 'm_4', name: 'Omeprazole', dosage: '20mg', time: '07:00', notes: 'Before breakfast', stock: 8, dailyDoses: 1 },
            { id: 'm_5', name: 'Amlodipine', dosage: '5mg', time: '12:00', notes: '', stock: 45, dailyDoses: 1 },
            { id: 'm_6', name: 'Sertraline', dosage: '50mg', time: '21:00', notes: 'Before sleep', stock: 3, dailyDoses: 1 }
        ],
        'p_demo_3': [
            { id: 'm_7', name: 'Warfarin', dosage: '5mg', time: '09:00', notes: 'Same time daily', stock: 15, dailyDoses: 1 },
            { id: 'm_8', name: 'Furosemide', dosage: '40mg', time: '09:00', notes: '', stock: 30, dailyDoses: 1 },
            { id: 'm_9', name: 'Aspirin', dosage: '100mg', time: '21:00', notes: 'Before sleep', stock: 4, dailyDoses: 1 }
        ]
    };
    
    const today = new Date().toISOString().split('T')[0];
    const takenDemo = {
        'p_demo_1': { [today]: ['m_1', 'm_2'] },
        'p_demo_2': { [today]: ['m_4'] },
        'p_demo_3': { [today]: ['m_7'] }
    };
    
    patients = demoPatients;
    savePatients();
    
    patients.forEach(p => {
        const data = {
            medicines: demoMedicines[p.id] || [],
            takenToday: takenDemo[p.id] || {}
        };
        localStorage.setItem(getPatientStorageKey(p.id), JSON.stringify(data));
    });
    
    currentPatientId = patients[0].id;
    loadPatientData(currentPatientId);
    showApp();
    
    showSyncStatus('Demo mode active - try editing and managing!', 'synced');
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
        checkLowStock();
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
        list.innerHTML = '<li class="empty-state"><p>' + (t('noPatients') || 'No patients yet') + '</p></li>';
    } else {
        list.innerHTML = patients.map(p => `
            <li class="patient-item ${p.id === currentPatientId ? 'active' : ''}" onclick="selectPatient('${p.id}')">
                <div class="patient-info">
                    <div class="patient-name">${p.name}</div>
                    <div class="patient-room">${p.room || t('noRoom')}</div>
                </div>
                <div class="btn-group" style="flex-direction: row; margin-top: 0;">
                    <button class="btn-secondary" style="padding: 6px 10px; font-size: 0.8rem; margin-bottom: 0;" onclick="event.stopPropagation(); showPatientModal('${p.id}')">${t('edit')}</button>
                    <button class="btn-delete" style="padding: 6px 10px; font-size: 0.8rem; margin-bottom: 0;" onclick="event.stopPropagation(); deletePatient('${p.id}')">${t('delete')}</button>
                </div>
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
    const id = e.target.value;
    selectPatient(id);
}

function showPatientModal(editId = null) {
    const modal = document.getElementById('patientModal');
    const title = document.getElementById('patientModalTitle');
    const nameInput = document.getElementById('patientName');
    const roomInput = document.getElementById('patientRoom');
    const saveBtn = document.getElementById('savePatientBtn');
    const deleteBtn = document.getElementById('deletePatientBtn');
    
    editingPatientId = editId;
    
    if (editId) {
        const patient = patients.find(p => p.id === editId);
        title.textContent = t('editPatient');
        nameInput.value = patient.name;
        roomInput.value = patient.room || '';
        saveBtn.onclick = () => updatePatient(editId);
        deleteBtn.classList.remove('hidden');
        deleteBtn.onclick = () => deletePatient(editId);
    } else {
        title.textContent = t('addPatient');
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
        id: 'p_' + Date.now(),
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
        alert(t('enterPatientName') || 'Please enter patient name');
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
    if (!confirm(t('deleteConfirm') || 'Delete this patient and all their medicines?')) return;
    
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
    const stockInput = document.getElementById('medStock').value;
    const stock = stockInput ? parseInt(stockInput) : null;

    if (!name || !dosage || !time) {
        alert(t('pleaseFillFields') || 'Please fill in name, dosage, and time');
        return;
    }

    medicines.push({ id: 'm_' + Date.now(), name, dosage, time, notes, stock, dailyDoses: stock ? 1 : null });
    medicines.sort((a, b) => a.time.localeCompare(b.time));
    savePatientData();

    document.getElementById('medName').value = '';
    document.getElementById('medDosage').value = '';
    document.getElementById('medTime').value = '';
    document.getElementById('medNotes').value = '';
    document.getElementById('medStock').value = '';
    renderLists();
    checkLowStock();
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
        
        const med = medicines.find(m => m.id === id);
        if (med && med.stock !== null && med.stock > 0) {
            med.stock = Math.max(0, med.stock - 1);
        }
        
        savePatientData();
    }
    renderLists();
    checkLowStock();
}

function markAsNotTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    if (takenToday[today]) {
        takenToday[today] = takenToday[today].filter(mid => mid !== id);
        savePatientData();
    }
    renderLists();
}

function updateMedicineCount() {
    const countEl = document.getElementById('medicineCount');
    if (medicines.length > 0) {
        countEl.textContent = medicines.length + ' ' + (t('medicines') || 'medicines');
    } else {
        countEl.textContent = '';
    }
}

function checkLowStock() {
    const warningEl = document.getElementById('stockWarning');
    const listEl = document.getElementById('lowStockList');
    
    if (!warningEl || !listEl) return;
    
    const lowStockMeds = medicines.filter(m => m.stock !== null && m.stock !== undefined && m.stock <= 10);
    
    if (lowStockMeds.length > 0) {
        warningEl.style.display = 'block';
        listEl.innerHTML = lowStockMeds.map(m => {
            const isCritical = m.stock <= 5;
            const color = isCritical ? '#dc2626' : '#d97706';
            return `<div style="padding: 8px 0; border-bottom: 1px solid #fcd34d;">
                <strong style="color: ${color};">${m.name}</strong> - ${m.stock} ${t('pillsLeft') || 'pills left'}
                ${isCritical ? `<span style="color: #dc2626; font-weight: bold;"> ⚠️ ${t('orderNow') || 'ORDER NOW!'}</span>` : ''}
            </div>`;
        }).join('');
    } else {
        warningEl.style.display = 'none';
    }
}

function renderLists() {
    const today = new Date().toISOString().split('T')[0];
    const todayTaken = takenToday[today] || [];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayMedicines = medicines.filter(m => m.time <= currentTime);

    const getStockBadge = (med) => {
        if (med.stock === null || med.stock === undefined) return '';
        if (med.stock <= 5) {
            return `<span class="stock-badge stock-critical">${med.stock} left</span>`;
        } else if (med.stock <= 10) {
            return `<span class="stock-badge stock-warning">${med.stock} left</span>`;
        }
        return `<span class="stock-badge stock-ok">${med.stock} in stock</span>`;
    };

    const render = (list) => {
        if (list.length === 0) return '<li class="empty-state"><p>' + (t('noMedicinesAll') || 'No medicines added yet') + '</p></li>';
        return list.map(med => {
            const isTaken = todayTaken.includes(med.id);
            return `<li class="medicine-item ${isTaken ? 'taken' : ''}">
                <div class="medicine-info">
                    <div class="medicine-name">${med.name}<span class="status-badge ${isTaken ? 'status-taken' : 'status-pending'}">${isTaken ? t('taken') : t('pending')}</span></div>
                    <div class="medicine-dosage">${med.dosage} ${getStockBadge(med)}</div>
                    <div class="medicine-time">${formatTime(med.time)}</div>
                    ${med.notes ? `<div class="medicine-notes">${med.notes}</div>` : ''}
                </div>
                <div class="btn-group" style="flex-direction: column;">
                    ${isTaken ? `<button class="btn-take" onclick="markAsNotTaken('${med.id}')">${t('undo')}</button>` : `<button class="btn-take" onclick="markAsTaken('${med.id}')">${t('take')}</button>`}
                    <button class="btn-delete" onclick="deleteMedicine('${med.id}')">${t('delete')}</button>
                </div>
            </li>`;
        }).join('');
    };

    document.getElementById('allList').innerHTML = render(medicines);
    document.getElementById('todayList').innerHTML = render(todayMedicines);
    
    updateMedicineCount();
    checkLowStock();
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
            localStorage.setItem(getPatientStorageKey(patientId), JSON.stringify(allData.patientData[patientId]));
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
