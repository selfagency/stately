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
import { createHistoryDemo } from './history-demo.js';

if (browser) {
  installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createHistoryDemo();
const { store } = demo;

const undoRedoCode = `const manager = createStateManager().use(createHistoryPlugin());
const useStore = defineStore('my-store', {
  state: () => ({ count: 0 }),
  history: { limit: 10 }
});
const store = useStore(manager);

store.count++;
store.$history.undo(); // count → 0
store.$history.redo(); // count → 1`;

const batchCode = `store.$history.startBatch();
store.count++; // not recorded yet
store.count++; // not recorded yet
store.$history.endBatch(); // one combined entry`;

const timeTravelCode = `// Jump directly to any snapshot index
store.$timeTravel.goTo(2);
// store.$timeTravel.entries contains all snapshots`;

onMount(() => {
  mountStatelyInspector();
  return () => demo.destroy();
});
</script>

<svelte:head>
  <title>History — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">History</h1>
    <p class="text-muted-foreground">Undo, redo, batch operations, and time-travel debugging for store state.</p>
  </div>

  <!-- Undo / Redo -->
  <ShowcaseSection
    label="01"
    tag="Undo / Redo"
    title="Navigate the mutation history"
    description="Every mutation is automatically recorded. Use undo and redo to move between snapshots."
    code={undoRedoCode}>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-muted-foreground">count</p>
          <p data-testid="history-count" class="text-4xl font-semibold">{store.count}</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">History entries</p>
          <p data-testid="history-entry-count" class="text-4xl font-semibold">{store.$history.entries.length}</p>
        </div>
      </div>
      <Field.Field>
        <Field.Label>Label</Field.Label>
        <Input
          data-testid="history-label"
          value={store.label}
          oninput={(e) => demo.setLabel((e.target as HTMLInputElement).value)}
          class="w-64" />
      </Field.Field>
      <div class="flex flex-wrap gap-2">
        <Button onclick={() => demo.increment()} data-testid="history-increment">Increment</Button>
        <Button
          variant="outline"
          onclick={() => store.$history.undo()}
          disabled={!store.$history.canUndo}
          data-testid="history-undo">
          Undo
        </Button>
        <Button
          variant="outline"
          onclick={() => store.$history.redo()}
          disabled={!store.$history.canRedo}
          data-testid="history-redo">
          Redo
        </Button>
        <Button variant="outline" onclick={() => store.$reset()}>Reset</Button>
      </div>
    </div>
  </ShowcaseSection>

  <!-- Batch operations -->
  <ShowcaseSection
    label="02"
    tag="Batch operations"
    title="Record multiple mutations as one history entry"
    description="startBatch / endBatch wraps a sequence of mutations into a single undo step."
    code={batchCode}>
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Click "Batch +3" — three increments produce one history entry rather than three.
      </p>
      <div class="flex flex-wrap gap-2">
        <Button onclick={() => demo.batchIncrement(3)} data-testid="history-batch">Batch +3</Button>
        <Button variant="outline" onclick={() => store.$history.undo()} disabled={!store.$history.canUndo}>
          Undo batch
        </Button>
      </div>
    </div>
  </ShowcaseSection>

  <!-- Time travel -->
  <ShowcaseSection
    label="03"
    tag="Time travel"
    title="Jump to any snapshot in the history"
    description="Click any entry in the timeline below to restore that exact snapshot."
    code={timeTravelCode}>
    <div class="space-y-3">
      <p class="text-sm text-muted-foreground">
        Current index: <span data-testid="history-current-index" class="font-mono font-medium"
          >{store.$timeTravel.currentIndex}</span>
      </p>
      <div class="space-y-1" data-testid="history-timeline">
        {#each store.$timeTravel.entries as entry, i (i)}
          <button
            type="button"
            onclick={() => store.$timeTravel.goTo(i)}
            class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted {i ===
            store.$timeTravel.currentIndex
              ? 'bg-primary/10 font-medium'
              : 'text-muted-foreground'}">
            <span class="w-6 font-mono text-xs opacity-60">{i}</span>
            <span>count = {entry.snapshot.count}</span>
            <span class="opacity-60">label = "{entry.snapshot.label}"</span>
          </button>
        {/each}
      </div>
    </div>
  </ShowcaseSection>
</div>
