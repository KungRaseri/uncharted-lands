# GitHub Copilot Instructions for Uncharted Lands

This file provides context and guidelines for GitHub Copilot when working on the Uncharted Lands project.

---

## Project Overview

**Uncharted Lands** is a SvelteKit game application where players build and manage settlements in a procedurally generated world. Players must overcome extreme weather, scarce resources, and hostile creatures while expanding settlements and improving technology.

**Tech Stack**:
- **Framework**: SvelteKit 2.48.4 + Svelte 5.43.2
- **Styling**: Tailwind CSS 4.1.16 + Skeleton 4.2.2
- **Database**: Prisma + PostgreSQL
- **Build**: Vite 6.0.3
- **Testing**: Vitest + Playwright

---

## Official Documentation References

### Skeleton Labs Documentation

Always consult these official Skeleton LLM documentation files when working with Skeleton components:

1. **General Overview**: https://www.skeleton.dev/llms.txt
   - Overview of all available LLM documentation
   - Links to framework-specific guides

2. **Svelte-Specific Guide**: https://www.skeleton.dev/llms-svelte.txt
   - **VERSION REQUIREMENTS**:
     - Svelte: 5+
     - SvelteKit: 2+
     - Skeleton: 3+ (we're on 4.2.2)
     - Tailwind: 4+
   - Complete setup instructions
   - Component usage patterns
   - Integration guides

3. **React Guide** (for reference): https://www.skeleton.dev/llms-react.txt
   - Cross-framework comparison
   - Understanding Zag.js patterns

### Skeleton Website Documentation

- **Main Docs**: https://www.skeleton.dev/docs
- **Get Started**: https://www.skeleton.dev/docs/get-started/svelte
- **Components**: https://www.skeleton.dev/docs/components
- **Integrations**: https://www.skeleton.dev/docs/integrations
- **Guides**: https://www.skeleton.dev/docs/guides
- **Migration v2→v3**: https://www.skeleton.dev/docs/get-started/migrate-from-v2
- **Migration v3→v4**: https://www.skeleton.dev/docs/get-started/migrate-from-v3

---

## Project-Specific Documentation

### Migration Documentation (Start Here!)

Our project is in active migration from Skeleton v2 to v4 with Tailwind v4. Read these files to understand current state:

1. **README_MIGRATION.md** - Start here for overview
   - Current migration status
   - Known issues (Skeleton v4.2.2 @variant bug)
   - Decision matrix for path forward
   - Quick commands

2. **SETUP_VERIFICATION.md** - Configuration verification
   - Verified against official Skeleton docs
   - Package versions and compliance
   - Configuration file validation
   - 8/9 score (blocked by upstream bug)

3. **TAILWIND_V4_COMPLIANCE.md** - Tailwind v4 requirements
   - 100% compliant with official requirements
   - CSS-first configuration explained
   - @apply replacement guide
   - Unsupported features list

4. **TAILWIND_V4_CONFIG.md** - Configuration guide
   - How Tailwind v4 works
   - All config files explained
   - Theme customization
   - Verification commands

5. **MIGRATION_STATUS.md** - Progress tracking
   - Completed steps checklist
   - Pending tasks with priorities
   - Known issues and workarounds
   - Next steps plan

6. **COMPONENT_MIGRATION_AUDIT.md** - Component migration plan
   - 10 files with Skeleton components
   - Component-by-component migration instructions
   - Code examples
   - Effort estimates (10-23 hours)

---

## Critical Project Status

### ⚠️ KNOWN ISSUE: Build Failure

**Status**: Application CANNOT currently build

**Error**:
```
Cannot use `@variant` with unknown variant: md
node_modules/@skeletonlabs/skeleton/dist/index.css:1854:2
```

**Cause**: Bug in Skeleton v4.2.2 library code (NOT our configuration)

**Impact**:
- ❌ `npm run build` fails
- ❌ `npm run dev` fails
- ✅ Configuration is 100% correct
- ✅ Type checking works
- ✅ Tests run (if no CSS needed)

**What This Means for You**:
- DO NOT suggest configuration changes to "fix" the build
- Our setup follows ALL official guidelines perfectly
- The bug is in Skeleton's compiled CSS, not our code
- When Skeleton releases a fix, builds will work without changes

### ✅ What IS Working

- ✅ All packages installed correctly
- ✅ All configuration files correct
- ✅ Tailwind v4 CSS-first approach implemented
- ✅ Vite plugin configured properly
- ✅ Theme system configured
- ✅ No @apply usage (per best practices)
- ✅ data-theme on `<html>` tag (per requirements)

---

## Code Style Guidelines

### Svelte 5 Patterns

**Use Svelte 5 Runes** (not old reactive statements):

```svelte
<!-- ✅ CORRECT (Svelte 5) -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  function increment() {
    count++;
  }
</script>

<!-- ❌ WRONG (Svelte 4) -->
<script>
  let count = 0;
  $: doubled = count * 2;
  
  function increment() {
    count++;
  }
</script>
```

**Use Snippets** (not slots):

```svelte
<!-- ✅ CORRECT (Svelte 5) -->
{#snippet header()}
  <h1>Title</h1>
{/snippet}

<!-- ❌ WRONG (Svelte 4) -->
<svelte:fragment slot="header">
  <h1>Title</h1>
</svelte:fragment>
```

**Event Handlers**:

```svelte
<!-- ✅ CORRECT (Svelte 5) -->
<button onclick={handleClick}>Click</button>

<!-- ❌ WRONG (Svelte 4) -->
<button on:click={handleClick}>Click</button>
```

### Skeleton Component Usage

**Current State**: We're still importing from OLD package paths (v2/v3):

```typescript
// ❌ CURRENT (needs migration)
import { AppShell, AppBar } from '@skeletonlabs/skeleton';

// ✅ TARGET (when build works)
import { Navbar } from '@skeletonlabs/skeleton-svelte';
```

**Component Name Changes**:
- `AppBar` → `Navbar`
- `AppRail` → `Navigation`
- `RangeSlider` → `Slider`
- `AppShell` → REMOVED (use custom layouts)
- `LightSwitch` → REMOVED (use custom component)
- `Table` → REMOVED (use Tailwind tables)

**When suggesting Skeleton components**:
1. Check if component exists in v4 (see COMPONENT_MIGRATION_AUDIT.md)
2. Use correct v4 name and import path
3. Reference official docs for API changes
4. Note if component is removed (provide alternative)

### Tailwind CSS v4 Patterns

**DO NOT use `@apply`** (discouraged in v4):

```css
/* ❌ AVOID */
.my-class {
  @apply bg-surface-50-950 text-surface-950 p-4;
}

/* ✅ PREFER - Standard CSS */
.my-class {
  background-color: var(--color-surface-50-950);
  color: var(--color-surface-950);
  padding: 1rem;
}

/* ✅ PREFER - CSS Custom Properties */
.my-class {
  background-color: var(--color-surface-50-950);
  color: var(--color-surface-950);
  padding: --spacing(4);
}

/* ✅ PREFER - @variant for dark mode */
.my-class {
  color: var(--color-surface-950);
  
  @variant dark {
    color: var(--color-surface-50);
  }
}
```

**Configuration in CSS** (not external files):

```css
/* ✅ CORRECT - Configuration in CSS */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.75 0.15 250);
}

@plugin "@tailwindcss/forms";
```

**NO External Config Files**:
- ❌ DO NOT create `tailwind.config.js`
- ❌ DO NOT create `tailwind.config.ts`
- ✅ All config in `src/app.postcss` using directives

---

## File Structure

```
uncharted-lands/
├── .github/
│   └── copilot-instructions.md          # This file
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── migrations/                      # Database migrations
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── admin/                   # Admin UI components
│   │   │   ├── app/                     # Global app components
│   │   │   └── game/                    # Game UI components
│   │   ├── auth.ts                      # Authentication utilities
│   │   ├── db.ts                        # Database client
│   │   └── stores/                      # Svelte stores
│   ├── routes/                          # SvelteKit routes
│   │   ├── (auth)/                      # Auth-related routes
│   │   ├── (protected)/                 # Protected routes
│   │   │   ├── admin/                   # Admin pages
│   │   │   ├── game/                    # Game pages
│   │   │   └── account/                 # User account
│   │   └── api/                         # API endpoints
│   ├── app.html                         # Root HTML template
│   ├── app.postcss                      # Global styles
│   └── hooks.server.ts                  # Server hooks
├── vite.config.js                       # Vite configuration
└── Documentation files (see above)      # Migration docs
```

---

## Common Tasks & Patterns

### Creating New Skeleton Components

When the build works and we can use Skeleton components:

```svelte
<script lang="ts">
  // ✅ Import from skeleton-svelte package
  import { ComponentName } from '@skeletonlabs/skeleton-svelte';
  
  // Use Svelte 5 runes for state
  let value = $state(initialValue);
  
  // Use proper event handlers
  function handleChange(e) {
    value = e.value; // Note: Skeleton v4 event structure
  }
</script>

<ComponentName 
  {value}
  onValueChange={handleChange}
  class="my-custom-classes"
/>
```

### Creating Custom Layouts (Replacing AppShell)

```svelte
<!-- ✅ Custom Layout Pattern -->
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

### Database Queries (Prisma)

```typescript
import { db } from '$lib/db';

// Query examples
const users = await db.user.findMany({
  where: { active: true },
  include: { settlements: true }
});

const settlement = await db.settlement.update({
  where: { id: settlementId },
  data: { resources: { increment: 10 } }
});
```

### API Routes (SvelteKit)

```typescript
// src/routes/api/[endpoint]/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Handle request
  const data = await fetchData();
  return json(data);
};
```

---

## Testing

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Component from './Component.svelte';

describe('Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(Component, { props: { title: 'Test' } });
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Do's and Don'ts

### ✅ DO

- Use Svelte 5 runes ($state, $derived, $effect)
- Use Svelte 5 snippets (not slots)
- Import Skeleton components from `@skeletonlabs/skeleton-svelte`
- Use standard CSS instead of @apply
- Reference official Skeleton LLM docs
- Check COMPONENT_MIGRATION_AUDIT.md for component status
- Use TypeScript for type safety
- Follow existing project patterns
- Consult migration documentation when unsure

### ❌ DON'T

- Don't use Svelte 4 reactive statements (`$:`)
- Don't use Svelte 4 slots syntax
- Don't import from `@skeletonlabs/skeleton` (old package)
- Don't use `@apply` in CSS
- Don't create `tailwind.config.js/ts` files
- Don't suggest configuration changes to "fix" the build
- Don't use removed components (AppShell, LightSwitch, Table)
- Don't assume the build failure is our configuration
- Don't use old Skeleton v2/v3 component names

---

## Component Migration Reference

See `COMPONENT_MIGRATION_AUDIT.md` for complete details. Quick reference:

### Components Needing Migration

| Old (v2/v3) | New (v4) | Status | Alternative |
|-------------|----------|--------|-------------|
| `AppShell` | — | ❌ Removed | Custom layouts |
| `AppBar` | `Navbar` | ✅ Renamed | |
| `AppRail` | `Navigation` | ✅ Renamed | |
| `AppRailTile` | (part of Navigation) | ✅ Merged | |
| `Avatar` | `Avatar` | ✅ Same | |
| `LightSwitch` | — | ❌ Removed | Custom component |
| `RangeSlider` | `Slider` | ✅ Renamed | |
| `Table` | — | ❌ Removed | Tailwind tables |

### Utilities Needing Replacement

| Utility | Status | Alternative |
|---------|--------|-------------|
| `popup` | ❌ Removed | Integration guide |
| `storePopup` | ❌ Removed | Integration guide |
| `tableMapperValues` | ❌ Removed | Custom implementation |

---

## Environment Variables

Check `.env` file for configuration. Never commit secrets!

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
# etc.
```

---

## Useful Commands

```powershell
# Development
npm run dev              # Start dev server (currently fails)
npm run build           # Build for production (currently fails)
npm run preview         # Preview production build

# Database
npm run migrate         # Run migrations
npx prisma studio       # Open Prisma Studio

# Testing
npm run test            # Run Playwright tests
npm run test:unit       # Run Vitest tests
npm run coverage        # Generate coverage report

# Code Quality
npm run check           # Type checking (works!)
npm run lint            # Lint code
npm run format          # Format with Prettier

# Git
git status              # Check status
git log --oneline -10   # Recent commits
```

---

## Migration Status Quick Reference

**✅ Configuration**: 100% correct per all official guidelines

**Current Versions**:
- Svelte: 5.43.2 ✅
- SvelteKit: 2.48.4 ✅
- Tailwind: 4.1.16 ✅
- Skeleton: 4.2.2 ✅
- @tailwindcss/vite: 4.1.16 ✅

**What's Working**:
- ✅ Type checking
- ✅ Configuration files
- ✅ Package installation
- ✅ Documentation

**What's Blocked**:
- ❌ Builds (Skeleton @variant bug)
- ❌ Dev server (same bug)
- 🔄 Component migration (waiting for build)

**Next Steps** (when build works):
1. Migrate 10 files with Skeleton components
2. Replace AppShell with custom layouts (3 files)
3. Update component imports and names
4. Replace removed components
5. Test all functionality

---

## Additional Resources

### Skeleton
- Discord: https://discord.gg/EXqV7W8MtY
- GitHub: https://github.com/skeletonlabs/skeleton
- Themes: https://themes.skeleton.dev/

### Tailwind
- Docs: https://tailwindcss.com/docs
- Discord: https://discord.gg/tailwindcss

### Svelte
- Docs: https://svelte.dev/docs
- Tutorial: https://learn.svelte.dev/
- Discord: https://discord.gg/svelte

### SvelteKit
- Docs: https://kit.svelte.dev/docs
- FAQ: https://kit.svelte.dev/faq

---

## Questions or Unsure?

1. **Check migration docs first** (README_MIGRATION.md)
2. **Consult official Skeleton LLM docs**: https://www.skeleton.dev/llms-svelte.txt
3. **Review component audit**: COMPONENT_MIGRATION_AUDIT.md
4. **Check compliance guide**: TAILWIND_V4_COMPLIANCE.md
5. **Ask the team** - Don't make assumptions!

---

**Last Updated**: October 31, 2025  
**Status**: Active migration in progress  
**Configuration**: 100% compliant with all official guidelines  
**Build**: Blocked by upstream Skeleton v4.2.2 bug (not our fault!)
