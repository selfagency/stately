<script lang="ts">
import { cn } from '$lib/utils.js';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<p class={cn('text-sm leading-6 text-muted-foreground', className)}>
  {@render children?.()}
</p>
