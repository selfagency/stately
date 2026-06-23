<script lang="ts">
import { Dialog } from 'bits-ui';
import { cn } from '$lib/utils.js';

let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<Dialog.Description class={cn('text-sm leading-6 text-muted-foreground', className)}>
  {@render children?.()}
</Dialog.Description>
