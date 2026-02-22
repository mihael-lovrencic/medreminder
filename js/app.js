const GOOGLE_CLIENT_ID = '349821944609-gguobung0alaapdnnu9oevqef9952muh.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let currentUser = null;
let tokenClient = null;
let accessToken = null;
let medicines = [];
let takenToday = {};

function init() {
    const savedUser = localStorage.getItem('medreminder_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.accessToken) {
            accessToken = currentUser.accessToken;
        }
        showApp();
    }
}

function createUser() {
    const name = document.getElementById('userName').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    currentUser = { id: 'local_' + Date.now(), name: name, isGoogle: false };
    localStorage.setItem('medreminder_user', JSON.stringify(currentUser));
    showApp();
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
    renderLists();
}

function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function switchUser() {
    if (confirm('Switch to a different user? Your local data will be kept.')) {
        localStorage.removeItem('medreminder_user');
        currentUser = null;
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('userName').value = '';
        closeSettings();
    }
}

function getUserStorageKey() {
    return `medreminder_data_${currentUser.id}`;
}

function loadData() {
    const data = JSON.parse(localStorage.getItem(getUserStorageKey())) || {};
    medicines = data.medicines || [];
    takenToday = data.takenToday || {};
}

function saveData() {
    localStorage.setItem(getUserStorageKey(), JSON.stringify({ medicines, takenToday }));
    showSyncStatus('Saved: ' + new Date().toLocaleTimeString(), 'pending');
}

function showSyncStatus(message, type = 'synced') {
    const el = document.getElementById('syncStatus');
    el.textContent = message;
    el.className = 'sync-status ' + type;
    el.classList.remove('hidden');
}

function addMedicine() {
    const name = document.getElementById('medName').value.trim();
    const dosage = document.getElementById('medDosage').value.trim();
    const time = document.getElementById('medTime').value;

    if (!name || !dosage || !time) {
        alert('Please fill in all fields');
        return;
    }

    medicines.push({ id: Date.now(), name, dosage, time });
    medicines.sort((a, b) => a.time.localeCompare(b.time));
    saveData();

    document.getElementById('medName').value = '';
    document.getElementById('medDosage').value = '';
    document.getElementById('medTime').value = '';
    renderLists();
}

function deleteMedicine(id) {
    medicines = medicines.filter(m => m.id !== id);
    saveData();
    renderLists();
}

function markAsTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    takenToday[today] = takenToday[today] || [];
    if (!takenToday[today].includes(id)) {
        takenToday[today].push(id);
        saveData();
    }
    renderLists();
}

function markAsNotTaken(id) {
    const today = new Date().toISOString().split('T')[0];
    if (takenToday[today]) {
        takenToday[today] = takenToday[today].filter(mid => mid !== id);
        saveData();
    }
    renderLists();
}

function renderLists() {
    loadData();
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
        const data = JSON.stringify({ medicines, takenToday });

        const searchResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=name="medreminder_backup.json"', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        const searchResult = await searchResponse.json();
        let fileId = null;

        if (searchResult.files && searchResult.files.length > 0) {
            fileId = searchResult.files[0].id;
            await fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media', {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: data
            });
        } else {
            const metadata = {
                name: 'medreminder_backup.json',
                mimeType: 'application/json'
            };

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

        const data = await fileResponse.json();

        medicines = data.medicines || [];
        takenToday = data.takenToday || {};

        saveData();
        renderLists();

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
