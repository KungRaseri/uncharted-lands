<script lang="ts">
	import {
		Home,
		Users,
		Zap,
		Shield,
		TreePine,
		Droplet,
		Mountain,
		Hammer,
		TrendingUp,
		AlertTriangle,
		ArrowRight
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>Introduction - Coming Soon™ | Uncharted Lands</title>
	<meta
		name="description"
		content="Learn about Uncharted Lands - Build settlements, manage resources, and survive in a procedurally generated world"
	/>
</svelte:head>

<div class="container mx-auto p-6 space-y-12 max-w-6xl">
	<!-- Hero Section -->
	<section class="text-center space-y-6 py-12">
		<h1 class="text-4xl md:text-5xl font-bold text-surface-900 dark:text-surface-100">
			Welcome to Uncharted Lands
		</h1>
		<p class="text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto">
			A settlement-building game where you must overcome extreme weather, scarce resources, and
			hostile creatures while expanding your community and advancing your technology.
		</p>
		<div class="flex gap-4 justify-center flex-wrap">
			<a href="/game/getting-started" class="btn preset-filled-primary-500">
				<span>Start Your Journey</span>
				<ArrowRight size={20} />
			</a>
			<a href="#gameplay" class="btn preset-tonal-surface-500"> Learn More </a>
		</div>
	</section>

	<!-- Game Features -->
	<section id="gameplay" class="space-y-8">
		<h2 class="text-3xl font-bold text-center text-surface-900 dark:text-surface-100">
			Core Gameplay
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<!-- Settlement Building -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<Home size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Settlement Building
					</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Construct various structures from basic tents to advanced buildings. Each structure
					provides unique benefits to help your settlement thrive.
				</p>
			</div>

			<!-- Resource Management -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<Hammer size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Resource Management
					</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Gather and manage five essential resources: food, water, wood, stone, and ore. Balance
					production and consumption to keep your settlement running.
				</p>
			</div>

			<!-- Population Growth -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<Users size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Population Growth
					</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Expand your population by building housing structures. More settlers mean more potential,
					but also greater resource demands.
				</p>
			</div>

			<!-- Energy Systems -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<Zap size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">Energy Systems</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Harness solar and wind energy to power advanced structures. Manage your plot's energy
					capacity to support growing infrastructure.
				</p>
			</div>

			<!-- Defense -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<Shield size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Defense & Protection
					</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Build defensive structures like palisades and watchtowers to protect your settlement from
					hostile creatures and environmental hazards.
				</p>
			</div>

			<!-- Technology -->
			<div class="card preset-filled-surface-100-900 p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="text-primary-500">
						<TrendingUp size={32} />
					</div>
					<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Technology Advancement
					</h3>
				</div>
				<p class="text-surface-600 dark:text-surface-400">
					Progress from basic survival to advanced civilization. Unlock new structures and
					capabilities as your settlement grows.
				</p>
			</div>
		</div>
	</section>

	<!-- World Generation -->
	<section class="space-y-6">
		<h2 class="text-3xl font-bold text-center text-surface-900 dark:text-surface-100">
			Procedurally Generated World
		</h2>
		<div class="card preset-filled-surface-100-900 p-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
				<div class="space-y-4">
					<h3 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
						Every World is Unique
					</h3>
					<p class="text-surface-600 dark:text-surface-400">
						Each game takes place in a procedurally generated world with unique terrain, climate,
						and resource distribution. Adapt your strategy to the environment you're given.
					</p>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<Mountain size={24} class="text-primary-500" />
							<span class="text-surface-700 dark:text-surface-300"
								>Varied elevation and terrain types</span
							>
						</div>
						<div class="flex items-center gap-3">
							<Droplet size={24} class="text-primary-500" />
							<span class="text-surface-700 dark:text-surface-300"
								>Dynamic precipitation patterns</span
							>
						</div>
						<div class="flex items-center gap-3">
							<TreePine size={24} class="text-primary-500" />
							<span class="text-surface-700 dark:text-surface-300"
								>Diverse biomes with unique resources</span
							>
						</div>
					</div>
				</div>
				<div class="flex justify-center">
					<div
						class="w-full aspect-square max-w-md bg-surface-200 dark:bg-surface-700 rounded-lg flex items-center justify-center"
					>
						<p class="text-surface-400 dark:text-surface-500 text-center px-4">
							World Map Preview
							<br />
							<span class="text-sm">(Coming Soon)</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Challenges -->
	<section class="space-y-6">
		<h2 class="text-3xl font-bold text-center text-surface-900 dark:text-surface-100">
			Challenges to Overcome
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="card preset-filled-warning-500 p-6 space-y-3 text-center">
				<div class="flex justify-center">
					<AlertTriangle size={40} />
				</div>
				<h3 class="text-xl font-bold">Extreme Weather</h3>
				<p class="text-sm">
					Adapt to harsh weather conditions that affect resource production and settlement
					stability.
				</p>
			</div>
			<div class="card preset-filled-error-500 p-6 space-y-3 text-center">
				<div class="flex justify-center">
					<Shield size={40} />
				</div>
				<h3 class="text-xl font-bold">Hostile Creatures</h3>
				<p class="text-sm">
					Defend against dangerous wildlife that threatens your settlers and resources.
				</p>
			</div>
			<div class="card preset-filled-tertiary-500 p-6 space-y-3 text-center">
				<div class="flex justify-center">
					<Hammer size={40} />
				</div>
				<h3 class="text-xl font-bold">Scarce Resources</h3>
				<p class="text-sm">
					Make strategic decisions about resource allocation in a world where nothing is abundant.
				</p>
			</div>
		</div>
	</section>

	<!-- Getting Started -->
	<section class="card preset-filled-primary-500 p-8 text-center space-y-6">
		<h2 class="text-3xl font-bold">Ready to Begin?</h2>
		<p class="text-lg max-w-2xl mx-auto">
			Create your first settlement and start your journey in the uncharted lands. Every decision
			matters. Every resource counts. Can you build a thriving community?
		</p>
		<div class="flex gap-4 justify-center flex-wrap">
			<a href="/game/getting-started" class="btn preset-filled-surface-50-950">
				<span>Start Playing</span>
				<ArrowRight size={20} />
			</a>
			<a href="/kb" class="btn preset-tonal-surface-50-950"> Knowledge Base </a>
		</div>
	</section>
</div>
