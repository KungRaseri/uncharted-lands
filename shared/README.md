# @uncharted-lands/shared

Shared types, constants, and utilities for Uncharted Lands game.

## Purpose

This package contains type definitions and constants that need to be consistent between the client and server packages. This ensures a **single source of truth** for shared game configuration.

## Usage

### In Server

```typescript
import { RESOURCE_TYPES, type ResourceType, type GameConfig } from '@uncharted-lands/shared';
```

### In Client

```typescript
import { EXTRACTOR_TYPES, type ExtractorType, BIOME_DISPLAY_CONFIG } from '@uncharted-lands/shared';
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

This will rebuild automatically when you make changes.

### Clean

```bash
npm run clean
```

## Structure

```
shared/
├── src/
│   ├── index.ts              # Main export file
│   └── types/
│       └── game-config.ts    # Game configuration types
├── dist/                     # Compiled output (gitignored)
├── package.json
└── tsconfig.json
```

## Adding New Shared Types

1. Create a new file in `src/types/` (e.g., `disasters.ts`)
2. Define your types/constants
3. Export from `src/index.ts`:
   ```typescript
   export * from './types/disasters.js';
   ```
4. Run `npm run build` to compile
5. Both client and server can now import

## Notes

- This package is **not published to npm** - it's used locally via `file:../shared`
- Changes require rebuild (`npm run build`) to take effect
- Use watch mode during active development
- Both client and server depend on this package
