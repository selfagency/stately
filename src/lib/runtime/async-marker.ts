/**
 * Symbol used to mark wrapped store actions that were originally declared as `async` functions.
 * Plugins (e.g. createAsyncPlugin) check this to skip wrapping synchronous actions.
 */
export const ASYNC_ACTION_MARKER = Symbol.for('stately.async.action');
