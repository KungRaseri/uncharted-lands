<script lang="ts">
	import { Globe, Flame } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<header id="hero" class="hero-gradient items-center text-center h-full">
	<div class="grid grid-cols-1 space-y-10 gap-10">
		<div class="flex flex-col items-center xl:items-start text-center xl:text-left space-y-6">
			<div class="mt-10 h-[72px] md:h-24">
				<Globe size={96} />
			</div>
			<h1 class="text-5xl! md:text-6xl! max-w-[600px]">Uncharted Lands</h1>
			<p class="text-xl! max-w-[475px]">
				Utilize the resources around you to build a strong community and ward against the dangers of
				wildlife and the environment
			</p>
			<div class="flex gap-4">
				<a href="/introduction" class="btn preset-filled-primary-500">
					<span>Get Settled</span>
					<Flame size={20} />
				</a>
				<a href="/introduction" class="btn preset-tonal-primary-500">Learn More</a>
			</div>
		</div>
	</div>
</header>

<style lang="scss">
	.hero-gradient {
		background-image: radial-gradient(
				at 0% 0%,
				rgba(var(--color-secondary-900) / 0.33) 0px,
				transparent 40%
			),
			radial-gradient(at 100% 0%, rgba(var(--color-primary-900) / 0.33) 0px, transparent 40%);
	}
</style>
