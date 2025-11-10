<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	import LightSwitch from './LightSwitch.svelte';

	import { Menu, User, X, Bell } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let { isMainMenuOpen = $bindable(false) }: { isMainMenuOpen?: boolean } = $props();
	let userMenuOpen = $state(false);
	let userMenuRef: HTMLDivElement | undefined = $state();

	// Close menu when clicking outside
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef && !userMenuRef.contains(event.target as Node)) {
				userMenuOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<header class="bg-surface-100 dark:bg-surface-800 shadow-md relative z-50">
	<div class="flex items-center justify-between gap-4 p-4">
		<!-- Lead slot -->
		<div class="flex items-center gap-2">
			<div class="block sm:hidden">
				<button
					type="button"
					class="px-1.5 py-0 btn-icon preset-tonal-surface-500 justify-center items-center"
					aria-controls="mobile-menu"
					aria-expanded={isMainMenuOpen}
					onclick={() => {
						isMainMenuOpen = !isMainMenuOpen;
					}}
				>
					{#if !isMainMenuOpen}
						<Menu size={24} />
					{:else}
						<X size={24} />
					{/if}
				</button>
			</div>
			<div class="hidden sm:flex gap-2">
				{#each page.data?.mainMenuLinks ?? [] as link}
				{#if link.requiredRole}
					{#if page.data?.account}
						<a
							href={link.route}
							class="btn rounded-md
								{link.isActive ? 'bg-primary-600' : ''}
								{page.data?.account?.role !== link.requiredRole ? 'hidden' : ''}
								hover:bg-primary-500
								"
						>
							<span class="">
								{link.name}
							</span>
						</a>
					{/if}
				{:else}
					<a
						href={link.route}
						class="btn rounded-md
							{link.isActive ? 'bg-primary-600' : ''}
							{page.data?.account && link.requiredRole && page.data?.account?.role !== link.requiredRole
							? 'hidden'
							: ''}
							hover:bg-primary-500
							"
						aria-current={link.isActive ? 'page' : undefined}
					>
						<span class="">
							{link.name}
						</span>
					</a>
				{/if}
			{/each}
			</div>
		</div>

		<!-- Trail slot -->
		<div class="flex items-center justify-end gap-2">
			<LightSwitch />
			{#if !page.data?.account}
				<a
					href="/sign-in"
					class="btn rounded-md
						hover:bg-primary-500
						{page.route.id === '/(auth)/sign-in' ? 'bg-primary-600' : ''}
						"
					data-testid="header-signin"
				>
					<span class=""> Sign in </span>
				</a>
				<a
					href="/register"
					class="btn rounded-md
						{page.route.id === '/(auth)/register' ? 'bg-primary-600' : ''}
						hover:bg-primary-500
						"
					data-testid="header-register"
				>
					<span class=""> Register </span>
				</a>
			{:else}
				<!-- Notifications Button -->
				<button type="button" class="btn-icon preset-filled-surface-500 rounded-full">
					<Bell size={20} />
				</button>

				<!-- User Menu -->
				<div class="relative" bind:this={userMenuRef}>
					<button
						type="button"
						class="btn-icon preset-filled-surface-500 rounded-full"
						id="user-menu-button"
						aria-expanded={userMenuOpen}
						aria-haspopup="true"
						onclick={() => {
							userMenuOpen = !userMenuOpen;
						}}
					>
						{#if page.data?.account?.profile?.picture}
							<img
								class="w-6 h-6 rounded-full object-cover"
								src={page.data.account.profile.picture}
								alt={page.data.account.profile.username || 'User'}
								onerror={(e) => {
									// If image fails to load, replace with User icon
									const parent = e.currentTarget.parentElement;
									e.currentTarget.remove();
									const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
									icon.setAttribute('width', '20');
									icon.setAttribute('height', '20');
									icon.setAttribute('viewBox', '0 0 24 24');
									icon.setAttribute('fill', 'none');
									icon.setAttribute('stroke', 'currentColor');
									icon.setAttribute('stroke-width', '2');
									icon.innerHTML = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
									parent?.appendChild(icon);
								}}
							/>
						{:else}
							<User size={20} />
						{/if}
					</button>

					{#if userMenuOpen}
						<div
							transition:slide
							class="list-nav card preset-filled-surface-100-900 p-2 absolute right-0 mt-2 rounded-md shadow-lg z-50 min-w-[200px]"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="user-menu-button"
							tabindex="-1"
						>
							<ul class="space-y-1">
								{#each page.data?.userMenuLinks ?? [] as link}
									{#if !link.requiredRole || link.requiredRole === page.data?.account?.role}
										<li>
											<a
												href={link.route}
												class="btn w-full justify-start rounded-md
													{link.isActive ? 'preset-filled-primary-500' : 'hover:preset-tonal-surface-500'}
												"
												aria-current={page.route.id?.includes(link.route) ? 'page' : undefined}
												onclick={() => {
													userMenuOpen = false;
												}}
											>
												{link.name}
											</a>
										</li>
									{/if}
								{/each}
								<li>
									<hr class="my-2" />
								</li>
								<li>
									<form method="POST" action="/auth?/signout">
										<button
											type="submit"
											class="btn w-full justify-start rounded-md hover:preset-tonal-error-500"
										>
											Sign out
										</button>
									</form>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- Mobile menu, show/hide based on menu state. -->
{#if isMainMenuOpen}
	<div
		transition:slide
		class="sm:hidden"
		id="mobile-menu"
		role="menu"
		aria-orientation="vertical"
		aria-labelledby="main-menu-button"
	>
		<div class="m-0 p-0 space-y-0 btn-group-vertical w-full rounded-none">
			{#each page.data?.mainMenuLinks ?? [] as link}
				<a
					href={link.route}
					class="btn rounded-none
						hover:bg-primary-500
						{page.route.id === link.route ||
					page.route.id === `/(protected)${link.route}` ||
					page.route.id === `/(auth)${link.route}`
						? 'bg-primary-600'
						: ''}
						"
					onclick={() => {
						isMainMenuOpen = false;
					}}
					aria-current={page.route.id?.includes(link.route) ? 'page' : undefined}
				>
					<span class="">
						{link.name}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}
