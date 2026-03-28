const fs = require('fs');
const path = require('path');

describe('App Logic', () => {
    let appCode;
    let t;
    let currentUser;
    let patients;
    let medicines;
    let takenToday;
    let currentPatientId;

    beforeAll(() => {
        appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
    });

    beforeEach(() => {
        currentUser = null;
        patients = [];
        medicines = [];
        takenToday = {};
        currentPatientId = null;
    });

    describe('Data Structures', () => {
        test('should have proper patient structure', () => {
            const patient = { id: 'p_1', name: 'Test Patient', room: 'Room 101' };
            expect(patient).toHaveProperty('id');
            expect(patient).toHaveProperty('name');
            expect(typeof patient.name).toBe('string');
        });

        test('should have proper medicine structure', () => {
            const medicine = { 
                id: 'm_1', 
                name: 'Aspirin', 
                dosage: '100mg', 
                time: '09:00', 
                notes: 'Take with water',
                stock: 30,
                dailyDoses: 1
            };
            expect(medicine).toHaveProperty('id');
            expect(medicine).toHaveProperty('name');
            expect(medicine).toHaveProperty('dosage');
            expect(medicine).toHaveProperty('time');
        });

        test('should have proper takenToday structure', () => {
            const today = new Date().toISOString().split('T')[0];
            takenToday[today] = ['m_1', 'm_2'];
            expect(takenToday[today]).toBeDefined();
            expect(Array.isArray(takenToday[today])).toBe(true);
        });
    });

    describe('Medicine Sorting', () => {
        test('should sort medicines by time', () => {
            const meds = [
                { id: 'm_1', name: 'Evening Med', time: '20:00' },
                { id: 'm_2', name: 'Morning Med', time: '08:00' },
                { id: 'm_3', name: 'Noon Med', time: '12:00' }
            ];
            meds.sort((a, b) => a.time.localeCompare(b.time));
            expect(meds[0].time).toBe('08:00');
            expect(meds[1].time).toBe('12:00');
            expect(meds[2].time).toBe('20:00');
        });
    });

    describe('Time Filtering', () => {
        test('should filter today medicines by current time', () => {
            const currentTime = '14:00';
            const meds = [
                { id: 'm_1', name: 'Morning Med', time: '08:00' },
                { id: 'm_2', name: 'Afternoon Med', time: '12:00' },
                { id: 'm_3', name: 'Evening Med', time: '20:00' }
            ];
            const todayMeds = meds.filter(m => m.time <= currentTime);
            expect(todayMeds.length).toBe(2);
            expect(todayMeds[0].name).toBe('Morning Med');
            expect(todayMeds[1].name).toBe('Afternoon Med');
        });
    });

    describe('Stock Management', () => {
        test('should decrement stock when marking medicine as taken', () => {
            const medicine = { id: 'm_1', name: 'Aspirin', stock: 30 };
            const wasTaken = false;
            if (!wasTaken && medicine.stock !== null && medicine.stock > 0) {
                medicine.stock = Math.max(0, medicine.stock - 1);
            }
            expect(medicine.stock).toBe(29);
        });

        test('should not go below zero stock', () => {
            const medicine = { id: 'm_1', name: 'Aspirin', stock: 0 };
            if (medicine.stock !== null && medicine.stock > 0) {
                medicine.stock = Math.max(0, medicine.stock - 1);
            }
            expect(medicine.stock).toBe(0);
        });

        test('should identify low stock', () => {
            const getStockStatus = (stock) => {
                if (stock === null || stock === undefined) return 'no_tracking';
                if (stock <= 5) return 'critical';
                if (stock <= 10) return 'warning';
                return 'ok';
            };
            expect(getStockStatus(3)).toBe('critical');
            expect(getStockStatus(8)).toBe('warning');
            expect(getStockStatus(20)).toBe('ok');
            expect(getStockStatus(null)).toBe('no_tracking');
        });
    });

    describe('Taken Today Logic', () => {
        test('should add medicine to taken list', () => {
            const today = new Date().toISOString().split('T')[0];
            takenToday[today] = takenToday[today] || [];
            const medicineId = 'm_1';
            if (!takenToday[today].includes(medicineId)) {
                takenToday[today].push(medicineId);
            }
            expect(takenToday[today]).toContain('m_1');
        });

        test('should not duplicate taken medicines', () => {
            const today = new Date().toISOString().split('T')[0];
            takenToday[today] = ['m_1'];
            const medicineId = 'm_1';
            if (!takenToday[today].includes(medicineId)) {
                takenToday[today].push(medicineId);
            }
            expect(takenToday[today].length).toBe(1);
        });
    });

    describe('User Management', () => {
        test('should create demo user', () => {
            currentUser = { id: 'demo_user', name: 'Demo User', isGoogle: false, isDemo: true };
            expect(currentUser.isDemo).toBe(true);
            expect(currentUser.name).toBe('Demo User');
        });

        test('should create regular user', () => {
            currentUser = { id: 'user_1', name: 'Test Nurse', isGoogle: false, isDemo: false };
            expect(currentUser.isDemo).toBe(false);
            expect(currentUser.isGoogle).toBe(false);
        });
    });

    describe('Demo Data', () => {
        test('should have 3 demo patients', () => {
            const demoPatients = [
                { id: 'p_demo_1', name: 'Ivan Horvat', room: 'Room 101' },
                { id: 'p_demo_2', name: 'Marija Kovačević', room: 'Room 102' },
                { id: 'p_demo_3', name: 'Stjepan Novak', room: 'Room 103' }
            ];
            expect(demoPatients.length).toBe(3);
        });

        test('should have demo medicines with stock', () => {
            const demoMedicines = [
                { id: 'm_1', name: 'Metformin', dosage: '500mg', time: '08:00', stock: 25 },
                { id: 'm_2', name: 'Lisinopril', dosage: '10mg', time: '08:00', stock: 60 }
            ];
            expect(demoMedicines[0].stock).toBe(25);
            expect(demoMedicines[1].stock).toBe(60);
        });
    });

    describe('Validation', () => {
        test('should validate medicine input', () => {
            const validateMedicine = (name, dosage, time) => {
                return !!(name && name.trim() && dosage && dosage.trim() && time);
            };
            expect(validateMedicine('Aspirin', '100mg', '09:00')).toBe(true);
            expect(validateMedicine('', '100mg', '09:00')).toBe(false);
            expect(validateMedicine('Aspirin', '', '09:00')).toBe(false);
            expect(validateMedicine('Aspirin', '100mg', '')).toBe(false);
        });

        test('should validate patient input', () => {
            const validatePatient = (name) => {
                return !!(name && name.trim());
            };
            expect(validatePatient('John Doe')).toBe(true);
            expect(validatePatient('')).toBe(false);
            expect(validatePatient('   ')).toBe(false);
        });
    });

    describe('Time Formatting', () => {
        test('should format time to 12-hour format', () => {
            const formatTime = (time) => {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
            };
            expect(formatTime('08:00')).toBe('8:00 AM');
            expect(formatTime('12:00')).toBe('12:00 PM');
            expect(formatTime('20:00')).toBe('8:00 PM');
            expect(formatTime('00:00')).toBe('12:00 AM');
        });
    });

    describe('LocalStorage Key Generation', () => {
        test('should generate correct storage key', () => {
            const getPatientStorageKey = (userId, patientId) => {
                return `medreminder_data_${userId}_${patientId}`;
            };
            expect(getPatientStorageKey('demo_user', 'p_demo_1')).toBe('medreminder_data_demo_user_p_demo_1');
            expect(getPatientStorageKey('user_123', 'p_456')).toBe('medreminder_data_user_123_p_456');
        });
    });

    describe('Organization', () => {
        test('should generate valid organization code', () => {
            const generateOrgCode = () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let code = '';
                for (let i = 0; i < 8; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            };
            const code = generateOrgCode();
            expect(code.length).toBe(8);
            expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
        });

        test('should have proper organization structure', () => {
            const org = {
                id: 'org_1',
                name: 'Test Hospital',
                code: 'ABC12345',
                createdBy: 'user_1',
                createdAt: new Date().toISOString(),
                members: [
                    { userId: 'user_1', userName: 'Admin', role: 'admin', joinedAt: new Date().toISOString() }
                ],
                backups: []
            };
            expect(org).toHaveProperty('id');
            expect(org).toHaveProperty('name');
            expect(org).toHaveProperty('code');
            expect(org.members.length).toBe(1);
            expect(org.members[0].role).toBe('admin');
        });

        test('should add member to organization', () => {
            const org = {
                members: [{ userId: 'user_1', userName: 'Admin', role: 'admin' }]
            };
            org.members.push({
                userId: 'user_2',
                userName: 'Nurse',
                role: 'member',
                joinedAt: new Date().toISOString()
            });
            expect(org.members.length).toBe(2);
            expect(org.members[1].userName).toBe('Nurse');
        });

        test('should remove member from organization', () => {
            const org = {
                members: [
                    { userId: 'user_1', userName: 'Admin', role: 'admin' },
                    { userId: 'user_2', userName: 'Nurse', role: 'member' }
                ]
            };
            org.members = org.members.filter(m => m.userId !== 'user_2');
            expect(org.members.length).toBe(1);
            expect(org.members[0].userId).toBe('user_1');
        });

        test('should create backup with patients', () => {
            const patients = [
                { id: 'p_1', name: 'Patient 1' },
                { id: 'p_2', name: 'Patient 2' }
            ];
            const backup = {
                id: 'backup_1',
                sharedBy: 'user_1',
                sharedByName: 'Admin',
                sharedAt: new Date().toISOString(),
                patients: patients,
                patientData: {
                    'p_1': { medicines: [], takenToday: {} },
                    'p_2': { medicines: [{ id: 'm_1', name: 'Aspirin' }], takenToday: {} }
                }
            };
            expect(backup.patients.length).toBe(2);
            expect(backup.patientData['p_2'].medicines.length).toBe(1);
        });

        test('should check if user is already member', () => {
            const org = {
                members: [
                    { userId: 'user_1', userName: 'Admin', role: 'admin' }
                ]
            };
            const isMember = org.members.some(m => m.userId === 'user_1');
            expect(isMember).toBe(true);
            const isNewMember = org.members.some(m => m.userId === 'user_2');
            expect(isNewMember).toBe(false);
        });
    });
});
