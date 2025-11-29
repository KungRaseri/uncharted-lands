# Bug Fix Template

## Bug Information

**Bug ID**: [Issue number or identifier]  
**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low  
**Status**: 📋 Reported / 🔍 Investigating / 🚧 Fixing / ✅ Fixed / ✔️ Verified  
**Reported**: [Date]  
**Fixed**: [Date when resolved]

---

## Bug Description

**What's broken?**  
[Clear description of the issue]

**Expected behavior**:  
[What should happen]

**Actual behavior**:  
[What actually happens]

**Steps to reproduce**:

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Bug occurs]

---

## Impact

**Who is affected?**  
[All users / Specific user types / Edge case]

**How critical?**  
[Can't play / Major annoyance / Minor issue / Cosmetic]

**Workaround available?**  
[Yes/No - If yes, describe]

---

## Investigation

### Error Messages

```
[Paste error logs, stack traces, console errors]
```

### Affected Files

- `[file-path]` - [Suspected issue]
- `[file-path]` - [Related code]

### Root Cause

**What's causing this?**  
[Analysis of the underlying issue]

**Why did this happen?**  
[What was missed in original implementation]

### Related Issues

- [Link to related bugs]
- [Link to original implementation PR]

---

## Fix Approach

### Strategy

[Describe how you'll fix it - one clear approach]

### Files to Change

- `[file-path]` - [What change needed]
- `[file-path]` - [What change needed]

### Risk Assessment

**Risk level**: 🔴 High / 🟠 Medium / 🟢 Low  
**Why?**: [Explain risk - e.g., touches critical system, affects many users]

**Mitigation**:

- [How to reduce risk - testing strategy, rollback plan]

---

## Implementation

### Code Changes

**Before** (broken):

```typescript
// Paste broken code
```

**After** (fixed):

```typescript
// Paste fixed code
```

**Why this fixes it**:  
[Explain the fix]

### Additional Changes

- [ ] Update related code
- [ ] Add validation
- [ ] Improve error handling
- [ ] Add defensive checks

---

## Testing

### Verification Steps

- [ ] Bug no longer reproduces
- [ ] Original functionality still works
- [ ] Related features unaffected
- [ ] Edge cases handled

### Test Cases

**Manual testing**:

1. [Test original reproduction steps]
2. [Test related functionality]
3. [Test edge cases]

**Automated tests**:

- [ ] Add regression test
- [ ] Update existing tests
- [ ] All tests pass

### Browsers / Environments

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile

---

## Prevention

**Why wasn't this caught earlier?**  
[Analysis - missing test? Logic error?]

**How to prevent in future?**

- [Add test coverage]
- [Add validation]
- [Improve code review]
- [Update documentation]

---

## Documentation Updates

- [ ] Update code comments
- [ ] Update README if needed
- [ ] Update GDD if design changed
- [ ] Add to CHANGELOG

---

## Notes

**Lessons learned**:  
[What did we learn from this bug?]

**Follow-up tasks**:

- [Related improvements to make]
- [Technical debt to address]

<!-- END TEMPLATE -->

---

## About This Template

> **Use this template** when fixing bugs, debugging issues, or resolving errors.

### When to Use

- Reporting a bug you discovered
- Investigating an issue
- Fixing a known bug
- Documenting a bug fix for code review

### How to Use

1. Run the template helper script: `.\client\templates\get-template.ps1`
2. Select option 3 (Bug Fix)
3. Template is copied to clipboard
4. Paste into your conversation with Copilot
5. Fill in all sections with specific bug details

### Example Usage

```markdown
## Bug Information

**Bug ID**: #127  
**Severity**: 🔴 Critical  
**Status**: 🚧 Fixing  
**Reported**: 2025-11-20

## Bug Description

**What's broken?**  
Population consumption calculation is 60-80x lower than GDD spec, causing infinite resources.

**Expected behavior**:  
100 population should consume 1800 food/hour and 3600 water/hour

**Actual behavior**:  
100 population consumes only 22.5 food/hour and 45 water/hour

**Steps to reproduce**:

1. Create settlement with 100 population
2. Wait 1 hour of game time
3. Check resource consumption
4. Food consumed is ~22 units instead of 1800

## Impact

**Who is affected?**  
All players - game is too easy, no resource pressure

**How critical?**  
Critical - breaks core game balance

**Workaround available?**  
No workaround, fundamental balance issue

## Investigation

### Error Messages
```

No errors - logic bug, not runtime error

```

### Affected Files
- `server/src/game/consumption-calculator.ts` - Incorrect formula
- `server/src/game/game-loop.ts` - Calls calculator every tick

### Root Cause
**What's causing this?**
Formula uses consumption per tick (0.005/tick) but only processes once per 10 minutes instead of 36,000 times.

**Why did this happen?**
Misunderstanding of tick rate vs. processing frequency

## Fix Approach

### Strategy
Multiply per-tick consumption by actual ticks elapsed (36,000 ticks = 10 minutes)

### Files to Change
- `server/src/game/consumption-calculator.ts` - Fix formula to account for tick count

### Risk Assessment
**Risk level**: 🟢 Low
**Why?**: Isolated calculation, easy to test, no dependencies

[...continue as needed...]
```
