const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';

async function clearLocalStorage(page) {
    try {
        await page.evaluate(() => localStorage.clear());
    } catch (e) {}
}

test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await clearLocalStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
});

test.describe('Login', () => {
    test('display login screen', async ({ page }) => {
        await expect(page.locator('#loginScreen')).toBeVisible();
        await expect(page.locator('#userName')).toBeVisible();
    });

    test('navigate to app after entering name', async ({ page }) => {
        await page.fill('#userName', 'Test Nurse');
        await page.click('button:has-text("Continue")');
        await expect(page.locator('#appScreen')).toBeVisible();
    });

    test('load demo mode', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('#appScreen')).toBeVisible();
    });
});

test.describe('Demo Mode', () => {
    test('load demo patients', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-card')).toHaveCount(3);
    });

    test('display patient names', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-name').first()).toContainText('Ivan');
    });

    test('display medicines in today view', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.medicine-item').first()).toBeAttached();
    });
});

test.describe('Navigation', () => {
    test('show medicines view', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Medicines")');
        await expect(page.locator('#allView')).toBeVisible();
    });

    test('show patients view', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Patients")');
        await expect(page.locator('#patientsView')).toBeVisible();
    });

    test('show today view', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Medicines")');
        await page.click('button:has-text("Today")');
        await expect(page.locator('#todayView')).toBeVisible();
    });
});

test.describe('Settings', () => {
    test('open settings modal', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('[title="Settings"]');
        await expect(page.locator('#settingsModal')).toBeVisible();
    });

    test('close settings modal with close button', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('[title="Settings"]');
        await page.locator('#settingsModal .icon-btn').click();
        await expect(page.locator('#settingsModal')).toHaveClass(/hidden/);
    });

    test('language selector exists', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('[title="Settings"]');
        await expect(page.locator('#langSelector')).toBeVisible();
    });

    test('switch language to German updates UI', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('[title="Settings"]');
        await page.selectOption('#langSelector', 'de');
        await expect(page.locator('#settingsModal h2')).toContainText('Einstellungen');
    });
});

test.describe('Data', () => {
    test('demo data loads', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('#patientSelector')).toHaveValue(/p/);
    });

    test('data persists after reload', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.patient-card')).toHaveCount(3);
        await page.reload();
        await expect(page.locator('.patient-card')).toHaveCount(3);
    });
});

test.describe('Patient Selector', () => {
    test('selector shows patients', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        const options = await page.locator('#patientSelector option').count();
        expect(options).toBe(3);
    });

    test('switch patient updates selector', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.selectOption('#patientSelector', { index: 1 });
        await expect(page.locator('#patientSelector')).toHaveValue(/p2/);
    });
});

test.describe('Add Medicine Panel', () => {
    test('open add medicine panel via FAB', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('button.fab').click();
        await expect(page.locator('#addMedicinePanel')).toBeVisible();
    });

    test('add medicine form has required fields', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('button.fab').click();
        await expect(page.locator('#medName')).toBeVisible();
        await expect(page.locator('#medDosage')).toBeVisible();
        await expect(page.locator('#medTime')).toBeVisible();
    });

    test('cancel button closes panel', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('button.fab').click();
        await page.click('button:has-text("Cancel")');
        await expect(page.locator('#addMedicinePanel')).toHaveClass(/hidden/);
    });

    test('add medicine and see in list', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('button.fab').click();
        await page.fill('#medName', 'TestMed123');
        await page.fill('#medDosage', '50mg');
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String((now.getMinutes() + 5) % 60).padStart(2, '0');
        await page.fill('#medTime', `${hours}:${minutes}`);
        await page.click('button:has-text("Add Medicine")');
        await page.waitForTimeout(500);
        await expect(page.locator('#allList')).toContainText('TestMed123');
    });
});

test.describe('Medicine Actions', () => {
    test('medicine has action button', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Medicines")');
        await expect(page.locator('.medicine-item .btn-take').first()).toBeAttached();
    });

    test('taken medicines show undo button', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Medicines")');
        await expect(page.locator('.medicine-item .btn-take:has-text("Undo")').first()).toBeAttached();
    });
});

test.describe('Low Stock', () => {
    test('show stock warning for low stock', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.selectOption('#patientSelector', { index: 1 });
        await page.waitForTimeout(300);
        await expect(page.locator('#stockWarning')).toBeVisible();
    });
});

test.describe('Patient Modal', () => {
    test('open patient modal', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Patients")');
        await page.locator('.btn-icon').click();
        await expect(page.locator('#patientModal')).toBeVisible();
    });

    test('patient modal has cancel button', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Patients")');
        await page.locator('.btn-icon').click();
        await expect(page.locator('#patientModal button:has-text("Cancel")')).toBeVisible();
    });

    test('cancel closes patient modal', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button:has-text("Patients")');
        await page.locator('.btn-icon').click();
        await page.click('#patientModal button:has-text("Cancel")');
        await expect(page.locator('#patientModal')).toHaveClass(/hidden/);
    });
});

test.describe('Mobile', () => {
    test('work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('#appScreen')).toBeVisible();
    });

    test('show bottom nav on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.click('button:has-text("Try Demo")');
        await expect(page.locator('.bottom-nav')).toBeVisible();
    });
});