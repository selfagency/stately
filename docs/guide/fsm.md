# Finite State Machines

Use the FSM plugin when a store follows a specific workflow with defined states and valid transitions.

This approach is a robust alternative to managing multiple booleans like `isLoading`, `isSaving`, and `hasError`, which can often lead to "impossible" state combinations.

## Getting Started

To enable FSM support, add the plugin to your state manager:

```ts
import { createFsmPlugin, createStateManager } from '@selfagency/stately';

const manager = createStateManager().use(createFsmPlugin());
```

## Defining Workflow States

Add an `fsm` property to your store definition, including an `initial` state and a `states` map:

```ts
import { defineStore } from '@selfagency/stately';

export const useCheckoutStore = defineStore('checkout', {
	state: () => ({ total: 0, errorMessage: '' }),
	fsm: {
		initial: 'idle',
		states: {
			idle: {
				begin: 'editing'
			},
			editing: {
				submit: 'submitting',
				cancel: 'idle'
			},
			submitting: {
				success: 'success',
				fail: 'error'
			},
			error: {
				retry: 'submitting',
				reset: 'editing'
			},
			success: {}
		}
	}
});
```

## Managing State with `$fsm`

The plugin attaches an `$fsm` controller to the store instance for managing transitions and checking the current state:

```ts
const checkout = useCheckoutStore(manager);

// Trigger transitions
checkout.$fsm.send('begin');
checkout.$fsm.send('submit');

// Check the current state
if (checkout.$fsm.matches('submitting', 'error')) {
	// Render specific UI based on state
}
```

### The `$fsm` Controller API

- `current`: The name of the active state.
- `send(event, ...args)`: Executes a transition and returns the new state.
- `matches(...states)`: Returns `true` if the current state matches any of the provided names.
- `can(event)`: Checks if the current state defines a transition for the given event.

## Lifecycle Hooks

States can define `_enter` and `_exit` hooks to perform side effects during transitions.

```ts
fsm: {
	initial: 'idle',
	states: {
		editing: {
			_enter(context) {
				console.log('Entered editing from:', context.from);
			},
			submit: 'submitting'
		},
		submitting: {
			_exit(context) {
				console.log('Leaving submitting due to:', context.event);
			},
			success: 'success',
			fail: 'error'
		}
	}
}
```

The hook `context` provides:

- `from`: The previous state.
- `to`: The next state.
- `event`: The event that triggered the transition.
- `args`: Any arguments passed to `send()`.

## Dynamic Transitions

Event handlers can be functions that return a target state name or `undefined` to remain in the current state. Use this when a transition depends on the event payload:

```ts
submitting: {
	fail(message: string) {
		return message.includes('retryable') ? 'error' : undefined;
	}
}
```

## Integration with Other Plugins

FSM state is integrated into the standard mutation pipeline, meaning:

- **History:** Transitions are recorded and can be undone/redone.
- **Persistence:** The current FSM state is automatically saved and restored.
- **Sync:** State changes are broadcast across tabs.

The active state is stored internally. Always use `$fsm.current` and `$fsm.send()` rather than modifying internal fields directly.

## When to Use the FSM Plugin

- **Use it** when your UI has clear, named stages (e.g., a multi-step checkout or a complex form) and you want to prevent invalid state transitions.
- **Skip it** for simple data stores where state is flat and doesn't follow a specific sequence of "modes."

## Related Documentation

- [Plugins Guide](/guide/plugins)
- [FSM API Reference](/reference/fsm)
- [Examples & Recipes](/guide/examples)
