# Script to switch SvelteKit from Vercel adapter to Node adapter for Docker deployment
# Run this in the client directory

Write-Host "🔧 Switching SvelteKit adapter from Vercel to Node..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Uninstall Vercel adapter
Write-Host "📦 Uninstalling @sveltejs/adapter-vercel..." -ForegroundColor Yellow
npm uninstall @sveltejs/adapter-vercel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to uninstall Vercel adapter" -ForegroundColor Red
    exit 1
}

# Step 2: Install Node adapter
Write-Host "📦 Installing @sveltejs/adapter-node..." -ForegroundColor Yellow
npm install -D @sveltejs/adapter-node

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node adapter" -ForegroundColor Red
    exit 1
}

# Step 3: Update svelte.config.js
Write-Host "📝 Updating svelte.config.js..." -ForegroundColor Yellow

$configPath = "svelte.config.js"
$configContent = @"
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Svelte 5 uses vitePreprocess by default
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			out: 'build',
			precompress: false,
			envPrefix: ''
		})
	}
};

export default config;
"@

Set-Content -Path $configPath -Value $configContent -NoNewline

Write-Host ""
Write-Host "✅ Successfully switched to Node adapter!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test the build locally:"
Write-Host "     npm run build" -ForegroundColor Gray
Write-Host "     npm run preview" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test with Docker:"
Write-Host "     docker build -t uncharted-client ." -ForegroundColor Gray
Write-Host "     docker run -p 3000:3000 uncharted-client" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Update environment variables if needed"
Write-Host ""
