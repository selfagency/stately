<script lang="ts">
import { browser } from '$app/environment';
import { Button } from '$lib/components/ui/button/index.js';
import * as Card from '$lib/components/ui/card/index.js';
import { mountStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import {
  createStatelyInspectorHook,
  getStatelyInspectorHook,
  installStatelyInspectorHook
} from '$lib/inspector/hook.js';
import { onMount } from 'svelte';

if (browser) {
  installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const features = [
  {
    href: '/core',
    label: 'Core',
    tag: 'Option store · Setup store · storeToRefs',
    description: '$patch, $reset, $subscribe, $onAction, $dispose, and storeToRefs for safe destructuring.'
  },
  {
    href: '/sync',
    label: 'Sync',
    tag: 'BroadcastChannel · in-memory bus',
    description: 'Keep state consistent across browser tabs with pluggable sync transports.'
  },
  {
    href: '/persistence',
    label: 'Persistence',
    tag: 'localStorage · sessionStorage · IndexedDB · LZ-string',
    description: 'Persist state across page reloads with adapters, pick/omit filtering, and TTL expiry.'
  },
  {
    href: '/history',
    label: 'History',
    tag: 'Undo · Redo · Time travel',
    description: 'Batch mutations into single undo steps and jump anywhere in the recorded timeline.'
  },
  {
    href: '/async',
    label: 'Async',
    tag: 'restartable · drop · parallel · enqueue · dedupe',
    description: 'Concurrency control with automatic loading/error state, cancellation, and debounce/throttle helpers.'
  },
  {
    href: '/fsm',
    label: 'FSM',
    tag: 'Finite state machine',
    description: 'Replace boolean soup with an explicit lifecycle machine. Invalid transitions are enforced at runtime.'
  },
  {
    href: '/validation',
    label: 'Validation',
    tag: 'Validation plugin · before-action guards',
    description: 'Reject invalid patches before they reach the store and intercept actions before they fire.'
  }
];

onMount(() => {
  mountStatelyInspector();
});
</script>

<svelte:head>
  <title>Stately showcase</title>
  <meta name="description" content="Interactive showcase for the Stately reactive state library." />
</svelte:head>

<div class="container mx-auto px-4 py-12 md:px-6">
  <div class="mb-12 space-y-4">
    <h1 class="text-4xl font-bold tracking-tight text-foreground">Stately showcase</h1>
    <p class="max-w-2xl text-lg text-muted-foreground">
      Live demos and browser tests for every feature in the library. Pick a section to explore.
    </p>
  </div>

  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="feature-grid">
    {#each features as feature (feature.href)}
      <Card.Root class="group border-border/70 bg-card/70 shadow-xs transition-shadow hover:shadow-md">
        <Card.Header>
          <Card.Description class="text-xs font-semibold uppercase tracking-[0.18em]">{feature.tag}</Card.Description>
          <Card.Title class="text-xl">{feature.label}</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="mb-5 text-sm text-muted-foreground">{feature.description}</p>
          <Button href={feature.href} variant="outline" size="sm">Explore {feature.label}</Button>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
