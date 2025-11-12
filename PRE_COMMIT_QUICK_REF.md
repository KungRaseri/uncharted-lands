# Pre-Commit Hooks Quick Reference

## ✅ What's Installed

Both `server/` and `client/` now have:

- **Husky** - Git hooks manager
- **lint-staged** - Run commands on staged files only

## 🎯 What Happens on Commit

### Server

When you commit `.ts` files:

1. ✨ Prettier formats code
2. 🔍 ESLint checks for issues (auto-fixes when possible)
3. 📝 TypeScript checks types

### Client

When you commit `.ts`, `.svelte`, `.json`, `.md`, `.css` files:

1. ✨ Prettier formats code
2. 🔍 ESLint checks `.ts` and `.svelte` files (auto-fixes when possible)

## 📋 Quick Commands

### Run Checks Manually

```bash
# Server
cd server
npm run format    # Format all files
npm run lint      # Lint all files
npm run check     # Type check

# Client
cd client
npm run format    # Format all files
npm run lint      # Lint all files
npm run check     # Type check
```

### Bypass Hooks (Emergency Only!)

```bash
git commit -m "Emergency fix" --no-verify
```

⚠️ Only use in emergencies!

## 🔧 Troubleshooting

### Hooks not running?

```bash
cd server  # or client
npm install
npm run prepare
```

### See what hooks do?

```bash
cat .husky/pre-commit
```

### Test hooks without committing

```bash
npx lint-staged
```

## 📚 More Info

See [PRE_COMMIT_HOOKS.md](./PRE_COMMIT_HOOKS.md) for detailed documentation.
