# Remaining Skeleton v2/v3 Class Migrations

**Date**: November 2, 2025  
**Status**: Partially Complete  

## ✅ Completed Fixes

### Landing Page (`src/routes/+page.svelte`)
- ✅ Migrated `svelte-material-icons` → `lucide-svelte`
  - `Earth` → `Globe`
  - `Campfire` → `Flame`
- ✅ Updated button presets to v4

### Header Component (`src/lib/components/app/Header.svelte`)
- ✅ Changed `variant-soft-surface` → `preset-tonal-surface-500`

### Game Navigation (`src/lib/components/game/Navigation.svelte`)
- ✅ Changed `variant-filled-secondary` → `preset-filled-secondary-500`

### Auth Pages
- ✅ Multiple files updated

---

## ⚠️ Remaining Files with Old Classes

### Game Components (High Priority)

#### 1. `src/routes/(protected)/game/settlements/[id]/+page.svelte`
**Count**: 16 instances
```svelte
variant-ghost-secondary → preset-outlined-secondary-500
```
**Locations**:
- All badge elements (structures, plot stats, resources)

#### 2. `src/routes/(protected)/game/settlements/+page.svelte`
**Count**: 5 instances
```svelte
variant-ghost-surface → preset-outlined-surface-500
```
**Locations**:
- Food, Water, Wood, Stone, Ore badges

### Admin Components (Medium Priority)

#### 3. `src/routes/(protected)/admin/worlds/create/+page.svelte`
**Count**: 1 instance
```svelte
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
```
**Location**: Error alert

#### 4. `src/routes/(protected)/admin/servers/create/+page.svelte`
**Count**: 4 instances
```svelte
variant-ghost-surface → preset-outlined-surface-500
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
```
**Locations**:
- Input field classes (3 instances)
- Error alert (1 instance)

#### 5. `src/routes/(protected)/admin/servers/[id]/+page.svelte`
**Count**: 2 instances
```svelte
variant-ghost-success → bg-success-500/10 text-success-900 dark:text-success-50
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
```
**Locations**:
- Server status badges

### Account Pages (Low Priority)

#### 6. `src/routes/(protected)/account/+page.svelte`
**Count**: 2 instances
```svelte
variant-soft-primary → preset-tonal-primary-500
variant-filled-secondary → preset-filled-secondary-500
```
**Locations**:
- Edit button
- Card element

### Auth Pages (Low Priority - May have been fixed)

#### 7. `src/routes/(auth)/sign-in/+page.svelte`
**Count**: 1 instance
```svelte
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
```

#### 8. `src/routes/(auth)/register/+page.svelte`
**Count**: 1 instance
```svelte
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
```

#### 9. `src/routes/(auth)/forgot-password/+page.svelte`
**Count**: 2 instances
```svelte
variant-ghost-error → bg-error-500/10 text-error-900 dark:text-error-50
variant-ghost-primary → preset-outlined-primary-500
```

---

## 📋 Migration Reference

### Skeleton v2/v3 → v4 Class Mappings

| Old (v2/v3) | New (v4) | Notes |
|-------------|----------|-------|
| `variant-filled-{color}` | `preset-filled-{color}-500` | Filled button/card style |
| `variant-soft-{color}` | `preset-tonal-{color}-500` | Soft/tonal style |
| `variant-ghost-{color}` | `preset-outlined-{color}-500` | Ghost/outlined style |
| `variant-outlined-{color}` | `preset-outlined-{color}-500` | Same as ghost |
| `variant-ringed-{color}` | `preset-outlined-{color}-500` | Same as ghost |
| `variant-glass-{color}` | `bg-{color}-500/10` | Glass/transparent effect |

### Special Cases (Alerts/Badges)

For alert/error states without presets:

```svelte
<!-- Old -->
<div class="alert variant-ghost-error">

<!-- New -->
<div class="alert bg-error-500/10 text-error-900 dark:text-error-50">
```

```svelte
<!-- Old -->
<div class="alert variant-ghost-success">

<!-- New -->
<div class="alert bg-success-500/10 text-success-900 dark:text-success-50">
```

---

## 🔧 Quick Fix Commands

### PowerShell Commands (for reference - may not work in PS 5.1)

```powershell
# Single file fix
$file = 'path\to\file.svelte'
(Get-Content $file) -join "`n" -replace 'variant-ghost-secondary', 'preset-outlined-secondary-500' | Set-Content $file

# Batch fix for specific pattern
Get-ChildItem -Path src -Recurse -Filter "*.svelte" | ForEach-Object {
    $content = Get-Content $_.FullName | Out-String
    $content = $content -replace 'variant-ghost-secondary', 'preset-outlined-secondary-500'
    Set-Content -Path $_.FullName -Value $content
}
```

### Manual Fix Steps

1. Open file in editor
2. Find/Replace:
   - Find: `variant-ghost-secondary`
   - Replace: `preset-outlined-secondary-500`
3. Repeat for other variant patterns
4. Save and test

---

## 🎯 Priority Order

1. **High**: Game settlement pages (user-facing, most visible)
2. **Medium**: Admin pages (less frequently accessed)
3. **Low**: Auth pages (likely already fixed, verify only)

---

## ✅ Verification Checklist

After fixing all files:

- [ ] Run `npm run check` - verify no TypeScript errors
- [ ] Run `npm run dev` - test dev server starts
- [ ] Visit `/game/settlements` - check badge styles
- [ ] Visit `/admin/servers` - check form styles
- [ ] Visit `/sign-in` - check error alert styles
- [ ] Search codebase: `variant-` should only appear in docs

---

## 📝 Notes

- Some files may have already been fixed during manual edits
- PowerShell 5.1 doesn't support `-Raw` parameter
- Consider using VS Code's global find/replace for batch updates
- Test each page after changes to ensure styles look correct

---

**Estimated Time to Complete**: 30-45 minutes  
**Total Files Remaining**: ~9 files  
**Total Instances**: ~35 class replacements
