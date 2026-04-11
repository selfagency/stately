<svelte:options runes={true} />

<style>
.stately-inspector {
	position: fixed;
	top: 1rem;
	right: 1rem;
	width: min(26rem, calc(100vw - 2rem));
	max-height: calc(100vh - 2rem);
	overflow: auto;
	padding: 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.75rem;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 16px 48px rgba(15, 23, 42, 0.16);
	z-index: 100000;
	font:
		0.875rem/1.5 system-ui,
		sans-serif;
}

.stately-inspector__layout {
	display: grid;
	gap: 1rem;
}

button {
	cursor: pointer;
}

pre {
	padding: 0.75rem;
	border-radius: 0.5rem;
	background: #0f172a;
	color: #e2e8f0;
	overflow: auto;
}
</style>

<script lang="ts">
import { getStatelyInspectorHook } from './hook.js';
import { formatInspectorValue } from './format.js';
import { createInspectorDrawerState } from './state.svelte.js';
import type { StatelyInspectorHook } from './types.js';

let { hook = getStatelyInspectorHook() } = $props<{ hook?: StatelyInspectorHook }>();
let drawer = $state<ReturnType<typeof createInspectorDrawerState> | null>(null);

$effect(() => {
	const nextDrawer = hook ? createInspectorDrawerState({ hook }) : null;
	drawer = nextDrawer;

	return () => {
		nextDrawer?.destroy();
		drawer = null;
	};
});
</script>

<aside class="stately-inspector" aria-label="Stately inspector">
	<h2>Stately inspector</h2>

	{#if !drawer || drawer.stores.length === 0}
		<p>No stores detected.</p>
	{:else}
		<div class="stately-inspector__layout">
			<section>
				<h3>Stores</h3>
				<ul>
					{#each drawer.stores as store (store.id)}
						<li>
							<button
								type="button"
								aria-pressed={drawer.selectedStoreId === store.id}
								onclick={() => drawer?.selectStore(store.id)}>
								Select store {store.id}
							</button>
						</li>
					{/each}
				</ul>
			</section>

			{#if drawer.snapshot}
				<section>
					<h3>State</h3>
					<pre aria-label="State snapshot">{formatInspectorValue(drawer.snapshot.state)}</pre>
				</section>

				<section>
					<h3>Timeline</h3>
					<div aria-label="Timeline entries">
						{#if drawer.snapshot.timeline.length === 0}
							<p>No timeline entries yet.</p>
						{:else}
							<ul>
								{#each drawer.snapshot.timeline as entry (entry.id)}
									<li>{entry.label}</li>
								{/each}
							</ul>
						{/if}
					</div>
				</section>

				<section>
					<h3>History</h3>
					{#if drawer.snapshot.history}
						<p>Current history index: {drawer.snapshot.history.currentIndex}</p>
						<ul>
							{#each drawer.snapshot.history.entries as entry, index (entry.timestamp + index)}
								<li>
									<button type="button" onclick={() => drawer?.goToHistory(index)}>
										Go to history entry {index}
									</button>
								</li>
							{/each}
						</ul>
					{:else}
						<p>History unavailable for this store.</p>
					{/if}
				</section>
			{/if}
		</div>
	{/if}
</aside>
