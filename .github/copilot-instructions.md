# GitHub Copilot Instructions for Uncharted Lands

**⚠️ IMPORTANT: This is a MONOREPO with THREE packages:**

- `shared/` - Shared types and utilities package (`@uncharted-lands/shared`)
- `client/` - SvelteKit frontend
- `server/` - Node.js backend

**📚 Read package-specific instructions:**

- **Shared Package**: `.github/copilot/shared-package.md` (How to add types, build workflow)
- **Client**: `.github/copilot/client-specific.md` (SvelteKit + Svelte 5 + Skeleton UI)
- **Server**: `.github/copilot/server-specific.md` (Node.js + Socket.IO + Drizzle ORM)

**Game Design Documentation** (Centralized in Client Docs Wiki):

- 📚 **Main GDD**: `client/docs/game-design/GDD-Monolith.md` - Complete game specifications
- 🏠 **GDD Home**: `client/docs/game-design/GDD-HOME.md` - Design docs overview
- 📊 **Implementation Status**: `client/docs/game-design/GDD-Implementation-Tracker.md` - What's
  implemented vs. planned
- 📖 **Quick Start**: `client/docs/game-design/GDD-Quick-Start.md` - How to use the design docs
- 📑 **Table of Contents**: `client/docs/game-design/GDD-Table-of-Contents.md` - Complete design
  document index
- 🔧 **Feature Template**: `client/docs/templates/Feature-Spec-Template.md` - Template for new
  features

**Note**: While in the same workspace folder, these are **independent repositories** with separate
git histories, deployment pipelines, and dependencies. Changes in one repo do not automatically
affect the other.

---

## � CRITICAL DEVELOPMENT PRINCIPLES

### **NEVER Leave Partial Implementations**

When implementing features:

1. ❌ **DON'T** remove code and leave TODO comments
2. ❌ **DON'T** create placeholder implementations that will "be done later"
3. ❌ **DON'T** make partial changes that break functionality
4. ✅ **DO** implement features fully, from database to UI
5. ✅ **DO** ask for clarification if requirements are unclear
6. ✅ **DO** consult the GDD for complete feature specifications

**Example of WRONG approach:**

```typescript
// ❌ BAD: Removing code with comment
// TODO: In future, implement structure requirements validation
const structure = await createStructure(data);
```

**Example of CORRECT approach:**

```typescript
// ✅ GOOD: Full implementation
const requirements = await validateStructureRequirements(structureType);
if (!hasResources(settlement, requirements)) {
  throw new Error('Insufficient resources');
}
const structure = await createStructure(data, requirements);
```

### **Code Accuracy & File Corruption Prevention**

When fixing linting, type checking, or compilation errors:

**❌ NEVER do this:**

- Blindly use `replace_string_in_file` without verifying context
- Make changes without first understanding the error
- Replace code based on assumptions about file structure
- Use insufficient context (less than 3-5 lines before/after)

**✅ ALWAYS do this:**

1. **Verify the Error First**

   ```powershell
   # Check actual errors before fixing
   npm run check    # TypeScript errors
   npm run lint     # Linting errors
   # OR use get_errors tool
   ```

2. **Research the Context**
   - Use `read_file` with 20-50 lines of context around the error
   - Use `grep_search` to understand related code/types/schemas
   - Check recent refactors in schema.ts or type definitions
   - Verify what changed (e.g., Plot table removed → Settlement.tileId added)

3. **Explain Before Fixing**
   - Show the OLD code that's causing the error
   - Show the NEW code that will fix it
   - Explain WHY this fix is correct (reference schema changes, type definitions)
   - Get user confirmation for critical changes

4. **Choose the Right Fix Method**

   **For Simple, Low-Risk Changes:**
   - Use `replace_string_in_file` with 5-10 lines of unique context
   - Verify the context is unique enough (won't match elsewhere)
   - Be aware: tabs vs spaces can cause matching failures

   **For Complex or Critical Changes:**
   - Create a `.patch` file with detailed explanation
   - Include old code, new code, and rationale
   - Let user apply manually in their editor
   - Example:

     ````markdown
     ## Fix: Update settlements count logic

     **Old Code (Lines 541-543):**

     ```typescript
     tiles.flatMap((t) => (t.Plots || []) as any).filter((p) => p.Settlement).length;
     ```
     ````

     **New Code:**

     ```typescript
     tiles.filter((t) => t.settlementId != null).length;
     ```

     **Rationale:** Plot table removed in refactor. Settlements now tracked via Tile.settlementId.

     ```

     ```

5. **Verify After Changes**
   - Run `get_errors` on the file to confirm fix worked
   - Check that no new errors were introduced
   - Verify the file wasn't corrupted (imports intact, syntax valid)

6. **Recovery from Corruption**
   ```powershell
   # If file gets corrupted, restore from Git
   git checkout HEAD -- path/to/file.ts
   # Then try again with better context or patch file
   ```

**Why This Matters:**

- `replace_string_in_file` can match ambiguous text in wrong locations
- Tabs vs spaces mismatches cause silent failures
- Insufficient context leads to replacing wrong code blocks
- Manual review via patch files catches mistakes before they corrupt files

**Example Workflow (Successful Fix):**

```
1. get_errors → Found "Property 'Plots' does not exist on type 'TileWithRelations'"
2. read_file → Read 50 lines around error to understand context
3. grep_search → Found TileWithRelations definition, confirmed settlementId exists
4. Explained fix → Showed old flatMap/Plots code vs new settlementId filter
5. Created patch file → Documented old code, new code, rationale
6. User applied manually → Avoided file corruption risk
7. get_errors → Verified "No errors found"
```

### **Full-Stack Implementation Required**

Every feature must be implemented across the entire stack:

1. **Database Schema** - Tables, relations, indexes in `server/src/db/schema.ts`
2. **Backend Logic** - Business rules, validation in `server/src/api/routes/*.ts` or
   `server/src/game/*.ts`
3. **API Endpoints** - REST routes with proper error handling
4. **Socket.IO Events** - Real-time updates if needed (defined in
   `server/src/types/socket-events.ts`)
5. **Frontend State** - Svelte stores in `client/src/lib/stores/game/*.svelte.ts`
6. **UI Components** - Svelte 5 components in `client/src/lib/components/game/*.svelte`
7. **Testing** - Unit tests for logic, integration tests for API, E2E tests for flows

**When you identify missing functionality:**

- Check the GDD for the complete specification
- Implement the full feature, not just part of it
- If the GDD doesn't specify the feature, ask the user before proceeding
- Update the Implementation Tracker when complete

### **Feature Implementation Checklist**

Before considering a feature "done":

- [ ] Database schema matches GDD specifications
- [ ] Backend validation and business logic complete
- [ ] API endpoints functional with error handling
- [ ] Real-time updates implemented (if applicable)
- [ ] Frontend state management working
- [ ] UI components styled and responsive
- [ ] Tests written and passing
- [ ] Documentation updated (GDD Tracker, feature spec)
- [ ] No TODO comments left in production code
- [ ] Code formatted (Prettier) and linted (ESLint)

---

## �📚 Game Design & Feature Documentation

**Uncharted Lands** has comprehensive game design documentation centralized in the client docs wiki:

- **🏠 [GDD Home](../client/docs/game-design/GDD-HOME.md)** - Design docs overview and quick
  navigation
- **📖 [Design Docs Quick Start](../client/docs/game-design/GDD-Quick-Start.md)** - Start here!
  Explains how to use all design docs
- **📚 [Game Design Document (GDD)](../client/docs/game-design/GDD-Monolith.md)** - Complete
  specifications for all game systems
- **📊 [Implementation Tracker](../client/docs/game-design/GDD-Implementation-Tracker.md)** -
  Current status of all features (✅/🚧/📋)
- **📑 [Table of Contents](../client/docs/game-design/GDD-Table-of-Contents.md)** - Complete design
  document index
- **🔧 [Feature Spec Template](../client/docs/templates/Feature-Spec-Template.md)** - Template for
  implementing new features

### When Implementing New Features:

1. **Check GDD Monolith** for design specifications and game mechanics
2. **Review Implementation Tracker** for current status and missing pieces
3. **Create feature spec** from template in `client/docs/features/[feature-name].md`
4. **Follow repo-specific instructions** (client or server) for implementation details
5. **Update tracker** when complete (mark as ✅)

**Important:** The GDD is the single source of truth for:

- Game mechanics and formulas
- Resource types and balance values
- Structure costs and prerequisites
- Disaster types and effects
- Population mechanics
- Technical architecture decisions
- UI/UX specifications

Always reference the GDD before implementing ANY game feature to ensure consistency with the design
vision.

---

## 🏗️ Architecture Overview

**Uncharted Lands** is a browser-based multiplayer settlement-building game with real-time features.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SvelteKit Client (Vercel)                          │   │
│  │  - SSR + Client-side routing                        │   │
│  │  - Admin UI (REST API calls)                        │   │
│  │  - Game UI (Socket.IO + REST)                       │   │
│  └──────────────┬──────────────────┬───────────────────┘   │
└─────────────────│──────────────────│─────────────────────────┘
                  │                  │
                  │ HTTP/REST        │ WebSocket (Socket.IO)
                  │                  │
         ┌────────▼──────────────────▼─────────┐
         │   Node.js Server (Railway/Render)   │
         │  ┌────────────────────────────────┐ │
         │  │  Express REST API              │ │
         │  │  (Admin, CRUD operations)      │ │
         │  └────────────────────────────────┘ │
         │  ┌────────────────────────────────┐ │
         │  │  Socket.IO Server              │ │
         │  │  (Real-time game events)       │ │
         │  └────────────────────────────────┘ │
         │  ┌────────────────────────────────┐ │
         │  │  Drizzle ORM + PostgreSQL      │ │
         │  │  (Shared database)             │ │
         │  └────────────────────────────────┘ │
         └────────────────────────────────────┘
```

### Communication Patterns

**Admin Operations** (client → server REST API):

- User management (`GET/PUT/DELETE /api/players/:id`)
- World/server management (`/api/worlds`, `/api/servers`)
- Uses SvelteKit form actions + server-side fetch
- Session cookie authentication

**Game Operations** (client ↔ server Socket.IO):

- Real-time resource updates (`resource-tick`)
- Player actions (`collect-resources`, `build-structure`)
- World state synchronization (`game-state`, `state-update`)
- Room-based broadcasting (players in same world)

### Data Flow Example: Building a Structure

1. **Client UI**: User clicks "Build Farm" button
2. **SvelteKit Action**: Form submission triggers `buildStructure` action in `+page.server.ts`
3. **REST API Call**: Server-side fetch to `POST /api/structures/create` with session cookie
4. **Server Validation**: Express endpoint validates resources, updates database (Drizzle)
5. **Database Update**: New `SettlementStructure` record created with transaction
6. **Socket.IO Broadcast**: Server emits `structure-built` to all players in the world
7. **Client Update**: Socket listener updates local state, re-renders UI

---

## 🔑 Critical Patterns

### Authentication Flow

**Registration/Login** (HTTP only):

```
POST /api/auth/register → Account created → Session cookie set → Redirect to /game
```

**Authenticated Requests** (both HTTP + WebSocket):

- **HTTP**: Session cookie passed in headers
- **WebSocket**: Session token sent in `authenticate` event
- **Middleware**: `hooks.server.ts` validates session, attaches `locals.account`

### Data Loading Pattern

All protected routes follow this pattern:

```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.account) throw redirect(302, '/login');

  const sessionToken = cookies.get('session');

  // Fetch from REST API (server-side only)
  const response = await fetch(`${API_URL}/endpoint`, {
    headers: { Cookie: `session=${sessionToken}` },
  });

  return { data: await response.json() };
};
```

**Why?** SvelteKit client cannot access `httpOnly` session cookies, so all API calls must happen
server-side in load functions or form actions.

### Real-Time Updates Pattern

```typescript
// Client: src/lib/stores/game/socket.ts
socket.on('resource-tick', (data) => {
  // Update settlement resources in real-time
  settlementStore.updateResources(data.settlementId, data.resources);
});

// Server: src/events/handlers.ts
io.to(`world:${worldId}`).emit('resource-tick', {
  settlementId,
  resources,
  timestamp: Date.now(),
});
```

**Rooms**: Players join `world:${worldId}` rooms. Events are broadcast only to players in the same
world.

---

## 🚀 Developer Workflows

### Starting Development

```powershell
# Terminal 1: Start server (WebSocket + REST API)
cd server
npm run dev  # Runs on :3001

# Terminal 2: Start client (SvelteKit dev server)
cd client
npm run dev  # Runs on :5173
```

### Database Migrations

```powershell
cd server

# After schema changes in src/db/schema.ts
npm run db:generate  # Create migration SQL
npm run db:push      # Apply to database
npm run db:studio    # View data in browser
```

**Pattern**: Schema is in `server/src/db/schema.ts`. All database operations use Drizzle ORM (never
raw SQL).

### Testing Sockets

```powershell
# Health check
Invoke-WebRequest -Uri http://localhost:3001/health

# Connect with browser console
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.on('connected', console.log);
```

---

## ⚠️ Common Pitfalls

### 1. Session Cookie Access

❌ **DON'T** try to read session cookie in `+page.svelte` (browser)

```svelte
<!-- This fails - httpOnly cookie not accessible -->
<script>
  const session = document.cookie; // Empty!
</script>
```

✅ **DO** use `+page.server.ts` load function

```typescript
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session'); // Works!
};
```

### 2. API URL Configuration

❌ **DON'T** hardcode localhost

```typescript
fetch('http://localhost:3001/api/players'); // Breaks in production
```

✅ **DO** use config

```typescript
import { API_URL } from '$lib/config'; // Uses PUBLIC_CLIENT_API_URL env var
fetch(`${API_URL}/players`);
```

### 3. Svelte 5 Runes

❌ **DON'T** use Svelte 4 syntax

```svelte
<script>
  let count = 0;
  $: doubled = count * 2;  // Old reactive statement
</script>
```

✅ **DO** use Svelte 5 runes

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### 4. Socket.IO Event Types

❌ **DON'T** emit untyped events

```typescript
socket.emit('build', { id: '123' }); // No type safety
```

✅ **DO** use defined event types

```typescript
// Types defined in server/src/types/socket-events.ts
socket.emit(
  'build-structure',
  {
    settlementId: '123',
    structureType: 'FARM',
  },
  (response) => {
    if (response.success) {
      /* ... */
    }
  }
);
```

---

## 📚 Key Files Reference

### Architecture Decision Records

- `server/src/db/README.md` - Why Drizzle ORM, migration workflow
- `server/README.md` - Socket.IO architecture, event patterns
- `client/src/lib/components/admin/README.md` - Admin UI component patterns

### Game Design Documents

- `client/docs/game-design/GDD-Monolith.md` - Complete game specifications (READ THIS FIRST for any
  game feature)
- `client/docs/game-design/GDD-Implementation-Tracker.md` - Current implementation status
- `client/docs/game-design/GDD-Quick-Start.md` - How to use the design docs
- `client/docs/templates/Feature-Spec-Template.md` - Template for new features

### Critical Configuration

- `client/src/lib/config.ts` - API_URL, WS_URL environment setup
- `server/src/types/socket-events.ts` - ALL Socket.IO events must be defined here
- `client/src/hooks.server.ts` - Authentication middleware for ALL routes
- `server/src/middleware/socket-middleware.ts` - WebSocket auth/logging

### Schema & Queries

- `server/src/db/schema.ts` - Single source of truth for database structure
- `server/src/db/queries.ts` - Pre-built query helpers (use these, don't write raw queries)

---

## 🎯 When to Use What

**Use GDD (Game Design Document)** for:

- Understanding game mechanics and formulas BEFORE implementing
- Finding resource types, structure lists, disaster types
- Checking balance values (production rates, costs, population limits)
- Verifying technical architecture patterns
- Planning new features or modifications
- Ensuring consistency with design vision

**Use REST API** for:

- Admin CRUD operations (players, servers, worlds)
- Initial page loads (SSR data fetching)
- Form submissions with validation
- File uploads / downloads

**Use Socket.IO** for:

- Real-time resource production
- Player movement / actions
- Game state synchronization
- Multiplayer interactions
- Live notifications

**Use SvelteKit Actions** for:

- Form handling with server-side validation
- Operations that need redirect after success
- CSRF protection (automatic)

---

**For detailed client-specific instructions** → `client/.github/copilot-instructions.md`  
**For detailed server-specific instructions** → `server/.github/copilot-instructions.md`
