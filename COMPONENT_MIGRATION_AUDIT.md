# Skeleton Component Migration Audit

This document lists all Skeleton components currently used in the codebase and their migration requirements from v2 to v4.

**Generated**: October 31, 2025  
**Current State**: All imports are from `@skeletonlabs/skeleton` (v2/v3 package)  
**Target State**: Imports should be from `@skeletonlabs/skeleton-svelte` (v4 package)

---

## 🔍 Component Usage Summary

### Components Found

| Component | Old Import | New Import | Renamed? | Files Using |
|-----------|------------|------------|----------|-------------|
| `AppShell` | ✅ Found | `@skeletonlabs/skeleton-svelte` | ❌ **REMOVED** | 3 files |
| `AppBar` | ✅ Found | `@skeletonlabs/skeleton-svelte` | ✅ → `Navbar` | 2 files |
| `AppRail` | ✅ Found | `@skeletonlabs/skeleton-svelte` | ✅ → `Navigation` | 1 file |
| `AppRailTile` | ✅ Found | (part of Navigation) | ✅ Merged | 1 file |
| `Avatar` | ✅ Found | `@skeletonlabs/skeleton-svelte` | ❌ Same | 2 files |
| `LightSwitch` | ✅ Found | ❌ Not available | ❌ **REMOVED** | 1 file |
| `RangeSlider` | ✅ Found | `@skeletonlabs/skeleton-svelte` | ✅ → `Slider` | 1 file |
| `Table` | ✅ Found | ❌ Not available | ❌ **REMOVED** | 1 file |

### Utilities Found

| Utility | Old Import | New Import | Status | Files Using |
|---------|------------|------------|--------|-------------|
| `popup` | ✅ Found | ❌ Not in core | 🔄 Integration | 1 file |
| `storePopup` | ✅ Found | ❌ Not in core | 🔄 Integration | 1 file |
| `PopupSettings` (type) | ✅ Found | ❌ Not in core | 🔄 Integration | 1 file |
| `tableMapperValues` | ✅ Found | ❌ Not available | ❌ **REMOVED** | 1 file |
| `TableSource` (type) | ✅ Found | ❌ Not available | ❌ **REMOVED** | 1 file |

---

## 📋 File-by-File Migration Plan

### 1. `src/routes/+layout.svelte`

**Current Imports**:
```typescript
import { AppShell } from '@skeletonlabs/skeleton';
import { storePopup } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ❌ **Remove `AppShell`** - Component removed in v4
  - Replace with custom layout using semantic HTML
  - See: https://www.skeleton.dev/docs/guides/layouts
  
- 🔄 **Replace popup utilities** - Now integration guide
  - See: https://www.skeleton.dev/docs/integrations/popover/svelte
  - May need Zag.js implementation or alternative

**Priority**: 🔴 Critical (affects all pages)

---

### 2. `src/routes/(protected)/game/+layout.svelte`

**Current Imports**:
```typescript
import { AppShell } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ❌ **Remove `AppShell`** - Component removed in v4
  - Replace with custom layout
  - See: https://www.skeleton.dev/docs/guides/layouts

**Priority**: 🔴 Critical (affects game section)

---

### 3. `src/routes/(protected)/admin/+layout.svelte`

**Current Imports**:
```typescript
import { AppShell } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ❌ **Remove `AppShell`** - Component removed in v4
  - Replace with custom layout
  - See: https://www.skeleton.dev/docs/guides/layouts

**Priority**: 🔴 Critical (affects admin section)

---

### 4. `src/lib/components/app/Header.svelte`

**Current Imports**:
```typescript
import { AppBar, popup, LightSwitch } from '@skeletonlabs/skeleton';
import type { PopupSettings } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `AppBar`** → **`Navbar`**
  ```typescript
  import { Navbar } from '@skeletonlabs/skeleton-svelte';
  ```
  - Update component props/API
  - See: https://www.skeleton.dev/docs/components/navbar

- 🔄 **Replace `popup`** - Now integration guide
  - See: https://www.skeleton.dev/docs/integrations/popover/svelte

- ❌ **Remove `LightSwitch`** - Component removed in v4
  - Build custom dark mode toggle
  - See: https://www.skeleton.dev/docs/guides/mode

**Priority**: 🟡 High (affects site navigation)

---

### 5. `src/lib/components/game/Navigation.svelte`

**Current Imports**:
```typescript
import { AppBar } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `AppBar`** → **`Navbar`**
  ```typescript
  import { Navbar } from '@skeletonlabs/skeleton-svelte';
  ```
  - Update component props/API
  - See: https://www.skeleton.dev/docs/components/navbar

**Priority**: 🟡 High (game navigation)

---

### 6. `src/lib/components/admin/Navigation.svelte`

**Current Imports**:
```typescript
import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `AppRail`** → **`Navigation`**
  ```typescript
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
  ```
  - Component greatly expanded in v4
  - `AppRailTile` is now part of Navigation component
  - Update component structure and props
  - See: https://www.skeleton.dev/docs/components/navigation

**Priority**: 🟡 High (admin navigation)

---

### 7. `src/routes/(protected)/admin/worlds/create/+page.svelte`

**Current Imports**:
```typescript
import { RangeSlider } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `RangeSlider`** → **`Slider`**
  ```typescript
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  ```
  - Update props: `value` is now array: `[15]`
  - Update events: `bind:value` → `onValueChange`
  - See: https://www.skeleton.dev/docs/components/slider

**Example Migration**:
```svelte
<!-- Before (v2) -->
<script>
  import { RangeSlider } from '@skeletonlabs/skeleton';
  let value = 15;
</script>
<RangeSlider name="amount" bind:value ticked />

<!-- After (v4) -->
<script>
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  let value = $state([15]);
</script>
<Slider 
  name="amount" 
  {value} 
  onValueChange={(e) => (value = e.value)}
  markers={[25, 50, 75]} 
/>
```

**Priority**: 🟢 Medium (world creation feature)

---

### 8. `src/routes/(protected)/admin/servers/+page.svelte`

**Current Imports**:
```typescript
import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ❌ **Remove `Table`** - Component removed in v4
  - Replace with Tailwind table component
  - Build custom data table
  - Consider alternatives: TanStack Table, Tabulator, etc.
  - See: https://www.skeleton.dev/docs/components#removed-components

- ❌ **Remove `tableMapperValues`** - Utility removed
- ❌ **Remove `TableSource` type** - Type removed

**Priority**: 🟡 High (admin functionality)

**Note**: This file might need significant refactoring if Table is heavily used.

---

### 9. `src/routes/(protected)/admin/servers/[id]/+page.svelte`

**Current Imports**:
```typescript
import { Avatar } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `Avatar`** - Same name, new import
  ```typescript
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  ```
  - Check props/API for changes
  - See: https://www.skeleton.dev/docs/components/avatar

**Priority**: 🟢 Medium (server detail page)

---

### 10. `src/routes/(protected)/admin/players/[id]/+page.svelte`

**Current Imports**:
```typescript
import { Avatar } from '@skeletonlabs/skeleton';
```

**Migration Required**:
- ✅ **Update `Avatar`** - Same name, new import
  ```typescript
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  ```
  - Check props/API for changes
  - See: https://www.skeleton.dev/docs/components/avatar

**Priority**: 🟢 Medium (player detail page)

---

## 🎯 Migration Priority Matrix

### Critical Priority 🔴
**Blocks**: Entire application or major sections

1. **All `AppShell` removals** (3 files)
   - `src/routes/+layout.svelte`
   - `src/routes/(protected)/game/+layout.svelte`
   - `src/routes/(protected)/admin/+layout.svelte`
   
   **Action**: Build custom layouts before other migrations

### High Priority 🟡
**Impact**: Core navigation and admin features

2. **Navigation components** (3 files)
   - `src/lib/components/app/Header.svelte` (AppBar → Navbar, remove LightSwitch)
   - `src/lib/components/game/Navigation.svelte` (AppBar → Navbar)
   - `src/lib/components/admin/Navigation.svelte` (AppRail → Navigation)

3. **Admin Table** (1 file)
   - `src/routes/(protected)/admin/servers/+page.svelte` (Table removed)

4. **Popup utilities** (1 file)
   - `src/routes/+layout.svelte` (popup, storePopup)

### Medium Priority 🟢
**Impact**: Specific features

5. **Avatar components** (2 files)
   - `src/routes/(protected)/admin/servers/[id]/+page.svelte`
   - `src/routes/(protected)/admin/players/[id]/+page.svelte`

6. **Slider component** (1 file)
   - `src/routes/(protected)/admin/worlds/create/+page.svelte`

---

## 📊 Migration Statistics

- **Total Components Used**: 8 unique components
- **Total Utilities Used**: 4 utilities/types
- **Total Files Affected**: 10 files
- **Components with Same Name**: 1 (Avatar)
- **Components Renamed**: 3 (AppBar, AppRail, RangeSlider)
- **Components Removed**: 3 (AppShell, LightSwitch, Table)
- **Utilities Removed**: 4 (popup, storePopup, tableMapperValues, types)

### Effort Estimation

| Category | Files | Estimated Effort | Notes |
|----------|-------|------------------|-------|
| AppShell Removal | 3 | 4-8 hours | Need custom layouts |
| Navigation Updates | 3 | 2-4 hours | Rename + API updates |
| Table Replacement | 1 | 2-6 hours | Build custom or use library |
| Popup Replacement | 1 | 1-3 hours | Implement integration guide |
| Simple Updates | 3 | 1-2 hours | Avatar, Slider renames |
| **TOTAL** | **10** | **10-23 hours** | Medium-large effort |

---

## 🛠️ Recommended Migration Order

### Phase 1: Layouts Foundation
1. Create custom layout components to replace `AppShell`
2. Update all layout files to use new structure
3. Test that all pages still render correctly

### Phase 2: Navigation
4. Update `Header.svelte` - AppBar → Navbar
5. Update `Navigation.svelte` (game) - AppBar → Navbar
6. Update `Navigation.svelte` (admin) - AppRail → Navigation
7. Build custom dark mode toggle to replace LightSwitch

### Phase 3: Data Display
8. Replace `Table` component in servers page
9. Update `Avatar` components (simple import change)
10. Update `Slider` component in world creation

### Phase 4: Utilities
11. Implement popup replacement using integration guide
12. Test all interactive features

### Phase 5: Testing & Polish
13. Full application testing
14. Fix any remaining issues
15. Update documentation

---

## 📝 Code Examples

### AppShell Replacement Example

**Before (v2)**:
```svelte
<script>
  import { AppShell } from '@skeletonlabs/skeleton';
</script>

<AppShell>
  <svelte:fragment slot="header">
    <Header />
  </svelte:fragment>
  
  <svelte:fragment slot="sidebarLeft">
    <Navigation />
  </svelte:fragment>
  
  <slot />
  
  <svelte:fragment slot="footer">
    <Footer />
  </svelte:fragment>
</AppShell>
```

**After (v4)** - Custom Layout:
```svelte
<script>
  import Header from '$lib/components/Header.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<div class="flex flex-col h-screen">
  <!-- Header -->
  <header class="flex-none">
    <Header />
  </header>
  
  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <aside class="flex-none w-64 overflow-y-auto">
      <Navigation />
    </aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
  
  <!-- Footer -->
  <footer class="flex-none">
    <Footer />
  </footer>
</div>
```

See: https://www.skeleton.dev/docs/guides/layouts

---

### AppBar → Navbar Migration

**Before (v2)**:
```svelte
<script>
  import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar>
  <svelte:fragment slot="lead">Logo</svelte:fragment>
  <svelte:fragment slot="trail">Menu</svelte:fragment>
</AppBar>
```

**After (v4)**:
```svelte
<script>
  import { Navbar } from '@skeletonlabs/skeleton-svelte';
</script>

<Navbar>
  {#snippet logo()}
    Logo
  {/snippet}
  
  {#snippet menu()}
    Menu
  {/snippet}
</Navbar>
```

Note: Check official docs for exact API - this is illustrative.

---

### RangeSlider → Slider Migration

**Before (v2)**:
```svelte
<script>
  import { RangeSlider } from '@skeletonlabs/skeleton';
  let value = 50;
</script>

<RangeSlider 
  name="setting"
  bind:value
  min={0}
  max={100}
  step={1}
  ticked
/>
```

**After (v4)**:
```svelte
<script>
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  let value = $state([50]);
</script>

<Slider 
  name="setting"
  {value}
  onValueChange={(e) => (value = e.value)}
  min={0}
  max={100}
  step={1}
  markers={[25, 50, 75]}
/>
```

---

## ⚠️ Breaking Changes to Watch For

### 1. Svelte 5 Runes
All state management must use Svelte 5 runes:
- `let value = 50` → `let value = $state(50)`
- `$: computed = value * 2` → `let computed = $derived(value * 2)`

### 2. Event Handlers
Event binding changed:
- `bind:value` → `{value}` + `onValueChange` callback
- `on:click` → `onclick` prop

### 3. Slots → Snippets
Slot syntax changed to snippets:
- `<svelte:fragment slot="name">` → `{#snippet name()}`

### 4. Style Props
New standardized style prop convention:
- Check each component's docs for style customization

### 5. Import Paths
ALL Skeleton component imports changed:
- `@skeletonlabs/skeleton` → `@skeletonlabs/skeleton-svelte`

---

## 🔗 Essential References

- [Skeleton v4 Components](https://www.skeleton.dev/docs/components)
- [Skeleton v3→v4 Migration](https://www.skeleton.dev/docs/get-started/migrate-from-v3)
- [Skeleton v2→v3 Migration](https://www.skeleton.dev/docs/get-started/migrate-from-v2)
- [Skeleton Layouts Guide](https://www.skeleton.dev/docs/guides/layouts)
- [Skeleton Integrations](https://www.skeleton.dev/docs/integrations)
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)

---

## ✅ Migration Tracking

Use this checklist as you complete each migration:

- [ ] Phase 1: Custom layouts created
  - [ ] `src/routes/+layout.svelte` - AppShell removed
  - [ ] `src/routes/(protected)/game/+layout.svelte` - AppShell removed
  - [ ] `src/routes/(protected)/admin/+layout.svelte` - AppShell removed

- [ ] Phase 2: Navigation updated
  - [ ] `src/lib/components/app/Header.svelte` - AppBar → Navbar
  - [ ] `src/lib/components/game/Navigation.svelte` - AppBar → Navbar  
  - [ ] `src/lib/components/admin/Navigation.svelte` - AppRail → Navigation
  - [ ] `src/lib/components/app/Header.svelte` - LightSwitch replaced

- [ ] Phase 3: Data display
  - [ ] `src/routes/(protected)/admin/servers/+page.svelte` - Table replaced
  - [ ] `src/routes/(protected)/admin/servers/[id]/+page.svelte` - Avatar updated
  - [ ] `src/routes/(protected)/admin/players/[id]/+page.svelte` - Avatar updated
  - [ ] `src/routes/(protected)/admin/worlds/create/+page.svelte` - Slider updated

- [ ] Phase 4: Utilities
  - [ ] `src/routes/+layout.svelte` - popup/storePopup replaced

- [ ] Phase 5: Testing
  - [ ] All pages load without errors
  - [ ] All navigation works
  - [ ] All interactive components work
  - [ ] Dark mode works
  - [ ] Forms work correctly
  - [ ] Admin features work

---

**Status**: ⚠️ Blocked by Skeleton v4.2.2 @variant bug  
**Next Action**: Wait for Skeleton fix or choose alternative path  
**Last Updated**: October 31, 2025
