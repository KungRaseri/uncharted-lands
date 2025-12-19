# Uncharted Lands

> A browser-based multiplayer settlement-building game with real-time resource management, disasters, and strategic gameplay.

[![CI Status](https://github.com/KungRaseri/uncharted-lands/actions/workflows/monorepo-ci.yml/badge.svg)](https://github.com/KungRaseri/uncharted-lands/actions/workflows/monorepo-ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=KungRaseri_uncharted-lands&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=KungRaseri_uncharted-lands)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎮 About The Game

**Uncharted Lands** is a multiplayer browser game where players build and manage settlements in a procedurally generated world. Features include:

- **Real-time Resource Management** - Food, wood, stone, metal production with 60Hz game loop
- **Settlement Building** - Construct farms, mines, housing, defenses, and special structures
- **Dynamic Disasters** - Earthquakes, droughts, plagues, and raids that test your resilience
- **Multiplayer World** - Compete and cooperate with other players in shared persistent worlds
- **Population System** - Manage happiness, immigration, emigration, and settlement growth
- **Strategic Gameplay** - Balance resources, population, and defenses to thrive

For complete game design documentation, see the **[GitHub Wiki](https://github.com/KungRaseri/uncharted-lands/wiki)**.

---

## 🏗️ Architecture

This is a **monorepo** containing three packages:

```
uncharted-lands/
├── client/              # SvelteKit frontend (Vercel)
│   ├── Svelte 5 + Runes
│   ├── Skeleton UI + Tailwind CSS
│   ├── Socket.IO client
│   └── Playwright E2E tests
│
├── server/              # Node.js backend (Railway/Render)
│   ├── Socket.IO server (real-time events)
│   ├── Express REST API (admin operations)
│   ├── Drizzle ORM + PostgreSQL
│   └── Event-driven game loop (60Hz)
│
├── shared/              # Shared TypeScript types
│   └── Type definitions for both client & server
│
└── scripts/             # Utility scripts
    ├── client/          # SvelteKit, UI, accessibility fixes
    ├── server/          # Database migrations, type fixes
    └── e2e/             # Docker-based E2E testing
```

### Technology Stack

#### Frontend
- **Framework**: [SvelteKit](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- **UI Library**: [Skeleton UI](https://skeleton.dev/) (built on Tailwind CSS)
- **Real-time**: [Socket.IO Client](https://socket.io/)
- **Testing**: [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E)
- **Deployment**: [Vercel](https://vercel.com/)

#### Backend
- **Runtime**: [Node.js 22](https://nodejs.org/) with TypeScript
- **WebSocket**: [Socket.IO](https://socket.io/) (real-time multiplayer)
- **API**: [Express](https://expressjs.com/) (REST endpoints)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Deployment**: [Railway](https://railway.app/) or [Render](https://render.com/)

#### Shared
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm workspaces

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.x or higher
- **PostgreSQL** 17.x or higher
- **npm** 10.x or higher

### 1. Clone the Repository

```bash
git clone https://github.com/KungRaseri/uncharted-lands.git
cd uncharted-lands
```

### 2. Install Dependencies

```bash
# Install all packages (client, server, shared)
npm install
```

### 3. Configure Environment

```bash
# Client environment
cd client
cp .env.example .env
# Edit .env with your settings (see ENVIRONMENT.md)

# Server environment
cd ../server
cp .env.example .env
# Edit .env with your PostgreSQL connection
```

**Key variables** (see [`ENVIRONMENT.md`](ENVIRONMENT.md) for full guide):

```bash
# Client (.env)
SERVER_API_URL=http://localhost:3001/api
PUBLIC_CLIENT_API_URL=http://localhost:3001/api
PUBLIC_WS_URL=http://localhost:3001

# Server (.env)
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/uncharted-lands"
CORS_ORIGINS=http://localhost:5173
```

### 4. Set Up Database

```bash
cd server

# Push schema to database (creates tables)
npm run db:push

# Optional: Seed with initial data
npm run db:seed

# Optional: Open Drizzle Studio to view data
npm run db:studio
```

### 5. Start Development Servers

```bash
# From root directory - starts both client and server
npm run dev

# Or individually:
# Terminal 1 - Server (http://localhost:3001)
cd server && npm run dev

# Terminal 2 - Client (http://localhost:5173)
cd client && npm run dev
```

### 6. Open in Browser

Visit **http://localhost:5173** to see the game!

---

## 📚 Documentation

### Game Design
- **[Game Design Document (GDD)](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Monolith)** - Complete specifications (1,200+ lines)
- **[Implementation Tracker](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Implementation-Tracker)** - Feature status (✅/🚧/📋)
- **[Quick Start Guide](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Quick-Start)** - How to use design docs

### Technical Documentation
- **[Environment Setup](ENVIRONMENT.md)** - Full environment configuration guide
- **[Client README](client/README.md)** - SvelteKit, UI, testing, deployment
- **[Server README](server/README.md)** - Socket.IO, database, game loop, API
- **[Shared Package](shared/README.md)** - Type definitions, build workflow
- **[Scripts Documentation](scripts/README.md)** - Utility scripts reference

### Architecture
- **[Copilot Instructions](.github/copilot-instructions.md)** - System architecture overview
- **[Client-Specific](.github/copilot/client-specific.md)** - SvelteKit patterns
- **[Server-Specific](.github/copilot/server-specific.md)** - Socket.IO patterns

---

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Client tests only
cd client && npm test

# Server tests only
cd server && npm test

# With coverage
npm run test:coverage
```

### End-to-End Tests

```bash
# Using Docker (recommended - isolated environment)
npm run test:e2e:docker

# Or manually
cd client
npm run test:e2e
```

### Type Checking

```bash
# Check all packages
npm run check

# Individual packages
npm run check:client
npm run check:server
npm run check:shared
```

### Linting & Formatting

```bash
# Lint all packages
npm run lint

# Format all packages
npm run format

# Check formatting without changes
npm run format:check
```

---

## 📦 Building for Production

### Client (SvelteKit)

```bash
cd client
npm run build
npm run preview  # Preview production build locally
```

**Deployment**: Automatically deployed to Vercel on push to `main` branch.

### Server (Node.js)

```bash
cd server
npm run build
npm start  # Runs compiled dist/index.js
```

**Deployment**: Automatically deployed to Railway/Render on push to `main` branch.

### Database Migrations

```bash
cd server

# Generate migration from schema changes
npm run db:generate

# Apply migrations in production
npm run db:migrate:run
```

---

## 🛠️ Development Workflows

### Adding a New Feature

1. **Check the GDD** - Review feature specifications in the [Game Design Document](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Monolith)
2. **Create Feature Branch** - `git checkout -b feature/my-feature`
3. **Implement Full Stack**:
   - **Database**: Update `server/src/db/schema.ts`
   - **Backend**: Add API routes, Socket.IO events, game logic
   - **Frontend**: Create Svelte components, state management
   - **Types**: Update `shared/src/` with new type definitions
4. **Test**: Write unit tests + E2E tests
5. **Document**: Update Implementation Tracker, add feature spec
6. **Submit PR**: Request review, ensure CI passes

### Database Schema Changes

```bash
cd server

# 1. Edit schema
vim src/db/schema.ts

# 2. Generate migration (for production)
npm run db:generate

# 3. Apply changes (development)
npm run db:push

# 4. View changes
npm run db:studio
```

See [`server/src/db/README.md`](server/src/db/README.md) for detailed database workflow.

### Running Scripts

All scripts are organized in `scripts/` directory:

```bash
# Client scripts (accessibility, UI fixes)
.\scripts\client\fix-a11y-issues.ps1

# Server scripts (database migrations)
cd server && npm run db:migrate:run

# E2E scripts (Docker testing)
.\scripts\e2e\e2e-docker.ps1
```

See [`scripts/README.md`](scripts/README.md) for complete script documentation.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code style** (Prettier, ESLint)
4. **Write tests** (unit + E2E for new features)
5. **Update documentation** (README, GDD tracker)
6. **Commit changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open Pull Request**

### Code Quality Standards

- ✅ All tests must pass (`npm test`)
- ✅ Type checking must pass (`npm run check`)
- ✅ Linting must pass (`npm run lint`)
- ✅ Code must be formatted (`npm run format`)
- ✅ SonarCloud quality gate must pass

---

## 🗺️ Roadmap

See the **[Implementation Tracker](https://github.com/KungRaseri/uncharted-lands/wiki/GDD-Implementation-Tracker)** for current status of all features:

### ✅ Completed (Phase 1)
- Core resource system (food, wood, stone, metal)
- Settlement creation and management
- Basic structure building (farms, housing, storage)
- Real-time resource production
- WebSocket-based multiplayer

### 🚧 In Progress (Phase 2)
- Disaster system (earthquakes, droughts, plagues, raids)
- Advanced structures (libraries, temples, marketplaces)
- Population happiness and immigration
- Resource consumption mechanics

### 📋 Planned (Phase 3+)
- Guild system and alliances
- Trade system between players
- Map exploration and fog of war
- Achievement system
- Mobile-responsive UI

---

## 🐛 Troubleshooting

### Client Can't Connect to Server

**Problem**: WebSocket connection fails, CORS errors

**Solution**:
1. Check `server/.env` has `CORS_ORIGINS=http://localhost:5173`
2. Check `client/.env` has `PUBLIC_WS_URL=http://localhost:3001`
3. Verify server is running: `curl http://localhost:3001/health`

See [`ENVIRONMENT.md`](ENVIRONMENT.md) for detailed troubleshooting.

### Database Connection Fails

**Problem**: Server crashes with "DATABASE_URL not set"

**Solution**:
1. Verify `server/.env` has correct `DATABASE_URL`
2. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Ensure PostgreSQL is running

### TypeScript Errors

**Problem**: Compilation errors after pulling latest code

**Solution**:
```bash
# Rebuild shared package
cd shared && npm run build

# Re-check all packages
cd .. && npm run check
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **KungRaseri** - *Initial work* - [GitHub](https://github.com/KungRaseri)

---

## 🙏 Acknowledgments

- [Svelte](https://svelte.dev/) & [SvelteKit](https://kit.svelte.dev/) - Amazing framework
- [Skeleton UI](https://skeleton.dev/) - Beautiful component library
- [Socket.IO](https://socket.io/) - Real-time communication
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript-first ORM
- [Vercel](https://vercel.com/), [Railway](https://railway.app/) - Deployment platforms

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/KungRaseri/uncharted-lands/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KungRaseri/uncharted-lands/discussions)
- **Wiki**: [Documentation](https://github.com/KungRaseri/uncharted-lands/wiki)

---

## ⭐ Show Your Support

If you find this project interesting, please consider giving it a star on GitHub! It helps others discover the project.

---

**Happy Building!** 🏰
