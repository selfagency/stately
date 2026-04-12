<script lang="ts">
import { cn } from '$lib/utils.js';
let { children, class: className = '' } = $props<{ children?: import('svelte').Snippet; class?: string }>();
</script>

<section
	class={cn(
		'rounded-[1.6rem] border border-border bg-card/78 text-card-foreground shadow-[0_24px_70px_rgb(3_8_14/0.42)] backdrop-blur-xl',
		className
	)}>
	{@render children?.()}
</section>
