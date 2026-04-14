<script lang="ts">
import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
import XIcon from '@lucide/svelte/icons/x';
import { Dialog as DialogPrimitive } from 'bits-ui';
import type { ComponentProps, Snippet } from 'svelte';
import DialogPortal from './dialog-portal.svelte';
import * as Dialog from './index.js';

let {
  ref = $bindable(null),
  class: className,
  portalProps,
  children,
  showCloseButton = true,
  ...restProps
}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
  portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
  children: Snippet;
  showCloseButton?: boolean;
} = $props();
</script>

<DialogPortal {...portalProps}>
  <Dialog.Overlay />
  <DialogPrimitive.Content
    bind:ref={ref}
    data-slot="dialog-content"
    class={cn(
      'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none',
      className
    )}
    {...restProps}>
    {@render children?.()}
    {#if showCloseButton}
      <DialogPrimitive.Close
        data-slot="dialog-close"
        class="ring-ring/50 hover:bg-muted hover:text-foreground absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2">
        <XIcon />
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</DialogPortal>
