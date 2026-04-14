<script lang="ts">
import { Badge } from '$lib/components/ui/badge/index.js';
import * as Card from '$lib/components/ui/card/index.js';
import * as Code from '$lib/components/ui/code/index.js';
import { Window } from '$lib/components/ui/window/index.js';

import type { Snippet } from 'svelte';

let {
  label,
  tag,
  title,
  description,
  code,
  status,
  children,
  actions
}: {
  label: string;
  tag: string;
  title: string;
  description: string;
  code: string;
  status?: string;
  children?: Snippet;
  actions?: Snippet;
} = $props();
</script>

<Window class="h-auto w-full shadow-sm" contentClass="p-0">
  <div class="border-b border-border/80 bg-muted/30 px-6 py-5">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <Badge>{label}</Badge>
          <Badge variant="secondary">{tag}</Badge>
        </div>
        <div class="space-y-2">
          <Card.Title class="text-2xl tracking-tight">{title}</Card.Title>
          <Card.Description class="max-w-3xl text-sm leading-7">{description}</Card.Description>
        </div>
      </div>
      {#if status || actions}
        <div class="flex items-center gap-3">
          {#if status}
            <Badge variant="secondary">{status}</Badge>
          {/if}
          {@render actions?.()}
        </div>
      {/if}
    </div>
  </div>

  <div class="space-y-4 p-5">
    <div class="space-y-4">
      {@render children?.()}
    </div>
    <div class="space-y-2">
      <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sample code</h2>
      <Code.Root
        code={code}
        lang="typescript"
        class="h-auto w-full rounded-xl border border-border/80 bg-sidebar shadow-xs">
        <Code.CopyButton class="bg-white hover:bg-primary hover:text-white top-3 right-3" />
      </Code.Root>
    </div>
  </div>
</Window>
