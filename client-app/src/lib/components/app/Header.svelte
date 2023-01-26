<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';

	import { AppBar } from '@skeletonlabs/skeleton';
	import Menu from 'svelte-material-icons/Menu.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import BellOutline from 'svelte-material-icons/BellOutline.svelte';
	import { slide } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let isMainMenuOpen = false;
	export let isUserMenuOpen = false;

	function toggleMainMenu() {
		dispatch('toggleMainMenu', {});
	}

	function toggleUserMenu() {
		dispatch('toggleUserMenu', {});
	}
</script>

<AppBar background="bg-surface-700 px-2 py-3" slotTrail="absolute flex items-center top-3 right-3">
	<svelte:fragment slot="lead">
		<div class="block sm:hidden">
			<button
				type="button"
				class="px-1.5 py-0 btn-icon variant-ghost-surface justify-center items-center"
				aria-controls="mobile-menu"
				aria-expanded="false"
				on:click={toggleMainMenu}
			>
				{#if !isMainMenuOpen}
					<Menu size={24} />
				{:else}
					<Close size={24} />
				{/if}
			</button>
		</div>
		<div class="hidden sm:block">
			{#each $page.data.mainMenuLinks as link}
				{#if link.requiredRole}
					{#if $page.data.account}
						<a
							href={link.route}
							class="btn btn-base {link.isActive
								? 'variant-ghost-primary'
								: 'variant-ghost-secondary'}
											{$page.data.account.role !== link.requiredRole ? 'hidden' : ''}
											"
						>
							<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
								{link.name}
							</span>
						</a>
					{/if}
				{/if}
				{#if !link.requiredRole}
					<a
						href={link.route}
						class="btn btn-base {link.isActive
							? 'variant-ghost-primary'
							: 'variant-ghost-secondary'}
									{$page.data.account && link.requiredRole && $page.data.account.role !== link.requiredRole
							? 'hidden'
							: ''}
									"
						aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
					>
						<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
							{link.name}
						</span>
					</a>
				{/if}
			{/each}
		</div>
	</svelte:fragment>

	<svelte:fragment slot="trail">
		<div class="space-x-3">
			{#if !$page.data.account}
				<a
					href="/login"
					class="btn btn-base {$page.route.id?.includes('/login')
						? 'variant-ghost-primary'
						: 'variant-ghost-secondary'}"
				>
					Sign in
				</a>
				<a
					href="/register"
					class="btn btn-base {$page.route.id?.includes('/register')
						? 'variant-ghost-primary'
						: 'variant-ghost-secondary'}"
				>
					Sign up
				</a>
			{/if}
			{#if $page.data.account}
				<div class="flex">
					<button type="button" class="px-1.5 py-0 btn-icon variant-ghost-surface">
						<BellOutline size={24} />
					</button>

					<button
						type="button"
						class="px-1.5 py-0 rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
						id="user-menu-button"
						aria-expanded="false"
						aria-haspopup="true"
						on:click={toggleUserMenu}
					>
						<span class="sr-only">Open user menu</span>
						<img
							class="h-8 w-8 rounded-full"
							src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
							alt=""
						/>
					</button>
				</div>
			{/if}
		</div>
	</svelte:fragment>
</AppBar>
{#if isUserMenuOpen}
	<div
		transition:slide
		class="absolute right-5 z-10"
		role="menu"
		aria-orientation="vertical"
		aria-labelledby="user-menu-button"
		tabindex="-1"
	>
		{#each $page.data.userMenuLinks as link}
			<a
				href={link.route}
				class="{link.isActive ? 'btn variant-ghost-primary' : 'btn variant-ghost-secondary'}
							{link.requiredRole && $page.data.account.role !== link.requiredRole ? 'hidden' : ''}
							px-3 py-2 text-base font-medium"
				aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
				on:click={toggleUserMenu}
			>
				<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
					{link.name}
				</span>
			</a>
		{/each}
	</div>
{/if}
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
		<div class="m-0 p-0 space-y-1">
			<!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
			{#each $page.data.mainMenuLinks as link}
				<a
					href={link.route}
					class="{$page.route.id === link.route ||
					$page.route.id === `/(protected)${link.route}` ||
					$page.route.id === `/(auth)${link.route}`
						? 'btn variant-soft-primary hover:bg-slate-50'
						: 'btn variant-soft-secondary'}
						block text-base font-medium
						rounded-none"
					aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
				>
					<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
						{link.name}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}
