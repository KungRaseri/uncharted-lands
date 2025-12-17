# Monorepo Consolidation Plan

**Goal**: Complete the monorepo migration by consolidating duplicate files, workflows, and configurations.

---

## ✅ Already Completed

1. **Shared Package Migration** - Types consolidated in `shared/` package
2. **Modifier Types Fix** - Pre-existing bug fixed (13 tests → 12 tests failing)
3. **Git Structure** - Monorepo created, submodules configured
4. **Dependencies** - Both client/server reference shared package

---

## 📋 TODO: Consolidation Tasks

### 1. Types & Domain Models

#### Current State
- ✅ `shared/src/types/game-config.ts` - Game configuration types (DONE)
- ❌ Client still has types in `src/lib/types/`
- ❌ Server still has types in `src/types/`
- ❌ No shared utility types

#### Files to Consolidate

**Client Types** (`client/src/lib/types/`):
```
- actions.ts           → Keep (SvelteKit-specific)
- admin.ts             → Keep (UI-specific)
- api.ts               → Analyze (might share with server)
- disaster-modal.ts    → Keep (UI-specific)  
- disaster.ts          → MOVE to shared (domain type)
- game.ts              → MOVE to shared (domain type)
- settlement.ts        → MOVE to shared (domain type)
- socket.ts            → Analyze (Socket.IO events - might share)
- structure.ts         → MOVE to shared (domain type)
- tile.ts              → MOVE to shared (domain type)
```

**Server Types** (`server/src/types/`):
```
- api.ts               → Keep (Express-specific)
- database.ts          → Keep (Drizzle-specific)
- disaster.ts          → MOVE to shared (domain type)
- environment.d.ts     → Keep (Node-specific)
- game.ts              → MOVE to shared (domain type)
- settlement.ts        → MOVE to shared (domain type)
- socket-events.ts     → Analyze (Socket.IO events - might share)
- structure.ts         → MOVE to shared (domain type)
- tile.ts              → MOVE to shared (domain type)
```

**Recommendation**:
```
shared/
  src/
    types/
      game-config.ts    (✅ exists)
      disaster.ts       (NEW - merge client+server)
      game.ts           (NEW - merge client+server)
      settlement.ts     (NEW - merge client+server)
      structure.ts      (NEW - merge client+server)
      tile.ts           (NEW - merge client+server)
      socket-events.ts  (NEW - shared Socket.IO types)
```

---

### 2. GitHub Workflows

#### Current State
- `client/.github/workflows/` - Client CI, Playwright tests
- `server/.github/workflows/` - Server CI, Docker publish
- `.github/workflows/` - (empty or root-level workflows)

#### Files Found
**Client**:
- `CI.yml` - Build, lint, test client
- `playwright-docker.yml` - E2E tests

**Server**:
- `CI.yml` - Build, lint, test server
- `docker-publish.yml` - Publish server Docker image

#### Consolidation Strategy

**Option A: Monorepo Workflow** (Recommended)
```yaml
# .github/workflows/monorepo-ci.yml
name: Monorepo CI

on: [push, pull_request]

jobs:
  shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build shared package
        run: |
          cd shared
          npm install
          npm run build
          npm run check

  client:
    needs: [shared]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & test client
        run: |
          cd shared && npm install && npm run build
          cd ../client
          npm install
          npm run check
          npm run lint
          npm run test:unit

  server:
    needs: [shared]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & test server
        run: |
          cd shared && npm install && npm run build
          cd ../server
          npm install
          npm run check
          npm run lint
          npm test

  e2e:
    needs: [client, server]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E tests
        run: |
          # Build shared
          cd shared && npm install && npm run build
          # Run E2E
          cd ..
          docker-compose -f docker-compose.e2e.yml up --abort-on-container-exit
```

**Option B: Keep Separate** (Current approach)
- Keep `client/.github/workflows/` for client
- Keep `server/.github/workflows/` for server
- Add `shared/.github/workflows/` for shared package
- Add root-level `.github/workflows/e2e.yml` for integration

**Recommendation**: **Option A** - Single monorepo workflow
- Ensures shared package builds first
- Runs all tests in dependency order
- Simpler to maintain
- Shows full project status in one place

---

### 3. Copilot Instructions

#### Current State
- `.github/copilot-instructions.md` - Root-level (mentions both repos)
- `client/.github/copilot-instructions.md` - Client-specific (Svelte 5, SvelteKit)
- `server/.github/copilot-instructions.md` - Server-specific (Node.js, Socket.IO)

#### Consolidation Strategy

**Recommended Structure**:
```
.github/
  copilot-instructions.md       (Root - KEEP & UPDATE)
    ↓ References:
  copilot/
    client-specific.md          (Move client/.github/copilot-instructions.md here)
    server-specific.md          (Move server/.github/copilot-instructions.md here)
    shared-package.md           (NEW - Shared package guidelines)
```

**Root Instructions** (`.github/copilot-instructions.md`):
- Monorepo structure overview
- Shared package usage
- Cross-cutting concerns
- References to specific instructions

**Client Specific** (`.github/copilot/client-specific.md`):
- Svelte 5 runes
- SvelteKit patterns
- UI component guidelines
- Form actions

**Server Specific** (`.github/copilot/server-specific.md`):
- Express patterns
- Socket.IO events
- Database queries
- Game logic

**Shared Package** (`.github/copilot/shared-package.md`):
- How to add new types
- Build workflow
- Import patterns
- Type safety guidelines

---

### 4. Other Consolidation Opportunities

#### A. Package.json Scripts

**Root-level** (`package.json` - NEW):
```json
{
  "name": "uncharted-lands-monorepo",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "build:shared": "cd shared && npm run build",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    
    "test": "npm run test:shared && npm run test:client && npm run test:server",
    "test:shared": "cd shared && npm test",
    "test:client": "cd client && npm run test:unit",
    "test:server": "cd server && npm test",
    
    "lint": "npm run lint:client && npm run lint:server",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    
    "check": "npm run check:shared && npm run check:client && npm run check:server",
    "check:shared": "cd shared && npm run check",
    "check:client": "cd client && npm run check",
    "check:server": "cd server && npm run check",
    
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

#### B. ESLint / Prettier Configs

**Current**: Each project has own config  
**Proposed**: Root-level shared config with project-specific overrides

```
.eslintrc.json          (Root - base rules)
.prettierrc             (Root - formatting)
client/.eslintrc.json   (Extends root + Svelte rules)
server/.eslintrc.json   (Extends root + Node rules)
```

#### C. TypeScript Configs

**Current**: Each project has own tsconfig.json  
**Proposed**: Shared base config

```
tsconfig.base.json      (Root - shared options)
shared/tsconfig.json    (Extends base)
client/tsconfig.json    (Extends base + SvelteKit)
server/tsconfig.json    (Extends base + Node)
```

#### D. Docker Compose

**Current**: Multiple docker-compose files  
**Proposed**: Consolidate at root

```
docker-compose.yml          (Dev environment)
docker-compose.e2e.yml      (E2E tests) ✅ Already at root
docker-compose.prod.yml     (Production)
```

#### E. Environment Variables

**Current**: Separate .env files  
**Proposed**: Centralized with project-specific prefixes

```
.env.example                (Root - template)
  CLIENT_API_URL=...
  CLIENT_WS_URL=...
  SERVER_DATABASE_URL=...
  SERVER_PORT=...
  SHARED_ENVIRONMENT=...
```

#### F. Documentation

**Current**: Docs in multiple locations  
**Proposed**: Centralize in root or docs/

```
docs/
  README.md                 (Main documentation)
  DEVELOPMENT.md            (Setup & workflows)
  ARCHITECTURE.md           (System design)
  API.md                    (REST + Socket.IO)
  TESTING.md                (Test strategies)
  game-design/              (✅ Already centralized)
```

---

## Implementation Priority

### Phase 1: Critical (Do Now) ✅
1. ✅ Fix unit test errors (modifier types)
2. ✅ Verify shared package working
3. ✅ Create migration summary

### Phase 2: High Priority (This Session)
1. **GitHub Workflows** - Consolidate to single monorepo CI
2. **Copilot Instructions** - Update root, move specific to subdirs
3. **Root package.json** - Add workspace scripts

### Phase 3: Medium Priority (Next Session)
1. **Domain Types** - Move shared types to shared package
2. **Socket.IO Events** - Consolidate event types
3. **ESLint/Prettier** - Shared configs

### Phase 4: Low Priority (Future)
1. **Docker Compose** - Consolidate configurations
2. **Environment Variables** - Centralize .env
3. **Documentation** - Reorganize structure

---

## Decision Matrix

| Item | Keep Separate | Consolidate | Reason |
|------|--------------|-------------|--------|
| game-config types | | ✅ | Already done |
| Domain types (Settlement, Tile, etc.) | | ✅ | Shared between client/server |
| UI types (admin.ts, actions.ts) | ✅ | | Client-specific |
| API types (Express routes) | ✅ | | Server-specific |
| Socket.IO events | | ✅ | Shared protocol |
| GitHub workflows | | ✅ | Monorepo CI better |
| Copilot instructions (root) | | ✅ | Single entry point |
| Copilot instructions (specific) | ✅ | | Keep tech-specific |
| ESLint/Prettier | | ✅ | Consistency |
| Docker Compose | | ✅ | Simplify dev setup |
| Environment variables | | ✅ | Central management |

---

## Next Steps

**User decides**:
1. Which phase to implement now?
2. Any specific consolidation to prioritize?
3. Any items to skip or defer?

**Recommendation**: Start with Phase 2 (GitHub workflows + Copilot instructions + root package.json) since they're high-impact and low-risk.
