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
import { createSyncDemo } from './sync-demo.js';

if (browser) {
	installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createSyncDemo();

const memCode = `const bus = createInMemorySyncBus();
const manager = createStateManager()
  .use(createSyncPlugin({ origin: 'tab-a', transports: [bus.createTransport()] }));
const peer = createStateManager()
  .use(createSyncPlugin({ origin: 'tab-b', transports: [bus.createTransport()] }));

// Mutate tab A → tab B reflects it immediately
tabA.increment();
console.log(tabB.count); // 1`;

const bcCode = `const transport = createBroadcastChannelTransport('my-channel');
const manager = createStateManager()
  .use(createSyncPlugin({ origin: 'tab-a', transports: [transport] }));

// Any tab that opens 'my-channel' will receive the mutation`;

onMount(() => {
	mountStatelyInspector();
	return () => demo.destroy();
});
</script>

<svelte:head>
	<title>Sync — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Sync</h1>
		<p class="text-muted-foreground">Synchronize state across browser contexts with pluggable transports.</p>
	</div>

	<ShowcaseSection
		label="01"
		tag="In-memory sync bus"
		title="Simulate cross-tab state sync within a single page"
		description="Two store instances share a sync bus. Incrementing either side propagates to the other — identical to BroadcastChannel but without browser tab overhead."
		code={memCode}>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-xl border border-border/80 bg-card/85 p-5">
				<p class="mb-1 text-sm font-medium text-muted-foreground">Tab A (in-memory)</p>
				<p data-testid="sync-mem-a-count" class="mb-4 text-4xl font-semibold">{demo.memPrimary.count}</p>
				<Button
					type="button"
					onclick={() =>
						demo.memPrimary.$patch((s) => {
							s.count += 1;
						})}>Increment Tab A</Button>
			</div>
			<div class="rounded-xl border border-border/80 bg-card/85 p-5">
				<p class="mb-1 text-sm font-medium text-muted-foreground">Tab B (in-memory)</p>
				<p data-testid="sync-mem-b-count" class="mb-4 text-4xl font-semibold">{demo.memPeer.count}</p>
				<Button
					type="button"
					variant="outline"
					onclick={() =>
						demo.memPeer.$patch((s) => {
							s.count += 1;
						})}>Increment Tab B</Button>
			</div>
		</div>
	</ShowcaseSection>

	<ShowcaseSection
		label="02"
		tag="BroadcastChannel sync"
		title="Real browser cross-tab messaging via BroadcastChannel"
		description="Uses the native BroadcastChannel API. Two instances on the same channel stay in sync — open a second tab to witness the live replication."
		code={bcCode}>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-xl border border-border/80 bg-card/85 p-5">
				<p class="mb-1 text-sm font-medium text-muted-foreground">Primary (BroadcastChannel)</p>
				<p data-testid="sync-bc-primary-count" class="mb-4 text-4xl font-semibold">{demo.bcPrimary.count}</p>
				<Button
					type="button"
					onclick={() =>
						demo.bcPrimary.$patch((s) => {
							s.count += 1;
						})}>Increment Primary</Button>
			</div>
			<div class="rounded-xl border border-border/80 bg-card/85 p-5">
				<p class="mb-1 text-sm font-medium text-muted-foreground">Peer (BroadcastChannel)</p>
				<p data-testid="sync-bc-peer-count" class="mb-4 text-4xl font-semibold">{demo.bcPeer.count}</p>
				<Button
					type="button"
					variant="outline"
					onclick={() =>
						demo.bcPeer.$patch((s) => {
							s.count += 1;
						})}>Increment Peer</Button>
			</div>
		</div>
		<Card.Root size="sm">
			<Card.Content>
				<p class="text-sm text-muted-foreground">
					Note: BroadcastChannel messages are not delivered to the sender. Incrementing one side syncs to the other but
					the sender doesn't receive its own message.
				</p>
			</Card.Content>
		</Card.Root>
	</ShowcaseSection>
</div>
