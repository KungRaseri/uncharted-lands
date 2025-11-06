<script lang="ts">
	import { arrows, Arrow } from '$lib/stores/game/arrows';
	import ArrowComponent from '$lib/components/game/entities/Arrow.svelte';

	let animState = $state<string>('idle');

	let isAttacking = $state(false);

	function handleAttack(type: string) {
		animState = `attack-${type}`;
		isAttacking = true;

		setTimeout(() => {
			if (type === 'ranged') spawnArrow();

			animState = 'idle';
			isAttacking = false;
		}, 500);
	}

	function spawnArrow() {
		let id = crypto.randomUUID();
		let name = `arrow-${id}`;

		$arrows = [...$arrows, { id, name }];

		setTimeout(() => {
			$arrows = $arrows.filter((t) => t.id !== id);
		}, 500);
	}
</script>

<div class="p-2">
	<div>
		<div class="archer">
			<div class={animState} />
			{#each $arrows as arrow}
				<ArrowComponent {arrow} />
			{/each}
		</div>
	</div>
	<div class="items-start">
		<button
			disabled={isAttacking}
			class="mb-2"
			onclick={() => {
				handleAttack('melee');
			}}>Melee</button
		>

		<button
			disabled={isAttacking}
			class="mb-2"
			onclick={() => {
				handleAttack('ranged');
			}}>Ranged</button
		>
	</div>
</div>

<style>
	.archer .idle {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 0;
		animation: archerIdle 0.5s steps(4) infinite;
	}

	.archer .walk {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -32px;
		animation: archerWalk 0.5s steps(6) infinite;
	}

	.archer .hurt {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -64px;
		animation: archerHurt 0.5s steps(3) infinite;
	}

	.archer .jump {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -96px;
		animation: archerJump 0.5s steps(3) infinite;
	}

	.archer .die {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -128px;
		animation: archerDie 0.5s steps(4) infinite;
	}

	.archer .attack-ranged {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -160px;
		animation: archerAttackRanged 0.5s steps(10) infinite;
	}

	.archer .attack-melee {
		width: 32px;
		height: 32px;
		background: url('$lib/images/MiniArcherMan.png');
		background-position: 0 -192px;
		animation: archerAttackMelee 0.5s steps(5) infinite;
	}

	@keyframes archerIdle {
		to {
			background-position-x: -128px;
		}
	}

	@keyframes archerWalk {
		to {
			background-position-x: -192px;
		}
	}

	@keyframes archerHurt {
		to {
			background-position-x: -96px;
		}
	}

	@keyframes archerJump {
		to {
			background-position-x: -96px;
		}
	}

	@keyframes archerDie {
		to {
			background-position-x: -128px;
		}
	}

	@keyframes archerAttackRanged {
		to {
			background-position-x: -320px;
		}
	}

	@keyframes archerAttackMelee {
		to {
			background-position-x: -160px;
		}
	}
</style>
