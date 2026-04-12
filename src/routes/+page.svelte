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
const wizard = demo.wizard;
const form = demo.form;
const preferences = demo.preferences;
let savedSnapshot = $state('No manually saved snapshot yet.');
let persistenceMode = $state<'live' | 'paused'>('live');
let validationError = $state('');
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

const fsmPattern = `const manager = createStateManager().use(createFsmPlugin());\n\nexport const useWizardStore = defineStore('wizard', {\n\tstate: () => ({ label: 'not started' }),\n\tfsm: {\n\t\tinitial: 'idle',\n\t\tstates: {\n\t\t\tidle:    { start: 'running' },\n\t\t\trunning: { pause: 'paused', finish: 'done', fail: 'failed' },\n\t\t\tpaused:  { resume: 'running', cancel: 'idle' },\n\t\t\tdone:    {},\n\t\t\tfailed:  { retry: 'running', cancel: 'idle' }\n\t\t}\n\t}\n});\n\nconst store = useWizardStore(manager);\nstore.$fsm.send('start');\nconsole.log(store.$fsm.current); // 'running'`;

const validationPattern = `const manager = createStateManager().use(createValidationPlugin());\n\nexport const useFormStore = defineStore('form', {\n\tstate: () => ({ quantity: 1, email: '' }),\n\tvalidate(state) {\n\t\tif (state.quantity < 1) return 'Quantity must be at least 1.';\n\t\tif (!state.email.includes('@')) return 'Enter a valid email.';\n\t\treturn true;\n\t},\n\tonValidationError(err) { console.error(err); }\n});\n\n// Rejected — quantity below minimum\nstore.$patch({ quantity: -5 });`;

const preferencesPattern = `export const usePreferencesStore = defineStore('preferences', {\n\tstate: () => ({ theme: 'light', compact: false, fontSize: 14 }),\n\tpersist: { adapter: createLocalStorageAdapter(), version: 1 },\n\tactions: {\n\t\ttoggleTheme() { this.theme = this.theme === 'light' ? 'dark' : 'light'; },\n\t\tsetFontSize(size) { this.fontSize = Math.max(10, Math.min(24, size)); }\n\t}\n});`;

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

// FSM handlers
function fsmSend(event: string) {
	try {
		wizard.$fsm.send(event);
		activity = `FSM transition: ${event} → ${wizard.$fsm.current}`;
	} catch {
		activity = `FSM: transition '${event}' is not allowed in state '${wizard.$fsm.current}'.`;
	}
}

// Validation handlers
function applyQuantity(value: number) {
	const before = form.quantity;
	form.setQuantity(value);
	if (form.quantity === before && value !== before) {
		validationError = `Rejected: quantity ${value} failed validation.`;
	} else {
		validationError = '';
		activity = `Quantity updated to ${form.quantity}.`;
	}
}

function applyEmail(value: string) {
	const before = form.email;
	form.setEmail(value);
	if (form.email === before && value !== before) {
		validationError = `Rejected: '${value}' failed email validation.`;
	} else {
		validationError = '';
	}
}

// Preferences handlers
function togglePreferencesTheme() {
	preferences.toggleTheme();
	activity = `Theme changed to ${preferences.theme}.`;
}

function toggleCompact() {
	preferences.setCompact(!preferences.compact);
	activity = `Compact mode ${preferences.compact ? 'enabled' : 'disabled'}.`;
}

function adjustFontSize(delta: number) {
	preferences.setFontSize(preferences.fontSize + delta);
	activity = `Font size set to ${preferences.fontSize}px.`;
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

				<ShowcaseSection
					label="Use case 05"
					tag="Workflow lifecycle"
					title="Model a task with explicit states — idle, running, paused, done, failed"
					description="Replace boolean soup with a finite state machine. Stately enforces valid transitions and exposes a typed controller on the store."
					code={fsmPattern}>
					<div class="space-y-4">
						<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
							<p class="text-muted-foreground mb-1 text-sm font-medium">Current FSM state</p>
							<p data-testid="fsm-state" class="text-3xl font-semibold tracking-tight text-foreground">
								{wizard.$fsm.current}
							</p>
						</div>
						<div class="flex flex-wrap gap-3">
							<Button type="button" onclick={() => fsmSend('start')} disabled={!wizard.$fsm.can('start')}>Start</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('pause')}
								disabled={!wizard.$fsm.can('pause')}>Pause</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('resume')}
								disabled={!wizard.$fsm.can('resume')}>Resume</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('finish')}
								disabled={!wizard.$fsm.can('finish')}>Finish</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('fail')}
								disabled={!wizard.$fsm.can('fail')}>Fail</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('retry')}
								disabled={!wizard.$fsm.can('retry')}>Retry</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => fsmSend('cancel')}
								disabled={!wizard.$fsm.can('cancel')}>Cancel</Button>
						</div>
					</div>
				</ShowcaseSection>

				<ShowcaseSection
					label="Use case 06"
					tag="Form validation"
					title="Reject invalid state before it reaches the store"
					description="Wrap any store with the validation plugin. Invalid patches are silently dropped — the store never enters a broken state."
					code={validationPattern}>
					<div class="space-y-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
								<p class="text-muted-foreground mb-3 text-sm font-medium">Quantity (1–99)</p>
								<div class="flex items-center gap-3">
									<Button type="button" variant="outline" onclick={() => applyQuantity(form.quantity - 1)}>−</Button>
									<span data-testid="form-quantity" class="w-10 text-center text-xl font-semibold"
										>{form.quantity}</span>
									<Button type="button" variant="outline" onclick={() => applyQuantity(form.quantity + 1)}>+</Button>
									<Button type="button" variant="outline" onclick={() => applyQuantity(0)}>Try 0 (invalid)</Button>
									<Button type="button" variant="outline" onclick={() => applyQuantity(999)}>Try 999 (invalid)</Button>
								</div>
							</div>
							<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
								<p class="text-muted-foreground mb-3 text-sm font-medium">Email (optional)</p>
								<input
									type="text"
									value={form.email}
									oninput={(e) => applyEmail((e.target as HTMLInputElement).value)}
									placeholder="user@example.com"
									class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
							</div>
						</div>
						{#if validationError}
							<Card.Root size="sm" class="border-destructive/50 bg-destructive/5">
								<Card.Content>
									<p class="text-destructive text-sm">{validationError}</p>
								</Card.Content>
							</Card.Root>
						{/if}
						<Card.Root size="sm" class="shadow-xs">
							<Card.Header>
								<Card.Description>Validated state</Card.Description>
							</Card.Header>
							<Card.Content class="pt-0">
								<pre class="overflow-x-auto text-sm">{JSON.stringify(
										{ quantity: form.quantity, email: form.email },
										null,
										2
									)}</pre>
							</Card.Content>
						</Card.Root>
					</div>
				</ShowcaseSection>

				<ShowcaseSection
					label="Use case 07"
					tag="Persisted preferences"
					title="Keep UI preferences across page reloads without extra boilerplate"
					description="A second independent store shows the inspector tracking multiple state objects simultaneously. Changes persist to localStorage automatically."
					code={preferencesPattern}>
					<div class="space-y-4">
						<div class="grid gap-4 sm:grid-cols-3">
							<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
								<p class="text-muted-foreground mb-3 text-sm font-medium">Theme</p>
								<p data-testid="pref-theme" class="mb-3 text-xl font-semibold capitalize">{preferences.theme}</p>
								<Button type="button" onclick={togglePreferencesTheme}>Toggle theme</Button>
							</div>
							<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
								<p class="text-muted-foreground mb-3 text-sm font-medium">Compact mode</p>
								<p data-testid="pref-compact" class="mb-3 text-xl font-semibold">
									{preferences.compact ? 'On' : 'Off'}
								</p>
								<Button type="button" variant="outline" onclick={toggleCompact}>Toggle compact</Button>
							</div>
							<div class="rounded-xl border border-border/80 bg-card/85 p-5 shadow-xs">
								<p class="text-muted-foreground mb-3 text-sm font-medium">Font size</p>
								<p data-testid="pref-font-size" class="mb-3 text-xl font-semibold">{preferences.fontSize}px</p>
								<div class="flex gap-2">
									<Button type="button" variant="outline" onclick={() => adjustFontSize(-2)}>−</Button>
									<Button type="button" variant="outline" onclick={() => adjustFontSize(2)}>+</Button>
								</div>
							</div>
						</div>
						<Card.Root size="sm" class="shadow-xs">
							<Card.Header>
								<Card.Description>Live preferences state (persisted to localStorage)</Card.Description>
							</Card.Header>
							<Card.Content class="pt-0">
								<pre class="overflow-x-auto text-sm">{JSON.stringify(
										{ theme: preferences.theme, compact: preferences.compact, fontSize: preferences.fontSize },
										null,
										2
									)}</pre>
							</Card.Content>
						</Card.Root>
					</div>
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
