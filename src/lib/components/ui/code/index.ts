import { tv, type VariantProps } from 'tailwind-variants';
import CopyButton from './code-copy-button.svelte';
import Overflow from './code-overflow.svelte';
import Root from './code.svelte';
import type { CodeCopyButtonProps, CodeRootProps } from './types.js';

export const codeVariants = tv({
  base: 'not-prose relative h-full overflow-auto rounded-lg border',
  variants: {
    variant: {
      default: 'border-border bg-card',
      secondary: 'bg-secondary/50 border-transparent'
    }
  }
});

export type CodeVariant = VariantProps<typeof codeVariants>['variant'];

export { CopyButton, Overflow, Root, type CodeCopyButtonProps as CopyButtonProps, type CodeRootProps as RootProps };
