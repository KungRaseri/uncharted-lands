# Feature Implementation Template

## Feature Overview

**Feature Name**: [Name of feature]  
**Status**: 📋 Planned / 🚧 In Progress / ✅ Complete  
**Priority**: 🔥 High / 📅 Medium / 🌟 Low  
**Sprint**: [Sprint number or date range]  
**Estimated Effort**: [Story points or hours]

---

## Context

**GDD Reference**: [Link to GDD section, e.g., "GDD-Monolith.md Section 3.4"]  
**Related Features**: [Dependencies or related systems]  
**Implementation Tracker**: [Mark when complete in GDD-Implementation-Tracker.md]

---

## Problem Statement

**What problem does this solve?**  
[Describe the player need or system gap]

**Why now?**  
[Why is this feature prioritized for this sprint?]

---

## Technical Approach

### Backend Changes

**Files to modify**:

- `server/src/[path]` - [What changes]
- `server/src/[path]` - [What changes]

**New files to create**:

- `server/src/game/[feature]-calculator.ts` - [Purpose]
- `server/src/api/routes/[feature].ts` - [Purpose]

**Database changes**:

```sql
-- New tables or schema modifications
CREATE TABLE [TableName] (...);
ALTER TABLE [ExistingTable] ADD COLUMN [field] [TYPE];
CREATE INDEX idx_[name] ON [Table]([Column]);
```

**API endpoints**:

- `POST /api/[resource]` - [Purpose]
- `GET /api/[resource]/:id` - [Purpose]
- `PUT /api/[resource]/:id` - [Purpose]

**Socket.IO events**:

- Server → Client: `'event-name'` - [When emitted, what data]
- Client → Server: `'action-name'` - [What it does]

### Frontend Changes

**Files to modify**:

- `client/src/lib/components/game/[Component].svelte` - [What changes]
- `client/src/lib/stores/game/[store].svelte.ts` - [What changes]

**New files to create**:

- `client/src/lib/components/game/[Feature]Panel.svelte` - [Purpose]
- `client/src/lib/stores/game/[feature].svelte.ts` - [Purpose]

---

## Implementation Steps

### Phase 1: Backend Foundation

- [ ] Create database migration
- [ ] Add schema definitions
- [ ] Create calculator/manager class
- [ ] Add API endpoints
- [ ] Add Socket.IO event handlers
- [ ] Write unit tests

### Phase 2: Game Loop Integration

- [ ] Add to game loop processing
- [ ] Test real-time updates
- [ ] Verify performance (60Hz compatible)

### Phase 3: Frontend Implementation

- [ ] Create state store
- [ ] Build UI components
- [ ] Connect Socket.IO listeners
- [ ] Add to relevant pages
- [ ] Test UI responsiveness

### Phase 4: Polish & Testing

- [ ] Integration tests
- [ ] E2E tests
- [ ] Balance adjustments
- [ ] Documentation updates
- [ ] Code review

---

## Acceptance Criteria

**Feature is complete when**:

- [ ] Backend logic matches GDD specification
- [ ] Real-time updates work via Socket.IO
- [ ] UI displays data correctly
- [ ] Tests pass (unit, integration, E2E)
- [ ] Performance meets requirements
- [ ] Documentation updated

---

## Testing Plan

**Manual testing**:

1. [Test case 1]
2. [Test case 2]
3. [Test case 3]

**Automated testing**:

- Unit: `server/tests/unit/game/[feature].test.ts`
- Integration: `server/tests/integration/api/[feature].test.ts`
- E2E: `client/tests/e2e/[feature].test.ts`

**Edge cases to verify**:

- [Edge case 1]
- [Edge case 2]

---

## Configuration & Balance

**Constants** (in `server/src/config/game-config.ts`):

```typescript
export const [FEATURE]_CONFIG = {
  BASE_VALUE: 100,
  MULTIPLIER: 1.5,
  // etc.
};
```

**Balance values**:
| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| [Param 1] | [Val] | [Why this value] |
| [Param 2] | [Val] | [Why this value] |

---

## Documentation Updates

**After implementation, update**:

- [ ] GDD-Implementation-Tracker.md (mark ✅)
- [ ] GDD-Monolith.md (if design changed)
- [ ] server/README.md (if new API endpoints)
- [ ] client/README.md (if new components)
- [ ] This template (final notes)

---

## Notes & Decisions

**Design decisions**:

- [Decision 1]: [Reasoning]
- [Decision 2]: [Reasoning]

**Gotchas / Things to remember**:

- [Important note 1]
- [Important note 2]

**Future improvements** (not in this sprint):

- [Improvement 1]
- [Improvement 2]

<!-- END TEMPLATE -->

---

## About This Template

> **Use this template** when implementing new features from the GDD or adding new functionality.

### When to Use

- Starting implementation of a GDD-specified feature
- Adding new game mechanics or systems
- Building new UI components with backend integration
- Any feature that requires database + API + UI changes

### How to Use

1. Run the template helper script: `.\client\templates\get-template.ps1`
2. Select option 2 (Feature Implementation)
3. Template is copied to clipboard
4. Paste into your conversation with Copilot
5. Fill in all bracketed placeholders with specific details

### Example Usage

````markdown
## Feature Overview

**Feature Name**: Disaster Warning System  
**Status**: 🚧 In Progress  
**Priority**: 🔥 High  
**Sprint**: Phase 3 (Nov 20-27, 2025)  
**Estimated Effort**: 8 hours

## Context

**GDD Reference**: GDD-Monolith.md Section 3.4.4 (Disaster Mechanics)  
**Related Features**: Disaster Event System, Watchtower structure  
**Implementation Tracker**: Will update when complete

## Problem Statement

**What problem does this solve?**  
Players need advance warning before disasters strike to prepare defenses, activate shelters, and request aid.

**Why now?**  
Core disaster system is being implemented (Phase 3), and warnings are essential for player agency.

## Technical Approach

### Backend Changes

**Files to modify**:

- `server/src/game/disaster-manager.ts` - Add warning phase logic
- `server/src/game/game-loop.ts` - Check warning timers

**New files to create**:

- `server/src/game/warning-calculator.ts` - Calculate warning times based on structures

**Database changes**:

```sql
ALTER TABLE DisasterEvent ADD COLUMN warningIssuedAt TIMESTAMP;
ALTER TABLE DisasterEvent ADD COLUMN warningDuration INTEGER;
```
````

**Socket.IO events**:

- Server → Client: `'disaster-warning'` - When warning issued
- Server → Client: `'disaster-imminent'` - 30 min before impact

### Frontend Changes

**New files to create**:

- `client/src/lib/components/game/DisasterWarning.svelte` - Warning banner UI

## Implementation Steps

[...continue as needed...]

```

```
