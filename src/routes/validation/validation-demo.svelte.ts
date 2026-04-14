import { createStateManager, createValidationPlugin, defineStore } from '../../lib/index.js';

// ---------------------------------------------------------------------------
// Store definitions
// ---------------------------------------------------------------------------

const _useCounterValidationStore = defineStore('validation-counter', {
  state: () => ({ count: 0 }),
  validate: (state) => (state.count >= 0 ? true : 'Count must be non-negative')
});

const _useFormValidationStore = defineStore('validation-form', {
  state: () => ({
    name: '',
    email: '',
    age: '' as string | number
  }),
  validate(state) {
    if (!state.name || String(state.name).trim().length === 0) return 'Name is required';
    if (!state.email || !String(state.email).includes('@')) return 'A valid email is required';
    const age = Number(state.age);
    if (!state.age && state.age !== 0) return true; // age is optional
    if (isNaN(age) || age < 0 || age > 150) return 'Age must be 0-150';
    return true;
  }
});

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export interface ValidationDemo {
  counterStore: ReturnType<typeof _useCounterValidationStore>;
  formStore: ReturnType<typeof _useFormValidationStore>;

  /** Last validation error message (empty when valid) */
  counterError: string;
  formError: string;

  /** Attempt to patch the counter with a value that may fail validation */
  trySetCount(value: number): void;

  /** Attempt to apply form fields */
  tryPatchForm(patch: Partial<{ name: string; email: string; age: string | number }>): void;

  destroy(): void;
}

export function createValidationDemo(): ValidationDemo {
  const manager = createStateManager().use(createValidationPlugin());

  let counterError = $state('');
  let formError = $state('');

  const counterStore = _useCounterValidationStore(manager);
  const formStore = _useFormValidationStore(manager);

  return {
    counterStore,
    formStore,
    get counterError() {
      return counterError;
    },
    get formError() {
      return formError;
    },
    trySetCount(value: number) {
      try {
        counterStore.$patch({ count: value });
        counterError = '';
      } catch (e) {
        counterError = e instanceof Error ? e.message : String(e);
      }
    },
    tryPatchForm(patch) {
      try {
        formStore.$patch(patch);
        formError = '';
      } catch (e) {
        formError = e instanceof Error ? e.message : String(e);
      }
    },
    destroy() {
      counterStore.$dispose();
      formStore.$dispose();
    }
  };
}
