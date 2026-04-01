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
        await page.click('button[onclick="showSettings()"]');
        await expect(page.locator('#settingsModal')).toBeVisible();
    });

    test('close settings modal', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button[onclick="showSettings()"]');
        await page.locator('#settingsModal button:has-text("✕")').first().click();
        await expect(page.locator('#settingsModal')).toHaveClass(/hidden/);
    });

    test('language selector exists', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.click('button[onclick="showSettings()"]');
        await expect(page.locator('#langSelector')).toBeVisible();
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
    test('open add medicine panel', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('.fab').click();
        await expect(page.locator('#addMedicinePanel')).toBeVisible();
    });

    test('add medicine form has required fields', async ({ page }) => {
        await page.click('button:has-text("Try Demo")');
        await page.locator('.fab').click();
        await expect(page.locator('#medName')).toBeVisible();
        await expect(page.locator('#medDosage')).toBeVisible();
        await expect(page.locator('#medTime')).toBeVisible();
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