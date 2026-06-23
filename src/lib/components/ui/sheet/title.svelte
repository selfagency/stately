<script lang="ts">
import { Dialog } from 'bits-ui';
import { cn } from '$lib/utils.js';

let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<Dialog.Title class={cn('font-serif text-3xl font-semibold tracking-[-0.04em] text-popover-foreground', className)}>
  {@render children?.()}
</Dialog.Title>
