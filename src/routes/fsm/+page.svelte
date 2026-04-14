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
import { createFsmDemo } from './fsm-demo.js';

if (browser) {
  installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createFsmDemo();
const { trafficStore, orderStore } = demo;

const fsmCode = `const useStore = defineStore('my-store', {
  state: () => ({ count: 0 }),
  fsm: {
    initial: 'idle',
    states: {
      idle: { START: 'loading' },
      loading: { RESOLVE: 'success', REJECT: 'error' },
      success: { RESET: 'idle' },
      error: { RETRY: 'loading', RESET: 'idle' }
    }
  }
});
const store = useStore(manager);

store.$fsm.current; // 'idle'
store.$fsm.send('START'); // → 'loading'
store.$fsm.can('RESOLVE'); // true
store.$fsm.matches('loading', 'error'); // true`;

const guardCode = `// send() returns the resulting state name
const next = store.$fsm.send('SUBMIT');
if (next !== 'pending') {
  // Transition was blocked (event not allowed in current state)
}`;

onMount(() => {
  mountStatelyInspector();
  return () => demo.destroy();
});
</script>

<svelte:head>
  <title>FSM — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">FSM</h1>
    <p class="text-muted-foreground">
      Finite state machine plugin — constrain transitions and co-locate logic with state.
    </p>
  </div>

  <!-- Traffic Light -->
  <ShowcaseSection
    label="01"
    tag="Traffic light"
    title="Simple three-state machine"
    description="The FSM plugin enforces allowed transitions. Red → Green → Yellow → Red is the only valid sequence."
    code={fsmCode}>
    <div class="flex items-center gap-8">
      <div class="flex flex-col items-center gap-2">
        <div
          data-testid="fsm-traffic-light"
          class="h-16 w-16 rounded-full border-2 border-border transition-colors duration-300"
          style="background-color: {demo.trafficColor};">
        </div>
        <p data-testid="fsm-traffic-state" class="font-mono text-sm font-medium uppercase">
          {trafficStore.$fsm.current}
        </p>
      </div>
      <Button onclick={() => trafficStore.$fsm.send('NEXT')} data-testid="fsm-traffic-next">Next</Button>
    </div>
  </ShowcaseSection>

  <!-- Order Workflow -->
  <ShowcaseSection
    label="02"
    tag="Order workflow"
    title="Multi-stage workflow with guards"
    description="Walk through an order lifecycle: idle → draft → pending → fulfilled (or rejected → retry). Only explicitly allowed transitions are accepted."
    code={guardCode}>
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-muted-foreground">Current state:</p>
        <span data-testid="fsm-order-state" class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
          {orderStore.$fsm.current}
        </span>
      </div>

      <!-- State machine flow diagram (text) -->
      <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        {#each ['idle', 'draft', 'pending', 'fulfilled', 'rejected'] as state (state)}
          <div
            class="rounded border px-2 py-1 {orderStore.$fsm.current === state
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : 'border-border'}">
            {state}
          </div>
        {/each}
      </div>

      <!-- Action buttons — only show allowed transitions -->
      <div class="flex flex-wrap gap-2">
        {#if orderStore.$fsm.can('START')}
          <Button onclick={() => orderStore.$fsm.send('START')} data-testid="fsm-order-start">Start order</Button>
        {/if}
        {#if orderStore.$fsm.can('SUBMIT')}
          <Button onclick={() => orderStore.$fsm.send('SUBMIT')} data-testid="fsm-order-submit">Submit</Button>
        {/if}
        {#if orderStore.$fsm.can('APPROVE')}
          <Button onclick={() => orderStore.$fsm.send('APPROVE')} data-testid="fsm-order-approve">Approve</Button>
        {/if}
        {#if orderStore.$fsm.can('REJECT')}
          <Button variant="destructive" onclick={() => orderStore.$fsm.send('REJECT')} data-testid="fsm-order-reject">
            Reject
          </Button>
        {/if}
        {#if orderStore.$fsm.can('RETRY')}
          <Button variant="outline" onclick={() => orderStore.$fsm.send('RETRY')} data-testid="fsm-order-retry">
            Retry
          </Button>
        {/if}
        {#if orderStore.$fsm.can('CANCEL')}
          <Button variant="outline" onclick={() => orderStore.$fsm.send('CANCEL')} data-testid="fsm-order-cancel">
            Cancel
          </Button>
        {/if}
        {#if orderStore.$fsm.can('RESET')}
          <Button variant="outline" onclick={() => orderStore.$fsm.send('RESET')} data-testid="fsm-order-reset">
            Reset
          </Button>
        {/if}
      </div>
    </div>
  </ShowcaseSection>
</div>
