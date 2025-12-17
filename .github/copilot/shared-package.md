# Copilot Instructions: Shared Package

**Package**: `@uncharted-lands/shared`  
**Location**: `shared/`  
**Purpose**: Single source of truth for types, constants, and utilities shared between client and
server

---

## 📦 Package Structure

```
shared/
  src/
    index.ts              # Main export file
    types/
      game-config.ts      # Game configuration types
      disaster.ts         # Disaster domain types (TODO)
      game.ts             # Core game types (TODO)
      settlement.ts       # Settlement types (TODO)
      structure.ts        # Structure types (TODO)
      tile.ts             # Tile types (TODO)
      socket-events.ts    # Socket.IO event types (TODO)
  dist/                   # Compiled output (auto-generated)
  package.json
  tsconfig.json
```

---

## ✅ What Belongs in Shared Package

### **Include** (Domain Types & Shared Logic):

- ✅ Game configuration types (`GameConfig`, resource types, etc.)
- ✅ Domain model types (Settlement, Tile, Structure, Disaster)
- ✅ Socket.IO event definitions (shared protocol)
- ✅ Shared constants (MAX_LEVEL, BIOME_TYPES, etc.)
- ✅ Shared utility functions (validation, calculations)
- ✅ Shared enums and type guards

### **Exclude** (Platform-Specific):

- ❌ Client UI types (Svelte components, form actions)
- ❌ Server API types (Express routes, middleware)
- ❌ Database types (Drizzle ORM schemas)
- ❌ Environment-specific configs

---

## 🔧 How to Add New Types

### Step 1: Create the Type File

```typescript
// shared/src/types/my-new-type.ts
export interface MyNewType {
  id: string;
  name: string;
  // ... other fields
}

export type MyNewTypeStatus = 'active' | 'inactive';

export const MY_NEW_TYPE_STATUSES: MyNewTypeStatus[] = ['active', 'inactive'];
```

### Step 2: Export from Index

```typescript
// shared/src/index.ts
export * from './types/game-config.js';
export * from './types/my-new-type.js'; // Add this line
```

### Step 3: Build the Package

```bash
cd shared
npm run build
```

Or use watch mode during development:

```bash
cd shared
npm run build -- --watch
```

### Step 4: Use in Client/Server

```typescript
// Client or Server
import type { MyNewType, MyNewTypeStatus } from '@uncharted-lands/shared';

const example: MyNewType = {
  id: '123',
  name: 'Test',
};
```

---

## 🏗️ Build Workflow

### Development Workflow

```bash
# Terminal 1: Watch mode (rebuilds on changes)
cd shared
npm run build -- --watch

# Terminal 2: Client dev server
cd client
npm run dev

# Terminal 3: Server dev server
cd server
npm run dev
```

### Production Build

```bash
# Build everything from root
npm run build

# Or build shared only
npm run build:shared
```

### Type Checking

```bash
# Check shared package types
cd shared
npm run check

# Or from root
npm run check:shared
```

---

## 📝 TypeScript Configuration

**Key Settings** (`shared/tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true, // Generate .d.ts files
    "declarationMap": true, // Generate .d.ts.map files
    "outDir": "./dist", // Output directory
    "rootDir": "./src", // Source directory
    "strict": true, // Strict type checking
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## ⚠️ Important Rules

### 1. **Never Import Runtime Dependencies**

- Shared package should contain ONLY types and pure TypeScript utilities
- No framework-specific code (React, Svelte, Express, etc.)
- No database dependencies (Drizzle, Prisma, etc.)

### 2. **Use Type-Only Imports in Shared Package**

```typescript
// ❌ BAD
import { someFunction } from 'some-library';

// ✅ GOOD
import type { SomeType } from 'some-library';
```

### 3. **Always Build After Changes**

- Client and server import from `dist/`, not `src/`
- Run `npm run build` or use watch mode
- CI/CD builds shared package first (see `.github/workflows/monorepo-ci.yml`)

### 4. **Avoid Circular Dependencies**

- Don't create circular type references
- Keep types simple and focused
- Use forward declarations if needed

### 5. **Document Breaking Changes**

- Shared package changes affect BOTH client and server
- Test both projects after modifying shared types
- Update version in package.json for major changes

---

## 🧪 Testing

Currently, shared package has no tests (types only). If adding utility functions:

```bash
# Add vitest
cd shared
npm install -D vitest

# Add test script to package.json
"scripts": {
  "test": "vitest"
}

# Create tests
mkdir src/__tests__
# Add *.test.ts files
```

---

## 🔄 Migration Checklist

When moving types from client/server to shared:

- [ ] Copy type definitions to `shared/src/types/`
- [ ] Export from `shared/src/index.ts`
- [ ] Build shared package (`npm run build`)
- [ ] Update imports in client (change path to `@uncharted-lands/shared`)
- [ ] Update imports in server (change path to `@uncharted-lands/shared`)
- [ ] Delete old type files from client/server
- [ ] Run type checks (`npm run check`)
- [ ] Test both client and server
- [ ] Commit changes

---

## 📚 Examples

### Example 1: Socket.IO Event Types

```typescript
// shared/src/types/socket-events.ts
export interface ResourceTickEvent {
  settlementId: string;
  resources: Record<string, number>;
  timestamp: number;
}

export interface StructureBuiltEvent {
  settlementId: string;
  structureId: string;
  structureType: string;
  playerId: string;
}

// Union type for all events
export type GameEvent = ResourceTickEvent | StructureBuiltEvent;
```

```typescript
// shared/src/index.ts
export * from './types/socket-events.js';
```

```typescript
// Server: Use the type
import type { ResourceTickEvent } from '@uncharted-lands/shared';

io.to(`world:${worldId}`).emit('resource-tick', {
  settlementId,
  resources,
  timestamp: Date.now(),
} satisfies ResourceTickEvent);
```

```typescript
// Client: Use the type
import type { ResourceTickEvent } from '@uncharted-lands/shared';

socket.on('resource-tick', (data: ResourceTickEvent) => {
  // Type-safe handling
  settlementStore.updateResources(data.settlementId, data.resources);
});
```

### Example 2: Shared Constants

```typescript
// shared/src/constants/game-limits.ts
export const GAME_LIMITS = {
  MAX_STRUCTURE_LEVEL: 5,
  MAX_SETTLEMENT_NAME_LENGTH: 50,
  MIN_SETTLEMENT_NAME_LENGTH: 3,
  MAX_POPULATION: 1000,
  MIN_RESOURCE_AMOUNT: 0,
  MAX_RESOURCE_AMOUNT: 999999,
} as const;

export type GameLimitKey = keyof typeof GAME_LIMITS;
```

```typescript
// Client: Use in form validation
import { GAME_LIMITS } from '@uncharted-lands/shared';

const nameSchema = z
  .string()
  .min(GAME_LIMITS.MIN_SETTLEMENT_NAME_LENGTH)
  .max(GAME_LIMITS.MAX_SETTLEMENT_NAME_LENGTH);
```

```typescript
// Server: Use in API validation
import { GAME_LIMITS } from '@uncharted-lands/shared';

if (level > GAME_LIMITS.MAX_STRUCTURE_LEVEL) {
  throw new Error('Maximum level exceeded');
}
```

---

## 🆘 Troubleshooting

### "Cannot find module '@uncharted-lands/shared'"

1. Make sure shared package is built:

   ```bash
   cd shared && npm run build
   ```

2. Make sure client/server dependencies are installed:

   ```bash
   cd client && npm install
   cd server && npm install
   ```

3. Check that `dist/` folder exists in `shared/`

### Type errors after updating shared package

1. Rebuild shared package:

   ```bash
   cd shared && npm run build
   ```

2. Restart TypeScript server in your editor

3. Clear any build caches:
   ```bash
   npm run clean
   npm run install:all
   ```

### CI/CD failures

- Check that `.github/workflows/monorepo-ci.yml` builds shared package first
- Verify all cache paths include `shared/package-lock.json`
- Ensure artifact upload/download steps copy `shared/dist/`

---

## 📖 Further Reading

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [npm Workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
