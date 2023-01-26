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
			<a href="/game" class="text-base text-gray-50 hover:text-orange-600"> Game </a>
		</div>

		<div class="px-5">
			<a href="/forum" class="text-base text-gray-50 hover:text-orange-600"> Forum </a>
		</div>

		<div class="px-5">
			<a href="/kb" class="text-base text-gray-50 hover:text-orange-600"> Knowledgebase </a>
		</div>

		<div class="px-5">
			<a href="/support" class="text-base text-gray-50 hover:text-orange-600"> Support </a>
		</div>
	</nav>
</footer>
