<script lang="ts">
import { cn } from '$lib/utils.js';
import { CopyButton } from '../copy-button/index.js';
import { useCodeCopyButton } from './code.svelte.js';
import type { CodeCopyButtonProps } from './types.js';

let {
	ref = $bindable(null),
	variant = 'ghost',
	size = 'icon',
	class: className,
	...rest
}: CodeCopyButtonProps = $props();

const copyButton = useCodeCopyButton();
</script>

<CopyButton
	bind:ref={ref}
	class={cn('bg-sidebar/95 border-border absolute top-2 right-2 border shadow-xs backdrop-blur-sm', className)}
	text={copyButton.code}
	variant={variant}
	size={size}
	{...rest} />
