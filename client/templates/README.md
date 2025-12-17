# Copilot Conversation Templates

> **Purpose**: Speed up GitHub Copilot's ability to understand context and summarize conversation history by using standardized templates.

---

## Why Use Templates?

Templates help GitHub Copilot:

- ✅ **Instantly understand** where you are in development
- ✅ **Skip re-reading** 100+ messages of conversation history
- ✅ **Provide better answers** with complete context
- ✅ **Save time** on context-setting at session start

Instead of Copilot spending 30 seconds parsing conversation history, templates give instant clarity.

---

## Available Templates

### 1. [SESSION-START.md](./SESSION-START.md) 🚀

**Use when**: Starting a new coding session

**Copy this when**:

- Opening VS Code for the day
- Switching between features/tasks
- Resuming work after a break

**What it provides**:

- Current focus and goals
- Previous context and decisions
- Blockers and questions
- Acceptance criteria

**Time saved**: 30-60 seconds of context parsing

---

### 2. [FEATURE-IMPLEMENTATION.md](./FEATURE-IMPLEMENTATION.md) 🏗️

**Use when**: Implementing new features from the GDD

**Copy this when**:

- Starting a new feature
- Need full implementation plan
- Want structured approach

**What it provides**:

- Technical approach (backend + frontend)
- Implementation steps (4 phases)
- Testing plan
- Documentation checklist

**Time saved**: 2-3 minutes of planning questions

---

### 3. [BUG-FIX.md](./BUG-FIX.md) 🐛

**Use when**: Fixing bugs or debugging issues

**Copy this when**:

- Investigating a bug
- Fixing reported issues
- Debugging errors

**What it provides**:

- Bug description and impact
- Investigation checklist
- Fix approach
- Testing verification

**Time saved**: 1-2 minutes of back-and-forth

---

### 4. [DESIGN-DECISION.md](./DESIGN-DECISION.md) 🤔

**Use when**: Making architectural or design decisions

**Copy this when**:

- Choosing between implementation approaches
- Significant technical decisions
- Architecture changes

**What it provides**:

- Options comparison (pros/cons)
- Decision rationale
- Implementation plan
- Consequences

**Time saved**: 3-5 minutes of discussion

---

### 5. [CODE-REVIEW.md](./CODE-REVIEW.md) 🔍

**Use when**: Reviewing code or pull requests

**Copy this when**:

- Reviewing PRs
- Pre-commit checks
- Discussing implementation details

**What it provides**:

- Review checklist (quality, tests, security)
- Issue categorization (critical/high/low)
- Decision recommendation
- Follow-up tasks

**Time saved**: 2-4 minutes of review setup

---

### 6. [ARTIFACT-DECISION.md](./ARTIFACT-DECISION.md) 📦

**Use when**: Deciding whether to create artifacts vs. direct edits

**Copy this when**:

- About to create significant code
- Uncertain about artifact vs. direct edit
- Want to collaborate on approach

**What it provides**:

- Decision criteria checklist
- Option comparison (artifact/direct/hybrid)
- Quick decision guide
- Communication shortcuts

**Time saved**: 30-60 seconds per decision + prevents lost code

---

## Quick Start Guide

### Step 1: Copy the Template

Navigate to the template you need:

```powershell
# View template
cat client/templates/SESSION-START.md

# Copy to clipboard (Windows)
Get-Content client/templates/SESSION-START.md | Set-Clipboard
```

### Step 2: Fill in the Blanks

Replace `[placeholders]` with your actual information:

- `[YYYY-MM-DD]` → Today's date
- `[Feature name]` → What you're working on
- `[file-path]` → Actual file paths

### Step 3: Paste in Chat

Start your Copilot conversation with the filled template. Copilot will have instant context.

---

## Example Workflow

### Starting Your Day

```powershell
# 1. Copy session template
Get-Content client/templates/SESSION-START.md | Set-Clipboard

# 2. Fill in the template (in chat)
# 3. Paste and start conversation with Copilot
```

### Implementing a Feature

```powershell
# 1. Start with session template (context)
# 2. Then use feature template for structure
Get-Content client/templates/FEATURE-IMPLEMENTATION.md | Set-Clipboard

# 3. Copilot now knows:
#    - Where you are (session)
#    - What you're building (feature)
#    - How to help (structured plan)
```

---

## Template Maintenance

### When to Update Templates

- ✏️ **Add new sections** as project evolves
- 🔄 **Refine questions** based on what Copilot asks most
- 🗑️ **Remove outdated** sections

### Customization

Feel free to:

- Add project-specific fields
- Remove irrelevant sections
- Create new templates for common tasks

### Contribution

If you create a useful template variation, add it to this folder!

---

## Best Practices

### 1. Be Specific, Not Vague

❌ **Bad**: "Working on disaster system"  
✅ **Good**: "Working on: Gradual damage calculation in `server/src/game/disaster-manager.ts` per GDD Section 3.4.5"

### 2. Reference Docs Instead of Re-explaining

❌ **Bad**: "Disasters should use this formula: severity - preparedness..."  
✅ **Good**: "See GDD-Monolith.md Section 3.4.5 for damage formula"

### 3. State Decisions Explicitly

❌ **Bad**: "We talked about processing frequency"  
✅ **Good**: "**Decided**: 10Hz processing (every 6 ticks) for disasters (2025-11-20)"

### 4. Use Artifacts for Important Code

When Copilot generates important code:

```
"Save this disaster-manager.ts as an artifact"
```

Artifacts are **instantly accessible** - no conversation history parsing needed.

### 5. Create Checkpoints

Every ~20 messages or when switching tasks:

```
"Summarize what we've done so far"
```

Creates mental checkpoints for Copilot to reference.

---

## Performance Impact

### Without Templates

- **Context gathering**: 30-60 seconds
- **Clarifying questions**: 2-5 back-and-forth messages
- **Total time to useful answer**: 3-5 minutes

### With Templates

- **Context gathering**: Instant (pre-provided)
- **Clarifying questions**: 0-1 (only edge cases)
- **Total time to useful answer**: 10-30 seconds

**Time saved per session**: 2-5 minutes  
**Time saved per day** (5 sessions): 10-25 minutes  
**Time saved per week**: 50-125 minutes (~1-2 hours)

---

## Keyboard Shortcuts (Optional)

Create PowerShell aliases for quick access:

```powershell
# Add to your PowerShell profile ($PROFILE)
function Get-SessionTemplate {
    Get-Content "C:\code\uncharted-lands\client\templates\SESSION-START.md" | Set-Clipboard
    Write-Host "Session template copied to clipboard!"
}

function Get-FeatureTemplate {
    Get-Content "C:\code\uncharted-lands\client\templates\FEATURE-IMPLEMENTATION.md" | Set-Clipboard
    Write-Host "Feature template copied to clipboard!"
}

function Get-BugTemplate {
    Get-Content "C:\code\uncharted-lands\client\templates\BUG-FIX.md" | Set-Clipboard
    Write-Host "Bug fix template copied to clipboard!"
}

# Usage:
# Get-SessionTemplate
# Get-FeatureTemplate
# Get-BugTemplate
```

---

## FAQ

**Q: Do I need to fill every field?**  
A: No! Fill only what's relevant. Empty sections can be deleted.

**Q: Can I use multiple templates in one conversation?**  
A: Yes! Start with SESSION-START, then use FEATURE-IMPLEMENTATION for structure.

**Q: What if my task doesn't fit any template?**  
A: Use SESSION-START as baseline, then explain your specific needs.

**Q: Should I use templates for quick questions?**  
A: No - templates are for complex work sessions. Quick questions don't need them.

---

## Related Documentation

- **[GDD-Quick-Start.md](../docs/game-design/GDD-Quick-Start.md)** - How to use game design docs
- **[GDD-Implementation-Tracker.md](../docs/game-design/GDD-Implementation-Tracker.md)** - What's implemented
- **[Feature-Spec-Template.md](../docs/templates/Feature-Spec-Template.md)** - Detailed feature specs

---

## Feedback

If you have suggestions for improving these templates:

1. Try the improvement in your own workflow
2. If it works well, update the template
3. Commit with a clear message explaining the improvement

---

**Last Updated**: November 20, 2025  
**Maintained By**: Development Team
