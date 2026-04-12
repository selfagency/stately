<script lang="ts">
import { cn } from '$lib/utils.js';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<div class={cn('flex flex-col gap-2 px-6 pt-6', className)}>
	{@render children?.()}
</div>
