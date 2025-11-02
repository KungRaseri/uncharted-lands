<script lang="ts">
	import { Github } from 'lucide-svelte';
</script>

<footer class="hidden sm:block p-5 space-y-3 justify-center items-center bg-surface-100 dark:bg-surface-800">
	<div class="w-fit mx-auto">
		<a href="https://github.com/redsyndicate/browser-game" class="">
			<span class="sr-only">GitHub</span>
			<Github size={24} />
		</a>
	</div>

	<nav class="w-fit mx-auto flex" aria-label="Footer">
		<div class="px-5">
			<a
				href="/game"
				class="
					btn rounded-md 
					hover:bg-primary-500
					"
			>
				Game
			</a>
		</div>

		<div class="px-5">
			<a
				href="/forum"
				class="
					btn rounded-md 
					hover:bg-primary-500
					"
			>
				Forum
			</a>
		</div>

		<div class="px-5">
			<a
				href="/kb"
				class="
					btn rounded-md 
					hover:bg-primary-500
					"
			>
				Knowledgebase
			</a>
		</div>

		<div class="px-5">
			<a
				href="/support"
				class="
					btn rounded-md 
					hover:bg-primary-500
					"
			>
				Support
			</a>
		</div>
	</nav>
</footer>
