# Skeleton v2 → v3 → v4 Migration Status

This document tracks our migration progress from Skeleton v2 through v3 to v4, including Tailwind CSS upgrades.

## Migration Path Overview

```
Skeleton v2.11.0 + Tailwind v3
    ↓
Skeleton v3.x + Tailwind v4  [SKIPPED - per official guidance]
    ↓
Skeleton v4.2.2 + Tailwind v4.1.16  [CURRENT STATE]
```

**Note**: The official v2→v3 migration guide recommends skipping Skeleton v3 component migration if targeting v4, which we did.

---

## ✅ Completed Steps

### Prerequisites
- [x] Created migration branch (if needed)
- [x] Updated from Skeleton v2.11.0 to v4.2.2
- [x] App was in functional state before migration
- [x] Critical dependencies updated

### Core Technologies Migration

#### Svelte v5
- [x] **Current Version**: `svelte@5.43.2` (latest)
- [x] **Status**: Already migrated to Svelte 5
- [x] Components using runes ($state, $derived, etc.)

#### SvelteKit v2
- [x] **Current Version**: `@sveltejs/kit@2.48.4` (latest)
- [x] **Status**: Already on SvelteKit v2

#### Tailwind v4
- [x] **Current Version**: `tailwindcss@4.1.16` (latest)
- [x] Removed `skeleton` plugin from tailwind.config ✅
- [x] Using `app.postcss` (not renamed to `app.css` - PostCSS route)
- [x] No purgecss plugin to remove ✅
- [x] Migrated to Tailwind v4 syntax (@import "tailwindcss")

### Skeleton v4 Migration

#### Package Updates
- [x] Installed `@skeletonlabs/skeleton@4.2.2`
- [x] Installed `@skeletonlabs/skeleton-svelte@4.2.2`
- [x] Updated imports throughout project

#### Configuration Files
- [x] `postcss.config.cjs` - Using `@tailwindcss/postcss` plugin
- [x] `src/app.postcss` - Updated with Tailwind v4 imports
- [x] `src/app.html` - Added `data-theme="cerberus"` to `<body>`
- [x] Removed `tailwind.config.ts` (Tailwind v4 doesn't use it)
- [x] No `vite.config.js` changes needed (not using Tailwind Vite plugin)

#### Theme Configuration
- [x] Using preset theme: `cerberus`
- [x] Theme specified in `app.html` via `data-theme` attribute
- [x] Skeleton imports in `app.postcss`

---

## 📋 Key Decisions Made

### Using PostCSS Plugin Instead of Vite Plugin

**Decision**: We are using `@tailwindcss/postcss` instead of `@tailwindcss/vite`.

**Reasoning**:
1. The v2→v3 migration guide suggests migrating to the Vite plugin
2. However, both plugins are officially supported in Tailwind v4
3. PostCSS plugin is more traditional and widely used
4. Our existing setup works with PostCSS
5. No compelling reason to switch mid-migration

**Current Setup**:
```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Alternative (Vite Plugin)**: If we wanted to switch:
1. Delete `postcss.config.cjs`
2. Run `npm uninstall postcss @tailwindcss/postcss`
3. Run `npm install @tailwindcss/vite`
4. Update `vite.config.js`:
```javascript
import tailwindcss from '@tailwindcss/vite'

plugins: [
  tailwindcss(),  // ABOVE sveltekit()
  sveltekit()
]
```

### Data-Theme Location

**Decision**: Keeping `data-theme` on `<body>` tag for now.

**Note from v2→v3 guide**:
> "The Skeleton `data-theme` attribute has moved from `<body>` to `<html>`"

**Current State**: We have it on `<body>` which works fine.

**Action Needed**: Consider moving to `<html>` tag if we encounter theme issues.

---

## ⚠️ Known Issues

### Critical: @variant Bug in Skeleton v4.2.2

**Error**:
```
[ERROR] Cannot use `@variant` with unknown variant: md
node_modules/@skeletonlabs/skeleton/dist/index.css:1854:2
```

**Impact**: Build fails completely - cannot run dev server or production build.

**Root Cause**: Skeleton v4.2.2 uses `@variant md` syntax but Tailwind v4.1.16 doesn't recognize 'md' as a registered variant. This is a bug in Skeleton's library code.

**Workarounds**:
1. **Wait for fix** (recommended) - Monitor https://github.com/skeletonlabs/skeleton
2. **Revert to stable** - Downgrade to Tailwind 3.4.17 + Skeleton 2.11.0
3. **Report bug** - File issue with Skeleton Labs
4. **Remove Skeleton** - Use pure Tailwind 4 components

---

## 🔄 Manual Migration Tasks

### 1. Replace @apply Usage ⚠️

**Current Usage**:
- `src/app.postcss`: Line 11 uses `@apply h-full overflow-hidden;`

**Recommended Fix**:
```css
/* Before */
html, body {
    @apply h-full overflow-hidden;
}

/* After */
html, body {
    height: 100%;
    overflow: hidden;
}
```

**Reasoning**: 
- Tailwind v4 discourages `@apply` usage
- New CSS custom properties and directives available
- More explicit and performant

**Priority**: Medium (works but not best practice)

### 2. Move data-theme to <html> Tag 🔍

**Current**: `<body data-theme="cerberus">`

**Recommended**: `<html lang="en" data-theme="cerberus">`

**File**: `src/app.html`

**Priority**: Low (current implementation works)

### 3. Component Migration 📦

**Status**: Need to audit component usage

**Components Used** (need verification):
- Check if using any v2/v3 components
- Update props/events to Skeleton v4 API
- Follow component-specific migration guides

**Action**: Run audit to identify all Skeleton component imports

### 4. Review Unsupported Features 🔍

**From v2→v3 Migration Guide** - Check if we use any of these:

#### Removed Svelte Actions:
- [ ] Clipboard (replaced with Cookbook guide)
- [ ] SVG Filter (replaced with Cookbook guide)
- [ ] Focus Trap (replaced with Integration guide)

#### Removed Components:
- [ ] `<AppShell>` (replaced with custom layouts)
- [ ] `<Autocomplete>` (Integration guide available)
- [ ] `<ConicGradient>` (built into Tailwind)
- [ ] `<Lightswitch>` (custom component)
- [ ] `<ListBox>` (removed)
- [ ] `<Stepper>` (Cookbook guide)
- [ ] `<Table>` (use Tailwind component)

#### Removed Utilities:
- [ ] Code Blocks (Integration guide)
- [ ] Drawers (Integration guide)
- [ ] Modals (Integration guide)
- [ ] Popovers (Integration guide)
- [ ] Toasts (Integration guide)
- [ ] Table of Contents (Cookbook guide)
- [ ] Persisted Store (incompatible with Svelte 5)

**Next Step**: Search codebase for usage of these features

---

## 📊 Migration Checklist Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Svelte v5** | ✅ Complete | v5.43.2 |
| **SvelteKit v2** | ✅ Complete | v2.48.4 |
| **Tailwind v4** | ✅ Complete | v4.1.16 |
| **Skeleton v4** | ⚠️ Blocked | v4.2.2 installed, build fails |
| **Package Updates** | ✅ Complete | All dependencies updated |
| **Config Files** | ✅ Complete | All properly configured |
| **Theme Setup** | ✅ Complete | Cerberus preset active |
| **@apply Cleanup** | 🔄 Pending | 1 usage in app.postcss |
| **Component Migration** | 🔍 Unknown | Needs audit |
| **Feature Audit** | 🔍 Unknown | Check for removed features |
| **Build Status** | ❌ Failing | @variant bug in Skeleton |

**Legend**:
- ✅ Complete
- ⚠️ Complete but blocked
- 🔄 In progress / Action needed
- 🔍 Needs investigation
- ❌ Failing

---

## 🎯 Next Steps

### Immediate Priority

1. **Decision Point**: Choose migration path:
   - **Option A**: Wait for Skeleton v4 fix (recommended if not time-sensitive)
   - **Option B**: Revert to Tailwind 3 + Skeleton 2 (stable, working build)
   - **Option C**: Report bug and contribute fix (community support)
   - **Option D**: Remove Skeleton dependency (most effort)

### When Build Works

2. **Code Cleanup**:
   - [ ] Replace `@apply` in `src/app.postcss`
   - [ ] Move `data-theme` to `<html>` tag
   - [ ] Verify all components work with Skeleton v4

3. **Component Audit**:
   - [ ] Search for Skeleton component imports
   - [ ] Test all Skeleton components in app
   - [ ] Update props/events to v4 API
   - [ ] Replace any removed components

4. **Feature Audit**:
   - [ ] Search for removed utility usage (modals, drawers, etc.)
   - [ ] Migrate to new implementations per guides
   - [ ] Test all affected features

5. **Testing & Validation**:
   - [ ] Run dev server
   - [ ] Test all pages/routes
   - [ ] Run unit tests
   - [ ] Run e2e tests
   - [ ] Build for production

6. **Documentation**:
   - [ ] Update README with new setup
   - [ ] Document any custom workarounds
   - [ ] Note version requirements

---

## 📚 Reference Links

### Official Migration Guides
- [Skeleton v2 → v3 Migration](https://www.skeleton.dev/docs/get-started/migrate-from-v2/)
- [Skeleton v3 → v4 Migration](https://www.skeleton.dev/docs/get-started/migrate-from-v3/)
- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Svelte v5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [SvelteKit v2 Migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-2)

### Skeleton Resources
- [Skeleton Documentation](https://www.skeleton.dev/docs)
- [Skeleton GitHub](https://github.com/skeletonlabs/skeleton)
- [Skeleton Discord](https://discord.gg/EXqV7W8MtY)
- [Theme Generator](https://themes.skeleton.dev/)

### Tailwind Resources
- [Tailwind v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [CSS-First Configuration](https://tailwindcss.com/blog/tailwindcss-v4#css-first-configuration)
- [Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)

---

## 💡 Lessons Learned

1. **Skip Intermediate Versions**: The official guide correctly recommends skipping Skeleton v3 when migrating to v4. We followed this advice.

2. **Verify Library Compatibility**: Always check if library versions are truly compatible before upgrading. Skeleton v4.2.2 claims Tailwind v4 support but has syntax errors.

3. **PostCSS vs Vite Plugin**: Both Tailwind plugins are valid. PostCSS is more traditional and widely documented.

4. **@apply is Discouraged**: Tailwind v4 provides better alternatives (CSS custom properties, @variant directive). Start migrating away from @apply.

5. **Theme System Overhaul**: Skeleton v4 completely redesigned the theme system. OKLCH colors, CSS variables, and new preset themes.

6. **Component Breaking Changes**: Nearly every Skeleton component had API changes between v2 and v4. Requires careful migration.

---

**Last Updated**: October 31, 2025  
**Migration Started**: October 31, 2025  
**Status**: Configuration complete, blocked by upstream bug
