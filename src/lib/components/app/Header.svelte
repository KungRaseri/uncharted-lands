<script lang="ts">
	import { page } from '$app/stores';

	import LightSwitch from './LightSwitch.svelte';

	import { Menu, User, X, Bell } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let { isMainMenuOpen = $bindable(false) }: { isMainMenuOpen?: boolean } = $props();
	let userMenuOpen = $state(false);
</script>

<header class="bg-surface-100 dark:bg-surface-800 shadow-md">
	<div class="grid grid-cols-3 items-center gap-4 p-4">
		<!-- Lead slot -->
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
			{#each $page.data?.mainMenuLinks ?? [] as link}
				{#if link.requiredRole}
					{#if $page.data?.account}
						<a
							href={link.route}
							class="btn rounded-md
								{link.isActive ? 'bg-primary-600' : ''}
								{$page.data?.account?.role !== link.requiredRole ? 'hidden' : ''}
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
							{$page.data?.account && link.requiredRole && $page.data?.account?.role !== link.requiredRole
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

		<!-- Trail slot -->
		<div class="flex items-center justify-end gap-2">
			<LightSwitch />
			{#if !$page.data?.account}
				<a
					href="/sign-in"
					class="btn rounded-md 
						hover:bg-primary-500
						{$page.route.id === '/(auth)/sign-in' ? 'bg-primary-600' : ''}
						"
					data-testid="header-signin"
				>
					<span class=""> Sign in </span>
				</a>
				<a
					href="/register"
					class="btn rounded-md
						{$page.route.id === '/(auth)/register' ? 'bg-primary-600' : ''}
						hover:bg-primary-500
						"
					data-testid="header-register"
				>
					<span class=""> Register </span>
				</a>
			{:else}
				<div>
					<button type="button" class="btn-icon bg-surface-200 dark:bg-surface-700 m-0 p-0">
						<Bell size={24} />
					</button>

					<button
						type="button"
						class="btn-icon bg-surface-200 dark:bg-surface-700 m-0 p-0"
						id="user-menu-button"
						aria-expanded={userMenuOpen}
						aria-haspopup="true"
						onclick={() => { userMenuOpen = !userMenuOpen; }}
					>
						{#if $page.data?.account?.profile?.picture}
							<img class="w-6 rounded-full" src={$page.data.account.profile.picture} alt="" />
						{:else}
							<div class="w-6 items-center justify-center mx-auto">
								<User size={24} />
							</div>
						{/if}
					</button>
					
					{#if userMenuOpen}
						<nav
							class="list-nav card p-3 absolute right-0 mt-1 rounded-md z-10"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="user-menu-button"
							tabindex="-1"
						>
							{#each $page.data?.userMenuLinks ?? [] as link}
								<div
									class="{link.requiredRole && link.requiredRole !== $page.data?.account?.role
										? 'hidden'
										: ''}							"
								>
									<a
										href={link.route}
										class="btn
									{link.isActive ? 'bg-primary-600' : ''}
									"
										aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
									>
										<span class="">
											{link.name}
										</span>
									</a>
								</div>
							{/each}
							<form method="POST" action="/auth?/signout">
								<button class="btn">
									<span class=""> Sign out </span>
								</button>
							</form>
						</nav>
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
			{#each $page.data?.mainMenuLinks ?? [] as link}
				<a
					href={link.route}
					class="btn rounded-none
						hover:bg-primary-500
						{$page.route.id === link.route ||
					$page.route.id === `/(protected)${link.route}` ||
					$page.route.id === `/(auth)${link.route}`
						? 'bg-primary-600'
						: ''}
						"
					onclick={() => {
						isMainMenuOpen = false;
					}}
					aria-current={$page.route.id?.includes(link.route) ? 'page' : undefined}
				>
					<span class="">
						{link.name}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}
