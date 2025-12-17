# Database - Drizzle ORM

This directory contains the Drizzle ORM configuration, schema definitions, and database utilities for the Uncharted Lands game server.

## 📁 Structure

```
src/db/
├── index.ts          # Database connection and exports
├── schema.ts         # Drizzle schema definitions (tables, relations, types)
└── queries.ts        # Common database query helpers
```

## 🚀 Quick Start

### 1. Environment Setup

Ensure your `.env` file has the DATABASE_URL:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/uncharted_lands"
```

### 2. Generate Migrations

After modifying the schema, generate migrations:

```bash
npm run db:generate
```

### 3. Apply Migrations

Apply pending migrations to your database:

```bash
npm run db:push
```

### 4. Database Studio

Open Drizzle Studio to view and edit data:

```bash
npm run db:studio
```

## 📝 Schema Overview

### Core Tables

- **Account** - User authentication and authorization
- **Profile** - User profiles and game data
- **Server** - Game server instances
- **World** - Game worlds with environmental settings
- **Region** - Regional subdivisions of worlds
- **Biome** - Biome definitions with resource modifiers
- **Tile** - Individual map tiles
- **Plot** - Buildable plots on tiles
- **Settlement** - Player settlements
- **SettlementStorage** - Resource storage for settlements
- **SettlementStructure** - Structures built in settlements
- **StructureRequirements** - Build requirements for structures
- **StructureModifier** - Modifiers applied by structures

### Relationships

```
Account 1:1 Profile
Profile 1:N Settlement
Settlement 1:1 SettlementStorage
Settlement 1:N SettlementStructure
World 1:N Region
Region 1:N Tile
Tile 1:N Plot
Plot 1:1 Settlement
```

## 💻 Usage Examples

### Basic Queries

```typescript
import { db, accounts, profiles } from './db';
import { eq } from 'drizzle-orm';

// Find user by email
const user = await db
  .select()
  .from(accounts)
  .where(eq(accounts.email, 'user@example.com'))
  .limit(1);

// Get all profiles
const allProfiles = await db.select().from(profiles);
```

### Using Query Helpers

```typescript
import {
  findAccountByToken,
  getPlayerSettlements,
  createSettlement,
  updateSettlementStorage,
} from './db/queries';

// Authenticate user
const account = await findAccountByToken(authToken);

// Get player's settlements
const settlements = await getPlayerSettlements(profileId);

// Create new settlement
const { settlement, storage } = await createSettlement(profileId, plotId, 'New Settlement', {
  food: 100,
  water: 100,
  wood: 50,
  stone: 30,
  ore: 10,
});

// Update resources
await updateSettlementStorage(storage.id, {
  food: 120,
  wood: 75,
});
```

### Joins & Relations

```typescript
import { db, settlements, settlementStorage, plots } from './db';
import { eq } from 'drizzle-orm';

// Get settlement with related data
const result = await db
  .select({
    settlement: settlements,
    storage: settlementStorage,
    plot: plots,
  })
  .from(settlements)
  .leftJoin(settlementStorage, eq(settlements.settlementStorageId, settlementStorage.id))
  .leftJoin(plots, eq(settlements.plotId, plots.id))
  .where(eq(settlements.id, settlementId));
```

### Inserting Data

```typescript
import { db, settlements } from './db';
import { createId } from '@paralleldrive/cuid2';

const [newSettlement] = await db
  .insert(settlements)
  .values({
    id: createId(),
    playerProfileId: 'player123',
    plotId: 'plot456',
    settlementStorageId: 'storage789',
    name: 'Riverside Village',
  })
  .returning();
```

### Updating Data

```typescript
import { db, settlementStorage } from './db';
import { eq } from 'drizzle-orm';

const [updated] = await db
  .update(settlementStorage)
  .set({ food: 200, water: 150 })
  .where(eq(settlementStorage.id, storageId))
  .returning();
```

### Deleting Data

```typescript
import { db, settlements } from './db';
import { eq } from 'drizzle-orm';

await db.delete(settlements).where(eq(settlements.id, settlementId));
```

## 🔧 Advanced Queries

### Filtering & Sorting

```typescript
import { db, settlements } from './db';
import { eq, and, desc, gte } from 'drizzle-orm';

// Multiple conditions
const recentSettlements = await db
  .select()
  .from(settlements)
  .where(
    and(
      eq(settlements.playerProfileId, profileId),
      gte(settlements.createdAt, new Date('2024-01-01'))
    )
  )
  .orderBy(desc(settlements.createdAt))
  .limit(10);
```

### Aggregations

```typescript
import { db, settlements } from './db';
import { count, eq } from 'drizzle-orm';

// Count settlements per player
const settlementCount = await db
  .select({ count: count() })
  .from(settlements)
  .where(eq(settlements.playerProfileId, profileId));
```

### Transactions

```typescript
import { db } from './db';

await db.transaction(async (tx) => {
  // All operations in this block are part of one transaction
  const [storage] = await tx.insert(settlementStorage).values({...}).returning();
  const [settlement] = await tx.insert(settlements).values({...}).returning();

  // If any operation fails, all are rolled back
});
```

## 🛠️ Migration Workflow

### 1. Modify Schema

Edit `src/db/schema.ts` to add/modify tables:

```typescript
export const myNewTable = pgTable('MyNewTable', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
```

### 2. Generate Migration

```bash
npm run db:generate
```

This creates a new SQL file in `drizzle/` directory.

### 3. Review Migration

Check the generated SQL file to ensure it matches your intentions:

```bash
cat drizzle/0001_*.sql
```

### 4. Apply Migration

Push changes to the database:

```bash
npm run db:push
```

### 5. Update Queries

Add any new query helpers to `queries.ts`:

```typescript
export async function getMyNewData(id: string) {
  return await db.select().from(myNewTable).where(eq(myNewTable.id, id));
}
```

## 🔐 Best Practices

### 1. Always Use Prepared Statements

```typescript
// ✅ Good - Protected from SQL injection
const user = await db.select().from(accounts).where(eq(accounts.email, userInput));

// ❌ Bad - Never concatenate user input
// await db.execute(sql`SELECT * FROM accounts WHERE email = '${userInput}'`);
```

### 2. Use Transactions for Multiple Operations

```typescript
// ✅ Good - Atomic operations
await db.transaction(async (tx) => {
  await tx.insert(storage).values({...});
  await tx.insert(settlement).values({...});
});

// ❌ Bad - Can result in partial state
await db.insert(storage).values({...});
await db.insert(settlement).values({...}); // If this fails, storage exists but no settlement
```

### 3. Handle Errors Properly

```typescript
try {
  const result = await db.select().from(accounts).where(eq(accounts.id, id));
  if (!result) {
    throw new Error('Account not found');
  }
  return result;
} catch (error) {
  logger.error('Database query failed:', error);
  throw error;
}
```

### 4. Use Indexes for Performance

```typescript
// In schema.ts
export const settlements = pgTable(
  'Settlement',
  {
    id: text('id').primaryKey(),
    playerProfileId: text('playerProfileId').notNull(),
    // ... other fields
  },
  (table) => ({
    // Index for common queries
    playerIdx: index('Settlement_playerProfileId_idx').on(table.playerProfileId),
  })
);
```

### 5. Close Connections on Shutdown

Already handled in `src/index.ts`:

```typescript
import { closeDatabase } from './db';

// Graceful shutdown
await closeDatabase();
```

## 📚 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle Query Examples](https://orm.drizzle.team/docs/crud)
- [Drizzle Schema Definition](https://orm.drizzle.team/docs/sql-schema-declaration)

## 🐛 Troubleshooting

### Connection Issues

```
Error: connect ECONNREFUSED
```

**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct.

### Migration Conflicts

```
Error: relation "Account" already exists
```

**Solution**: Database schema exists. Use `db:push` to sync schema or drop and recreate the database.

### Type Errors

```
Type 'unknown' is not assignable to type 'Account'
```

**Solution**: Use type assertions or the inferred types from schema:

```typescript
import type { Account } from './db/schema';

const [account] = await db.select().from(accounts).where(...);
// account is now typed as Account
```

## 🎯 Next Steps

1. **Implement Resource Generation** - Move client-side resource calculations to server
2. **Add Caching Layer** - Implement Redis for frequently accessed data
3. **Add Full-Text Search** - Use PostgreSQL full-text search for world/region names
4. **Optimize Queries** - Profile slow queries and add indexes
5. **Add Database Monitoring** - Track query performance and connection pool stats
