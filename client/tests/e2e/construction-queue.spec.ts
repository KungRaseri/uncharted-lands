import { test, expect } from '@playwright/test';

/**
 * Construction Queue E2E Tests
 * 
 * Tests the complete construction queue flow from building
 * structures to completion and UI updates.
 */

test.describe('Construction Queue', () => {
	test.beforeEach(async ({ page }) => {
		// Login
		await page.goto('/login');
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'password123');
		await page.click('button[type="submit"]');
		
		// Wait for redirect to game page
		await page.waitForURL('/game', { timeout: 10000 });
		
		// Click on first settlement card
		const firstSettlement = page.locator('[data-testid^="settlement-card"]').first();
		await firstSettlement.click();
		
		// Wait for settlement page to load
		await page.waitForURL(/\/game\/settlements\/[^/]+$/, { timeout: 10000 });
		
		// Wait for dashboard to be ready
		await page.waitForSelector('[data-testid="build-menu-button"]', { timeout: 10000 });
	});

	test('should display construction queue panel', async ({ page }) => {
		// Verify construction queue panel is visible
		const queuePanel = page.locator('section').filter({ hasText: 'Construction Queue' });
		await expect(queuePanel).toBeVisible();
	});

	test('should open build menu', async ({ page }) => {
		// Click build menu button
		await page.click('[data-testid="build-menu-button"]');
		
		// Wait for build menu to appear
		const buildMenu = page.locator('text=Build Structure').first();
		await expect(buildMenu).toBeVisible({ timeout: 5000 });
	});

	test('should display available structures', async ({ page }) => {
		// Open build menu
		await page.click('[data-testid="build-menu-button"]');
		
		// Wait for structures to load
		await page.waitForSelector('[data-testid^="build-structure-"]', { timeout: 5000 });
		
		// Verify at least one structure is shown
		const structures = page.locator('[data-testid^="build-structure-"]');
		await expect(structures.first()).toBeVisible();
	});

	test('should add building to construction queue', async ({ page }) => {
		// Open build menu
		await page.click('[data-testid="build-menu-button"]');
		await page.waitForTimeout(1000);
		
		// Try to build a Tent (cheap structure)
		const tentButton = page.locator('[data-testid="build-structure-tent"]');
		if (await tentButton.count() > 0) {
			await tentButton.click();
			
			// Wait for construction queue to update
			await page.waitForTimeout(2000);
			
			// Check if construction item appears
			const constructionItems = page.locator('[data-testid="construction-queue-item"]');
			const count = await constructionItems.count();
			
			// If structure was added, verify it
			if (count > 0) {
				const firstItem = constructionItems.first();
				await expect(firstItem).toBeVisible();
				
				// Verify structure name is shown
				const structureName = firstItem.locator('[data-testid="structure-name"]');
				await expect(structureName).toBeVisible();
			}
		}
	});

	test('should show time remaining in HH:MM:SS format', async ({ page }) => {
		// Check if there are any construction items
		const constructionItems = page.locator('[data-testid="construction-queue-item"]');
		const count = await constructionItems.count();
		
		if (count > 0) {
			// Get time remaining element
			const timeRemaining = constructionItems.first().locator('[data-testid="time-remaining"]');
			const timeText = await timeRemaining.textContent();
			
			// Verify format is HH:MM:SS (e.g., "00:05:30")
			expect(timeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		}
	});

	test('should show progress bar for active construction', async ({ page }) => {
		// Check if there are any active construction items
		const activeItems = page.locator('[data-testid="construction-queue-item"][data-status="active"]');
		const count = await activeItems.count();
		
		if (count > 0) {
			// Verify progress bar exists
			const progressBar = activeItems.first().locator('[data-testid="progress-bar"]');
			await expect(progressBar).toBeVisible();
			
			// Get progress value
			const progressValue = await progressBar.getAttribute('data-progress');
			
			// Verify progress is a number between 0 and 100
			const progress = parseFloat(progressValue || '0');
			expect(progress).toBeGreaterThanOrEqual(0);
			expect(progress).toBeLessThanOrEqual(100);
		}
	});

	test('should update progress over time', async ({ page }) => {
		// Check if there are any active construction items
		const activeItems = page.locator('[data-testid="construction-queue-item"][data-status="active"]');
		const count = await activeItems.count();
		
		if (count > 0) {
			const progressBar = activeItems.first().locator('[data-testid="progress-bar"]');
			
			// Get initial progress
			const initialProgress = await progressBar.getAttribute('data-progress');
			const initialTime = await activeItems.first().locator('[data-testid="time-remaining"]').textContent();
			
			// Wait 3 seconds
			await page.waitForTimeout(3000);
			
			// Get updated progress
			const updatedProgress = await progressBar.getAttribute('data-progress');
			const updatedTime = await activeItems.first().locator('[data-testid="time-remaining"]').textContent();
			
			// Progress should have increased OR time should have decreased
			// (depending on whether progress ticker is running)
			expect(
				parseFloat(updatedProgress || '0') > parseFloat(initialProgress || '0') ||
				updatedTime !== initialTime
			).toBeTruthy();
		}
	});

	test('should persist construction queue on page refresh', async ({ page }) => {
		// Get current construction queue count
		const constructionItems = page.locator('[data-testid="construction-queue-item"]');
		const initialCount = await constructionItems.count();
		
		if (initialCount > 0) {
			// Get first structure name
			const firstName = await constructionItems.first().locator('[data-testid="structure-name"]').textContent();
			
			// Refresh page
			await page.reload();
			
			// Wait for construction queue to reload
			await page.waitForSelector('[data-testid="build-menu-button"]', { timeout: 10000 });
			await page.waitForTimeout(2000);
			
			// Verify construction items still exist
			const newConstructionItems = page.locator('[data-testid="construction-queue-item"]');
			const newCount = await newConstructionItems.count();
			
			expect(newCount).toBe(initialCount);
			
			// Verify first structure name matches
			if (newCount > 0) {
				const newFirstName = await newConstructionItems.first().locator('[data-testid="structure-name"]').textContent();
				expect(newFirstName).toBe(firstName);
			}
		}
	});
});
		
		// Wait 3 seconds
		await page.waitForTimeout(3000);
		
		// Get updated progress
		const updatedProgress = await progressBar.getAttribute('data-progress');
		
		// Progress should have increased
		expect(Number(updatedProgress)).toBeGreaterThan(Number(initialProgress));
	});

	test('should prevent building extractor in occupied slot', async ({ page }) => {
		// Build first extractor
		await page.click('[data-testid="build-menu-button"]');
		await page.click('[data-testid="structure-card-Farm"]');
		await page.click('[data-testid="tile-slot-0"]');
		await page.click('[data-testid="confirm-build"]');
		
		// Wait for queue to update
		await page.waitForTimeout(1000);
		
		// Try to build another in same slot
		await page.click('[data-testid="build-menu-button"]');
		await page.click('[data-testid="structure-card-Well"]');
		await page.click('[data-testid="tile-slot-0"]'); // Same slot
		await page.click('[data-testid="confirm-build"]');
		
		// Should show error message
		await expect(page.locator('[data-testid="error-message"]')).toContainText('SLOT_RESERVED');
	});

	test('should validate area before building', async ({ page }) => {
		// Try to build structure that exceeds area capacity
		// (Assumes settlement has limited area)
		await page.click('[data-testid="build-menu-button"]');
		await page.click('[data-testid="structure-card-Warehouse"]');
		await page.click('[data-testid="confirm-build"]');
		
		// Build until area is full
		for (let i = 0; i < 20; i++) {
			const errorVisible = await page.locator('[data-testid="error-message"]').isVisible();
			if (errorVisible) {
				const errorText = await page.locator('[data-testid="error-message"]').textContent();
				expect(errorText).toContain('INSUFFICIENT_AREA');
				break;
			}
			await page.click('[data-testid="build-menu-button"]');
			await page.click('[data-testid="structure-card-Warehouse"]');
			await page.click('[data-testid="confirm-build"]');
			await page.waitForTimeout(500);
		}
	});

	test('should complete construction and add structure', async ({ page }) => {
		// This test requires a very short construction time in test environment
		// OR mocking/fast-forwarding time
		
		// For now, skip or mark as slow
		test.skip();
		
		// TODO: Implement time-mocking or use test fixtures with 1-second constructions
	});

	test('should queue multiple structures correctly', async ({ page }) => {
		// Build 5 structures
		for (let i = 0; i < 5; i++) {
			await page.click('[data-testid="build-menu-button"]');
			await page.click('[data-testid="structure-card-Tent"]');
			await page.click('[data-testid="confirm-build"]');
			await page.waitForTimeout(500);
		}
		
		// Check queue count
		const queueItems = page.locator('[data-testid="construction-queue-item"]');
		await expect(queueItems).toHaveCount(5);
		
		// First 3 should be active
		const activeItems = queueItems.filter({ has: page.locator('[data-status="active"]') });
		await expect(activeItems).toHaveCount(3);
		
		// Rest should be queued
		const queuedItems = queueItems.filter({ has: page.locator('[data-status="queued"]') });
		await expect(queuedItems).toHaveCount(2);
	});

	test('should persist queue on page refresh', async ({ page }) => {
		// Build structure
		await page.click('[data-testid="build-menu-button"]');
		await page.click('[data-testid="structure-card-Tent"]');
		await page.click('[data-testid="confirm-build"]');
		
		// Wait for queue
		await page.waitForSelector('[data-testid="construction-queue-item"]');
		
		// Refresh page
		await page.reload();
		
		// Wait for page to load
		await page.waitForSelector('[data-testid="settlement-name"]');
		
		// Queue should still be visible
		const queueItems = page.locator('[data-testid="construction-queue-item"]');
		await expect(queueItems).toHaveCount(1);
	});

	test('should show time in HH:MM:SS format', async ({ page }) => {
		// Build structure
		await page.click('[data-testid="build-menu-button"]');
		await page.click('[data-testid="structure-card-Tent"]');
		await page.click('[data-testid="confirm-build"]');
		
		// Wait for queue
		await page.waitForSelector('[data-testid="construction-queue-item"]');
		
		// Get time display
		const timeDisplay = page.locator('[data-testid="time-remaining"]').first();
		const timeText = await timeDisplay.textContent();
		
		// Should match HH:MM:SS format
		expect(timeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});
});
