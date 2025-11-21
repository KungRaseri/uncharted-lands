# Session Start Template

## Session Info

**Date**: [YYYY-MM-DD]  
**Branch**: [branch-name]  
**Duration**: [estimated time]  
**Current Time/Terminal States**: [Any background processes running - e.g., "esbuild running in terminal 1, server on :3001"]

---

## Current Focus

**Working on**: [Feature/Bug/System name]  
**File(s)**: [Primary files being modified - use absolute paths]  
**Reference**: [GDD section with specific subsection - e.g., "GDD-Monolith.md Section 3.4.5 (Structure Damage)"]  
**Open in Editor**: [File currently visible in VS Code - helps me understand what you're looking at]

---

## Previous Context

**Last session**: [What you finished last time]  
**Decisions made**:

- [Key decision 1]
- [Key decision 2]

**Current state**:

- ✅ [What's complete]
- 🚧 [What's in progress]
- 📋 [What's next]

---

## Current Goal

**Objective**: [Clear one-sentence goal]

**Acceptance Criteria**:

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Blockers / Questions

**Blocker**: [Current issue preventing progress, or "None"]  
**Questions**:

1. [Question 1]
2. [Question 2]

---

## Notes

[Any additional context, links, or reminders]

<!-- END TEMPLATE -->

---

## About This Template

> **Quick Context Template** - Copy/paste this at the start of each coding session to help GitHub Copilot understand where you are instantly.

### When to Use

- At the start of every coding session
- When switching between major features
- After a break of more than a few hours

### How to Use

1. Run the template helper script: `.\client\templates\get-template.ps1`
2. Select option 1 (Session Start)
3. Template is copied to clipboard
4. Paste into your conversation with Copilot
5. Fill in the bracketed placeholders

### Example Usage

```markdown
# Session Start Template

## Session Info

**Date**: 2025-11-20  
**Branch**: feature/disaster-system  
**Duration**: 2-3 hours

## Current Focus

**Working on**: Disaster damage calculation  
**File(s)**: server/src/game/disaster-manager.ts  
**Reference**: GDD-Monolith.md Section 3.4.5 (Structure Damage System)

## Previous Context

**Last session**: Created DisasterEvent schema and database migration  
**Decisions made**:

- 10Hz processing frequency (every 6 ticks)
- Gradual damage application (every 10 minutes)

**Current state**:

- ✅ DisasterEvent schema created
- ✅ Database migration complete
- 🚧 Damage calculation logic in progress
- 📋 Testing and integration pending

## Current Goal

**Objective**: Implement gradual structure damage during disaster impact phase

**Acceptance Criteria**:

- [ ] Calculate damage based on severity - preparedness ± 20%
- [ ] Apply structure-specific resistances
- [ ] Emit damage events every 10 minutes
- [ ] Update structure health in database

## Blockers / Questions

**Blocker**: None  
**Questions**:

1. Should we apply damage all at once or spread over impact duration?
2. How to handle structures at 0% health (destroyed vs repairable)?

## Notes

- GDD specifies variance of ±20% for unpredictability
- Need to reference BiomeDisasterMap for vulnerability calculations
```
