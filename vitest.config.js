import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			globals: true,
			environment: 'jsdom',
			// Simplified glob pattern - only use .test.ts files (saves collection time)
			include: ['tests/unit/**/*.test.ts'],
			// Explicitly exclude unnecessary files (faster test collection)
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/.svelte-kit/**',
				'**/build/**',
				'**/coverage/**'
			],
			setupFiles: ['./vitest.setup.js'],
			// Disable isolation to run all tests in the same global context
			isolate: false,
			// Enable parallel test execution for faster runs
			pool: 'threads',
			poolOptions: {
				threads: {
					singleThread: false, // Enable multi-threading
					isolate: false // Keep shared context for speed
				}
			},
			// Optimize worker count (adjust based on CPU cores)
			maxWorkers: 4,
			minWorkers: 1,
			alias: {
				$lib: '/src/lib',
				$app: '/.svelte-kit/runtime/app'
			},
			// Faster TypeScript transformation
			esbuild: {
				target: 'node22' // Match Node.js version for optimal compilation
			},
			coverage: {
				provider: 'v8',
				all: false,
				reporter: ['text', 'json', 'html', 'lcov'],
				include: ['src/lib/game/**/*.{js,ts}', 'src/lib/utils/**/*.{js,ts}', 'src/lib/timespan.ts'],
				exclude: [
					'**/*.test.{js,ts}',
					'**/*.spec.{js,ts}',
					'**/*.d.ts',
					'**/*.config.{js,ts}',
					'**/node_modules/**',
					// Exclude SvelteKit specific files that can't be parsed by V8
					'**/*.svelte',
					'**/+*.ts',
					'**/+*.js',
					'src/hooks.*.ts',
					'src/app.html',
					'src/error.html',
					// Exclude server-side code (not testable in jsdom)
					'src/lib/server/**',
					// Exclude files with advanced TS that V8 can't parse
					'src/lib/stores/game/socket.ts',
					// Exclude API client (better tested via E2E)
					'src/lib/game/world-api.ts',
					// Exclude image assets
					'**/*.{png,jpg,jpeg,gif,svg,webp}',
					// Exclude CSS
					'**/*.css',
					// Exclude markdown
					'**/*.md',
					// Exclude type definitions
					'src/lib/types/**',
					'src/app.d.ts',
					'src/index.d.ts'
				],
				reportsDirectory: './coverage'
			}
		},
		resolve: {
			conditions: ['browser']
		}
	})
);
