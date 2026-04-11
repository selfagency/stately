<style>
:global(body) {
	margin: 0;
	font-family:
		Inter,
		ui-sans-serif,
		system-ui,
		-apple-system,
		BlinkMacSystemFont,
		'Segoe UI',
		sans-serif;
	background:
		radial-gradient(circle at top, rgb(37 99 235 / 0.16), transparent 32%),
		linear-gradient(180deg, #07111f 0%, #0f172a 100%);
	color: #e2e8f0;
}

.page-shell {
	max-width: 1180px;
	margin: 0 auto;
	padding: 3rem 1.25rem 4rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
}

.card {
	background: rgb(15 23 42 / 0.84);
	border: 1px solid rgb(148 163 184 / 0.2);
	border-radius: 1.25rem;
	box-shadow: 0 22px 55px rgb(15 23 42 / 0.28);
	backdrop-filter: blur(16px);
}

.hero {
	display: grid;
	grid-template-columns: 1.7fr 1fr;
	gap: 1.5rem;
	padding: 1.5rem;
	margin-bottom: 1rem;
}

.hero-stats,
.tab-grid,
.button-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.hero-stats > div,
.panel {
	flex: 1 1 180px;
	padding: 1rem;
	border-radius: 1rem;
	background: rgb(30 41 59 / 0.8);
	border: 1px solid rgb(148 163 184 / 0.16);
}

.section-block {
	padding: 1.25rem;
}

.eyebrow {
	margin: 0 0 0.5rem;
	color: #7dd3fc;
	font-size: 0.8rem;
	font-weight: 700;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}

h1,
h2,
h3 {
	margin: 0 0 0.65rem;
}

.lede,
p {
	line-height: 1.6;
}

button {
	border: 0;
	border-radius: 999px;
	padding: 0.75rem 1rem;
	font: inherit;
	font-weight: 700;
	color: #eff6ff;
	background: linear-gradient(135deg, #2563eb, #7c3aed);
	cursor: pointer;
}

button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

pre {
	overflow-x: auto;
	padding: 1rem;
	border-radius: 1rem;
	background: rgb(2 6 23 / 0.8);
	border: 1px solid rgb(148 163 184 / 0.16);
	white-space: pre-wrap;
}

ol {
	padding-left: 1.25rem;
}

.active {
	color: #7dd3fc;
	font-weight: 700;
}

.activity {
	margin-top: 1rem;
	color: #cbd5e1;
}

@media (max-width: 800px) {
	.hero {
		grid-template-columns: 1fr;
	}
}
</style>

<script lang="ts">
import { browser } from '$app/environment';
import { onMount } from 'svelte';
import InspectorDrawer from '../lib/inspector/InspectorDrawer.svelte';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook
} from '../lib/inspector/hook.js';
import { createShowcaseDemo } from './showcase-demo.js';

const inspectorHook = browser
	? installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook())
	: undefined;
const demo = createShowcaseDemo();
const primary = demo.primary;
const peer = demo.peer;
let showInspector = $state(false);
let savedSnapshot = $state('No manually saved snapshot yet.');
let persistenceMode = $state<'live' | 'paused'>('live');
let activity = $state('Ready for experimentation.');

const asyncStatus = $derived.by(() => {
	const request = primary.$async.loadCount;

	if (request.isLoading) {
		return 'Loading showcase value…';
	}

	const error = request.error;
	if (error instanceof Error && error.name === 'AbortError') {
		return 'Async request cancelled';
	}

	if (error instanceof Error) {
		return `Async request failed: ${error.message}`;
	}

	if (request.lastSuccessAt) {
		return 'Async request completed';
	}

	return 'No async request yet';
});

type TimelineEntry = {
	index: number;
	count: number;
	active: boolean;
};

type CountSnapshotEntry = {
	snapshot: { count: number };
};

const timelineEntries = $derived(
	(primary.$history.entries as unknown as CountSnapshotEntry[]).map<TimelineEntry>((entry, index) => ({
		index,
		count: entry.snapshot.count,
		active: index === primary.$timeTravel.currentIndex
	}))
);

const ssrPattern = `const manager = createStateManager()\n\t.use(createPersistencePlugin())\n\t.use(createHistoryPlugin());\n\nsetStateManager(manager); // request-scoped in context`;

async function refreshSavedSnapshot() {
	savedSnapshot = (await demo.persistence.read()) ?? 'No manually saved snapshot yet.';
}

function incrementPrimary() {
	primary.increment();
	activity = 'Incremented tab A.';
}

function incrementPeer() {
	peer.increment();
	activity = 'Incremented tab B to simulate a second browser tab.';
}

async function saveCurrentSnapshot() {
	primary.$persist.resume();
	persistenceMode = 'live';
	await primary.$persist.flush();
	await refreshSavedSnapshot();
	activity = 'Saved the current snapshot.';
}

function makeUnsavedLocalChange() {
	primary.$persist.pause();
	persistenceMode = 'paused';
	primary.increment(5);
	activity = 'Made an unsaved local change while persistence is paused.';
}

async function restoreSavedSnapshot() {
	await primary.$persist.rehydrate();
	primary.$persist.resume();
	persistenceMode = 'live';
	await refreshSavedSnapshot();
	activity = 'Restored the last saved snapshot.';
}

async function clearSavedSnapshot() {
	await primary.$persist.clear();
	primary.$persist.resume();
	persistenceMode = 'live';
	await refreshSavedSnapshot();
	activity = 'Cleared the saved snapshot.';
}

function batchAddFive() {
	primary.$history.startBatch();
	for (let index = 0; index < 5; index += 1) {
		primary.increment();
	}
	primary.$history.endBatch();
	activity = 'Grouped five increments into one history entry.';
}

function undoLastChange() {
	primary.$history.undo();
	activity = 'Undid the last change.';
}

function redoLastChange() {
	primary.$history.redo();
	activity = 'Redid the last change.';
}

function jumpToFirstSnapshot() {
	primary.$timeTravel.goTo(0);
	activity = 'Jumped to the first snapshot without rebroadcasting sync or persistence.';
}

async function loadAsyncTarget(target: number) {
	activity = `Loading ${target} asynchronously.`;
	try {
		await demo.loadCount(target);
		activity = `Loaded ${target} asynchronously.`;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			activity = 'Async request cancelled';
			return;
		}

		activity = error instanceof Error ? error.message : 'Unknown async failure';
	}
}

function cancelPendingAsyncLoad() {
	primary.$async.loadCount.abort();
}

onMount(() => {
	showInspector = true;
	void refreshSavedSnapshot();

	return () => {
		showInspector = false;
		demo.destroy();
	};
});
</script>

<svelte:head>
	<title>Stately showcase</title>
	<meta
		name="description"
		content="Interactive showcase for Stately persistence, history, sync, and async orchestration." />
</svelte:head>

<svelte:boundary>
	<div class="page-shell">
		<section class="hero card">
			<div>
				<p class="eyebrow">Pinia-style state for Svelte 5</p>
				<h1>Stately showcase</h1>
				<p class="lede">
					Exercise persistence, undo/redo, time travel, multi-tab sync, and async cancellation from one polished demo
					page.
				</p>
			</div>
			<div class="hero-stats">
				<div>
					<span>Primary</span>
					<strong>Primary tab value: {primary.count}</strong>
				</div>
				<div>
					<span>Peer</span>
					<strong>Peer tab value: {peer.count}</strong>
				</div>
				<div>
					<span>Derived</span>
					<strong>Double count: {primary.doubleCount}</strong>
				</div>
			</div>
		</section>

		<section class="grid">
			<article class="card section-block">
				<h2>Synced tabs</h2>
				<p>Both panels use the same store definition in different managers bridged by the sync plugin.</p>
				<div class="tab-grid">
					<div class="panel">
						<h3>Tab A</h3>
						<p>Tab A count: {primary.count}</p>
						<p>{primary.note}</p>
						<button type="button" onclick={incrementPrimary}>Increment tab A</button>
					</div>
					<div class="panel">
						<h3>Tab B</h3>
						<p>Tab B count: {peer.count}</p>
						<p>{peer.note}</p>
						<button type="button" onclick={incrementPeer}>Increment tab B</button>
					</div>
				</div>
			</article>

			<article class="card section-block">
				<h2>Persistence demo</h2>
				<p>
					Manual save plus a paused write mode makes the restore flow visible instead of quietly overwriting itself.
				</p>
				<p><strong>Persistence mode:</strong> {persistenceMode}</p>
				<div class="button-row">
					<button type="button" onclick={saveCurrentSnapshot}>Save current snapshot</button>
					<button type="button" onclick={makeUnsavedLocalChange}>Make unsaved local change</button>
					<button type="button" onclick={restoreSavedSnapshot}>Restore saved snapshot</button>
					<button type="button" onclick={clearSavedSnapshot}>Clear saved snapshot</button>
				</div>
				<pre>{savedSnapshot}</pre>
			</article>

			<article class="card section-block">
				<h2>History and time travel</h2>
				<p>
					Batching collapses multiple direct mutations into one logical undo step, while time travel replays snapshots
					locally.
				</p>
				<div class="button-row">
					<button type="button" onclick={batchAddFive}>Batch add five</button>
					<button type="button" onclick={undoLastChange} disabled={!primary.$history.canUndo}>
						Undo last change
					</button>
					<button type="button" onclick={redoLastChange} disabled={!primary.$history.canRedo}>
						Redo last change
					</button>
					<button type="button" onclick={jumpToFirstSnapshot}>Jump to first snapshot</button>
				</div>
				<ol>
					{#each timelineEntries as entry (entry.index)}
						<li class:active={entry.active}>Snapshot {entry.index}: count {entry.count}</li>
					{/each}
				</ol>
			</article>

			<article class="card section-block">
				<h2>Async orchestration</h2>
				<p>The async plugin tracks loading state and lets the latest request replace the previous one.</p>
				<div class="button-row">
					<button type="button" onclick={() => loadAsyncTarget(12)}>Load 12 asynchronously</button>
					<button type="button" onclick={() => loadAsyncTarget(24)}>Load 24 asynchronously</button>
					<button type="button" onclick={cancelPendingAsyncLoad} disabled={!primary.$async.loadCount.isLoading}>
						Cancel pending async load
					</button>
				</div>
				<p>{asyncStatus}</p>
			</article>

			<article class="card section-block">
				<h2>SSR-safe manager pattern</h2>
				<p>
					Create a manager per request and put it in Svelte context. Reserve
					<code>getDefaultStateManager()</code> for SPA-only convenience.
				</p>
				<pre>{ssrPattern}</pre>
			</article>
		</section>

		<p aria-live="polite" role="status" class="activity">{activity}</p>
	</div>
	{#if showInspector && inspectorHook}
		<InspectorDrawer hook={inspectorHook} />
	{/if}
</svelte:boundary>
