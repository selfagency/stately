<script lang="ts">
import { cn } from '$lib/utils.js';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<h3 class={cn('font-serif text-2xl font-semibold tracking-[-0.03em] text-card-foreground', className)}>
  {@render children?.()}
</h3>
