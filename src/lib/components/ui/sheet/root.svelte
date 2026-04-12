<script lang="ts">
import { Dialog } from 'bits-ui';

let { open = $bindable(false), children } = $props<{ open?: boolean; children?: import('svelte').Snippet }>();
</script>

<Dialog.Root bind:open={open}>
	{@render children?.()}
</Dialog.Root>
