export interface FsmTransitionContext {
  readonly from: string;
  readonly to: string;
  readonly event: string;
  readonly args: unknown[];
}

export type FsmTransitionTarget = string | ((...args: unknown[]) => string | void);

export interface FsmStateDefinition {
  _enter?: (context: FsmTransitionContext) => void;
  _exit?: (context: FsmTransitionContext) => void;
  /** Event transition handlers return the target state name, or `undefined` to stay in the current state. */
  [event: string]: FsmTransitionTarget | ((context: FsmTransitionContext) => void) | undefined;
}

export interface FsmDefinition {
  initial: string;
  states: Record<string, FsmStateDefinition>;
}

export interface FsmController {
  readonly current: string;
  send(event: string, ...args: unknown[]): string;
  matches(...states: string[]): boolean;
  can(event: string): boolean;
}
