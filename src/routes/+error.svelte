<script lang="ts">
	import { page } from '$app/stores';
</script>

<section class="mx-auto w-1/2 space-y-2">
	<h1>Error</h1>
	<div class="card p-3">
		<p>{$page.error?.errorId}</p>
		<p>{$page.error?.message}</p>
	</div>
</section>
