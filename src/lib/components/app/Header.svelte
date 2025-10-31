<script lang="ts">
	import { page } from '$app/stores';

	import { AppBar, popup, LightSwitch } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

	import { Menu, User, X, Bell } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	const MenuOptions: PopupSettings = {
		placement: 'bottom',
		event: 'click',
		target: 'userMenu'
	};

	export let isMainMenuOpen = false;
</script>

<AppBar
	gridColumns="grid-cols-3"
	slotDefault="place-self-center"
	slotTrail="place-content-end"
	background="bg-surface-100-800-token"
	shadow="shadow-md"
>
	<svelte:fragment slot="lead">
		<div class="block sm:hidden">
			<button
				type="button"
				class="px-1.5 py-0 btn-icon variant-soft-surface justify-center items-center"
				aria-controls="mobile-menu"
				aria-expanded="false"
				on:click={() => {
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
		<div class="hidden sm:block">
			{#each $page.data.mainMenuLinks as link}
				{#if link.requiredRole}
					{#if $page.data.account}
						<a
							href={link.route}
							class="btn rounded-md
								{link.isActive ? 'bg-primary-active-token' : ''}
								{$page.data.account.role !== link.requiredRole ? 'hidden' : ''}
								bg-primary-hover-token
								"
						>
							<span class="text-token">
								{link.name}
							</span>
						</a>
					{/if}
				{:else}
					<a
						href={link.route}
						class="btn rounded-md
							{link.isActive ? 'bg-primary-active-token' : ''}
							{$page.data.account && link.requiredRole && $page.data.account.role !== link.requiredRole
							? 'hidden'
							: ''}
							bg-primary-hover-token
							"
						aria-current={link.isActive ? 'page' : undefined}
					>
						<span class="text-token">
							{link.name}
						</span>
					</a>
				{/if}
			{/each}
		</div>
	</svelte:fragment>

	<svelte:fragment slot="trail">
		<div class="flex space-x-2">
			<LightSwitch />
			{#if !$page.data.account}
				<a
					href="/sign-in"
					class="btn rounded-md text-token
						bg-primary-hover-token
						{$page.route.id === '/(auth)/sign-in' ? 'bg-primary-active-token' : ''}
						"
					data-testid="header-signin"
				>
					<span class="text-token"> Sign in </span>
				</a>
				<a
					href="/register"
					class="btn rounded-md
						{$page.route.id === '/(auth)/register' ? 'bg-primary-active-token' : ''}
						bg-primary-hover-token
						"
					data-testid="header-register"
				>
					<span class="text-token"> Register </span>
				</a>
			{:else}
				<div>
					<button type="button" class="btn-icon bg-surface-200-700-token m-0 p-0">
						<Bell size={24} />
					</button>

					<button
						type="button"
						class="btn-icon bg-surface-200-700-token m-0 p-0"
						id="user-menu-button"
						aria-expanded="false"
						aria-haspopup="true"
						use:popup={MenuOptions}
					>
						{#if $page.data.account.profile?.picture}
							<img class="w-6 rounded-full" src={$page.data.account.profile.picture} alt="" />
						{:else}
							<div class="w-6 items-center justify-center mx-auto">
								<User size={24} />
							</div>
						{/if}
					</button>
					<span class="relative rounded-md">
						<nav
							class="list-nav card p-3 -ml-5 mt-1 rounded-md"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="user-menu-button"
							tabindex="-1"
							data-popup="userMenu"
						>
							{#each $page.data.userMenuLinks as link}
								<div
									class="{link.requiredRole && link.requiredRole !== $page.data.account.role
										? 'hidden'
										: ''}							"
								>
									<a
										href={link.route}
										class="btn
									{link.isActive ? 'bg-primary-active-token' : ''}
									"
										aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
									>
										<span class="text-token">
											{link.name}
										</span>
									</a>
								</div>
							{/each}
							<form method="POST" action="/auth?/signout">
								<button class="btn">
									<span class="text-token"> Sign out </span>
								</button>
							</form>
						</nav>
					</span>
				</div>
			{/if}
		</div>
	</svelte:fragment>
</AppBar>

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
			{#each $page.data.mainMenuLinks as link}
				<a
					href={link.route}
					class="btn rounded-none
						bg-primary-hover-token
						{$page.route.id === link.route ||
					$page.route.id === `/(protected)${link.route}` ||
					$page.route.id === `/(auth)${link.route}`
						? 'bg-primary-active-token'
						: ''}
						"
					on:click={() => {
						isMainMenuOpen = false;
					}}
					aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
				>
					<span class="text-token">
						{link.name}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}
