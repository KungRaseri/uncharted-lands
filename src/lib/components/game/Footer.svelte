<script lang="ts">
	import { Globe, Server, Wifi } from 'lucide-svelte';
	
	let serverStatus = $state<'online' | 'offline' | 'connecting'>('online');
	let serverName = $state('Main Server');
	let worldName = $state('New World');
</script>

<footer class="bg-surface-100 dark:bg-surface-800 border-t border-surface-300 dark:border-surface-700">
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center justify-between h-10 text-xs">
			<!-- Server Info -->
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<Server size={14} class="text-surface-500" />
					<span class="text-surface-600 dark:text-surface-400">{serverName}</span>
				</div>
				<div class="flex items-center gap-2">
					<Globe size={14} class="text-surface-500" />
					<span class="text-surface-600 dark:text-surface-400">{worldName}</span>
				</div>
			</div>

			<!-- Connection Status -->
			<div class="flex items-center gap-2">
				<Wifi 
					size={14} 
					class="{serverStatus === 'online' 
						? 'text-success-500' 
						: serverStatus === 'offline' 
						? 'text-error-500' 
						: 'text-warning-500'}"
				/>
				<span class="text-surface-600 dark:text-surface-400 capitalize">
					{serverStatus}
				</span>
			</div>
		</div>
	</div>
</footer>
