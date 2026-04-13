<script lang="ts">
import { browser } from '$app/environment';
import ShowcaseSection from '$lib/components/ShowcaseSection.svelte';
import { Button } from '$lib/components/ui/button/index.js';
import * as Field from '$lib/components/ui/field/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { mountStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook
} from '$lib/inspector/hook.js';
import { onMount } from 'svelte';
import { createPersistenceDemo } from './persistence-demo.svelte.js';

if (browser) {
	installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createPersistenceDemo();

const memCode = `const useCounterStore = defineStore('my-counter', {
  state: () => ({ count: 0 }),
  persist: { adapter: createMemoryStorageAdapter(), version: 1 }
});
const manager = createStateManager().use(createPersistencePlugin());
const store = useCounterStore(manager);

store.count++;
await store.$persist.flush();    // write to adapter
await store.$persist.rehydrate(); // read from adapter`;

const pickCode = `const useFormStore = defineStore('my-form', {
  state: () => ({ count: 0, transient: 'unsaved draft' }),
  persist: {
    adapter: createMemoryStorageAdapter(),
    version: 1,
    pick: ['count']  // only 'count' is written to storage
  }
});`;

const omitCode = `// Exclude one field from persistence
persist: { adapter, version: 1, omit: ['secret'] }`;

const lzCode = `import { createLzStringCompression } from '@selfagency/stately';

persist: {
  adapter: createLocalStorageAdapter(),
  version: 1,
  compression: createLzStringCompression()
}`;

const ttlCode = `// Expire persisted data after 30 seconds
persist: { adapter, version: 1, ttl: 30_000 }`;

onMount(() => {
	mountStatelyInspector();
	return () => demo.destroy();
});
</script>

<svelte:head>
	<title>Persistence — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Persistence</h1>
		<p class="text-muted-foreground">Persist store state across page reloads with pluggable storage adapters.</p>
	</div>

	<!-- Demo 1: memory adapter -->
	<ShowcaseSection
		label="01"
		tag="Memory adapter"
		title="Manual save, rehydrate, and clear"
		description="The memory adapter stores state in-process. Incrementing the counter, saving, resetting, and rehydrating demonstrates the full persist lifecycle without touching browser storage."
		code={memCode}>
		<div class="space-y-4">
			<div class="flex items-center gap-4">
				<div>
					<p class="text-sm text-muted-foreground">Count</p>
					<p data-testid="persist-basic-count" class="text-4xl font-semibold">{demo.basicStore.count}</p>
				</div>
				<Field.Field>
					<Field.Label>Label</Field.Label>
					<Input
						data-testid="persist-basic-label"
						value={demo.basicStore.label}
						oninput={(e) => demo.basicStore.$patch({ label: (e.target as HTMLInputElement).value })}
						class="w-48" />
				</Field.Field>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() =>
						demo.basicStore.$patch((s) => {
							s.count += 1;
						})}>Increment</Button>
				<Button variant="outline" onclick={() => demo.saveBasic()} data-testid="persist-basic-save">Save</Button>
				<Button
					variant="outline"
					onclick={() => {
						demo.basicStore.$persist.pause();
						demo.basicStore.$reset();
						demo.basicStore.$persist.resume();
					}}
					data-testid="persist-basic-reset">Reset store</Button>
				<Button variant="outline" onclick={() => demo.rehydrateBasic()} data-testid="persist-basic-rehydrate"
					>Rehydrate</Button>
				<Button variant="outline" onclick={() => demo.clearBasic()} data-testid="persist-basic-clear">Clear</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- Demo 2: pick filtering -->
	<ShowcaseSection
		label="02"
		tag="Pick filtering"
		title="Only persist specific fields"
		description="With pick: ['count'], only the count field is written to storage. The transient field reverts to its default after a cycle."
		code={pickCode}>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">count (persisted)</p>
					<p data-testid="persist-pick-count" class="text-4xl font-semibold">{demo.pickStore.count}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">transient (not persisted)</p>
					<Input
						data-testid="persist-pick-transient"
						value={demo.pickStore.transient}
						oninput={(e) => demo.pickStore.$patch({ transient: (e.target as HTMLInputElement).value })}
						class="w-48" />
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() =>
						demo.pickStore.$patch((s) => {
							s.count += 1;
						})}
					data-testid="persist-pick-increment">Increment count</Button>
				<Button variant="outline" onclick={() => demo.savePickAndRehydrate()}>Save → reset → rehydrate</Button>
				<Button variant="outline" onclick={() => demo.clearPick()}>Clear</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- Demo 3: omit filtering -->
	<ShowcaseSection
		label="03"
		tag="Omit filtering"
		title="Exclude specific fields from persistence"
		description="With omit: ['secret'], every field except 'secret' is persisted. The secret reverts to its default after a cycle."
		code={omitCode}>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">count (persisted)</p>
					<p data-testid="persist-omit-count" class="text-4xl font-semibold">{demo.omitStore.count}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">secret (not persisted)</p>
					<Input
						data-testid="persist-omit-secret"
						value={demo.omitStore.secret}
						oninput={(e) => demo.omitStore.$patch({ secret: (e.target as HTMLInputElement).value })}
						class="w-48" />
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() =>
						demo.omitStore.$patch((s) => {
							s.count += 1;
						})}>Increment count</Button>
				<Button variant="outline" onclick={() => demo.saveOmitAndRehydrate()}>Save → reset → rehydrate</Button>
				<Button variant="outline" onclick={() => demo.clearOmit()}>Clear</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- Demo 4: LZ compression -->
	<ShowcaseSection
		label="04"
		tag="LZ-string compression"
		title="Compress persisted payloads"
		description="Pass compression: createLzStringCompression() to shrink storage payloads using LZ-string. The raw stored value is shown below the controls."
		code={lzCode}>
		<div class="space-y-4">
			<div>
				<p class="text-sm text-muted-foreground">Count</p>
				<p data-testid="persist-compressed-count" class="text-4xl font-semibold">{demo.compressedStore.count}</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button
					data-testid="persist-compressed-increment"
					onclick={() =>
						demo.compressedStore.$patch((s) => {
							s.count += 1;
						})}>Increment</Button>
				<Button variant="outline" onclick={() => demo.saveCompressed()}>Compress & save</Button>
				<Button
					variant="outline"
					onclick={() => demo.saveAndRehydrateCompressed()}
					data-testid="persist-compressed-reset-rehydrate">Save → reset → rehydrate</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- Demo 5: TTL -->
	<ShowcaseSection
		label="05"
		tag="TTL expiration"
		title="Auto-expire persisted data"
		description="Persisted data older than ttl milliseconds is discarded on rehydration. Click 'Simulate expiry' to tamper the stored timestamp and show the TTL guard in action."
		code={ttlCode}>
		<div class="space-y-4">
			<div>
				<p class="text-sm text-muted-foreground">Count</p>
				<p data-testid="persist-ttl-count" class="text-4xl font-semibold">{demo.ttlStore.count}</p>
			</div>
			<p
				data-testid="persist-ttl-expired"
				class="text-sm font-medium {demo.isExpired ? 'text-destructive' : 'text-muted-foreground'}">
				{demo.isExpired ? 'Expired — rehydration discarded stale data' : 'Not expired'}
			</p>
			<div class="flex flex-wrap gap-2">
				<Button
					onclick={() =>
						demo.ttlStore.$patch((s) => {
							s.count += 1;
						})}>Increment</Button>
				<Button variant="outline" onclick={() => demo.saveTtl()}>Save (2 s TTL)</Button>
				<Button variant="outline" onclick={() => demo.expire()}>Simulate expiry</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- Activity log -->
	{#if demo.log.length > 0}
		<div class="rounded-xl border border-border/60 bg-muted/30 p-4">
			<p class="mb-2 text-sm font-medium">Activity log</p>
			<ul class="space-y-0.5 font-mono text-xs" data-testid="persist-log">
				{#each demo.log as entry (entry)}
					<li class="text-muted-foreground">{entry}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
