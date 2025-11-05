# Uncharted Lands

> A survival settlement building game in a procedurally generated world

[![CI Status](https://github.com/KungRaseri/uncharted-lands/workflows/CI/badge.svg)](https://github.com/KungRaseri/uncharted-lands/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎮 About

**Uncharted Lands** is a game where players build and manage settlements in a procedurally generated world. Players must overcome extreme weather, scarce resources, and hostile creatures while expanding settlements and improving technology.

## 📁 Project Structure

This is a **monorepo** with separate deployable applications:

```
uncharted-lands/
├── client/          # 🎮 SvelteKit game application
│   ├── src/         # Game UI and logic
│   ├── prisma/      # Database schema
│   └── vercel.json  # Client deployment config
├── server/          # 🔌 WebSocket server
│   ├── src/         # Real-time game server
│   └── vercel.json  # Server deployment config
├── docs/            # 📚 Project documentation
│   ├── VERCEL_DEPLOYMENT.md      # Deployment guide
│   └── MONOREPO_STRUCTURE.md     # Structure guide
└── package.json     # Root workspace config
```

### 🎮 Client (`client/`)

Main game application built with:
- **Framework**: SvelteKit 2.48.4 + Svelte 5.43.2
- **Styling**: Tailwind CSS 4.1.16 + Skeleton 4.2.2
- **Database**: Prisma + PostgreSQL
- **Build**: Vite 6.0.3
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel (separate project)

### 🔌 Server (`server/`)

WebSocket server for real-time game features:
- **Runtime**: Node.js + TypeScript
- **WebSockets**: ws library
- **Purpose**: Real-time game state synchronization
- **Deployment**: Vercel (separate project)

### 📚 Documentation (`docs/`)

Comprehensive project documentation:
- **VERCEL_DEPLOYMENT.md** - Complete deployment guide
- **MONOREPO_STRUCTURE.md** - Structure and commands
- **WORLD_GENERATION_GUIDE.md** - World generation system
- **RESOURCE_GENERATION_SYSTEM.md** - Resource management
- **migration/** - Migration documentation

See [docs/README.md](./docs/README.md) for the full documentation index.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Installation

```bash
# Install all dependencies
npm install

# Setup client
cd client
npm install
cp .env.example .env
# Configure your .env file with database credentials

# Run database migrations
npm run migrate
```

### Development

```bash
# From root directory:

# Run client (game application)
npm run dev

# Or run from client directory:
cd client
npm run dev
```

Visit `http://localhost:5173` to see the game!

### Building

```bash
# Build client for production
npm run build

# Build all workspaces
npm run build:all
```

### Testing

```bash
# Run client tests
npm test

# Run all tests
npm run test:all

# Run with coverage
cd client
npm run coverage
```

## 🎯 Available Scripts

**Root workspace:**
```bash
npm run dev            # Start client dev server
npm run dev:client     # Start client dev server
npm run dev:server     # Start server (when available)
npm run build          # Build client
npm run build:all      # Build all workspaces
npm run test           # Run client tests
npm run test:all       # Run all tests
npm run lint           # Lint all workspaces
npm run format         # Format all workspaces
npm run migrate        # Run database migrations
npm run clean          # Clean all build artifacts
```

**Client-specific** (run from `client/` directory):
```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm test               # Run Playwright tests
npm run test:unit      # Run Vitest tests
npm run coverage       # Generate test coverage
npm run check          # Type checking
npm run lint           # Lint code
npm run format         # Format code with Prettier
npm run migrate        # Run database migrations
npm run seed           # Seed database
```

## 🏗️ VS Code Workspace

For the best development experience, open the workspace file:

1. Open VS Code
2. File → Open Workspace from File
3. Select `uncharted-lands.code-workspace`

This provides:
- Multi-root workspace with separate folders for client, server, and docs
- Configured tasks for building, testing, and running
- Debug configurations for full-stack development
- Recommended extensions
- Proper settings for Svelte, TypeScript, Tailwind, etc.

## 📦 Deployment

### Vercel (Client)

The client is configured for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The `vercel.json` at the root is configured to:
- Build from the `client/` directory
- Deploy SvelteKit application
- Set up cron jobs for game tick system

### Environment Variables

Required environment variables (see `client/.env.example`):

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
SENTRY_AUTH_TOKEN=...
# etc.
```

## 🧪 CI/CD

GitHub Actions workflow (`.github/workflows/CI.yml`) runs on push/PR to `main` and `development`:

- ✅ Build verification
- ✅ E2E tests (Playwright)
- ✅ Unit tests (Vitest)
- ✅ SonarCloud analysis

## 📚 Documentation

Full documentation is available in the `docs/` directory:

- **[Home](./docs/Home.md)** - Documentation hub
- **[World Generation Guide](./docs/WORLD_GENERATION_GUIDE.md)** - Technical details on world generation
- **[Game Systems](./docs/)** - Resource generation, tick system, etc.
- **[Migration Documentation](./docs/migration/)** - Skeleton v4 migration details

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Make sure to:
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/KungRaseri/uncharted-lands
- **Issues**: https://github.com/KungRaseri/uncharted-lands/issues
- **Pull Requests**: https://github.com/KungRaseri/uncharted-lands/pulls

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [SvelteKit](https://kit.svelte.dev/)
- [Svelte 5](https://svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Skeleton](https://www.skeleton.dev/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)

---

**Built with ❤️ by KungRaseri**
