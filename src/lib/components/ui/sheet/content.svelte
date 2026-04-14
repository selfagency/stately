<script lang="ts">
import { cn } from '$lib/utils.js';
import { Dialog } from 'bits-ui';

type Side = 'top' | 'right' | 'bottom' | 'left';

const sideClasses: Record<Side, string> = {
  top: 'inset-x-3 top-3 max-h-[min(32rem,calc(100dvh-1.5rem))] rounded-[1.4rem] border',
  right: 'bottom-3 right-3 top-3 h-[calc(100dvh-1.5rem)] w-[min(30rem,calc(100vw-1.5rem))] rounded-[1.5rem] border',
  bottom: 'inset-x-3 bottom-3 max-h-[min(32rem,calc(100dvh-1.5rem))] rounded-[1.4rem] border',
  left: 'bottom-3 left-3 top-3 h-[calc(100dvh-1.5rem)] w-[min(30rem,calc(100vw-1.5rem))] rounded-[1.5rem] border'
};

type Props = {
  children?: import('svelte').Snippet;
  class?: string;
  side?: Side;
  trapFocus?: boolean;
  preventScroll?: boolean;
  interactOutsideBehavior?: 'close' | 'ignore' | 'defer-otherwise-close' | 'defer-otherwise-ignore';
  escapeKeydownBehavior?: 'close' | 'ignore' | 'defer-otherwise-close' | 'defer-otherwise-ignore';
  onOpenAutoFocus?: (event: Event) => void;
};

let props: Props = $props();

const side = $derived((props.side ?? 'right') as Side);
const className = $derived(props.class ?? '');
const trapFocus = $derived(props.trapFocus ?? false);
const preventScroll = $derived(props.preventScroll ?? false);
const interactOutsideBehavior = $derived(props.interactOutsideBehavior ?? 'ignore');
const escapeKeydownBehavior = $derived(props.escapeKeydownBehavior ?? 'close');

function handleOpenAutoFocus(event: Event) {
  event.preventDefault();
  props.onOpenAutoFocus?.(event);
}
</script>

<Dialog.Portal>
  <Dialog.Content
    class={cn(
      'fixed z-50 flex flex-col overflow-hidden border-border bg-popover/96 text-popover-foreground shadow-[0_28px_90px_rgb(4_8_15/0.52)] backdrop-blur-xl outline-none',
      sideClasses[side],
      className
    )}
    trapFocus={trapFocus}
    preventScroll={preventScroll}
    interactOutsideBehavior={interactOutsideBehavior}
    escapeKeydownBehavior={escapeKeydownBehavior}
    onOpenAutoFocus={handleOpenAutoFocus}>
    {@render props.children?.()}
  </Dialog.Content>
</Dialog.Portal>
