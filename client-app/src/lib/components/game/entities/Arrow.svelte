<script lang="ts">
	import { Box } from '@svelteuidev/core';

	export let arrow: any;
</script>

<div id={arrow.id} class="arrow text-amber-200 text-xs">--></div>

<style>
	.arrow {
		float: left;
		position: relative;
		width: 32px;
		height: 32px;
		top: -16px;
		left: -16px;
		animation: flying 0.5s steps(640);
	}

	@keyframes flying {
		from {
			left: 32px;
		}
		to {
			left: 100%;
		}
	}
</style>
