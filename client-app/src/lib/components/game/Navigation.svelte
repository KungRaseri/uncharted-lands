<script lang="ts">
	import Menu from 'svelte-material-icons/Menu.svelte';
	import Close from 'svelte-material-icons/Close.svelte';

	const navigationLinks = [
		{
			name: 'Overview',
			url: '/game',
			badge_value: 0
		},
		{
			name: 'Settlements',
			url: '/game/settlements',
			badge_value: 0
		},
		{
			name: 'Map',
			url: '/game/map',
			badge_value: 0
		},
		{
			name: 'Mine',
			url: '/game/mine',
			badge_value: 0
		}
	];

	let currentPage: number = 0;
</script>

<div>
	<div class="sm:hidden">
		<label for="tabs" class="sr-only">Select a tab</label>
		<!-- Use an "onChange" listener to redirect the user to the selected tab URL. -->
		<select
			id="tabs"
			name="tabs"
			class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
		>
			{#each navigationLinks as link}
				<option>{link.name}</option>
			{/each}
		</select>
	</div>
	<div class="hidden sm:block">
		<div class="border-b border-gray-200">
			<nav class="-mb-px flex space-x-8" aria-label="Tabs">
				{#each navigationLinks as link}
					<a
						href={link.url}
						class={navigationLinks[currentPage].name == link.name
							? 'border-indigo-500 text-indigo-600 hover:text-gray-700 hover:border-gray-200 whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm'}
					>
						{link.name}
						{#if link.badge_value > 0}
							<span
								class="bg-gray-100 text-gray-900 hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block"
							>
								{link.badge_value}
							</span>
						{/if}
					</a>
				{/each}
				<!-- Current: "border-indigo-500 text-indigo-600", Default: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200" -->
				<!-- <a
					href="#"
					class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm"
				>
					Applied

					<!-- Current: "bg-indigo-100 text-indigo-600", Default: "bg-gray-100 text-gray-900" -->
				<!-- <span
						class="bg-gray-100 text-gray-900 hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block"
						>52</span
					>
				</a> -->
			</nav>
		</div>
	</div>
</div>
