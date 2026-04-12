# Finite state machines

This page documents the public finite-state-machine surface exposed by `createFsmPlugin()`.

## `createFsmPlugin()`

`createFsmPlugin()` augments stores that declare an `fsm` option.

```ts
import { createFsmPlugin, createStateManager } from '@selfagency/stately';

const manager = createStateManager().use(createFsmPlugin());
```

The plugin adds `$fsm` to matching stores.

## Store definition option: `fsm`

`fsm` accepts a `FsmDefinition`:

```ts
type FsmDefinition = {
	initial: string;
	states: Record<string, FsmStateDefinition>;
};
```

### `initial`

The state name used when the store is created.

### `states`

The state map. Each key is a state name. Each value is a `FsmStateDefinition`.

```ts
type FsmStateDefinition = {
	_enter?: (context: FsmTransitionContext) => void;
	_exit?: (context: FsmTransitionContext) => void;
	[event: string]: string | ((...args: unknown[]) => string | void) | undefined;
};
```

Reserved keys:

- `_enter`
- `_exit`

Event handlers may:

- return a target state name to transition
- return `undefined` to stay in the current state

## Store controller: `$fsm`

The plugin adds this controller to the store:

```ts
interface FsmController {
	readonly current: string;
	send(event: string, ...args: unknown[]): string;
	matches(...states: string[]): boolean;
	can(event: string): boolean;
}
```

### `current`

The active FSM state name.

### `send(event, ...args)`

Runs the transition for the current state and returns the resulting current state.

If the transition changes state, the plugin patches the store so history, persistence, and sync can observe the FSM update.

### `matches(...states)`

Returns `true` when the current state matches any supplied state name.

### `can(event)`

Returns `true` when the current state defines the supplied event.

## Transition hook context

`_enter` and `_exit` hooks receive this context:

```ts
interface FsmTransitionContext {
	readonly from: string;
	readonly to: string;
	readonly event: string;
	readonly args: unknown[];
}
```

## Interaction with the store state

The plugin stores the active state in an internal `__stately_fsm` field inside the store state.

This internal field exists so:

- history can record transitions
- persistence can save and restore the active state
- sync can broadcast the active state to other contexts

Treat `__stately_fsm` as an implementation detail.
Use `$fsm.current` and `$fsm.send(...)` instead of mutating the backing field
directly.

## Related pages

- [Finite state machines guide](/guide/fsm)
- [Plugins and orchestration](/reference/plugins)
