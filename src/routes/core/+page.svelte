<script lang="ts">
import { browser } from '$app/environment';
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
import { createCoreDemo } from './core-demo.svelte.js';

if (browser) {
	installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createCoreDemo();
const optionStore = demo.optionStore;
const setupStore = demo.setupStore;
const refs = demo.refs;

let patchLog = $state('(no patch yet)');
let disposeLog = $state('store is alive');
let disposeUnsubscribe: (() => void) | null = $state(null);

function applyObjectPatch() {
	optionStore.$patch({ count: 42 });
	patchLog = '$patch({ count: 42 }) — object form';
}

function applyFnPatch() {
	optionStore.$patch((state) => {
		state.count += 10;
	});
	patchLog = '$patch(state => state.count += 10) — function form';
}

function resetStore() {
	optionStore.$reset();
	patchLog = '$reset() — returned to initial state';
}

function disposeAndRevive() {
	if (disposeUnsubscribe) {
		disposeUnsubscribe();
		disposeUnsubscribe = null;
		disposeLog = 'store disposed — subscriptions stopped';
	} else {
		disposeLog = 'store is alive';
	}
}

const optionCode = `const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubled(state) { return state.count * 2; }
  },
  actions: {
    increment() { this.count += 1; },
    decrement() { this.count -= 1; }
  }
});

const store = useCounterStore(manager);`;

const setupCode = `const useCounterStore = defineStore('counter', {
  setup: () => ({
    count: 0,
    get doubled() { return this.count * 2; },
    increment() { this.count += 1; }
  })
});`;

const refsCode = `import { storeToRefs } from '@selfagency/stately';

// Safe destructuring — refs stay reactive
const { count, doubled } = storeToRefs(store);
console.log(count.value); // reactive
console.log(doubled.value); // reactive derived`;

const patchCode = `// Object form
store.$patch({ count: 42 });

// Function form
store.$patch((state) => { state.count += 10; });

// Reset to initial state
store.$reset();`;

const subscribeCode = `const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('mutation:', mutation.type, 'state:', state);
});

// Stop listening
unsubscribe();`;

const onActionCode = `store.$onAction(({ name, args, before, after, onError }) => {
  before(() => {
    // return false to cancel the action
    if (name === 'increment' && blocked) return false;
  });
  after((result) => console.log('action completed', result));
});`;

onMount(() => {
	mountStatelyInspector({ initiallyOpen: false });
	disposeUnsubscribe = optionStore.$subscribe(() => {});
	return () => {
		demo.destroy();
	};
});
</script>

<svelte:head>
	<title>Core — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Core API</h1>
		<p class="text-muted-foreground">
			Option stores, setup stores, storeToRefs, $patch, $reset, $subscribe, $onAction, $dispose.
		</p>
	</div>

	<ShowcaseSection
		label="01"
		tag="Option store"
		title="State, getters, and actions in one declaration"
		description="The classic Pinia-style option store. State is a plain-object factory; getters are derived values; actions mutate state."
		code={optionCode}>
		<div class="flex flex-wrap gap-3">
			<Button type="button" onclick={() => optionStore.increment()}>Increment</Button>
			<Button type="button" variant="outline" onclick={() => optionStore.decrement()}>Decrement</Button>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-option-count" class="text-sm">count: {optionStore.count}</pre>
				<pre data-testid="core-option-doubled" class="text-sm">doubled: {optionStore.doubled}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="02"
		tag="Setup store"
		title="Factory function with direct reactive properties"
		description="The setup form lets you co-locate state and actions in a plain object returned from a setup function."
		code={setupCode}>
		<div class="flex flex-wrap gap-3">
			<Button type="button" onclick={() => setupStore.increment()}>Increment (setup)</Button>
			<Button type="button" variant="outline" onclick={() => setupStore.decrement()}>Decrement (setup)</Button>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-setup-count" class="text-sm">count: {setupStore.count}</pre>
				<pre data-testid="core-setup-doubled" class="text-sm">doubled: {setupStore.doubled}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="03"
		tag="storeToRefs"
		title="Safe destructuring without losing reactivity"
		description="Raw destructuring breaks reactivity. storeToRefs wraps each non-action property in a stable ref whose .value stays reactive."
		code={refsCode}>
		<Card.Root size="sm">
			<Card.Header><Card.Description>refs.count.value and refs.doubled.value</Card.Description></Card.Header>
			<Card.Content>
				<pre data-testid="core-refs-count" class="text-sm">refs.count.value: {refs.count.value}</pre>
				<pre data-testid="core-refs-doubled" class="text-sm">refs.doubled.value: {refs.doubled.value}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="04"
		tag="$patch · $reset"
		title="Apply targeted updates or restore the initial snapshot"
		description="$patch accepts either a partial object or a mutation function. $reset restores the original state() return value."
		code={patchCode}>
		<div class="flex flex-wrap gap-3">
			<Button type="button" onclick={applyObjectPatch}>$patch object</Button>
			<Button type="button" variant="outline" onclick={applyFnPatch}>$patch function</Button>
			<Button type="button" variant="outline" onclick={resetStore}>$reset</Button>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-patch-log" class="text-sm">{patchLog}</pre>
				<pre data-testid="core-patch-count" class="text-sm">count after: {optionStore.count}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="05"
		tag="$subscribe"
		title="React to every state mutation"
		description="$subscribe fires synchronously after each mutation with the mutation context and new state. Returns an unsubscribe function."
		code={subscribeCode}>
		<div class="flex flex-wrap gap-3">
			<Button type="button" onclick={() => optionStore.increment()}>Trigger mutation</Button>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-subscribe-log" class="text-sm">{demo.subscriptionLog}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="06"
		tag="$onAction + before() guard"
		title="Intercept actions before and after they run"
		description="$onAction provides before(), after(), and onError() hooks. Returning false from before() cancels the action."
		code={onActionCode}>
		<div class="flex flex-wrap gap-3">
			<Button type="button" onclick={() => optionStore.increment()} data-testid="core-guarded-increment"
				>Increment</Button>
			<Button
				type="button"
				variant={demo.guardActive ? 'default' : 'outline'}
				onclick={() => demo.setGuardActive(!demo.guardActive)}
				data-testid="core-guard-toggle">
				{demo.guardActive ? 'Guard active — increment blocked' : 'Guard inactive — click to enable'}
			</Button>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-guard-count" class="text-sm">count: {optionStore.count}</pre>
				<pre data-testid="core-guard-status" class="text-sm">guard: {demo.guardActive ? 'blocking' : 'inactive'}</pre>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>

	<ShowcaseSection
		label="07"
		tag="$dispose"
		title="Clean up store subscriptions when done"
		description="$dispose marks the store as disposed and clears all active subscriptions. Useful for short-lived contexts."
		code="store.$dispose(); // releases all subscriptions">
		<Card.Root size="sm">
			<Card.Content>
				<pre data-testid="core-dispose-log" class="text-sm">{disposeLog}</pre>
				<div class="mt-2 flex flex-wrap gap-2">
					<Button variant="outline" onclick={disposeAndRevive} data-testid="core-dispose-toggle">
						{disposeUnsubscribe ? 'Dispose subscription' : 'Revive subscription'}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>
</div>
