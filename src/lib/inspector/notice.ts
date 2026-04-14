import { getStatelyInspectorHook } from './hook.js';
import type { StatelyInspectorNoticeLevel } from './types.js';

export function reportStatelyInspectorNotice(message: string, level: StatelyInspectorNoticeLevel = 'warning'): void {
  getStatelyInspectorHook()?.notifyNotice({ message, level, timestamp: Date.now() });
}
