<script lang="ts">
	import { Anchor, Box, Burger, Button, Stack, Switch, type Func } from '@svelteuidev/core';
	import { slide } from 'svelte/transition';
	import { backInOut } from 'svelte/easing';

	let isSessionAuthorized = false;
	let isMainMenuOpen = false;
	let isUserMenuOpen = false;
	export let toggleDarkTheme: Func;

	export let links = [
		{
			name: 'Home',
			route: '/'
		},
		{
			name: 'Forum',
			route: '/forum'
		},
		{
			name: 'Game',
			route: '/game'
		}
	];

	function toggleMainMenu() {
		isMainMenuOpen = !isMainMenuOpen;
	}

	function toggleUserMenu() {
		isUserMenuOpen = !isUserMenuOpen;
	}
</script>

<nav class="bg-gray-800">
	<div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
		<div class="relative flex items-center justify-between h-16">
			<div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
				<Burger opened={isMainMenuOpen} on:click={toggleMainMenu} />
			</div>
			<div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
				<div class="flex-shrink-0 flex items-center">
					<img
						class="block lg:hidden h-8 w-auto"
						src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=500"
						alt="Workflow"
					/>
					<img
						class="hidden lg:block h-8 w-auto"
						src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=500"
						alt="Workflow"
					/>
				</div>
				<div class="hidden sm:block sm:ml-6">
					<div class="flex space-x-4">
						<!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
						{#each links as link}
							<a
								href={link.route}
								class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
								><button>{link.name}</button></a
							>
						{/each}
					</div>
				</div>
			</div>
			<Switch on:change={toggleDarkTheme} />
			{#if isSessionAuthorized}
				<div
					class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
				>
					<button
						type="button"
						class="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
					>
						<span class="sr-only">View notifications</span>
						<!-- Heroicon name: outline/bell -->
						<svg
							class="h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
					</button>

					<!-- Profile dropdown -->
					<div class="ml-3 relative">
						<div>
							<button
								on:click={toggleUserMenu}
								type="button"
								class="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
								id="user-menu-button"
								aria-expanded="false"
								aria-haspopup="true"
							>
								<span class="sr-only">Open user menu</span>
								<img
									class="h-8 w-8 rounded-full"
									src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
									alt=""
								/>
							</button>
						</div>

						<!--
		Dropdown menu, show/hide based on menu state.

		Entering: "transition ease-out duration-100"
		  From: "transform opacity-0 scale-95"
		  To: "transform opacity-100 scale-100"
		Leaving: "transition ease-in duration-75"
		  From: "transform opacity-100 scale-100"
		  To: "transform opacity-0 scale-95"
	  -->
						{#if isUserMenuOpen}
							<div
								class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
								role="menu"
								aria-orientation="vertical"
								aria-labelledby="user-menu-button"
								tabindex="-1"
							>
								<!-- Active: "bg-gray-100", Not Active: "" -->
								<a
									href="#"
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-0">Your Profile</a
								>
								<a
									href="#"
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-1">Settings</a
								>
								<a
									href="#"
									class="block px-4 py-2 text-sm text-gray-700"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-2">Sign out</a
								>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if isMainMenuOpen}
		<div transition:slide class="sm:hidden">
			<Stack mx="lg" mb="xs" justify="start">
				{#each links as link}
					<Button
						fullSize
						variant="subtle"
						href={link.route}
						class="text-gray-300 hover:bg-gray-700 hover:text-white text-base font-medium"
					>
						{link.name}
					</Button>
				{/each}
			</Stack>
		</div>
	{/if}
</nav>
