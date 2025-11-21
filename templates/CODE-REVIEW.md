# Code Review Template

> **Use this template** when reviewing code changes, pull requests, or discussing implementation details.

---

## Review Info

**PR/Branch**: [Branch name or PR number]  
**Author**: [Developer name]  
**Reviewer**: [Your name]  
**Date**: [YYYY-MM-DD]  
**Review Type**: 🔍 Pre-commit / 🔄 PR Review / 📦 Post-merge

---

## Summary

**What changed?**  
[Brief summary of the changes]

**Why?**  
[Purpose - bug fix, new feature, refactor, etc.]

**Scope**:  
[Small/Medium/Large - number of files, complexity]

---

## Files Changed

**Backend**:

- `[file-path]` - [What changed]
- `[file-path]` - [What changed]

**Frontend**:

- `[file-path]` - [What changed]

**Database**:

- Migration: `[migration-file]` - [What changed]

**Tests**:

- `[test-file]` - [What was added/modified]

---

## Review Checklist

### Code Quality

- [ ] Code follows project style guide
- [ ] No commented-out code
- [ ] No console.logs or debug statements
- [ ] Variable/function names are clear
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Complex logic has comments

### Functionality

- [ ] Matches GDD specification (if applicable)
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Input validation present
- [ ] No obvious bugs

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests if needed
- [ ] Tests actually test the change
- [ ] All tests pass
- [ ] Coverage adequate

### Performance

- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Appropriate use of caching
- [ ] 60Hz game loop compatible (if backend)

### Security

- [ ] No SQL injection vulnerabilities
- [ ] User input sanitized
- [ ] Authentication/authorization checked
- [ ] No sensitive data exposed
- [ ] CORS configured correctly

### Documentation

- [ ] Code comments where needed
- [ ] README updated if needed
- [ ] GDD updated if design changed
- [ ] API docs updated
- [ ] CHANGELOG updated

---

## Detailed Review

### Strengths

**What's good about this code?**

- ✅ [Good thing 1]
- ✅ [Good thing 2]

### Issues Found

#### 🔴 Critical (Must fix before merge)

1. **[Issue title]**
   - **Location**: `[file]:[line]`
   - **Problem**: [What's wrong]
   - **Impact**: [Why this is critical]
   - **Suggestion**: [How to fix]

#### 🟠 High Priority (Should fix)

1. **[Issue title]**
   - **Location**: `[file]:[line]`
   - **Problem**: [What's wrong]
   - **Suggestion**: [How to fix]

#### 🟡 Low Priority (Nice to have)

1. **[Issue title]**
   - **Location**: `[file]:[line]`
   - **Suggestion**: [Improvement]

### Questions

1. **Q**: [Question about implementation choice]
   - **A**: [Answer or "Needs clarification"]

---

## Testing Verification

### Manual Testing

**Did you test locally?** Yes / No

**Test results**:

- [Test case 1]: ✅ Pass / ❌ Fail
- [Test case 2]: ✅ Pass / ❌ Fail

**Issues found during testing**:

- [Issue 1 if any]

### Automated Tests

**Test run status**: ✅ All pass / ⚠️ Some fail / ❌ Many fail

**Failing tests**:

- `[test-name]` - [Why failing]

---

## Security Review

**Security concerns**: Yes / No

**If yes, describe**:

- [Concern 1]
- [Mitigation needed]

---

## Performance Review

**Performance concerns**: Yes / No

**If yes, describe**:

- [Concern 1]
- [Optimization suggestion]

**Benchmark results** (if applicable):

```
Before: [metric]
After:  [metric]
Change: [+/- X%]
```

---

## Architecture Review

**Does this align with existing architecture?** Yes / No / Partially

**Concerns**:

- [Architectural concern if any]

**Suggestions**:

- [How to better align with architecture]

---

## Decision

**Recommendation**: ✅ Approve / 🔄 Request Changes / 💬 Comment Only

**Reasoning**:  
[Why this recommendation]

**Required changes before merge**:

1. [Required change 1]
2. [Required change 2]

**Optional improvements for future**:

1. [Optional improvement 1]

---

## Notes

**Follow-up tasks**:

- [Task 1 - file issue or create TODO]

**Lessons learned**:

- [What did we learn from this review?]

---

## Example Usage

```markdown
## Review Info

**PR/Branch**: feature/disaster-damage-calculation  
**Author**: Developer A  
**Reviewer**: Developer B  
**Date**: 2025-11-20  
**Review Type**: 🔄 PR Review

## Summary

**What changed?**  
Implemented gradual disaster damage calculation with structure-specific resistances

**Why?**  
Phase 3 of disaster system - need realistic damage progression during impact

**Scope**:  
Medium - 3 files modified, 1 new file, 200 lines changed

## Files Changed

**Backend**:

- `server/src/game/disaster-manager.ts` - Added damage calculation logic
- `server/src/game/game-loop.ts` - Integrated 10Hz disaster processing
- `server/src/config/game-config.ts` - Added resistance values

**Tests**:

- `server/tests/unit/game/disaster-manager.test.ts` - Added damage calculation tests

## Review Checklist

[...marks as checked/unchecked...]

## Detailed Review

### Strengths

**What's good about this code?**

- ✅ Clean separation of damage calculation logic
- ✅ Well-tested with multiple edge cases
- ✅ Follows GDD specification exactly

### Issues Found

#### 🔴 Critical (Must fix before merge)

1. **Division by zero if disaster impact duration is 0**
   - **Location**: `disaster-manager.ts:145`
   - **Problem**: `progress = elapsedTime / disaster.impactDuration` crashes if duration is 0
   - **Impact**: Server crash during disaster
   - **Suggestion**: Add check: `if (disaster.impactDuration === 0) return;`

#### 🟠 High Priority (Should fix)

1. **Missing NULL check for settlement structures**
   - **Location**: `disaster-manager.ts:167`
   - **Problem**: Assumes `settlement.structures` exists, could be undefined
   - **Suggestion**: Add `if (!settlement.structures?.length) return;`

### Questions

1. **Q**: Why 10-minute intervals for damage instead of continuous?
   - **A**: Performance - reduces DB writes, matches GDD "every 10 minutes" spec

## Decision

**Recommendation**: 🔄 Request Changes

**Reasoning**:  
Code quality is excellent and follows GDD, but critical NULL/division bugs must be fixed before merge.

**Required changes before merge**:

1. Fix division by zero bug in damage calculation
2. Add NULL check for settlement.structures

**Optional improvements for future**:

1. Consider caching structure resistances (minor optimization)

[...continue as needed...]
```
