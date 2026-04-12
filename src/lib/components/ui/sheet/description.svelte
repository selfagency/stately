<script lang="ts">
import { cn } from '$lib/utils.js';
import { Dialog } from 'bits-ui';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<Dialog.Description class={cn('text-sm leading-6 text-muted-foreground', className)}>
	{@render children?.()}
</Dialog.Description>
