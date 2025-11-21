# Design Decision Template

## Decision Summary

**Decision**: [One-sentence summary]  
**Date**: [YYYY-MM-DD]  
**Status**: 🤔 Proposed / 💬 Discussing / ✅ Decided / 🔄 Revised  
**Impact**: 🔴 High / 🟠 Medium / 🟢 Low

---

## Decision Summary

**Decision**: [One-sentence summary]  
**Date**: [YYYY-MM-DD]  
**Status**: 🤔 Proposed / 💬 Discussing / ✅ Decided / 🔄 Revised  
**Impact**: 🔴 High / 🟠 Medium / 🟢 Low

---

## Context

**What are we deciding?**  
[Detailed description of the decision to be made]

**Why now?**  
[What triggered this decision - new feature, bug, scalability issue, etc.]

**Who's involved?**  
[List of stakeholders or team members]

---

## Problem Statement

**Current situation**:  
[What's the current state or problem?]

**Constraints**:

- [Technical constraint 1]
- [Business constraint 2]
- [Resource constraint 3]

**Goals**:

- [Goal 1]
- [Goal 2]

---

## Options Considered

### Option 1: [Name]

**Description**:  
[How this approach works]

**Pros**:

- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons**:

- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Implementation effort**: [Low/Medium/High - X hours/days]

**Example**:

```typescript
// Code example if applicable
```

---

### Option 2: [Name]

**Description**:  
[How this approach works]

**Pros**:

- ✅ [Advantage 1]
- ✅ [Advantage 2]

**Cons**:

- ❌ [Disadvantage 1]
- ❌ [Disadvantage 2]

**Implementation effort**: [Low/Medium/High - X hours/days]

**Example**:

```typescript
// Code example if applicable
```

---

### Option 3: [Name]

**Description**:  
[How this approach works]

**Pros**:

- ✅ [Advantage 1]

**Cons**:

- ❌ [Disadvantage 1]

**Implementation effort**: [Low/Medium/High - X hours/days]

---

## Decision

**Chosen Option**: [Option X - Name]

**Rationale**:  
[Detailed explanation of why this option was chosen]

**Key factors**:

1. [Factor 1 - e.g., Performance is critical]
2. [Factor 2 - e.g., Easier to maintain]
3. [Factor 3 - e.g., Aligns with GDD design]

**Trade-offs accepted**:  
[What we're giving up by choosing this option]

---

## Implementation Plan

### Changes Required

**Backend**:

- `[file-path]` - [Change needed]
- `[file-path]` - [Change needed]

**Frontend**:

- `[file-path]` - [Change needed]

**Database**:

```sql
-- Schema changes if needed
```

**Configuration**:

- Update `[config-file]`

### Migration Strategy

**For existing data/code**:

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Rollback plan**:  
[How to revert if this doesn't work]

---

## Consequences

### Positive

- [Good outcome 1]
- [Good outcome 2]

### Negative

- [Challenge 1 we'll face]
- [Challenge 2 we'll face]

### Technical Debt

[Any technical debt introduced by this decision]

---

## Validation

**How will we know this was the right choice?**

- [Success metric 1]
- [Success metric 2]

**Review date**: [When to re-evaluate this decision]

---

## References

**Related documents**:

- [Link to GDD section]
- [Link to RFC or discussion]
- [Link to similar decision]

**Research**:

- [External article or resource]
- [Benchmark or comparison]

---

## Notes & Discussion

**Questions raised**:

- Q: [Question 1]
- A: [Answer or still open]

**Alternative approaches considered but rejected**:

- [Approach X] - Rejected because [reason]

---

## Example Usage

```markdown
## Decision Summary

**Decision**: Use 10Hz processing for disasters instead of 60Hz  
**Date**: 2025-11-19  
**Status**: ✅ Decided  
**Impact**: 🔴 High (affects core disaster system)

## Context

**What are we deciding?**  
How frequently to process disaster damage during the impact phase

**Why now?**  
Implementing disaster system (Phase 3), need to determine processing frequency

**Who's involved?**  
Development team, playtesting feedback

## Problem Statement

**Current situation**:  
Game loop runs at 60Hz for resource production, but disasters may not need such high frequency

**Constraints**:

- Must handle 100+ settlements during disasters
- Server CPU limited
- Need responsive damage updates

**Goals**:

- Minimize server load
- Maintain responsive gameplay feel
- Allow gradual damage application

## Options Considered

### Option 1: 60Hz Processing (Every Tick)

**Description**:  
Process disaster damage calculations every tick (16.67ms), same as resources

**Pros**:

- ✅ Maximum responsiveness
- ✅ Consistent with resource system
- ✅ Smooth damage progression

**Cons**:

- ❌ Unnecessary CPU usage (damage changes every 10 minutes, not every tick)
- ❌ Database writes every tick (3600/minute per settlement)
- ❌ Won't scale to 100+ settlements

**Implementation effort**: Low - 2 hours (already in game loop)

### Option 2: 10Hz Processing (Every 6 Ticks)

**Description**:  
Process disasters at 10Hz (every 100ms), separate from resource ticks

**Pros**:

- ✅ Still very responsive (100ms updates)
- ✅ 6x less CPU usage than 60Hz
- ✅ Can batch damage calculations
- ✅ Scales to 100+ settlements

**Cons**:

- ❌ Slightly more complex game loop logic
- ❌ Need to track tick counts for different systems

**Implementation effort**: Medium - 4 hours (add tick counter logic)

### Option 3: Event-Based Processing (On Damage Events Only)

**Description**:  
Only calculate damage when disaster phases change (every 10 minutes)

**Pros**:

- ✅ Minimal CPU usage
- ✅ Simple implementation

**Cons**:

- ❌ No granular progress updates
- ❌ Can't show real-time damage feed
- ❌ Poor UX (10-minute gaps with no feedback)

**Implementation effort**: Low - 2 hours

## Decision

**Chosen Option**: Option 2 - 10Hz Processing

**Rationale**:  
10Hz provides excellent responsiveness while using 6x less CPU than 60Hz. Disasters are slower-paced events (minutes/hours) that don't require tick-level precision. The complexity trade-off is minimal.

**Key factors**:

1. Performance - Can handle 100+ settlements during disasters
2. UX - Still feels responsive (100ms updates imperceptible)
3. Scalability - Allows future world-scale disasters

**Trade-offs accepted**:  
Slightly more complex game loop logic (must track tick counts), but negligible compared to performance gain.

## Implementation Plan

### Changes Required

**Backend**:

- `server/src/game/game-loop.ts` - Add disaster processing every 6 ticks
- `server/src/game/disaster-manager.ts` - Create disaster processing function

[...continue as needed...]
```
