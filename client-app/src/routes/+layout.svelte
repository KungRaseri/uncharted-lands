<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { slide } from 'svelte/transition';

	import { writable, type Writable } from 'svelte/store';
	import { AppShell, AppRail, AppRailTile, AppBar } from '@skeletonlabs/skeleton';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	import Menu from 'svelte-material-icons/Menu.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import ViewDashboard from 'svelte-material-icons/ViewDashboard.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import Web from 'svelte-material-icons/Web.svelte';
	import AccountGroup from 'svelte-material-icons/AccountGroup.svelte';
	import FolderSearchOutline from 'svelte-material-icons/FolderSearchOutline.svelte';
	import BellOutline from 'svelte-material-icons/BellOutline.svelte';

	let isDarkTheme = false;
	let isMainMenuOpen = false;
	let isUserMenuOpen = false;

	function toggleMainMenu() {
		isMainMenuOpen = !isMainMenuOpen;
	}

	function toggleUserMenu() {
		isUserMenuOpen = !isUserMenuOpen;
	}

	function toggleDarkTheme() {
		isDarkTheme = !isDarkTheme;
	}

	const storeValue: Writable<number> = writable(1);

	export let data: PageData;
</script>

<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<AppShell slotPageContent="w-full h-full">
	<svelte:fragment slot="header">
		<AppBar background="bg-surface-700 px-5 py-4">
			<svelte:fragment slot="lead">
				<div class="items-center sm:hidden">
					<button
						type="button"
						class="items-center rounded-md p-2 text-primary-50 hover:text-secondary-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
						aria-controls="mobile-menu"
						aria-expanded="false"
						on:click={toggleMainMenu}
					>
						<span class="sr-only">Open main menu</span>

						<div class={isMainMenuOpen ? 'hidden' : 'block'}>
							<Menu viewBox="0 0 24 24" size={24} />
						</div>
						<div class={isMainMenuOpen ? 'block' : 'hidden'}>
							<Close viewBox="0 0 24 24" size={24} />
						</div>
					</button>
				</div>
				<div class="flex items-center justify-center sm:items-stretch sm:justify-start">
					<div class="items-center mx-5 sm:mx-1">
						<img
							class="hidden w-8 lg:block"
							src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
							alt="Your Company"
						/>
					</div>
					<div class="hidden sm:ml-6 sm:block">
						<div class="space-y-4">
							{#each data.mainMenuLinks as link}
								{#if link.requiredRole}
									{#if data.account}
										<a
											href={link.route}
											class="{link.isActive
												? 'bg-primary-900 text-primary-50 hover:bg-primary-800'
												: 'bg-secondary-900 text-secondary-50 hover:bg-secondary-800'} 
													{data.account.role !== link.requiredRole ? 'hidden' : ''}
													mx-1 px-3 py-2 rounded-md text-sm font-medium"
											aria-current="page"
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
										class="{link.isActive
											? 'bg-primary-900 text-primary-50 hover:bg-primary-800'
											: 'bg-secondary-900 text-secondary-50 hover:bg-secondary-800'} 
										{data.account && link.requiredRole && data.account.role !== link.requiredRole ? 'hidden' : ''}
										mx-1 px-3 py-2 rounded-md text-sm font-medium"
										aria-current="page"
									>
										<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
											{link.name}
										</span>
									</a>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</svelte:fragment>

			<svelte:fragment slot="trail">
				<div class="absolute flex items-center right-5 sm:right-11">
					{#if !data.account}
						<a
							href="/login"
							class="mx-1 px-3 py-2 bg-primary-700 text-primary-50 rounded-md text-sm font-medium"
						>
							Sign in
						</a>
						<a
							href="/register"
							class="mx-1 px-3 py-2 bg-secondary-700 text-primary-50 rounded-md text-sm font-medium"
						>
							Sign up
						</a>
					{/if}
					{#if data.account}
						<button type="button" class="bg-surface-500 p-1 rounded-full text-secondary-50">
							<span class="sr-only">View notifications</span>
							<BellOutline size={18} />
						</button>

						<div class="ml-3">
							<div>
								<button
									type="button"
									class="rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
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
						</div>
					{/if}
				</div>
			</svelte:fragment>
		</AppBar>
		{#if isUserMenuOpen}
			<div
				transition:slide
				class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
				role="menu"
				aria-orientation="vertical"
				aria-labelledby="user-menu-button"
				tabindex="-1"
			>
				{#each data.userMenuLinks as link}
					<a
						href={link.route}
						class="{link.isActive ? 'bg-gray-100' : ''} 
									{link.requiredRole && data.account.role !== link.requiredRole ? 'hidden' : ''}
									hover:bg-gray-400 block px-3 py-2 text-base font-medium"
						aria-current="page"
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
			<div transition:slide class="sm:hidden" id="mobile-menu">
				<div class="space-y-1 px-2 pt-2 pb-3">
					<!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
					{#each data.mainMenuLinks as link}
						{#if link.requiredRole}
							{#if data.account}
								<a
									href={link.route}
									class="{link.isActive
										? 'bg-primary-900 text-primary-50 hover:bg-primary-800'
										: 'bg-secondary-900 text-secondary-50 hover:bg-secondary-800'} 
											{data.account.role !== link.requiredRole ? 'hidden' : ''}
											block px-3 py-2 rounded-md text-base font-medium"
									aria-current="page"
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
								class="{link.isActive
									? 'bg-primary-900 text-primary-50 hover:bg-primary-800'
									: 'bg-secondary-900 text-secondary-50 hover:bg-secondary-800'} 
										{data.account && link.requiredRole && data.account.role !== link.requiredRole ? 'hidden' : ''}
										block px-3 py-2 rounded-md text-base font-medium"
								aria-current="page"
							>
								<span class={link.isActive ? 'text-primary-50' : 'text-secondary-50'}>
									{link.name}
								</span>
							</a>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</svelte:fragment>

	<slot />

	<svelte:fragment slot="footer">
		<Footer classes="bg-surface-700 fixed bottom-0 inset-x-0 hidden sm:block" />
	</svelte:fragment>
</AppShell>
