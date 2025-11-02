# Skeleton v4 Theme System Migration

**Date**: November 2, 2025  
**Status**: ⚠️ In Progress - Design Tokens Need Migration  

---

## Current Status

✅ **Working**:
- Theme imported: `@import "@skeletonlabs/skeleton/themes/cerberus"`
- Theme applied: `data-theme="cerberus"` on `<html>` tag
- Mode control: `data-mode="light"` on `<html>` tag
- Dev server running: http://localhost:3001/

⚠️ **Issue Detected**:
- **Design Tokens** (v2/v3 syntax) still in use throughout codebase
- Classes ending in `-token` are **deprecated** in Skeleton v4
- Need to migrate to **CSS custom properties** or **direct Tailwind classes**

---

## Skeleton v4 Theme System

### How Themes Work in v4

1. **Import the theme CSS** in `app.css`:
   ```css
   @import "@skeletonlabs/skeleton/themes/cerberus";
   ```

2. **Set theme on HTML element** in `app.html`:
   ```html
   <html data-theme="cerberus" data-mode="light">
   ```

3. **Use CSS custom properties** instead of design tokens:
   ```css
   /* ❌ OLD (v2/v3 - Design Tokens) */
   .my-element {
     background: bg-surface-200-700-token;
     color: text-primary-900-50-token;
   }
   
   /* ✅ NEW (v4 - CSS Custom Properties) */
   .my-element {
     background-color: var(--color-surface-200);
     color: var(--color-primary-900);
   }
   
   /* ✅ ALSO NEW (v4 - Direct Tailwind) */
   .my-element {
     @apply bg-surface-200 text-primary-900;
   }
   ```

4. **Dark mode handling** with `data-mode` attribute:
   - Light mode: `data-mode="light"`
   - Dark mode: `data-mode="dark"`
   - The theme automatically switches colors based on this

---

## Design Token Migration Guide

### What Are Design Tokens?

Design tokens in Skeleton v2/v3 were **class-based utilities** that provided:
- Light/dark mode switching (e.g., `200-700` means light-200, dark-700)
- Automatic color application
- Simplified theming

Example: `bg-surface-200-700-token` would be:
- Light mode: `background-color: surface-200`
- Dark mode: `background-color: surface-700`

### Why They're Deprecated in v4

Skeleton v4 moved to:
1. **CSS custom properties** (CSS variables)
2. **Direct Tailwind classes**
3. **The `@variant` directive** for dark mode

This provides:
- Better performance
- More flexibility
- Standard CSS patterns
- Easier debugging

---

## Token Classes Found in Codebase

### Search Results

Found **30+ instances** of `-token` classes across:

| File | Token Classes | Count |
|------|--------------|-------|
| `account/+page.svelte` | `bg-surface-400-500-token`, `text-primary-900-50-token`, `border-surface-500-400-token` | 5 |
| `admin/servers/create/+page.svelte` | `bg-surface-200-700-token`, `bg-primary-400-500-token` | 2 |
| `admin/worlds/create/+page.svelte` | `bg-surface-backdrop-token`, `bg-primary-400-500-token` | 20+ |
| `admin/worlds/+page.svelte` | `bg-primary-400-500-token`, `text-token` | 3 |
| `game/getting-started/+page.svelte` | `bg-surface-200-700-token` | 1 |
| Various admin pages | `text-token`, `bg-primary-400-500-token` | 10+ |

---

## Migration Patterns

### Background Colors

```svelte
<!-- ❌ OLD -->
<div class="bg-surface-200-700-token">

<!-- ✅ NEW (Option 1: CSS Custom Property) -->
<div style="background-color: var(--color-surface-200)">

<!-- ✅ NEW (Option 2: Tailwind with dark variant) -->
<div class="bg-surface-200 dark:bg-surface-700">

<!-- ✅ NEW (Option 3: Skeleton preset if available) -->
<div class="card bg-surface">
```

### Text Colors

```svelte
<!-- ❌ OLD -->
<h2 class="text-primary-900-50-token">

<!-- ✅ NEW -->
<h2 class="text-primary-900 dark:text-primary-50">
```

### Border Colors

```svelte
<!-- ❌ OLD -->
<div class="border-surface-500-400-token">

<!-- ✅ NEW -->
<div class="border-surface-500 dark:border-surface-400">
```

### Generic "text-token"

```svelte
<!-- ❌ OLD -->
<span class="text-token">

<!-- ✅ NEW (inherits from parent or theme default) -->
<span>

<!-- ✅ OR if you need explicit color -->
<span class="text-surface-950 dark:text-surface-50">
```

### Button/Card Backgrounds

```svelte
<!-- ❌ OLD -->
<button class="btn bg-primary-400-500-token">

<!-- ✅ NEW (use Skeleton v4 presets) -->
<button class="btn preset-filled-primary-500">

<!-- ✅ OR direct Tailwind -->
<button class="btn bg-primary-400 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600">
```

---

## Recommended Approach

### Strategy 1: Use Skeleton v4 Presets (Preferred)

For buttons, badges, cards, use the built-in presets:

```svelte
<!-- Buttons -->
<button class="btn preset-filled-primary-500">
<button class="btn preset-outlined-secondary-500">
<button class="btn preset-tonal-surface-500">

<!-- Cards -->
<div class="card preset-filled-surface-500">
<div class="card preset-outlined-primary-500">

<!-- Badges -->
<span class="badge preset-filled-success-500">
<span class="badge preset-outlined-warning-500">
```

### Strategy 2: Direct Tailwind Classes

For custom elements without presets:

```svelte
<div class="bg-surface-200 text-surface-950 dark:bg-surface-700 dark:text-surface-50">
```

### Strategy 3: CSS Custom Properties

For more complex styling or when you need theme-aware colors in `<style>` blocks:

```svelte
<style>
  .my-custom-element {
    background-color: var(--color-surface-200);
    color: var(--color-primary-900);
  }
  
  [data-mode="dark"] .my-custom-element {
    background-color: var(--color-surface-700);
    color: var(--color-primary-50);
  }
</style>
```

---

## Migration Checklist

### High Priority (User-Facing)

- [ ] `account/+page.svelte` (5 token classes)
  - Card background
  - Header text
  - Label text
  - Border colors

- [ ] `game/getting-started/+page.svelte` (1 token class)
  - Container background

- [ ] Auth pages (if any token classes found)

### Medium Priority (Admin Pages)

- [ ] `admin/servers/create/+page.svelte` (2 token classes)
  - Card background
  - Button background

- [ ] `admin/worlds/create/+page.svelte` (20+ token classes)
  - Many `bg-surface-backdrop-token` badges
  - Button backgrounds

- [ ] `admin/worlds/+page.svelte` (3 token classes)
  - Button styling

- [ ] `admin/players/+page.svelte` (3 token classes)
  - Button styling, icon colors

### Low Priority (Less Visible)

- [ ] Other admin pages with `text-token`
- [ ] Server detail pages
- [ ] Region pages

---

## Available Cerberus Theme Colors

The Cerberus theme provides these color scales:

- **primary**: Blue scale (50-950)
- **secondary**: Purple scale (50-950)
- **tertiary**: Green scale (50-950)
- **success**: Green
- **warning**: Orange
- **error**: Red
- **surface**: Gray/neutral scale (50-950)

Each scale has light/dark variants that automatically switch with `data-mode`.

---

## Testing Plan

1. **Visual inspection**: Check each page in browser
2. **Dark mode toggle**: Verify colors switch correctly
3. **Contrast**: Ensure text is readable on backgrounds
4. **Interactive states**: Hover, focus, active states work
5. **Responsive**: Test mobile and desktop views

---

## Next Steps

1. ✅ Document current token usage (this file)
2. ⏳ Migrate account page (highest priority)
3. ⏳ Migrate game pages
4. ⏳ Migrate admin pages
5. ⏳ Test in browser
6. ⏳ Verify dark mode
7. ⏳ Final cleanup

---

## Resources

- **Skeleton v4 Docs**: https://www.skeleton.dev/docs
- **Cerberus Theme**: https://www.skeleton.dev/docs/themes
- **Migration Guide**: https://www.skeleton.dev/docs/get-started/migrate-from-v3
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Estimated Time**: 2-3 hours for full migration  
**Risk Level**: Low (visual only, no logic changes)  
**Impact**: High (affects entire UI appearance)
