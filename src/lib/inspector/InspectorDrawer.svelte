<svelte:options runes={true} />

<style>
.stately-inspector-shell {
	position: fixed;
	bottom: 1rem;
	right: 1rem;
	z-index: 100000;
	display: flex;
	align-items: flex-end;
	gap: 0.75rem;
}

.stately-inspector-tab {
	display: inline-flex;
	align-items: center;
	gap: 0.55rem;
	padding: 0.75rem 0.95rem;
	border-radius: 999px;
	border: 1px solid rgb(148 163 184 / 0.22);
	background: linear-gradient(135deg, rgb(15 23 42 / 0.96), rgb(37 99 235 / 0.92));
	box-shadow: 0 16px 48px rgb(15 23 42 / 0.24);
	color: #eff6ff;
	font-weight: 700;
	pointer-events: auto;
}

.stately-inspector-tab img {
	width: 1.25rem;
	height: 1.25rem;
	display: block;
}

.stately-inspector {
	width: min(26rem, calc(100vw - 2rem));
	max-height: calc(100vh - 2rem);
	overflow: auto;
	padding: 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.75rem;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 16px 48px rgba(15, 23, 42, 0.16);
	z-index: 100000;
	pointer-events: none;
	font:
		0.875rem/1.5 system-ui,
		sans-serif;
	transform: translateX(0);
	opacity: 1;
	transition:
		transform 180ms ease,
		opacity 180ms ease;
}

.stately-inspector--closed {
	transform: translateX(calc(100% + 1rem));
	opacity: 0;
	pointer-events: none;
}

.stately-inspector__layout {
	display: grid;
	gap: 1rem;
}

.stately-inspector__notice-list {
	margin: 0;
	padding-left: 1.25rem;
}

.stately-inspector__notice-list li {
	margin-top: 0.35rem;
}

.stately-inspector * {
	pointer-events: none;
}

.stately-inspector button {
	cursor: pointer;
	pointer-events: auto;
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
import statelyLogoUrl from '../../../stately.svg';
import { formatInspectorValue } from './format.js';
import { getStatelyInspectorHook } from './hook.js';
import { createInspectorDrawerState } from './state.svelte.js';
import type { StatelyInspectorHook } from './types.js';

let { hook = getStatelyInspectorHook() } = $props<{ hook?: StatelyInspectorHook }>();
let drawer = $state<ReturnType<typeof createInspectorDrawerState> | null>(null);
let isOpen = $state(false);

$effect(() => {
	const nextDrawer = hook ? createInspectorDrawerState({ hook }) : null;
	drawer = nextDrawer;

	return () => {
		nextDrawer?.destroy();
		drawer = null;
	};
});
</script>

<div class="stately-inspector-shell">
	<button
		type="button"
		class="stately-inspector-tab"
		aria-controls="stately-inspector-drawer"
		aria-expanded={isOpen}
		onclick={() => {
			isOpen = !isOpen;
		}}>
		<img alt="Stately" src={statelyLogoUrl} />
		<span>{isOpen ? 'Close Stately' : 'Open Stately'}</span>
	</button>

	<aside
		id="stately-inspector-drawer"
		class="stately-inspector"
		class:stately-inspector--closed={!isOpen}
		aria-label="Stately inspector">
		<h2>Stately inspector</h2>

		{#if !drawer || drawer.stores.length === 0}
			<p>No stores detected.</p>
		{:else}
			<div class="stately-inspector__layout">
				{#if drawer.notices.length > 0}
					<section>
						<h3>Warnings and alerts</h3>
						<ul class="stately-inspector__notice-list" aria-live="polite">
							{#each drawer.notices as notice (`${notice.timestamp}-${notice.message}`)}
								<li role={notice.level === 'warning' ? 'alert' : 'status'}>
									<strong>{notice.level}:</strong>
									{notice.message}
								</li>
							{/each}
						</ul>
						<button type="button" onclick={() => drawer?.clearNotices()}>Clear warnings</button>
					</section>
				{/if}

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
</div>
