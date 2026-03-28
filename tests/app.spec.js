const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

async function clearLocalStorage(page) {
    try {
        await page.evaluate(() => localStorage.clear());
    } catch (e) {
        // Ignore localStorage errors
    }
}

test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await clearLocalStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
});

test.describe('Login Screen', () => {
    test('should display login screen', async ({ page }) => {
        await expect(page.locator('#loginScreen')).toBeVisible();
        await expect(page.locator('#userName')).toBeVisible();
    });

    test('should navigate to app after entering name', async ({ page }) => {
        await page.fill('#userName', 'Test Nurse');
        await page.click('button:has-text("Continue")');
        await expect(page.locator('#appScreen')).toBeVisible();
    });

    test('should load demo mode', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('#appScreen')).toBeVisible();
        await expect(page.locator('#userNameDisplay')).toHaveText('Demo User');
    });
});

test.describe('Demo Mode', () => {
    test('should load 3 demo patients', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-item')).toHaveCount(3);
    });

    test('should display patient names', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-name').first()).toContainText('Ivan');
    });

    test('should display medicines', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.medicine-item').first()).toBeVisible();
    });
});

test.describe('Patient Management', () => {
    test('should add new patient', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        const initialCount = await page.locator('.patient-item').count();
        await page.click('button:has-text("Add Patient")');
        await page.fill('#patientName', 'New Patient');
        await page.click('#savePatientBtn');
        await expect(page.locator('.patient-item')).toHaveCount(initialCount + 1);
    });

    test('should delete patient', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Try Demo")');
        const initialCount = await page.locator('.patient-item').count();
        await page.locator('.patient-item').first().locator('button:has-text("Delete")').click();
        await expect(page.locator('.patient-item')).toHaveCount(initialCount - 1);
    });

    test('should switch between patients', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.selectOption('#patientSelector', { index: 1 });
        await expect(page.locator('#currentPatientName')).toContainText('Marija');
    });
});

test.describe('Medicine Management', () => {
    test('should add medicine', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        // Add medicine on Today tab (default)
        await page.fill('#medName', 'UniqueTestMed123');
        await page.fill('#medDosage', '50mg');
        await page.fill('#medTime', '15:00');
        await page.click('button:has-text("Add Medicine")');
        await expect(page.locator('#todayList')).toContainText('UniqueTestMed123');
    });

    test('should mark medicine as taken', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('.tab:has-text("All Medicines")');
        const takenBefore = await page.locator('#allList .medicine-item.taken').count();
        await page.locator('#allList button:has-text("Take")').first().click();
        await expect(page.locator('#allList .medicine-item.taken')).toHaveCount(takenBefore + 1);
    });

    test('should delete medicine', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('.tab:has-text("All Medicines")');
        const initialCount = await page.locator('#allList .medicine-item').count();
        await page.locator('#allList .medicine-item').first().locator('button:has-text("Delete")').click();
        await expect(page.locator('#allList .medicine-item')).toHaveCount(initialCount - 1);
    });
});

test.describe('Tab Navigation', () => {
    test('should switch to All Medicines tab', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('.tab:has-text("All Medicines")');
        await expect(page.locator('#all-tab')).toBeVisible();
    });

    test('should switch back to Today tab', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('.tab:has-text("All Medicines")');
        await page.click('.tab:has-text("Today")');
        await expect(page.locator('#today-tab')).toBeVisible();
    });
});

test.describe('Settings', () => {
    test('should open settings', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Settings")');
        await expect(page.locator('#settingsModal')).toBeVisible();
    });

    test('should close settings', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Settings")');
        await page.locator('#settingsModal button').last().click();
        await expect(page.locator('#settingsModal')).toHaveClass(/hidden/);
    });

    test('should switch to German language', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Settings")');
        await page.selectOption('#langSelector', 'de');
        await page.locator('#settingsModal button').last().click();
        await expect(page.locator('button:has-text("Patient hinzufügen")')).toBeVisible();
    });

    test('should switch to Croatian language', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Settings")');
        await page.selectOption('#langSelector', 'hr');
        await page.locator('#settingsModal button').last().click();
        await expect(page.locator('button:has-text("Dodaj pacijenta")')).toBeVisible();
    });
});

test.describe('Data Persistence', () => {
    test('should persist data after reload', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-item')).toHaveCount(3);
        await page.reload();
        await expect(page.locator('.patient-item')).toHaveCount(3);
    });
});

test.describe('User Management', () => {
    test('should switch user', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Settings")');
        await page.click('button:has-text("Switch User")');
        await expect(page.locator('#loginScreen')).toBeVisible();
    });
});

test.describe('Responsive', () => {
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('#appScreen')).toBeVisible();
    });
});
