<script lang="ts">
import { browser } from '$app/environment';
import ShowcaseSection from '$lib/components/ShowcaseSection.svelte';
import { Button } from '$lib/components/ui/button/index.js';
import { mountStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import {
	createStatelyInspectorHook,
	getStatelyInspectorHook,
	installStatelyInspectorHook
} from '$lib/inspector/hook.js';
import { onMount } from 'svelte';
import { createAsyncDemo } from './async-demo.svelte.js';

if (browser) {
	installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createAsyncDemo();

const restartableCode = `createAsyncPlugin({ policies: { load: 'restartable' } })
// Each new call cancels any in-flight request`;

const dropCode = `createAsyncPlugin({ policies: { load: 'drop' } })
// While loading, extra calls are silently discarded`;

const errorCode = `// Error state is automatically tracked on $async
await store.load(true); // throws
store.$async.load.isLoading; // false
// catch errors inside the action and expose via state`;

const debounceCode = `import { debounceAction } from '@selfagency/stately';

const debouncedSave = debounceAction((value: string) => {
  store.save(value);
}, 500);

input.addEventListener('input', (e) => debouncedSave(e.target.value));`;

const throttleCode = `import { throttleAction } from '@selfagency/stately';

const throttledScroll = throttleAction((pos: number) => {
  store.updateScrollPos(pos);
}, 100);`;

onMount(() => {
	mountStatelyInspector();
	return () => demo.destroy();
});
</script>

<svelte:head>
	<title>Async — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">Async</h1>
		<p class="text-muted-foreground">
			Automatic loading/error tracking, concurrency control, debounce, and throttle helpers.
		</p>
	</div>

	<!-- Restartable -->
	<ShowcaseSection
		label="01"
		tag="Restartable"
		title="Each call cancels the previous in-flight request"
		description="With policy: 'restartable', clicking Load repeatedly always starts fresh. The call count increments but only the latest result is committed."
		code={restartableCode}>
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">isLoading</p>
					<p data-testid="async-restartable-loading" class="text-2xl font-semibold">
						{demo.restartableStore.$async.load.isLoading ? 'true' : 'false'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">value</p>
					<p data-testid="async-restartable-value" class="text-2xl font-semibold">
						{demo.restartableStore.value || '—'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">call count</p>
					<p data-testid="async-restartable-calls" class="text-2xl font-semibold">
						{demo.restartableStore.callCount}
					</p>
				</div>
			</div>
			<Button onclick={() => demo.restartableStore.load(600)} data-testid="async-restartable-btn">Load (600 ms)</Button>
		</div>
	</ShowcaseSection>

	<!-- Drop -->
	<ShowcaseSection
		label="02"
		tag="Drop"
		title="Additional calls are silently ignored while loading"
		description="With policy: 'drop', clicking Load while a request is in-flight is a no-op. The call count won't increase."
		code={dropCode}>
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">isLoading</p>
					<p data-testid="async-drop-loading" class="text-2xl font-semibold">
						{demo.dropStore.$async.load.isLoading ? 'true' : 'false'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">value</p>
					<p data-testid="async-drop-value" class="text-2xl font-semibold">
						{demo.dropStore.value || '—'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">call count</p>
					<p data-testid="async-drop-calls" class="text-2xl font-semibold">
						{demo.dropStore.callCount}
					</p>
				</div>
			</div>
			<Button onclick={() => demo.dropStore.load(600)} data-testid="async-drop-btn">Load (600 ms)</Button>
		</div>
	</ShowcaseSection>

	<!-- Error tracking -->
	<ShowcaseSection
		label="03"
		tag="Error state"
		title="Automatic isLoading tracking with error handling"
		description="isLoading flips to false after a failed action. Errors can be caught inside the action and exposed as reactive state."
		code={errorCode}>
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div>
					<p class="text-sm text-muted-foreground">isLoading</p>
					<p data-testid="async-error-loading" class="text-2xl font-semibold">
						{demo.errorStore.$async.load.isLoading ? 'true' : 'false'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">value</p>
					<p data-testid="async-error-value" class="text-2xl font-semibold">
						{demo.errorStore.value || '—'}
					</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">error</p>
					<p data-testid="async-error-message" class="truncate text-2xl font-semibold text-destructive">
						{demo.errorStore.error || '—'}
					</p>
				</div>
			</div>
			<div class="flex gap-2">
				<Button onclick={() => demo.errorStore.load(false)} data-testid="async-error-success-btn">
					Load (success)
				</Button>
				<Button variant="destructive" onclick={() => demo.errorStore.load(true)} data-testid="async-error-fail-btn">
					Load (fail)
				</Button>
			</div>
		</div>
	</ShowcaseSection>

	<!-- debounceAction -->
	<ShowcaseSection
		label="04"
		tag="debounceAction"
		title="Delay execution until input settles"
		description="Click rapidly — the function only fires 500 ms after the last click."
		code={debounceCode}>
		<div class="space-y-4">
			<Button onclick={() => demo.triggerDebounce()} data-testid="async-debounce-btn">
				Trigger (debounced 500 ms)
			</Button>
			<ul class="space-y-0.5 font-mono text-xs text-muted-foreground" data-testid="async-debounce-log">
				{#each demo.debounceLog as entry (entry)}
					<li>{entry}</li>
				{/each}
				{#if demo.debounceLog.length === 0}
					<li class="italic">No fires yet</li>
				{/if}
			</ul>
		</div>
	</ShowcaseSection>

	<!-- throttleAction -->
	<ShowcaseSection
		label="05"
		tag="throttleAction"
		title="Rate-limit execution to at most once per interval"
		description="Click rapidly — the function fires at most once per second."
		code={throttleCode}>
		<div class="space-y-4">
			<Button onclick={() => demo.triggerThrottle()} data-testid="async-throttle-btn">Trigger (throttled 1 s)</Button>
			<ul class="space-y-0.5 font-mono text-xs text-muted-foreground" data-testid="async-throttle-log">
				{#each demo.throttleLog as entry (entry)}
					<li>{entry}</li>
				{/each}
				{#if demo.throttleLog.length === 0}
					<li class="italic">No fires yet</li>
				{/if}
			</ul>
		</div>
	</ShowcaseSection>
</div>
