````instructions
# GitHub Copilot Instructions for Uncharted Lands Server

This file provides context and guidelines for GitHub Copilot when working on the Uncharted Lands game server.

---

## ⚠️ CRITICAL: No Summaries or Auto-Documentation

**NEVER write conversation summaries or create documentation unless explicitly requested.**

### Rules:
1. **DO NOT EVER**:
   - Write conversation summaries at any point
   - Create summary documents (SUMMARY.md, STATUS.md, CHANGES.md, etc.)
   - Generate progress reports automatically
   - Create migration status files
   - Auto-generate documentation files
   - Create README files (except when specifically asked)

2. **ONLY create documentation when user explicitly requests it**:
   - "Create a summary"
   - "Write documentation for X"
   - "Document this feature"
   - "Add a README"

3. **Always prefer**:
   - Direct answers in chat
   - Inline explanations
   - Code changes as requested
   - Updating existing documentation if it exists

4. **When documentation IS requested**:
   - Confirm what they want documented
   - Follow the Documentation Policy below for placement

---

## Project Overview

**Uncharted Lands Server** is a real-time game server for the Uncharted Lands game, handling multiplayer game state, player actions, resource production, and real-time events.

**Tech Stack**:
- **Runtime**: Node.js 22.x
- **Language**: TypeScript 5.7.3
- **Real-Time**: Socket.IO 4.8.1
- **Database**: Drizzle ORM + PostgreSQL
- **Build**: tsx (dev) / tsc (production)
- **Deployment**: Railway or Render (persistent connections)
- **Environment**: dotenv for configuration

---

## 📚 Game Design Documentation

**All game design documentation is centralized in the client docs wiki.**

- **🏠 [GDD Home](../../client/docs/game-design/GDD-HOME.md)** - Design docs overview and quick navigation
- **📖 [Design Docs Quick Start](../../client/docs/game-design/GDD-Quick-Start.md)** - Start here! Explains how to use all design docs
- **📚 [Game Design Document (GDD)](../../client/docs/game-design/GDD-Monolith.md)** - Complete specifications for all game systems
- **📊 [Implementation Tracker](../../client/docs/game-design/GDD-Implementation-Tracker.md)** - Current status of all features (✅/🚧/📋)
- **� [Table of Contents](../../client/docs/game-design/GDD-Table-of-Contents.md)** - Complete design document index
- **�🔧 [Feature Spec Template](../../client/docs/templates/Feature-Spec-Template.md)** - Template for implementing new features

**When implementing server-side game features:**
1. **Check GDD Monolith** for game mechanics, formulas, and balance values
2. **Review Implementation Tracker** for current status and missing backend pieces
3. **Refer to feature spec** in `client/docs/features/[feature-name].md` for technical details
4. **Implement** Socket.IO events and game logic following patterns below
5. **Update tracker** when complete (mark server-side portion as ✅)

**Key GDD Sections for Server Development:**
- **Core Systems** (Resources, Population, Settlements) - For game loop calculations
- **Technical Architecture** - For Socket.IO event design
- **Content & Balance** - For production rates, formulas, and balance values
- **Detailed Features** - For specific feature implementations

### 🎯 When to Reference the GDD

**Game Logic Implementation:**
- Resource production calculations → GDD 3.1 + GDD 6 (formulas and balance values)
- Population growth formulas → GDD 3.3 (happiness, housing, consumption rates)
- Structure costs/requirements → GDD 3.2 + GDD 6 (building costs and prerequisites)
- Disaster damage calculations → GDD 4.5 (severity formulas and effects)
- Tech tree unlocks → GDD 4.2 (research requirements and bonuses)

**Socket.IO Event Design:**
- Event naming conventions → GDD 5.2 (Technical Architecture)
- Data structures for events → GDD appendices (type definitions)
- Broadcasting patterns → GDD 5.2 (room-based multiplayer)
- Authentication flow → GDD 5.3 (Security Architecture)

**Database Schema:**
- Table relationships → GDD 5.1 (Database Architecture)
- Required fields → GDD feature sections (data requirements)
- Validation rules → GDD 6 (balance constraints)
- Migration planning → Check Implementation Tracker for schema changes

**Game Balance:**
- Production rates → GDD 6.1 (Resource Balance)
- Building costs → GDD 6.2 (Structure Balance)
- Population limits → GDD 6.3 (Population Balance)
- Disaster severity → GDD 6.5 (Disaster Balance)

**Common Server Questions Answered by GDD:**
- "What's the resource production formula?" → GDD 3.1 + 6.1
- "How does happiness affect population?" → GDD 3.3
- "What triggers a disaster?" → GDD 4.5 (frequency, conditions, warnings)
- "What Socket.IO events are defined?" → GDD 5.2 + Implementation Tracker
- "What's the game loop tick rate?" → GDD 5.2 (60Hz/second)

---

## 🚨 CRITICAL DEVELOPMENT PRINCIPLES

### **NEVER Leave Partial Implementations**

When implementing server-side features:

1. ❌ **DON'T** remove database operations and leave TODO comments
2. ❌ **DON'T** create placeholder validation that will "be done later"
3. ❌ **DON'T** make partial API changes that break functionality
4. ✅ **DO** implement features fully, from database to Socket.IO events
5. ✅ **DO** ask for clarification if game mechanics are unclear
6. ✅ **DO** consult the GDD for complete specifications

**Example of WRONG approach:**
```typescript
// ❌ BAD: Removing validation with comment
// TODO: In future, implement structure requirements validation
const structure = await db.insert(structures).values({
  settlementId,
  type: structureType
}).returning();
```

**Example of CORRECT approach:**
```typescript
// ✅ GOOD: Full implementation
const requirements = await db
  .select()
  .from(structureRequirements)
  .where(eq(structureRequirements.structureType, structureType));

if (!hasResources(settlement, requirements)) {
  throw new Error('Insufficient resources');
}

const [structure] = await db.transaction(async (tx) => {
  // Deduct resources
  await tx.update(settlementStorage)
    .set({ wood: settlement.wood - cost.wood, stone: settlement.stone - cost.stone })
    .where(eq(settlementStorage.id, settlement.storageId));
  
  // Create structure
  return tx.insert(structures)
    .values({ settlementId, type: structureType })
    .returning();
});

// Emit Socket.IO event
io.to(`world:${worldId}`).emit('structure-built', {
  settlementId,
  structure
});
```

### **Full-Stack Implementation Required**

Every backend feature must be implemented across:

1. **Database Schema** - Tables, relations, indexes in `src/db/schema.ts`
2. **Backend Logic** - Business rules, validation in `src/game/*.ts` or `src/api/routes/*.ts`
3. **API Endpoints** - REST routes with proper error handling (if applicable)
4. **Socket.IO Events** - Real-time updates defined in `src/types/socket-events.ts`
5. **Database Queries** - Efficient queries in `src/db/queries.ts` (for reusable patterns)
6. **Testing** - Unit tests for logic, integration tests for events
7. **Logging** - Structured logging with context for debugging

**When you identify missing backend functionality:**
- Check the GDD for the complete specification
- Implement the full feature with database operations, validation, and events
- If the GDD doesn't specify the feature, ask the user before proceeding
- Update the Implementation Tracker when complete

### **Backend Feature Implementation Checklist**

Before considering a server-side feature "done":
- [ ] Database schema matches GDD specifications (tables, columns, indexes)
- [ ] Backend validation and business logic complete (game rules enforced)
- [ ] Database operations use transactions where appropriate
- [ ] Error handling covers all failure cases
- [ ] Socket.IO events emitted for real-time updates
- [ ] Room-based broadcasting targets correct players
- [ ] Structured logging added with relevant context
- [ ] Tests written and passing (unit + integration)
- [ ] Documentation updated (GDD Tracker, API docs)
- [ ] **No TODO comments left in production code**
- [ ] Code formatted (Prettier) and linted (ESLint)

---

## Documentation Policy

**⚠️ CRITICAL: ALL project documentation MUST be placed in the `docs/` directory.**

### Documentation Rules

1. **Location**: ALL `.md` documentation files go in `docs/` directory
   - ✅ CORRECT: `docs/Server-Architecture.md`
   - ❌ WRONG: `SERVER_ARCHITECTURE.md` (root level)
   - ❌ WRONG: `src/docs/guide.md` (inside src)

2. **Root-Level Exceptions**: Only these files are allowed in the project root:
   - `README.md` - Project overview and getting started
   - `LICENSE` - License file
   - `CHANGELOG.md` - Version history (if needed)

3. **Summary Documents**:
   - ⚠️ **DO NOT** create summary documents unless explicitly requested by the user
   - User must specifically ask: "Create a summary of changes", "Document the migration", etc.
   - Most changes should be documented in existing files or commit messages
   - Only create summaries when the user specifically asks for one
   - If created, they MUST go in `docs/` directory with appropriate subdirectory

4. **When Creating Documentation**:
   - **Always** check if `docs/` directory exists
   - **Always** create new docs in `docs/`
   - Use subdirectories for organization: `docs/guides/`, `docs/api/`, `docs/migration/`, etc.
   - **Never** create documentation in the project root (except README.md)
   - **Ask first** before creating new documentation files

5. **Existing Root-Level Docs**: If you find documentation in the root:
   - Move it to `docs/` with appropriate subdirectory
   - Update any references to the old location
   - Notify the user of the move

### Documentation Organization

```
docs/
├── Home.md                    # Wiki home page
├── Server-Architecture.md     # Server architecture overview
├── WebSocket-API.md          # Socket.IO API reference
└── migration/                # Migration documentation (if needed)
```

---

## Architecture

### Server Purpose

This WebSocket server handles:
- **Real-time multiplayer**: Player connections and state synchronization
- **Game events**: Broadcasting events to connected players
- **Player actions**: Processing and validating player inputs
- **Health checks**: HTTP endpoint for monitoring

### Why Separate Server?

- **Vercel limitations**: Vercel's serverless functions cannot maintain persistent WebSocket connections
- **Deployment target**: Railway or Render support long-running WebSocket processes
- **Independent scaling**: Server can scale independently from the SvelteKit client

### Client-Server Communication

- **Client**: SvelteKit app on Vercel (`uncharted-lands/client`)
- **Server**: Game server on Railway/Render (`uncharted-lands/server`)
- **Protocol**: Socket.IO with typed events
- **Database**: Shared PostgreSQL database
- **Health endpoint**: HTTP GET `/health` for monitoring

---

## Official Documentation References

### Socket.IO

- **Docs**: https://socket.io/docs/v4/
- **Server API**: https://socket.io/docs/v4/server-api/
- **TypeScript**: https://socket.io/docs/v4/typescript/
- **Emit cheatsheet**: https://socket.io/docs/v4/emit-cheatsheet/

### Drizzle ORM

- **Docs**: https://orm.drizzle.team/docs/overview
- **PostgreSQL**: https://orm.drizzle.team/docs/get-started-postgresql
- **Queries**: https://orm.drizzle.team/docs/rqb
- **Migrations**: https://orm.drizzle.team/docs/migrations

### Node.js

- **HTTP Server**: https://nodejs.org/api/http.html
- **Process**: https://nodejs.org/api/process.html
- **Events**: https://nodejs.org/api/events.html

### TypeScript

- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **ES Modules**: https://www.typescriptlang.org/docs/handbook/esm-node.html

---

## Project Structure

```
uncharted-lands-server/
├── .github/
│   ├── copilot-instructions.md          # This file
│   └── workflows/                       # CI/CD workflows
├── docs/
│   ├── Home.md                          # Wiki home page
│   ├── Server-Architecture.md           # Architecture documentation
│   └── WebSocket-API.md                 # Socket.IO API reference
├── src/
│   ├── db/
│   │   ├── index.ts                     # Database connection
│   │   ├── schema.ts                    # Drizzle schema definitions
│   │   ├── queries.ts                   # Query helper functions
│   │   └── README.md                    # Database usage guide
│   ├── events/
│   │   └── handlers.ts                  # Socket.IO event handlers
│   ├── game/
│   │   └── resource-calculator.ts       # Resource production logic
│   ├── middleware/
│   │   └── socket-middleware.ts         # Socket.IO middleware
│   ├── types/
│   │   └── socket-events.ts             # TypeScript event definitions
│   ├── utils/
│   │   └── logger.ts                    # Structured logging
│   └── index.ts                         # Main server entry point
├── drizzle/
│   ├── 0000_*.sql                       # Database migrations
│   └── meta/                            # Migration metadata
├── drizzle.config.ts                    # Drizzle configuration
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
├── eslint.config.js                     # ESLint configuration
├── package.json                         # Dependencies and scripts
├── .prettierrc                          # Code formatting
├── README.md                            # Project documentation
└── tsconfig.json                        # TypeScript configuration
```

### Key Files

- **src/index.ts**: Main server with:
  - Socket.IO server with typed events
  - HTTP server for health checks (`/health`)
  - Middleware pipeline (logging, auth, error handling)
  - Event handler registration
  - Graceful shutdown handling
  - Database connection management

- **src/db/schema.ts**: Complete database schema:
  - 14 tables (Account, Profile, Settlement, World, etc.)
  - Relations and foreign keys
  - TypeScript type exports
  - All game data structures

- **src/db/queries.ts**: Pre-built query helpers:
  - Authentication queries
  - Settlement operations
  - World/region queries
  - Resource management

- **src/events/handlers.ts**: Socket.IO event handlers:
  - Player authentication
  - World joining/leaving
  - Resource collection
  - Structure building
  - Game state synchronization

- **src/game/resource-calculator.ts**: Game logic:
  - Time-based resource production
  - Production rate calculations
  - Resource consumption
  - Net production calculations

- **.env**: Configuration (never commit!)
  - `PORT`: Server port (default: 3001)
  - `HOST`: Bind address (default: 0.0.0.0)
  - `DATABASE_URL`: PostgreSQL connection
  - `CORS_ORIGINS`: Allowed client origins
  - `SENTRY_DSN`: Error tracking (optional)

---

## Code Style Guidelines

### TypeScript Patterns

**Use ES Modules** (not CommonJS):

```typescript
// ✅ CORRECT
import { Server } from 'socket.io';
import { db } from './db/index.js';
export function broadcast(message: object) { }

// ❌ WRONG
const { Server } = require('socket.io');
const db = require('./db');
module.exports = { broadcast };
```

**Strict Type Safety**:

```typescript
// ✅ Explicit types
async function handleMessage(
  socket: Socket,
  data: CollectResourcesData
): Promise<void> {
  const settlement = await getSettlementWithDetails(data.settlementId);
}

// ❌ Implicit any
async function handleMessage(socket, data) {
  const settlement = await getSettlementWithDetails(data.settlementId);
}
```

**Use TypeScript Interfaces for Socket Events**:

```typescript
// ✅ Typed Socket.IO events
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from './types/socket-events';

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
```

### Socket.IO Patterns

**Connection Handling**:

```typescript
io.on('connection', (socket) => {
  logger.info('[CONNECTION] Client connected', { socketId: socket.id });

  // Authentication check
  if (!socket.data.authenticated) {
    socket.disconnect();
    return;
  }

  // Register event handlers
  registerEventHandlers(socket);

  // Track connection
  socket.on('disconnect', (reason) => {
    logger.info('[DISCONNECT]', { socketId: socket.id, reason });
  });
});
```

**Event Handlers with Acknowledgments**:

```typescript
socket.on('collect-resources', async (data, callback) => {
  try {
    const result = await handleCollectResources(socket, data);
    callback({ success: true, data: result });
  } catch (error) {
    logger.error('[ERROR] Resource collection failed:', error);
    callback({ success: false, error: error.message });
  }
});
```

**Room-Based Broadcasting**:

```typescript
// Join world room
socket.join(`world:${worldId}`);

// Broadcast to specific world
io.to(`world:${worldId}`).emit('state-update', {
  type: 'resource-update',
  data: newResources
});

// Broadcast to all except sender
socket.to(`world:${worldId}`).emit('player-action', action);
```

**Error Handling**:

```typescript
socket.on('error', (error: Error) => {
  logger.error('[SOCKET ERROR]', { socketId: socket.id, error });
});

// Middleware error handling
io.use((socket, next) => {
  try {
    // Validation logic
    next();
  } catch (error) {
    next(new Error('Middleware error'));
  }
});
```

### Database Patterns (Drizzle ORM)

**Query with Relations**:

```typescript
import { db, settlements, settlementStorage, plots } from './db';
import { eq } from 'drizzle-orm';

const settlement = await db
  .select({
    settlement: settlements,
    storage: settlementStorage,
    plot: plots,
  })
  .from(settlements)
  .leftJoin(settlementStorage, eq(settlements.settlementStorageId, settlementStorage.id))
  .leftJoin(plots, eq(settlements.plotId, plots.id))
  .where(eq(settlements.id, settlementId))
  .limit(1);
```

**Insert with Returning**:

```typescript
const [newSettlement] = await db
  .insert(settlements)
  .values({
    id: createId(),
    playerProfileId: profileId,
    plotId: plotId,
    settlementStorageId: storageId,
    name: 'New Settlement',
  })
  .returning();
```

**Update Resources**:

```typescript
const [updated] = await db
  .update(settlementStorage)
  .set({
    food: newAmount.food,
    water: newAmount.water,
  })
  .where(eq(settlementStorage.id, storageId))
  .returning();
```

---

## Event Protocol

### Client → Server Events

```typescript
// Authenticate
{
  type: 'authenticate',
  playerId: string,
  token: string
}

// Join world
{
  type: 'join-world',
  worldId: string,
  playerId: string
}

// Collect resources
{
  type: 'collect-resources',
  settlementId: string
}

// Build structure
{
  type: 'build-structure',
  settlementId: string,
  structureType: string,
  position: { x: number, y: number }
}
```

### Server → Client Events

```typescript
// Connected
{
  type: 'connected',
  message: string,
  socketId: string,
  timestamp: number
}

// Game state
{
  type: 'game-state',
  worldId: string,
  state: {
    settlements: Settlement[],
    playerId: string
  },
  timestamp: number
}

// Resource update
{
  type: 'resource-update',
  settlementId: string,
  resources: ResourceAmounts,
  production: ResourceAmounts,
  timestamp: number
}

// Error
{
  type: 'error',
  code: string,
  message: string,
  timestamp: number
}
```

---

## Common Tasks & Patterns

### Starting Development Server

```bash
npm run dev
```

Runs server with hot-reload using tsx watch mode on port 3001.

### Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Push schema changes directly (dev only)
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

### Testing Socket.IO Events

Use the client's test files or Socket.IO client directly:

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  socket.emit('authenticate', {
    playerId: 'player-123',
    token: 'auth-token'
  }, (response) => {
    console.log('Auth response:', response);
  });
});
```

### Adding New Event Handler

1. Define event types in `src/types/socket-events.ts`:

```typescript
export interface ClientToServerEvents {
  'new-event': (data: NewEventData, callback: ResponseCallback) => void;
}

export interface NewEventData {
  settlementId: string;
  action: string;
}
```

2. Implement handler in `src/events/handlers.ts`:

```typescript
export function handleNewEvent(socket: Socket, data: NewEventData): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate
      if (!data.settlementId) {
        throw new Error('Settlement ID required');
      }

      // Database query
      const settlement = await getSettlementWithDetails(data.settlementId);

      // Business logic
      // ...

      // Respond
      socket.emit('new-event-response', { success: true });
      resolve();
    } catch (error) {
      logger.error('[NEW EVENT ERROR]', error);
      reject(error);
    }
  });
}
```

3. Register in `registerEventHandlers()`:

```typescript
socket.on('new-event', async (data, callback) => {
  try {
    await handleNewEvent(socket, data);
    callback?.({ success: true });
  } catch (error) {
    callback?.({ success: false, error: error.message });
  }
});
```

### Adding Database Query

1. Add query function to `src/db/queries.ts`:

```typescript
export async function getNewData(id: string) {
  try {
    const result = await db
      .select()
      .from(tableName)
      .where(eq(tableName.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    logger.error('[QUERY ERROR]', error);
    throw error;
  }
}
```

2. Export from `src/db/index.ts` if needed:

```typescript
export { getNewData } from './queries.js';
```

3. Use in handlers:

```typescript
import { getNewData } from '../db/index.js';

const data = await getNewData(id);
```

### Broadcasting Updates

```typescript
// Broadcast to specific world room
io.to(`world:${worldId}`).emit('state-update', {
  type: 'resource-update',
  data: newResources
});

// Broadcast to all except sender
socket.to(`world:${worldId}`).emit('player-action', action);

// Broadcast to specific player
io.to(socket.id).emit('personal-update', data);
```

### Health Check Endpoint

Already implemented in `src/index.ts`:

```typescript
// HTTP GET /health
// Returns: { status: 'ok', uptime: number, timestamp: number }
```

---

## Testing

### Manual Socket.IO Testing

Using Socket.IO client library:

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Test authentication
  socket.emit('authenticate', {
    playerId: 'test-player',
    token: 'test-token'
  }, (response) => {
    console.log('Auth response:', response);
  });

  // Test resource collection
  socket.emit('collect-resources', {
    settlementId: 'settlement-123'
  }, (response) => {
    console.log('Collect response:', response);
  });
});

socket.on('resource-update', (data) => {
  console.log('Resource update:', data);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### Testing with Client

```typescript
// From SvelteKit client (src/lib/server/socket.ts)
const socket = io('ws://localhost:3001');

socket.on('connect', () => {
  socket.emit('authenticate', { playerId, token }, (response) => {
    if (response.success) {
      // Request game state
      socket.emit('game-state-request', { worldId }, (state) => {
        console.log('Game state:', state);
      });
    }
  });
});
```

### Health Check Testing

```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:3001/health

# Expected response
{"status":"ok","uptime":123.456,"timestamp":1234567890}
```

---

## Do's and Don'ts

### ✅ DO

- **Reference the GDD first** before implementing any game feature
- Use GDD for formulas, balance values, and game mechanics
- Use ES modules (import/export)
- Type all function parameters and return values
- Use Socket.IO event acknowledgments for responses
- Clean up connections and rooms on disconnect
- Use Drizzle ORM for all database queries
- Log important events with Winston logger
- Implement health checks
- Support graceful shutdown (already implemented)
- Validate incoming event data
- Use environment variables for configuration
- Join/leave rooms properly for world-based broadcasting
- Use typed Socket.IO events (ClientToServerEvents, ServerToClientEvents)

### ❌ DON'T

- **Don't implement game features without checking the GDD first**
- Don't hardcode balance values (use GDD specifications)
- Don't use CommonJS (require/module.exports)
- Don't use `any` type without good reason
- Don't ignore Socket.IO errors
- Don't leave orphaned room subscriptions
- Don't send unstructured data (always use typed events)
- Don't log sensitive information (passwords, tokens)
- Don't hardcode configuration (use .env)
- Don't block the event loop with synchronous operations
- Don't trust client input without validation
- Don't commit `.env` files
- Don't use raw WebSocket (ws library) - we migrated to Socket.IO
- Don't query database without error handling

---

## Deployment

### Environment Variables

Required environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server
PORT=3001
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

### Railway/Render Configuration

**Build Command**:
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm start
```

**Health Check Endpoint**:
```
http://server-url:3001/health
```

Returns: `{ status: 'ok', uptime: number, timestamp: number }`

### Production Considerations

1. **Connection Pooling**: Already configured with 10 max connections in `src/db/index.ts`
2. **Graceful Shutdown**: Implemented in `src/index.ts` (closes database, Socket.IO server)
3. **Error Logging**: Winston logger with structured logs
4. **Database Connections**: Automatically closed on SIGTERM/SIGINT
5. **Socket.IO Rooms**: Memory-based, no Redis needed yet (scale later with Redis adapter)
6. **CORS**: Configure for production domains
7. **Rate Limiting**: Consider implementing for authentication endpoints

---

## Useful Commands

```powershell
# Development
npm run dev              # Start dev server with auto-reload (tsx watch)
npm run build            # Build TypeScript to dist/
npm start                # Run production build (node dist/index.js)

# Database
npm run db:generate      # Generate Drizzle migration from schema changes
npm run db:push          # Push schema changes directly to database (dev only)
npm run db:studio        # Open Drizzle Studio web UI

# Code Quality
npm run type-check       # TypeScript type checking (if configured)
npm run lint             # ESLint code checking (if configured)

# Package Management
npm install              # Install dependencies
npm update               # Update dependencies
npm audit                # Check for vulnerabilities

# Testing
npm test                 # Run tests (if configured)
```

---

## Implementation Reference

Key files for understanding the current architecture:

1. **Database**:
   - `src/db/schema.ts` - Complete Drizzle schema (14 tables)
   - `src/db/queries.ts` - Pre-built query functions
   - `src/db/README.md` - Database usage guide

2. **Socket.IO**:
   - `src/types/socket-events.ts` - Typed event definitions
   - `src/middleware/socket-middleware.ts` - Authentication, logging, error handling
   - `src/events/handlers.ts` - Event handler implementations

3. **Game Logic**:
   - `src/game/resource-calculator.ts` - Production/consumption calculations
   - `src/game/game-loop.ts` - 60Hz game loop
   - `src/game/population-calculator.ts` - Population system

---

## Additional Resources

### Socket.IO
- Official Docs: https://socket.io/docs/v4/
- TypeScript Support: https://socket.io/docs/v4/typescript/
- Server API: https://socket.io/docs/v4/server-api/

### Drizzle ORM
- Documentation: https://orm.drizzle.team/docs/overview
- PostgreSQL Guide: https://orm.drizzle.team/docs/get-started-postgresql
- Drizzle Kit: https://orm.drizzle.team/kit-docs/overview

### Node.js
- Node.js Docs: https://nodejs.org/docs/
- Best Practices: https://github.com/goldbergyoni/nodebestpractices

### TypeScript
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Advanced Types: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html

### Deployment
- Railway Docs: https://docs.railway.app/
- Render Docs: https://render.com/docs

---

These examples should be used as guidance when configuring Sentry functionality within a project.

# Error / Exception Tracking

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Ensure you are creating custom spans with meaningful names and operations
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure they are imported using `import * as Sentry from "@sentry/node"`
Enable logging in Sentry using `Sentry.init({ enableLogs: true })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

In Node.js the Sentry initialization is typically in `instrumentation.ts`

### Baseline

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://0a128684927db4409d51d0848f4d3666@o4504635308638208.ingest.us.sentry.io/4510353298292736",

  // Send structured logs to Sentry
  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://0a128684927db4409d51d0848f4d3666@o4504635308638208.ingest.us.sentry.io/4510353298292736",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```

---

**Last Updated**: November 13, 2025
**Status**: Production-ready game server with real-time multiplayer features
**Tech Stack**: TypeScript + Socket.IO + Drizzle ORM + PostgreSQL + Node.js 22.x
**Deployment**: Railway/Render with persistent connections

````
