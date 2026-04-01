// MedReminder App
const GOOGLE_CLIENT_ID = '349821944609-gguobung0alaapdnnu9oevqef9952muh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const COMMON_MEDICINES = [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Metformin', 'Lisinopril',
    'Omeprazole', 'Sertraline', 'Amlodipine', 'Atorvastatin', 'Metoprolol',
    'Losartan', 'Hydrochlorothiazide', 'Warfarin', 'Furosemide', 'Prednisone',
    'Amoxicillin', 'Azithromycin', 'Cetirizine', 'Loratadine', 'Ventolin'
].sort();

let state = {
    user: null,
    patients: [],
    medicines: [],
    takenToday: {},
    currentPatientId: null,
    customMedicines: [],
    organization: null,
    accessToken: null
};

let tokenClient = null;

// Organization
function generateOrgCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function loadOrganization() {
    if (!state.user) return;
    const data = localStorage.getItem(`medreminder_org_${state.user.id}`);
    if (data) {
        state.organization = JSON.parse(data);
        updateOrgUI();
    }
}

function saveOrganizationData() {
    if (!state.user || !state.organization) return;
    localStorage.setItem(`medreminder_org_${state.user.id}`, JSON.stringify(state.organization));
    localStorage.setItem(`medreminder_orgs_${state.organization.code}`, JSON.stringify(state.organization));
}

function updateOrgUI() {
    const info = document.getElementById('orgInfo');
    const createBtn = document.getElementById('createOrgBtn');
    const joinBtn = document.getElementById('joinOrgBtn');
    const leaveBtn = document.getElementById('leaveOrgBtn');
    const backupSection = document.getElementById('orgBackupSection');
    
    if (state.organization) {
        info.classList.remove('hidden');
        document.getElementById('orgNameDisplay').textContent = state.organization.name;
        document.getElementById('orgCodeDisplay').textContent = state.organization.code;
        document.getElementById('orgMemberCount').textContent = `${state.organization.members.length} ${t('memberCount') || 'members'}`;
        document.getElementById('orgBackupCount').textContent = `${state.organization.backups?.length || 0} ${t('backups') || 'backups'}`;
        createBtn.classList.add('hidden');
        joinBtn.classList.add('hidden');
        leaveBtn.classList.remove('hidden');
        backupSection.classList.remove('hidden');
        renderOrgBackupList();
    } else {
        info.classList.add('hidden');
        createBtn.classList.remove('hidden');
        joinBtn.classList.remove('hidden');
        leaveBtn.classList.add('hidden');
        backupSection.classList.add('hidden');
    }
}

function copyOrgCode() {
    navigator.clipboard.writeText(document.getElementById('orgCodeDisplay').textContent)
        .then(() => showToast(t('copied') || 'Copied!', 'success'))
        .catch(() => showToast(t('copyFailed') || 'Failed', 'error'));
}

function showCreateOrgModal() {
    document.getElementById('orgModal').classList.remove('hidden');
    document.getElementById('orgNameInput').value = '';
}

function closeOrgModal() {
    document.getElementById('orgModal').classList.add('hidden');
}

function saveOrganization() {
    const name = document.getElementById('orgNameInput').value.trim();
    if (!name) return alert(t('pleaseFillFields'));
    
    state.organization = {
        id: 'org_' + Date.now(),
        name,
        code: generateOrgCode(),
        createdBy: state.user.id,
        createdAt: new Date().toISOString(),
        members: [{ userId: state.user.id, userName: state.user.name, role: 'admin', joinedAt: new Date().toISOString() }],
        backups: []
    };
    
    saveOrganizationData();
    closeOrgModal();
    updateOrgUI();
    showToast(t('orgCreated') || 'Organization created', 'success');
}

function showJoinOrgModal() {
    document.getElementById('joinOrgModal').classList.remove('hidden');
    document.getElementById('orgCodeInput').value = '';
}

function closeJoinOrgModal() {
    document.getElementById('joinOrgModal').classList.add('hidden');
}

function joinOrganization() {
    const code = document.getElementById('orgCodeInput').value.trim().toUpperCase();
    if (!code) return alert(t('pleaseEnterCode'));
    
    let found = null;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('medreminder_orgs_')) {
            const org = JSON.parse(localStorage.getItem(key));
            if (org.code === code) { found = org; break; }
        }
    }
    
    if (!found) return alert(t('orgNotFound'));
    if (found.members.some(m => m.userId === state.user.id)) return alert(t('alreadyMember'));
    
    found.members.push({ userId: state.user.id, userName: state.user.name, role: 'member', joinedAt: new Date().toISOString() });
    localStorage.setItem(`medreminder_orgs_${code}`, JSON.stringify(found));
    state.organization = found;
    saveOrganizationData();
    closeJoinOrgModal();
    updateOrgUI();
    showToast((t('joined') || 'Joined ') + found.name, 'success');
}

function leaveOrganization() {
    if (!confirm(t('confirmLeaveOrg'))) return;
    state.organization.members = state.organization.members.filter(m => m.userId !== state.user.id);
    if (state.organization.members.length === 0) {
        localStorage.removeItem(`medreminder_orgs_${state.organization.code}`);
    } else {
        localStorage.setItem(`medreminder_orgs_${state.organization.code}`, JSON.stringify(state.organization));
    }
    state.organization = null;
    localStorage.removeItem(`medreminder_org_${state.user.id}`);
    updateOrgUI();
    showToast(t('leftOrganization') || 'Left organization', 'success');
}

function shareBackupToOrg() {
    if (!state.organization) return alert(t('noOrg'));
    const backup = {
        id: 'backup_' + Date.now(),
        sharedBy: state.user.id,
        sharedByName: state.user.name,
        sharedAt: new Date().toISOString(),
        patients: state.patients,
        patientData: {}
    };
    state.patients.forEach(p => {
        const data = localStorage.getItem(`medreminder_data_${state.user.id}_${p.id}`);
        if (data) backup.patientData[p.id] = JSON.parse(data);
    });
    state.organization.backups.push(backup);
    saveOrganizationData();
    renderOrgBackupList();
    showToast(t('backupShared') || 'Backup shared', 'success');
}

function loadBackupFromOrg() {
    if (!state.organization || !state.organization.backups.length) return alert(t('noBackups'));
    const backup = state.organization.backups[state.organization.backups.length - 1];
    if (!confirm(`${t('confirmLoadBackup')} ${backup.sharedByName}?`)) return;
    
    state.patients = backup.patients || [];
    savePatients();
    Object.entries(backup.patientData || {}).forEach(([id, data]) => {
        localStorage.setItem(`medreminder_data_${state.user.id}_${id}`, JSON.stringify(data));
    });
    if (state.patients.length) {
        state.currentPatientId = state.patients[0].id;
        loadPatientData(state.currentPatientId);
    }
    renderPatientList();
    renderLists();
    showToast(t('backupLoaded') || 'Backup loaded', 'success');
}

function renderOrgBackupList() {
    const container = document.getElementById('orgBackupList');
    if (!state.organization?.backups.length) {
        container.innerHTML = `<p style="color:#888;font-size:14px">${t('noBackupsShared')}</p>`;
        return;
    }
    container.innerHTML = state.organization.backups.slice(-5).reverse().map(b => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${b.sharedByName}</strong><br><span style="color:#666;font-size:12px">${new Date(b.sharedAt).toLocaleDateString()} - ${b.patients?.length || 0} patients</span>`;
        return div.outerHTML;
    }).join('');
}

// Init
function init() {
    const saved = localStorage.getItem('medreminder_user');
    if (saved) {
        state.user = JSON.parse(saved);
        if (state.user.accessToken) state.accessToken = state.user.accessToken;
        loadPatients();
        loadCustomMedicines();
        loadOrganization();
        showApp();
        setupMedicineDropdown();
    }
}

function loadCustomMedicines() {
    if (!state.user) return;
    state.customMedicines = JSON.parse(localStorage.getItem(`medreminder_custom_meds_${state.user.id}`)) || [];
}

function saveCustomMedicines() {
    if (!state.user) return;
    localStorage.setItem(`medreminder_custom_meds_${state.user.id}`, JSON.stringify(state.customMedicines));
}

function getAllMedicines() {
    const custom = state.customMedicines.filter(m => !COMMON_MEDICINES.includes(m));
    return [...new Set([...COMMON_MEDICINES, ...custom])].sort();
}

function setupMedicineDropdown() {
    const input = document.getElementById('medName');
    const dropdown = document.getElementById('medicineDropdown');
    if (!input || !dropdown) return;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) { dropdown.classList.add('hidden'); return; }
        
        const allMeds = getAllMedicines();
        const matches = allMeds.filter(m => m.toLowerCase().includes(query));
        const showAdd = !allMeds.some(m => m.toLowerCase() === query);
        
        let html = matches.slice(0, 10).map(m => 
            `<div class="medicine-option" onclick="selectMedicine('${m.replace(/'/g, "\\'")}')">${m}</div>`
        ).join('');
        
        if (showAdd) html += `<div class="medicine-option add-new" onclick="addNewMedicine('${query.replace(/'/g, "\\'")}')">+ Add "${query}"</div>`;
        
        if (html) { dropdown.innerHTML = html; dropdown.classList.remove('hidden'); }
        else dropdown.classList.add('hidden');
    });
    
    input.addEventListener('blur', () => setTimeout(() => dropdown.classList.add('hidden'), 200));
    input.addEventListener('focus', () => { if (input.value.trim()) input.dispatchEvent(new Event('input')); });
}

function selectMedicine(name) {
    document.getElementById('medName').value = name;
    document.getElementById('medicineDropdown').classList.add('hidden');
}

function addNewMedicine(name) {
    if (!state.customMedicines.includes(name)) {
        state.customMedicines.push(name);
        saveCustomMedicines();
    }
    document.getElementById('medName').value = name;
    document.getElementById('medicineDropdown').classList.add('hidden');
}

// User
function createUser() {
    const name = document.getElementById('userName').value.trim();
    if (!name) return alert(t('enterUserName'));
    state.user = { id: 'user_' + Date.now(), name, isGoogle: false };
    localStorage.setItem('medreminder_user', JSON.stringify(state.user));
    state.patients = [];
    savePatients();
    showApp();
}

function startDemoMode() {
    state.user = { id: 'demo_user', name: 'Demo User', isGoogle: false, isDemo: true };
    localStorage.setItem('medreminder_user', JSON.stringify(state.user));
    
    state.patients = [
        { id: 'p1', name: 'Ivan Horvat', room: 'Room 101' },
        { id: 'p2', name: 'Marija Kovačević', room: 'Room 102' },
        { id: 'p3', name: 'Stjepan Novak', room: 'Room 103' }
    ];
    
    const meds = {
        p1: [
            { id: 'm1', name: 'Metformin', dosage: '500mg', time: '08:00', notes: 'With breakfast', stock: 25 },
            { id: 'm2', name: 'Lisinopril', dosage: '10mg', time: '08:00', stock: 60 },
            { id: 'm3', name: 'Metformin', dosage: '500mg', time: '20:00', stock: 25 }
        ],
        p2: [
            { id: 'm4', name: 'Omeprazole', dosage: '20mg', time: '07:00', stock: 8 },
            { id: 'm5', name: 'Amlodipine', dosage: '5mg', time: '12:00', stock: 45 },
            { id: 'm6', name: 'Sertraline', dosage: '50mg', time: '21:00', stock: 3 }
        ],
        p3: [
            { id: 'm7', name: 'Warfarin', dosage: '5mg', time: '09:00', stock: 15 },
            { id: 'm8', name: 'Furosemide', dosage: '40mg', time: '09:00', stock: 30 },
            { id: 'm9', name: 'Aspirin', dosage: '100mg', time: '21:00', stock: 4 }
        ]
    };
    
    const today = new Date().toISOString().split('T')[0];
    const taken = {
        p1: { [today]: ['m1', 'm2'] },
        p2: { [today]: ['m4'] },
        p3: { [today]: ['m7'] }
    };
    
    savePatients();
    state.patients.forEach(p => {
        localStorage.setItem(`medreminder_data_${state.user.id}_${p.id}`, JSON.stringify({ medicines: meds[p.id], takenToday: taken[p.id] }));
    });
    
    state.currentPatientId = state.patients[0].id;
    loadPatientData(state.currentPatientId);
    showApp();
    showToast(t('demoModeActive') || 'Demo mode active!', 'success');
}

// Data
function loadPatients() {
    state.patients = JSON.parse(localStorage.getItem(`medreminder_patients_${state.user.id}`)) || [];
}

function savePatients() {
    localStorage.setItem(`medreminder_patients_${state.user.id}`, JSON.stringify(state.patients));
}

function loadPatientData(patientId) {
    const data = JSON.parse(localStorage.getItem(`medreminder_data_${state.user.id}_${patientId}`)) || {};
    state.medicines = data.medicines || [];
    state.takenToday = data.takenToday || {};
}

function savePatientData() {
    if (!state.currentPatientId) return;
    localStorage.setItem(`medreminder_data_${state.user.id}_${state.currentPatientId}`, JSON.stringify({ medicines: state.medicines, takenToday: state.takenToday }));
}

// App
function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    renderPatientSelector();
    if (state.patients.length && !state.currentPatientId) {
        selectPatient(state.patients[0].id);
    } else if (state.patients.length) {
        renderLists();
        checkLowStock();
    } else {
        showPatientModal();
    }
    if (typeof applyTranslations === 'function') applyTranslations();
}

function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function switchUser() {
    if (!confirm(t('switchUserConfirm'))) return;
    localStorage.removeItem('medreminder_user');
    location.reload();
}

function showToast(message, type = '') {
    const el = document.getElementById('syncStatus');
    el.textContent = message;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// Views
function showView(view) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    event.target.closest('.nav-item')?.classList.add('active');
    
    document.getElementById('todayView').classList.toggle('hidden', view !== 'today');
    document.getElementById('allView').classList.toggle('hidden', view !== 'medicines');
    document.getElementById('patientsView').classList.toggle('hidden', view !== 'patients');
    
    // Default to today's view
    if (!view) {
        document.getElementById('todayView').classList.remove('hidden');
        document.getElementById('allView').classList.add('hidden');
        document.getElementById('patientsView').classList.add('hidden');
    }
}

function toggleAddMedicine() {
    const panel = document.getElementById('addMedicinePanel');
    panel.classList.toggle('hidden');
}

// Patient
function renderPatientSelector() {
    const selector = document.getElementById('patientSelector');
    if (!selector) return;
    selector.innerHTML = state.patients.map(p => `<option value="${p.id}" ${p.id === state.currentPatientId ? 'selected' : ''}>${p.name}</option>`).join('');
}

function selectPatient(id) {
    state.currentPatientId = id;
    loadPatientData(id);
    renderPatientSelector();
    renderLists();
    checkLowStock();
}

function onPatientChange(e) {
    selectPatient(e.target.value);
}

function showPatientModal(editId = null) {
    const modal = document.getElementById('patientModal');
    const title = document.getElementById('patientModalTitle');
    const nameIn = document.getElementById('patientName');
    const roomIn = document.getElementById('patientRoom');
    const saveBtn = document.getElementById('savePatientBtn');
    const delBtn = document.getElementById('deletePatientBtn');
    
    if (editId) {
        const p = state.patients.find(p => p.id === editId);
        title.textContent = t('editPatient');
        nameIn.value = p.name;
        roomIn.value = p.room || '';
        saveBtn.onclick = () => updatePatient(editId);
        delBtn.classList.remove('hidden');
        delBtn.onclick = () => deletePatient(editId);
    } else {
        title.textContent = t('addPatient');
        nameIn.value = '';
        roomIn.value = '';
        saveBtn.onclick = addPatient;
        delBtn.classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.add('hidden');
}

function addPatient() {
    const name = document.getElementById('patientName').value.trim();
    const room = document.getElementById('patientRoom').value.trim();
    if (!name) return alert(t('enterPatientName'));
    
    const patient = { id: 'p_' + Date.now(), name, room };
    state.patients.push(patient);
    savePatients();
    closePatientModal();
    state.currentPatientId = patient.id;
    savePatientData();
    renderPatientSelector();
    renderLists();
}

function updatePatient(id) {
    const name = document.getElementById('patientName').value.trim();
    const room = document.getElementById('patientRoom').value.trim();
    if (!name) return alert(t('enterPatientName'));
    
    const idx = state.patients.findIndex(p => p.id === id);
    if (idx !== -1) {
        state.patients[idx] = { ...state.patients[idx], name, room };
        savePatients();
        closePatientModal();
        renderPatientSelector();
        renderLists();
    }
}

function deletePatient(id) {
    if (!confirm(t('deleteConfirm'))) return;
    state.patients = state.patients.filter(p => p.id !== id);
    localStorage.removeItem(`medreminder_data_${state.user.id}_${id}`);
    savePatients();
    
    if (state.currentPatientId === id) {
        state.currentPatientId = state.patients.length ? state.patients[0].id : null;
        if (state.currentPatientId) loadPatientData(state.currentPatientId);
        else { state.medicines = []; state.takenToday = {}; }
    }
    renderPatientSelector();
    renderLists();
}

function renderPatientList() {
    const list = document.getElementById('patientList');
    if (!list) return;
    
    if (!state.patients.length) {
        list.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>${t('noPatients')}</p></div>`;
        return;
    }
    
    list.innerHTML = state.patients.map(p => `
        <div class="patient-card ${p.id === state.currentPatientId ? 'active' : ''}" onclick="selectPatient('${p.id}')">
            <div class="patient-name">${p.name}</div>
            <div class="patient-room">${p.room || t('noRoom')}</div>
            <div class="patient-actions">
                <button class="btn-sm primary" onclick="event.stopPropagation(); showPatientModal('${p.id}')">${t('edit')}</button>
                <button class="btn-sm danger" onclick="event.stopPropagation(); deletePatient('${p.id}')">${t('delete')}</button>
            </div>
        </div>
    `).join('');
}

// Medicine
function addMedicine() {
    const name = document.getElementById('medName').value.trim();
    const dosage = document.getElementById('medDosage').value.trim();
    const time = document.getElementById('medTime').value;
    const notes = document.getElementById('medNotes').value.trim();
    const stock = document.getElementById('medStock').value !== '' ? parseInt(document.getElementById('medStock').value) : null;
    
    if (!name || !dosage || !time) return alert(t('pleaseFillFields'));
    
    state.medicines.push({ id: 'm_' + Date.now(), name, dosage, time, notes, stock, dailyDoses: stock !== null ? 1 : null });
    state.medicines.sort((a, b) => a.time.localeCompare(b.time));
    savePatientData();
    
    ['medName', 'medDosage', 'medTime', 'medNotes', 'medStock'].forEach(id => document.getElementById(id).value = '');
    toggleAddMedicine();
    renderLists();
    checkLowStock();
}

function deleteMedicine(id) {
    state.medicines = state.medicines.filter(m => m.id !== id);
    savePatientData();
    renderLists();
}

function markAsTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    state.takenToday[today] = state.takenToday[today] || [];
    if (!state.takenToday[today].includes(id)) {
        state.takenToday[today].push(id);
        const med = state.medicines.find(m => m.id === id);
        if (med?.stock != null && med.stock > 0) med.stock = Math.max(0, med.stock - 1);
        savePatientData();
    }
    renderLists();
    checkLowStock();
}

function markAsNotTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    if (state.takenToday[today]) {
        state.takenToday[today] = state.takenToday[today].filter(mid => mid !== id);
        savePatientData();
    }
    renderLists();
}

function checkLowStock() {
    const warning = document.getElementById('stockWarning');
    const list = document.getElementById('lowStockList');
    if (!warning || !list) return;
    
    const low = state.medicines.filter(m => m.stock != null && m.stock <= 10);
    if (low.length) {
        warning.classList.remove('hidden');
        list.innerHTML = low.map(m => `<div>${m.name} - ${m.stock} ${t('left')} ${m.stock <= 5 ? '⚠️' : ''}</div>`).join('');
    } else {
        warning.classList.add('hidden');
    }
}

function renderLists() {
    const today = new Date().toISOString().split('T')[0];
    const taken = state.takenToday[today] || [];
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const todayMeds = state.medicines.filter(m => m.time <= currentTime);
    
    const getStockBadge = (m) => {
        if (m.stock == null) return '';
        if (m.stock <= 5) return `<span class="stock-badge stock-critical">${m.stock} ${t('left')}</span>`;
        if (m.stock <= 10) return `<span class="stock-badge stock-warning">${m.stock} ${t('left')}</span>`;
        return `<span class="stock-badge stock-ok">${m.stock} in stock</span>`;
    };
    
    const renderItem = (med) => {
        const isTaken = taken.includes(med.id);
        return `
            <div class="medicine-item ${isTaken ? 'taken' : ''}">
                <div class="medicine-info">
                    <div class="medicine-name">
                        ${med.name}
                        <span class="status-badge ${isTaken ? 'status-taken' : 'status-pending'}">${isTaken ? t('taken') : t('pending')}</span>
                    </div>
                    <div class="medicine-dosage">${med.dosage} ${getStockBadge(med)}</div>
                    <div class="medicine-time">${formatTime(med.time)}</div>
                    ${med.notes ? `<div style="color:#888;font-size:13px;margin-top:4px">${med.notes}</div>` : ''}
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn-take" onclick="${isTaken ? `markAsNotTaken('${med.id}')` : `markAsTaken('${med.id}')`}">${isTaken ? t('undo') : t('take')}</button>
                    <button class="btn-delete" onclick="deleteMedicine('${med.id}')">${t('delete')}</button>
                </div>
            </div>
        `;
    };
    
    document.getElementById('todayList').innerHTML = todayMeds.length ? todayMeds.map(renderItem).join('') : '<div class="empty-state"><i class="fas fa-capsules"></i><p>No medicines due now</p></div>';
    document.getElementById('allList').innerHTML = state.medicines.length ? state.medicines.map(renderItem).join('') : '<div class="empty-state"><i class="fas fa-capsules"></i><p>No medicines added</p></div>';
    
    renderPatientList();
}

function formatTime(time) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// Google Sync
function initGoogleSync() {
    if (!GOOGLE_CLIENT_ID) return alert(t('googleNotConfigured'));
    
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES + ' https://www.googleapis.com/auth/userinfo.email',
        callback: async (response) => {
            if (!response.access_token) return;
            state.accessToken = response.access_token;
            
            try {
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + state.accessToken } }).then(r => r.json());
                state.user = { id: 'google_' + userInfo.email, name: userInfo.name || userInfo.email, email: userInfo.email, isGoogle: true, accessToken: state.accessToken };
                localStorage.setItem('medreminder_user', JSON.stringify(state.user));
                loadPatients();
                showApp();
                closeSettings();
                showToast(t('googleConnected'), 'success');
            } catch (e) {
                showToast(t('googleProfileFailed'), 'error');
            }
        }
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

async function syncToDrive() {
    if (!state.user?.isGoogle || !state.accessToken) return alert(t('connectGoogleFirst'));
    
    try {
        const allData = { patients: state.patients, customMedicines: state.customMedicines, patientData: {} };
        state.patients.forEach(p => {
            const data = localStorage.getItem(`medreminder_data_${state.user.id}_${p.id}`);
            if (data) allData.patientData[p.id] = JSON.parse(data);
        });
        
        const search = await fetch('https://www.googleapis.com/drive/v3/files?q=name="medreminder_backup.json"', { headers: { Authorization: 'Bearer ' + state.accessToken } }).then(r => r.json());
        
        if (search.files?.length) {
            await fetch('https://www.googleapis.com/upload/drive/v3/files/' + search.files[0].id + '?uploadType=media', { method: 'PATCH', headers: { Authorization: 'Bearer ' + state.accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify(allData) });
        } else {
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify({ name: 'medreminder_backup.json', mimeType: 'application/json' })], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify(allData)], { type: 'application/json' }));
            await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: 'Bearer ' + state.accessToken }, body: form });
        }
        showToast(t('uploaded') || 'Uploaded to Google Drive!', 'success');
    } catch (e) {
        showToast((t('uploadFailed') || 'Upload failed: ') + e.message, 'error');
    }
}

async function syncFromDrive() {
    if (!state.user?.isGoogle || !state.accessToken) return alert(t('connectGoogleFirst'));
    
    try {
        const search = await fetch('https://www.googleapis.com/drive/v3/files?q=name="medreminder_backup.json"', { headers: { Authorization: 'Bearer ' + state.accessToken } }).then(r => r.json());
        if (!search.files?.length) return alert(t('noBackup'));
        
        const data = await fetch('https://www.googleapis.com/drive/v3/files/' + search.files[0].id + '?alt=media', { headers: { Authorization: 'Bearer ' + state.accessToken } }).then(r => r.json());
        
        state.patients = data.patients || [];
        savePatients();
        state.customMedicines = data.customMedicines || [];
        saveCustomMedicines();
        Object.entries(data.patientData || {}).forEach(([id, d]) => localStorage.setItem(`medreminder_data_${state.user.id}_${id}`, JSON.stringify(d)));
        
        if (state.patients.length) {
            state.currentPatientId = state.patients[0].id;
            loadPatientData(state.currentPatientId);
        }
        showApp();
        showToast(t('downloaded') || 'Loaded from Google Drive!', 'success');
    } catch (e) {
        showToast((t('downloadFailed') || 'Download failed: ') + e.message, 'error');
    }
}

function signOutGoogle() {
    if (state.accessToken) fetch('https://oauth2.googleapis.com/revoke?token=' + state.accessToken, { method: 'POST' }).catch(() => {});
    state.accessToken = null;
    if (state.user) { state.user.isGoogle = false; delete state.user.accessToken; localStorage.setItem('medreminder_user', JSON.stringify(state.user)); }
    showToast(t('googleDisconnected'), 'success');
}

document.addEventListener('DOMContentLoaded', init);