<script lang="ts">
import { Badge } from '$lib/components/ui/badge/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import * as Card from '$lib/components/ui/card/index.js';

let {
  primaryCount,
  peerCount,
  doubleCount
}: {
  primaryCount: number;
  peerCount: number;
  doubleCount: number;
} = $props();
</script>

<Card.Root>
  <Card.Header class="gap-8">
    <div class="space-y-6">
      <div class="flex flex-wrap gap-2">
        <Badge>Pinia-style stores</Badge>
        <Badge variant="secondary">Svelte 5 runes</Badge>
        <Badge variant="secondary">Live demo surface</Badge>
      </div>
      <div class="space-y-3">
        <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">Stately showcase</h1>
        <Card.Description class="max-w-2xl text-base leading-7">
          Explore practical examples for sync, persistence, history, and async orchestration with a live demo beside the
          implementation pattern.
        </Card.Description>
      </div>
      <div class="flex flex-wrap gap-3">
        <Button href="https://stately.self.agency/" target="_blank" rel="noreferrer">Docs</Button>
        <Button href="https://github.com/selfagency/stately" target="_blank" rel="noreferrer" variant="outline"
          >GitHub repo</Button>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <Card.Root size="sm" class="border-primary/20 bg-primary/5">
          <Card.Header class="gap-3 text-center">
            <Card.Description class="uppercase tracking-[0.18em]">Primary Tab</Card.Description>
            <Card.Title class="text-4xl font-semibold tracking-tight">{primaryCount}</Card.Title>
          </Card.Header>
        </Card.Root>
        <Card.Root size="sm" class="border-secondary/25 bg-secondary/8">
          <Card.Header class="gap-3 text-center">
            <Card.Description class="uppercase tracking-[0.18em]">Secondary Tab</Card.Description>
            <Card.Title class="text-4xl font-semibold tracking-tight">{peerCount}</Card.Title>
          </Card.Header>
        </Card.Root>
        <Card.Root size="sm" class="border-primary/15 bg-muted/60">
          <Card.Header class="gap-3 text-center">
            <Card.Description class="uppercase tracking-[0.18em]">Derived Count</Card.Description>
            <Card.Title class="text-4xl font-semibold tracking-tight">{doubleCount}</Card.Title>
          </Card.Header>
        </Card.Root>
      </div>
    </div>

    <div class="grid gap-4 border-t border-border/70 pt-6 text-sm md:grid-cols-3">
      <div class="space-y-1">
        <p class="font-medium text-foreground">What this page is for</p>
        <p class="text-muted-foreground">
          Use the live controls to evaluate how Stately behaves in situations teams actually ship.
        </p>
      </div>
      <div class="space-y-1">
        <p class="font-medium text-foreground">Best viewed as</p>
        <p class="text-muted-foreground">
          An interactive reference where each section pairs behavior, state output, and implementation shape.
        </p>
      </div>
      <div class="space-y-1">
        <p class="font-medium text-foreground">Inspector</p>
        <p class="text-muted-foreground">
          Open the Stately sheet at any time to inspect live snapshots while using the app.
        </p>
      </div>
    </div>
  </Card.Header>
</Card.Root>
