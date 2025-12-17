<script lang="ts">
	import { Globe, Flame } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<div class="hero-gradient h-full flex items-center justify-center text-center p-8">
	<div class="max-w-4xl space-y-10">
		<div class="flex flex-col items-center space-y-6">
			<div class="h-[72px] md:h-24">
				<Globe size={96} />
			</div>
			<h1 class="text-5xl md:text-6xl font-bold">Uncharted Lands</h1>
			<p class="text-xl max-w-[600px]">
				Utilize the resources around you to build a strong community and ward against the dangers of
				wildlife and the environment
			</p>
			<div class="flex gap-4 flex-wrap justify-center">
				<a href="/game/getting-started" class="btn preset-filled-primary-500">
					<span>Get Settled</span>
					<Flame size={20} />
				</a>
				<a href="/introduction" class="btn preset-tonal-primary-500">Learn More</a>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.hero-gradient {
		background-image:
			radial-gradient(at 0% 0%, rgba(var(--color-secondary-900) / 0.33) 0px, transparent 40%),
			radial-gradient(at 100% 0%, rgba(var(--color-primary-900) / 0.33) 0px, transparent 40%);
	}
</style>
