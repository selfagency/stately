<script lang="ts">
import { cn } from '$lib/utils.js';
import { Dialog } from 'bits-ui';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<Dialog.Title class={cn('font-serif text-3xl font-semibold tracking-[-0.04em] text-popover-foreground', className)}>
  {@render children?.()}
</Dialog.Title>
