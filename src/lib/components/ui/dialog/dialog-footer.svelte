<script lang="ts">
import { cn, type WithElementRef } from '$lib/utils.js';
import { Dialog as DialogPrimitive } from 'bits-ui';
import type { HTMLAttributes } from 'svelte/elements';

let {
	ref = $bindable(null),
	class: className,
	children,
	showCloseButton = false,
	...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
	showCloseButton?: boolean;
} = $props();
</script>

<div
	bind:this={ref}
	data-slot="dialog-footer"
	class={cn(
		'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
		className
	)}
	{...restProps}>
	{@render children?.()}
	{#if showCloseButton}
		<DialogPrimitive.Close
			class="focus-visible:border-ring focus-visible:ring-ring/50 border-border bg-background hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[0.8rem] font-medium outline-none transition-all focus-visible:ring-3">
			Close
		</DialogPrimitive.Close>
	{/if}
</div>
