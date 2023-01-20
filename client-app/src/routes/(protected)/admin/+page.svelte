<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="my-3">
	<h3>Admin Dashboard</h3>
	<p>Welcome, {$page.data.account.email}</p>
</div>
