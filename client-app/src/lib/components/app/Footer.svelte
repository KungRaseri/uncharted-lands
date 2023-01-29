<script lang="ts">
	import Github from 'svelte-material-icons/Github.svelte';
</script>

<footer class="bg-surface-700 hidden lg:block justify-center items-center p-5 space-y-3">
	<div class="w-fit mx-auto">
		<a
			href="https://github.com/redsyndicate/browser-game"
			class="text-gray-50 hover:text-orange-600"
		>
			<span class="sr-only">GitHub</span>
			<Github size={24} />
		</a>
	</div>

	<nav class="w-fit mx-auto flex" aria-label="Footer">
		<div class="px-5">
			<a href="/game" class="btn variant-soft-surface"> Game </a>
		</div>

		<div class="px-5">
			<a href="/forum" class="btn variant-soft-surface"> Forum </a>
		</div>

		<div class="px-5">
			<a href="/kb" class="btn variant-soft-surface"> Knowledgebase </a>
		</div>

		<div class="px-5">
			<a href="/support" class="btn variant-soft-surface"> Support </a>
		</div>
	</nav>
</footer>
