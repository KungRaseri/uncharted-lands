<script lang="ts">
	import type { PageData } from './$types';
	import { Server } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let isServerFormActive = $state(false);

	function handleRowClick(server: any) {
		// Handle server selection
		console.log('Selected server:', server);
	}
</script>

<div class="card w-4/5">
	<h1 class="card-header">Servers</h1>
	<section class="p-4">
		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						{#each Object.keys(data.servers[0] || {}) as key}
							<th>{key}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.servers as server}
						<tr class="cursor-pointer" onclick={() => handleRowClick(server)}>
							{#each Object.values(server) as value}
								<td>{value}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan={Object.keys(data.servers[0] || {}).length}>
							Total Servers: {data.servers.length}
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>
</div>
