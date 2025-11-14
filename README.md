# Uncharted Lands | Browser-based Settlement Game

## 📚 Game Design Documentation

Complete game design documentation is available on the [GitHub Wiki](https://github.com/KungRaseri/uncharted-lands/wiki):

- **📖 [Design Docs Quick Start](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Quick-Start)** - Start here to understand the documentation system
- **📚 [Game Design Document (GDD)](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-HOME)** - Complete specifications for all game systems (1,200+ lines)
- **📊 [Implementation Tracker](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Implementation-Tracker)** - Current status of features (✅/🚧/📋)
- **🔧 [Feature Spec Template](https://github.com/KungRaseri/uncharted-lands/wiki/Feature-Spec-Template)** - Template for new feature implementations

**When implementing new features:**

1. Check the GDD for design specifications and game mechanics
2. Review the Implementation Tracker for current status and dependencies
3. Create a feature spec from the template in `docs/features/[feature-name].md`
4. Follow Svelte 5 + SvelteKit + Skeleton UI patterns
5. Update the tracker when complete

**Local Documentation**: The source files are also available in [`docs/game-design/`](docs/game-design/) for offline reference.

## Quality

[![Uncharted Lands - CI](https://github.com/RedSyndicate/browser-game/actions/workflows/CI.yml/badge.svg)](https://github.com/RedSyndicate/browser-game/actions/workflows/CI.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=RedSyndicate_browser-game&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=RedSyndicate_browser-game) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=RedSyndicate_browser-game&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=RedSyndicate_browser-game) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=RedSyndicate_browser-game&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=RedSyndicate_browser-game)

## Technology Stack

### Frontend

- Sveltekit
  - Typescript
  - Skeleton UI
  - Tailwind CSS
  - Vitest
  - Playwright

### Backend

- Node.js + TypeScript
- Socket.IO (real-time multiplayer)
- Drizzle ORM + PostgreSQL
- Event-driven game loop (60Hz)

### Documentation

- **Wiki**: See [`docs/`](docs/) folder for complete documentation
- **Architecture**: See [root instructions](.github/copilot-instructions.md) for system overview

## Database

```bash
# Generate Drizzle migrations from schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Open Drizzle Studio to view/edit data
npm run db:studio
```

**Note**: We migrated from Prisma to Drizzle ORM. See `server/src/db/` for the schema.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Documentation

For detailed documentation:

- **[GitHub Wiki](https://github.com/KungRaseri/uncharted-lands/wiki)** - Complete documentation hub
- **[Game Design Documentation](https://github.com/KungRaseri/uncharted-lands/wiki/Game-Design-Document)** - Game specifications
- **[Local Docs](docs/)** - Offline documentation in `docs/` folder
