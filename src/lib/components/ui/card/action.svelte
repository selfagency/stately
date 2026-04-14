<script lang="ts">
import { cn } from '$lib/utils.js';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<div class={cn('flex items-center gap-2', className)}>
  {@render children?.()}
</div>
