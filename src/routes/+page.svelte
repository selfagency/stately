<script lang="ts">
import { browser } from '$app/environment';
import ShowcaseHero from '$lib/components/ShowcaseHero.svelte';
import ShowcaseSection from '$lib/components/ShowcaseSection.svelte';
import { Button } from '$lib/components/ui/button/index.js';
import * as Card from '$lib/components/ui/card/index.js';
import { mountStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook
} from '$lib/inspector/hook.js';
import { onMount } from 'svelte';
import { createShowcaseDemo } from './showcase-demo.js';

if (browser) {
	installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}
const demo = createShowcaseDemo();
const primary = demo.primary;
const peer = demo.peer;
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

const syncPattern = `const manager = createStateManager()\n\t.use(createSyncPlugin({ channel: 'demo-counter' }));\n\nexport const useCounterStore = defineStore('counter', {\n\tstate: () => ({ count: 0 })\n});`;

const persistencePattern = `export const useDraftStore = defineStore('draft', {\n\tstate: () => ({ content: '' }),\n\tpersist: {\n\t\tadapter: createLocalStorageAdapter(),\n\t\tversion: 1\n\t}\n});`;

const historyPattern = `const manager = createStateManager().use(createHistoryPlugin());\n\nstore.$history.startBatch();\nstore.increment();\nstore.increment();\nstore.$history.endBatch();\nstore.$timeTravel.goTo(0);`;

const asyncPattern = `const manager = createStateManager().use(createAsyncPlugin());\n\nawait store.loadCount(12);\nstore.$async.loadCount.abort();\nif (store.$async.loadCount.isLoading) {\n\t// show pending UI\n}`;

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
	mountStatelyInspector();
	void refreshSavedSnapshot();

	return () => {
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
	<div class="relative container mx-auto px-4 py-8 md:px-6 lg:py-12">
		<div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 overflow-hidden">
			<div class="absolute -top-24 left-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl"></div>
			<div class="absolute right-12 top-12 h-40 w-40 rounded-full bg-secondary/12 blur-3xl"></div>
		</div>

		<div class="space-y-10">
			<ShowcaseHero primaryCount={primary.count} peerCount={peer.count} doubleCount={primary.doubleCount} />

			<div class="space-y-8">
				<ShowcaseSection
					label="Use case 01"
					tag="Cross-tab cart stepper"
					title="Sync a shared counter between two browser contexts"
					description="Simulate collaborative state like a cart quantity, presence counter, or shared checklist where both surfaces react immediately."
					code={syncPattern}>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
							<div class="space-y-5">
								<div class="space-y-1">
									<p class="text-muted-foreground text-sm font-medium">Tab A</p>
									<p data-testid="tab-a-count" class="text-4xl font-semibold tracking-tight text-foreground">
										{primary.count}
									</p>
								</div>
								<Button type="button" onclick={incrementPrimary}>Increment Tab A by 1</Button>
							</div>
						</div>
						<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
							<div class="space-y-5">
								<div class="space-y-1">
									<p class="text-muted-foreground text-sm font-medium">Tab B</p>
									<p data-testid="tab-b-count" class="text-4xl font-semibold tracking-tight text-foreground">
										{peer.count}
									</p>
								</div>
								<Button type="button" variant="outline" onclick={incrementPeer}>Increment Tab B by 1</Button>
							</div>
						</div>
					</div>
					<Card.Root size="sm" class="shadow-xs">
						<Card.Header>
							<Card.Description>Current state</Card.Description>
						</Card.Header>
						<Card.Content class="pt-0">
							<pre class="overflow-x-auto text-sm whitespace-pre-wrap">{JSON.stringify(
									{
										count: primary.count,
										note: primary.note
									},
									null,
									2
								)}</pre>
						</Card.Content>
					</Card.Root>
				</ShowcaseSection>

				<ShowcaseSection
					label="Use case 02"
					tag="Draft restoration"
					title="Pause writes, make a risky local edit, and restore the saved version"
					description="Good for editors, settings panels, and recovery flows where “last saved” must remain explicit instead of silently drifting."
					status={`Persistence mode: ${persistenceMode}`}
					code={persistencePattern}>
					<div class="flex flex-wrap gap-3">
						<Button type="button" onclick={saveCurrentSnapshot}>Save current snapshot</Button>
						<Button type="button" variant="outline" onclick={makeUnsavedLocalChange}>Make unsaved local change</Button>
						<Button type="button" variant="outline" onclick={restoreSavedSnapshot}>Restore saved snapshot</Button>
						<Button type="button" variant="outline" onclick={clearSavedSnapshot}>Clear saved snapshot</Button>
					</div>
					<Card.Root size="sm">
						<Card.Content>
							<pre class="overflow-x-auto text-sm whitespace-pre-wrap">{savedSnapshot}</pre>
						</Card.Content>
					</Card.Root>
				</ShowcaseSection>

				<ShowcaseSection
					label="Use case 03"
					tag="Wizard checkpoints"
					title="Batch several mutations into a single undo step, then jump back in time"
					description="Perfect for multi-step forms, pricing builders, or staged configuration screens where rollback should feel intentional."
					code={historyPattern}>
					<div class="flex flex-wrap gap-3">
						<Button type="button" onclick={batchAddFive}>Batch add five</Button>
						<Button type="button" variant="outline" onclick={undoLastChange} disabled={!primary.$history.canUndo}
							>Undo last change</Button>
						<Button type="button" variant="outline" onclick={redoLastChange} disabled={!primary.$history.canRedo}
							>Redo last change</Button>
						<Button type="button" variant="outline" onclick={jumpToFirstSnapshot}>Jump to first snapshot</Button>
					</div>
					<Card.Root size="sm">
						<Card.Header>
							<Card.Description>Recorded snapshots</Card.Description>
						</Card.Header>
						<Card.Content>
							<ol class="space-y-2 pl-5 text-sm text-muted-foreground">
								{#each timelineEntries as entry (entry.index)}
									<li class:font-semibold={entry.active}>
										Snapshot {entry.index}: count {entry.count}
									</li>
								{/each}
							</ol>
						</Card.Content>
					</Card.Root>
				</ShowcaseSection>

				<ShowcaseSection
					label="Use case 04"
					tag="Cancelable requests"
					title="Keep async UI honest when the latest request should win"
					description="Ideal for search, dashboard refreshes, and background fetches where stale responses must not clobber the latest state."
					code={asyncPattern}>
					<div class="flex flex-wrap gap-3">
						<Button type="button" onclick={() => loadAsyncTarget(12)}>Load 12 asynchronously</Button>
						<Button type="button" variant="outline" onclick={() => loadAsyncTarget(24)}>Load 24 asynchronously</Button>
						<Button
							type="button"
							variant="outline"
							onclick={cancelPendingAsyncLoad}
							disabled={!primary.$async.loadCount.isLoading}>Cancel pending async load</Button>
					</div>
					<Card.Root size="sm">
						<Card.Header>
							<Card.Description>Async status</Card.Description>
							<Card.Title class="text-base">{asyncStatus}</Card.Title>
							<Card.Description>Primary count: {primary.count}</Card.Description>
							<Card.Description>Peer count: {peer.count}</Card.Description>
						</Card.Header>
					</Card.Root>
				</ShowcaseSection>

				<ShowcaseSection
					label="Reference"
					tag="SSR note"
					title="Keep managers request-scoped in SvelteKit"
					description="Server rendering should create a fresh state manager per request and push it through context instead of relying on a shared singleton."
					code={ssrPattern}>
					<Card.Root size="sm">
						<Card.Content>
							<p class="text-muted-foreground text-sm">
								Use request-scoped managers in SvelteKit. Treat singleton helpers as SPA-only convenience.
							</p>
						</Card.Content>
					</Card.Root>
				</ShowcaseSection>
			</div>

			<Card.Root class="border-border/70 bg-card/60 shadow-sm">
				<Card.Content class="flex items-center justify-between gap-4 py-4">
					<div>
						<p class="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Live activity</p>
						<p aria-live="polite" role="status" class="text-sm font-medium text-foreground">{activity}</p>
					</div>
					<div class="hidden text-right md:block">
						<p class="text-muted-foreground text-xs uppercase tracking-[0.2em]">Inspector</p>
						<p class="text-sm text-foreground">Always-on developer view</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</svelte:boundary>
