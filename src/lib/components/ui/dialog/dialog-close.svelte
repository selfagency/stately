<script lang="ts">
import { Dialog as DialogPrimitive } from 'bits-ui';

let { ref = $bindable(null), type = 'button', ...restProps }: DialogPrimitive.CloseProps = $props();
</script>

<DialogPrimitive.Close bind:ref={ref} data-slot="dialog-close" type={type} {...restProps} />
