# Pre-Commit Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to run automatic checks before commits, ensuring code quality and preventing broken builds from being committed.

## What Gets Checked

### Server (`server/`)

Before committing TypeScript files in the server:

1. **Format** - Prettier formats the code
2. **Lint** - ESLint checks for code quality issues
3. **Type Check** - TypeScript compiler checks for type errors

### Client (`client/`)

Before committing files in the client:

1. **Format** - Prettier formats TypeScript, Svelte, JSON, Markdown, and CSS files
2. **Lint** - ESLint checks TypeScript and Svelte files
3. **Type Check** - Runs on commit (via lint-staged)

## How It Works

### Automatic Checks

When you run `git commit`, Husky automatically:

1. Intercepts the commit
2. Runs `lint-staged` which:
   - Only checks **staged files** (files you're committing)
   - Runs the appropriate checks based on file type
   - Automatically fixes issues when possible
3. If all checks pass, the commit proceeds
4. If any check fails, the commit is blocked

### Example Workflow

```bash
# Stage your changes
git add server/src/api/routes/worlds.ts

# Try to commit
git commit -m "Add world generation endpoint"

# Husky runs automatically:
# ✓ Formatting... (auto-fixed)
# ✓ Linting... (auto-fixed)
# ✓ Type checking...
# ✓ Commit successful!
```

## Configuration

### Server Configuration

**File**: `server/package.json`

```json
{
	"lint-staged": {
		"src/**/*.ts": ["prettier --write", "eslint --fix", "tsc --noEmit"]
	}
}
```

### Client Configuration

**File**: `client/package.json`

```json
{
	"lint-staged": {
		"*.{ts,svelte}": ["prettier --write", "eslint --fix"],
		"*.{json,md,css}": ["prettier --write"]
	}
}
```

## Manual Commands

You can still run checks manually:

### Server

```bash
cd server

# Format all files
npm run format

# Lint all files
npm run lint

# Type check
npm run check

# Format check (no changes)
npm run format:check
```

### Client

```bash
cd client

# Format all files
npm run format

# Lint all files
npm run lint

# Type check
npm run check
```

## Bypassing Hooks (Emergency Only)

If you absolutely need to commit without running checks:

```bash
git commit -m "Emergency fix" --no-verify
```

⚠️ **Warning**: Only use `--no-verify` in emergencies. It defeats the purpose of the pre-commit hooks.

## Common Issues

### Issue: "Husky command not found"

**Solution**: Run `npm install` in the directory

```bash
cd server && npm install
cd client && npm install
```

### Issue: "lint-staged takes too long"

**Solution**: lint-staged only checks staged files. If you have many staged files, consider committing in smaller chunks:

```bash
# Commit files in batches
git add server/src/api/routes/*.ts
git commit -m "Update API routes"

git add server/src/db/*.ts
git commit -m "Update database schema"
```

### Issue: "Type check fails but I can't see the error"

**Solution**: Run the type check manually to see full output:

```bash
cd server && npm run check
# or
cd client && npm run check
```

### Issue: "Pre-commit hook fails in CI/CD"

**Solution**: Husky hooks only run locally. CI/CD has its own checks defined in `.github/workflows/`.

## Disabling Hooks Temporarily

If you need to disable hooks for development:

```bash
# Unset the Husky directory
cd server  # or client
npx husky uninstall

# To re-enable
npm run prepare
```

## How to Update

### Update Husky

```bash
cd server  # or client
npm install --save-dev husky@latest
```

### Update lint-staged

```bash
cd server  # or client
npm install --save-dev lint-staged@latest
```

### Modify Checks

Edit the `lint-staged` section in `package.json`:

```json
{
	"lint-staged": {
		"*.ts": [
			"prettier --write",
			"eslint --fix",
			"tsc --noEmit",
			"npm test" // Add tests
		]
	}
}
```

## Benefits

✅ **Catch errors early** - Before they reach CI/CD
✅ **Consistent code style** - Auto-formatting on commit
✅ **Faster feedback** - No waiting for CI to find typos
✅ **Better git history** - No "fix lint" commits
✅ **Team consistency** - Everyone runs same checks

## Troubleshooting

### Hooks not running?

1. Check `.husky/pre-commit` exists:

   ```bash
   ls -la .husky/
   ```

2. Ensure it's executable (Unix/Mac):

   ```bash
   chmod +x .husky/pre-commit
   ```

3. Check Git hooks are enabled:

   ```bash
   git config core.hooksPath
   # Should output: .husky
   ```

4. Reinstall hooks:
   ```bash
   npm run prepare
   ```

### Hooks running but not working?

1. Check Node/npm are accessible:

   ```bash
   node --version
   npm --version
   ```

2. Check packages are installed:

   ```bash
   npm list husky lint-staged
   ```

3. Test lint-staged manually:
   ```bash
   npx lint-staged
   ```

## Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
