import { test as setup, expect as _expect } from '@playwright/test';
// Use _expect to avoid unused import error
_expect.extend({});
// TODO: Update this test file to use REST API instead of Prisma
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

/**
 * Authentication setup for admin tests
 * This file creates test users and generates authentication state
 *
 * NOTE: Temporarily disabled during Prisma → REST API migration
 * Will be re-enabled once test infrastructure is updated
 */

const ADMIN_USER = {
	email: 'admin@test.com',
	password: 'TestPassword123!',
	role: 'ADMINISTRATOR'
};

const REGULAR_USER = {
	email: 'user@test.com',
	password: 'TestPassword123!',
	role: 'MEMBER'
};

/* TEMPORARILY DISABLED - needs REST API migration
setup('create test users', async () => {
    try {
        // Clean up existing test users
        await prisma.account.deleteMany({
            where: {
                email: {
                    in: [ADMIN_USER.email, REGULAR_USER.email]
                }
            }
        });

        // Create admin user
        await prisma.account.create({
            data: {
                email: ADMIN_USER.email,
                password: ADMIN_USER.password, // In real setup, this should be hashed
                role: ADMIN_USER.role as any
            }
        });

        // Create regular user
        await prisma.account.create({
            data: {
                email: REGULAR_USER.email,
                password: REGULAR_USER.password,
                role: REGULAR_USER.role as any
            }
        });

        console.log('✓ Test users created successfully');
    } catch (error) {
        console.error('Failed to create test users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
});

setup('authenticate as admin', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', ADMIN_USER.email);
    await page.fill('input[name="password"]', ADMIN_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to protected area
    await page.waitForURL(/\/(game|admin|account)/);
    
    // Save authentication state
    await page.context().storageState({ path: 'tests/admin/.auth/admin.json' });
    
    console.log('✓ Admin authentication saved');
});

setup('authenticate as regular user', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Fill in user credentials
    await page.fill('input[name="email"]', REGULAR_USER.email);
    await page.fill('input[name="password"]', REGULAR_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to protected area
    await page.waitForURL(/\/game/);
    
    // Save authentication state
    await page.context().storageState({ path: 'tests/admin/.auth/user.json' });
    
    console.log('✓ Regular user authentication saved');
});
*/

export { ADMIN_USER, REGULAR_USER };
