<script lang="ts">
	import type { PageData } from './$types';
	import { MessageSquare, Send, Search, Users, Mail, Info, Plus } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	let selectedConversation = $state<string | null>(null);
	let newMessage = $state('');
</script>

<svelte:head>
	<title>Messages | Uncharted Lands</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-3"
			>
				<MessageSquare size={32} class="text-primary-500" />
				Messages
			</h1>
			<p class="text-surface-600 dark:text-surface-400">
				Private conversations with other players
			</p>
		</div>
		<button class="btn preset-filled-primary-500 rounded-md" disabled>
			<Plus size={20} />
			<span>New Message</span>
		</button>
	</div>

	<!-- Coming Soon Notice -->
	<div class="card preset-filled-warning-500 p-6">
		<div class="flex items-start gap-4">
			<Info size={24} class="shrink-0" />
			<div>
				<h3 class="text-lg font-bold mb-2">Coming Soon</h3>
				<p class="mb-3">
					The Messaging system is currently under development. This feature will include:
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>Private messaging between players</li>
					<li>Group conversations</li>
					<li>Message notifications and alerts</li>
					<li>Read receipts and typing indicators</li>
					<li>Message history and search</li>
					<li>Attachment support (images, links)</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Placeholder Messaging Interface -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-50">
		<!-- Conversations List -->
		<div class="card preset-filled-surface-100-900 p-4">
			<div class="mb-4">
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="input-group-shim">
						<Search size={16} />
					</div>
					<input
						type="text"
						placeholder="Search conversations..."
						class="input"
						disabled
					/>
				</div>
			</div>

			<div class="space-y-2">
				{#each [1, 2, 3, 4] as item}
					<div class="p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-600"
							></div>
							<div class="flex-1">
								<div
									class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-2/3 mb-2"
								></div>
								<div
									class="h-3 bg-surface-300 dark:bg-surface-600 rounded w-full"
								></div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<p class="text-center text-surface-500 text-sm mt-4">No conversations available</p>
		</div>

		<!-- Message View -->
		<div
			class="lg:col-span-2 card preset-filled-surface-100-900 flex flex-col"
			style="height: 600px;"
		>
			<!-- Header -->
			<div class="p-4 border-b border-surface-300 dark:border-surface-700">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-600"></div>
					<div>
						<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-32 mb-2"></div>
						<div class="h-3 bg-surface-300 dark:bg-surface-600 rounded w-24"></div>
					</div>
				</div>
			</div>

			<!-- Messages -->
			<div class="flex-1 p-4 overflow-y-auto">
				<div class="flex items-center justify-center h-full">
					<div class="text-center">
						<MessageSquare size={48} class="mx-auto mb-4 text-surface-400" />
						<p class="text-surface-500">Select a conversation to view messages</p>
					</div>
				</div>
			</div>

			<!-- Input -->
			<div class="p-4 border-t border-surface-300 dark:border-surface-700">
				<div class="input-group input-group-divider grid-cols-[1fr_auto]">
					<input type="text" placeholder="Type a message..." class="input" disabled />
					<button class="btn preset-filled-primary-500" disabled>
						<Send size={16} />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Back to Game -->
	<div class="flex justify-center">
		<a href="/game" class="btn preset-tonal-surface-500 rounded-md">
			← Back to Game Overview
		</a>
	</div>
</div>
