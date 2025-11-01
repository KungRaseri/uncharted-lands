/**
 * Patch Skeleton v4.2.2 CSS to fix @variant md bug
 * 
 * Issue: Skeleton uses @variant md for responsive breakpoints
 * Problem: Tailwind v4 doesn't recognize 'md' as a variant (it's a modifier/breakpoint)
 * Solution: Replace @variant md with @media queries
 * 
 * This script runs automatically after npm install via postinstall hook.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skeletonCssPath = path.join(
  __dirname,
  '../node_modules/@skeletonlabs/skeleton/dist/index.css'
);

console.log('🔧 Patching Skeleton CSS for Tailwind v4 compatibility...');

// Check if file exists
if (!fs.existsSync(skeletonCssPath)) {
  console.warn('⚠️  Skeleton CSS file not found. Skipping patch.');
  console.warn(`   Expected: ${skeletonCssPath}`);
  process.exit(0);
}

try {
  // Read the CSS file
  let css = fs.readFileSync(skeletonCssPath, 'utf8');
  
  // Count occurrences before patching
  const beforeCount = (css.match(/@variant md/g) || []).length;
  
  if (beforeCount === 0) {
    console.log('✅ No @variant md found. Skeleton may have been fixed upstream!');
    process.exit(0);
  }
  
  console.log(`   Found ${beforeCount} instances of @variant md`);
  
  // Replace @variant md with @media query
  // md breakpoint is 768px in Tailwind
  css = css.replace(
    /@variant md \{/g,
    '@media (min-width: 768px) {'
  );
  
  // Verify the replacement worked
  const afterCount = (css.match(/@variant md/g) || []).length;
  
  if (afterCount > 0) {
    console.error(`❌ Patch failed. Still ${afterCount} instances remaining.`);
    process.exit(1);
  }
  
  // Write the patched CSS back
  fs.writeFileSync(skeletonCssPath, css, 'utf8');
  
  console.log(`✅ Successfully patched ${beforeCount} instances of @variant md`);
  console.log('   Build should now work!');
  
} catch (error) {
  console.error('❌ Error patching Skeleton CSS:', error.message);
  process.exit(1);
}
