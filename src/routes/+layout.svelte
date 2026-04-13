<script lang="ts">
import '../app.css';

let { children } = $props();

const routes = [
	{ href: '/core', label: 'Core' },
	{ href: '/sync', label: 'Sync' },
	{ href: '/persistence', label: 'Persistence' },
	{ href: '/history', label: 'History' },
	{ href: '/async', label: 'Async' },
	{ href: '/fsm', label: 'FSM' },
	{ href: '/validation', label: 'Validation' }
];
</script>

<nav class="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
	<div class="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href="/" class="font-semibold tracking-tight text-foreground transition-colors hover:text-primary">Stately</a>
		{#each routes as route (route.href)}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={route.href} class="text-sm text-muted-foreground transition-colors hover:text-foreground"
				>{route.label}</a>
		{/each}
	</div>
</nav>

{@render children?.()}
