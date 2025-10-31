# Tailwind v4 + Skeleton v4 Configuration

This document explains the current Tailwind v4 and Skeleton v4 configuration setup.

## Configuration Files

### ✅ Required Files

1. **`postcss.config.cjs`**
   - PostCSS configuration for Vite
   - Uses `@tailwindcss/postcss` plugin (Tailwind 4 requirement)
   - Location: Root directory

2. **`src/app.postcss`**
   - Global stylesheet with Tailwind and Skeleton imports
   - Uses new Tailwind 4 `@import` and `@plugin` syntax
   - Location: `src/` directory

3. **`src/app.html`**
   - Sets `data-theme="cerberus"` attribute on body
   - Required for Skeleton theme system

### ❌ NOT Needed

- **`tailwind.config.ts`** / **`tailwind.config.js`** - Tailwind 4 doesn't use external config files
- All configuration is done inline in CSS using `@theme`, `@plugin`, etc.

## Current Setup

### postcss.config.cjs
```javascript
module.exports = {
	plugins: {
		'@tailwindcss/postcss': {},  // Tailwind 4 PostCSS plugin
		autoprefixer: {},
	},
}
```

### src/app.postcss
```css
@import "tailwindcss";                              // Tailwind 4 core
@import "@skeletonlabs/skeleton";                   // Skeleton core styles
@import "@skeletonlabs/skeleton-svelte";            // Skeleton Svelte components
@import "@skeletonlabs/skeleton/themes/cerberus";   // Cerberus theme

@plugin "@tailwindcss/forms";                       // Forms plugin
@plugin "@tailwindcss/typography";                  // Typography plugin

html,
body {
    @apply h-full overflow-hidden;
    font-family: 'Titillium Web', sans-serif;
}
```

### src/app.html
```html
<body data-theme="cerberus" data-sveltekit-preload-data="hover">
```

## Package Versions

- **Tailwind CSS**: `4.1.16` (latest)
- **@tailwindcss/postcss**: `4.1.16`
- **@tailwindcss/forms**: `0.5.9` (compatible with v4)
- **@tailwindcss/typography**: `0.5.15` (compatible with v4)
- **@skeletonlabs/skeleton**: `4.2.2` (latest)
- **@skeletonlabs/skeleton-svelte**: `4.2.2` (latest)

## Known Issues

### Build Error: `@variant md`

**Status**: ❌ BLOCKING - Build fails

**Error**:
```
Cannot use `@variant` with unknown variant: md
file: node_modules/@skeletonlabs/skeleton/dist/index.css:1:0
```

**Cause**: Skeleton v4.2.2 uses `@variant md` for responsive breakpoints, but Tailwind 4.1.16 doesn't recognize `md` as a registered variant. This is a bug in Skeleton Labs v4.2.2.

**Impact**: 
- Build fails completely
- Cannot use Skeleton v4 + Tailwind 4 together currently
- Affects all projects trying to upgrade

**Workarounds**:
1. **Wait for Skeleton Labs fix** (recommended) - Monitor https://github.com/skeletonlabs/skeleton
2. **Revert to Tailwind 3 + Skeleton 2** (stable but missing features)
3. **Remove Skeleton entirely** (build custom components)

## Customization

### Adding Custom Theme Values

Instead of `tailwind.config.ts`, use inline `@theme` in `app.postcss`:

```css
@theme {
  /* Custom colors */
  --color-brand-primary: oklch(60% 0.2 250);
  --color-brand-secondary: oklch(70% 0.15 200);
  
  /* Custom spacing */
  --spacing-custom: 2.5rem;
  
  /* Custom fonts */
  --font-heading: 'Titillium Web', sans-serif;
}
```

### Available Themes

Skeleton v4 provides these themes:
- `cerberus` (current)
- `crimson`
- `emerald`
- `gold`
- `hamlindigo`
- `rocket`
- `sahara`
- `seafoam`
- `skeleton`
- `vintage`

Change theme in `src/app.html`:
```html
<body data-theme="YOUR_THEME_NAME">
```

## Migration Path

### Current State: ❌ Build Broken

**What works:**
- Package installation ✅
- Configuration files ✅
- Import syntax ✅

**What's broken:**
- Build fails due to Skeleton bug ❌
- Cannot run dev server ❌
- Cannot deploy ❌

### Recommended Action

**Option A: Wait for Skeleton Fix** (Best for production)
```bash
# Revert to stable Tailwind 3
npm install -D tailwindcss@3.4.17
npm uninstall @tailwindcss/postcss

# Update postcss.config.cjs to use standard plugin
# Update app.postcss to use @import 'tailwindcss/base', etc.
```

**Option B: Report and Help Fix** (Best for open source)
1. File issue: https://github.com/skeletonlabs/skeleton/issues
2. Reference: `@variant md` incompatibility with Tailwind 4.1.16
3. Provide reproduction steps
4. Wait for patch release

**Option C: Remove Skeleton** (Best for customization)
1. Uninstall Skeleton packages
2. Build custom components with Tailwind 4
3. Keep full control over styling

## Verification

To verify configuration is correct:

```bash
# Check installed versions
npm list tailwindcss @skeletonlabs/skeleton

# Try to build (will fail due to Skeleton bug)
npm run build

# Check for config files (should be none)
ls tailwind.config.*
```

## Additional Resources

- [Tailwind v4 Documentation](https://tailwindcss.com/docs)
- [Skeleton v4 Documentation](https://skeleton.dev/docs)
- [Skeleton v3→v4 Migration Guide](https://skeleton.dev/docs/get-started/migrate-from-v3)
- [Tailwind v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
