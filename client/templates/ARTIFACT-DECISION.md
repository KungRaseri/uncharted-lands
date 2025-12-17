# Artifact Decision Template

## Context

**What we're creating**: [File type - e.g., "New TypeScript module", "SQL migration", "Svelte component"]  
**Estimated size**: [Lines of code - e.g., "50-100 lines", "200+ lines"]  
**File location**: [Absolute path where this will live]  
**Related files**: [Files this will import/use - helps me assess coupling]

---

## Artifact Criteria Checklist

### ✅ **Strong Yes** - Create Artifact If:

- [ ] **Multi-file change** - Changes span 3+ files that need to stay in sync
- [ ] **Complex logic** - Contains algorithms, formulas, or intricate business rules
- [ ] **Reference material** - You'll need to copy/paste or reference this multiple times
- [ ] **Version tracking** - You want to compare iterations (v1, v2, v3 of the code)
- [ ] **Large code block** - 100+ lines in a single file
- [ ] **Schema/Config** - Database migrations, type definitions, or config files
- [ ] **Template/Boilerplate** - You'll reuse this pattern for other features
- [ ] **Review needed** - You want to carefully review before applying

### 🤔 **Maybe** - Consider Artifact If:

- [ ] **Moderate size** - 50-100 lines
- [ ] **Single file** - Only one file affected but significant changes
- [ ] **Educational** - Complex pattern you want preserved for learning
- [ ] **Debugging** - Multiple iterations expected to get it right

### ❌ **No Artifact Needed** - Direct Edit If:

- [ ] **Tiny change** - Under 20 lines
- [ ] **Quick fix** - Obvious solution, no iteration expected
- [ ] **Single-line edit** - Changing a value, fixing a typo
- [ ] **Template fill-in** - Using an existing template (like SESSION-START)
- [ ] **Delete only** - Removing code without replacement

---

## Decision Framework

### **Option A: Create Artifact**

**Best when**: [X] indicates "Strong Yes" criteria met

**Advantages**:

- ✅ Preserves code in chat (survives session end)
- ✅ Allows review before application
- ✅ Enables comparison between iterations
- ✅ Creates permanent reference

**Process**:

1. I create artifact with descriptive title
2. You review the code in artifact panel
3. You give feedback: "Looks good" or "Change X to Y"
4. I update artifact (v2, v3, etc.)
5. When approved, you manually apply via `replace_string_in_file` or copy/paste

**Trade-off**: Requires manual application (but safer for complex changes)

---

### **Option B: Direct Edit**

**Best when**: [X] indicates "No Artifact Needed" criteria met

**Advantages**:

- ✅ Immediate application (no manual copy)
- ✅ Faster for simple changes
- ✅ Less chat clutter for trivial edits

**Process**:

1. I use `replace_string_in_file` directly
2. Change applies immediately
3. You verify with `get_errors` if needed

**Trade-off**: Code only visible in tool response (lost after chat scroll)

---

### **Option C: Hybrid Approach**

**Best when**: [X] indicates "Maybe" criteria met

**Process**:

1. **Start with artifact** for initial draft
2. **Review together** in artifact panel
3. **Once approved**, I convert to direct edit
4. Artifact remains as reference

**Example**: New calculator module (complex logic) → Artifact for review → Direct edit once confirmed

---

## Quick Decision Guide

**Ask yourself**:

| Question                                | Yes = Artifact | No = Direct Edit |
| --------------------------------------- | -------------- | ---------------- |
| Is it over 100 lines?                   | ✅ Artifact    | ❌ Direct        |
| Will I need to reference this later?    | ✅ Artifact    | ❌ Direct        |
| Am I uncertain about the approach?      | ✅ Artifact    | ❌ Direct        |
| Does it involve complex logic/formulas? | ✅ Artifact    | ❌ Direct        |
| Is it a quick typo/value fix?           | ❌ Direct      | ✅ Direct        |
| Multi-file coordination needed?         | ✅ Artifact    | ❌ Direct        |

**Default rule**: **When in doubt, use artifact.** It's easier to convert artifact → direct edit than to reconstruct lost code.

---

<!-- END TEMPLATE -->

---

## About This Template

This template helps you and your AI coding assistant decide whether code changes should be created as artifacts (reviewable in the artifact panel) or applied directly using file editing tools. It provides a framework for making artifact decisions based on complexity, size, and need for iteration.

## When to Use

Use this template when:

- About to create or modify significant code (50+ lines)
- Uncertain whether to use artifact or direct edit approach
- Working on complex multi-file changes
- Need to align with your AI assistant on artifact strategy
- Starting a new feature and planning implementation approach
- Want to establish artifact preferences for a coding session

## How to Use

1. **Fill Context**: Describe what you're creating, estimated size, file location, and related files
2. **Complete Checklist**: Check boxes in Strong Yes / Maybe / No categories
3. **Evaluate Framework**: Review Option A (Artifact), Option B (Direct Edit), or Option C (Hybrid)
4. **Use Quick Decision Guide**: Answer yes/no questions in the table
5. **Decide**: Choose artifact, direct edit, or hybrid based on criteria
6. **Communicate**: Use shortcuts to tell your AI assistant your preference
7. **Note Reasoning**: Document why this approach is best for future reference

---

## Communication Shortcuts

### **You → Me**

**"Make this an artifact"**:

- I'll create artifact even if it's borderline
- Useful when you want to review before applying

**"Direct edit is fine"**:

- I'll use `replace_string_in_file` immediately
- Useful for simple fixes you're confident about

**"Let's decide together"**:

- I'll present options with reasoning
- Useful when unclear

**"Show me the artifact criteria"**:

- I'll reference this template's checklist
- Helps us align on decision

### **Me → You**

**"I recommend an artifact because [reason]"**:

- I'll explain which criteria triggered the recommendation
- You can override: "Direct edit anyway" or "Agreed, artifact please"

**"This is small enough for direct edit unless you prefer artifact"**:

- Borderline case, giving you the choice
- Default is direct edit unless you say otherwise

**"Creating artifact for review"**:

- I'm making the artifact call based on criteria
- You can still request direct conversion after review

---

## Examples from Uncharted Lands

### ✅ **Should Be Artifact**

**Example 1**: Disaster damage calculation

- **Why**: Complex formula, 150+ lines, affects multiple systems
- **Process**: Artifact → Review formulas → Iterate → Apply
- **File**: `server/src/game/disaster-calculator.ts`

**Example 2**: Database migration for construction queue

- **Why**: Schema change, needs careful review, reference for rollback
- **Process**: Artifact → Review SQL → Test locally → Apply
- **File**: `server/drizzle/0023_add_construction_queue.sql`

**Example 3**: Complete UI component

- **Why**: 200+ lines, Svelte component with complex state
- **Process**: Artifact → Review markup/logic → Iterate → Apply
- **File**: `client/src/lib/components/game/DisasterWarningPanel.svelte`

### ❌ **Direct Edit Fine**

**Example 1**: Fix consumption rate constant

- **Why**: Single line, obvious fix from GDD
- **Before**: `const FOOD_RATE = 0.005;`
- **After**: `const FOOD_RATE = 0.3;`
- **File**: `server/src/game/consumption-calculator.ts`

**Example 2**: Add missing import

- **Why**: One line, no logic change
- **Process**: Direct `replace_string_in_file`
- **File**: Any file needing import

**Example 3**: Update type definition

- **Why**: Small interface change, 3-5 lines
- **Process**: Direct edit
- **File**: `server/src/types/*.ts`

### 🤔 **Hybrid Cases**

**Example 1**: New API endpoint (50 lines)

- **Process**: Start with artifact for review → Convert to direct edit
- **Why**: Moderate size, want to review validation logic
- **File**: `server/src/api/routes/*.ts`

**Example 2**: Socket.IO event handler

- **Process**: Artifact if complex logic, direct if simple CRUD
- **Why**: Depends on complexity of handler
- **File**: `server/src/events/handlers.ts`

---

## Template Usage in Practice

### **Scenario 1: New Feature Implementation**

**You paste**: FEATURE-IMPLEMENTATION template filled out  
**Me**: "Based on the technical approach, I recommend artifacts for:

- Disaster calculator (150 lines, complex formulas)
- Database migration (schema changes)
- UI component (200+ lines)

Direct edits fine for:

- Config constants
- Type definitions
- Import additions

Sound good?"

**You**: "Agreed" or "Make X an artifact too"

---

### **Scenario 2: Bug Fix**

**You paste**: BUG-FIX template filled out  
**Me**: "This is a 3-line fix in consumption-calculator.ts. Direct edit unless you want artifact?"  
**You**: "Direct is fine" → I apply immediately

---

### **Scenario 3: Uncertain Approach**

**You say**: "I need to add disaster warnings but not sure of the structure"  
**Me**: "Let me create an artifact so we can iterate on the approach together"  
**Process**: Artifact v1 → Feedback → v2 → Feedback → v3 → Apply

---

## My Default Behavior

**Unless you specify otherwise, I will**:

1. **Always create artifacts** for:
   - 100+ line files
   - Database migrations
   - Complete new components
   - Complex algorithms

2. **Ask before deciding** for:
   - 50-100 line changes
   - New modules/files
   - Refactoring existing code

3. **Default to direct edit** for:
   - Under 20 lines
   - Single-line fixes
   - Import additions
   - Obvious typos

4. **Mention my reasoning**: "Creating artifact because [complex formulas]" or "Direct edit since [simple fix]"

---

## Overriding My Defaults

**You can always override** by saying:

- **"Make everything an artifact for this session"** - I'll artifact all changes
- **"Direct edits only unless I say otherwise"** - I'll minimize artifacts
- **"Use artifacts for files over 75 lines"** - Custom threshold
- **"Ask me each time"** - I'll request approval for every change

**Current default** (unless overridden): Follow the criteria checklist above

---

## Notes

- **Artifact titles matter**: I'll use descriptive titles like "Disaster Warning Calculator (v2)" not "Code Update"
- **Versioning**: Artifact iterations show evolution (helpful for learning)
- **Preservation**: Artifacts persist in chat even after session ends
- **Performance**: For 5+ files changing, consider artifact for the most complex, direct edit for simple ones

---

## Related Templates

- Use with **FEATURE-IMPLEMENTATION** - Decide artifact strategy during planning phase
- Use with **BUG-FIX** - Quick decision for fix approach
- Use with **SESSION-START** - Note artifact preference for session

---

## Example Usage

```markdown
# Artifact Decision Template

## Context

**What we're creating**: New disaster damage calculator module  
**Estimated size**: 180 lines  
**File location**: server/src/game/disaster-damage-calculator.ts  
**Related files**: server/src/game/disaster-manager.ts, server/src/game/game-loop.ts

## Artifact Criteria Checklist

### ✅ **Strong Yes** - Create Artifact If:

- [x] **Multi-file change** - Affects disaster-manager, game-loop, and new calculator
- [x] **Complex logic** - Damage formula: (Severity - Preparedness) ± 20% with structure resistances
- [ ] **Reference material** - May reference but not repeatedly
- [x] **Version tracking** - Want to iterate on damage formula
- [x] **Large code block** - 180 lines
- [x] **Schema/Config** - Resistance values need configuration
- [ ] **Template/Boilerplate** - Unique to disasters
- [x] **Review needed** - Complex formulas need careful review

### 🤔 **Maybe** - Consider Artifact If:

- [x] **Moderate size** - Actually large (180 lines)
- [ ] **Single file** - Multi-file
- [x] **Educational** - Complex pattern worth preserving
- [x] **Debugging** - Formula may need iteration

### ❌ **No Artifact Needed** - Direct Edit If:

- [ ] **Tiny change** - No
- [ ] **Quick fix** - No
- [ ] **Single-line edit** - No
- [ ] **Template fill-in** - No
- [ ] **Delete only** - No

## Decision Framework

### **Option A: Create Artifact** ✅ **RECOMMENDED**

**Advantages**:

- ✅ Complex damage formula needs review (GDD Section 3.4.5)
- ✅ 180 lines is substantial
- ✅ May need 2-3 iterations to get formula right
- ✅ Affects multiple files (calculator, manager, game-loop)
- ✅ Want to preserve calculation logic for reference

**Process**:

1. I create artifact: "Disaster Damage Calculator Module"
2. You review damage formulas against GDD spec
3. Feedback: "Change variance calculation" or "Add structure resistance"
4. I update artifact (v2)
5. Once approved, manually apply to files

**Trade-off**: Manual application, but safer for complex multi-file changes

## Quick Decision Guide

| Question                                | Answer                      | Result      |
| --------------------------------------- | --------------------------- | ----------- |
| Is it over 100 lines?                   | Yes (180)                   | ✅ Artifact |
| Will I need to reference this later?    | Yes (damage formulas)       | ✅ Artifact |
| Am I uncertain about the approach?      | Somewhat (GDD math)         | ✅ Artifact |
| Does it involve complex logic/formulas? | Yes (variance, resistances) | ✅ Artifact |
| Multi-file coordination needed?         | Yes (3 files)               | ✅ Artifact |

**Decision**: **Create artifact** - 5/5 "Strong Yes" criteria met

## Communication

**Me → You**:  
"I recommend an artifact because this is 180 lines of complex damage calculations affecting 3 files. We can iterate on the formula together before applying."

**You → Me**:  
"Agreed, artifact please" or "Actually, direct edit the simple parts and artifact only the calculator"

## Notes

**Why artifact is best here**:

- Damage formula is critical game balance (GDD Section 3.4.5)
- Math needs verification: `damage = (severity - preparedness) ± 20%`
- Structure resistances are configurable constants
- Affects disaster-manager integration (need to see full picture)
- Want to compare iterations if formula feels wrong

**Alternative considered**:

- Direct edit for simple files, artifact for calculator only
- Rejected: Better to see all changes together for context
```

---

**Last Updated**: November 21, 2025  
**Version**: 1.0
