import { createFsmPlugin, createStateManager, defineStore } from '../../index.js';

export const useWizardStore = defineStore('example-plugin-fsm', {
  state: () => ({ step: 1, maxSteps: 3 }),
  fsm: {
    initial: 'editing',
    states: {
      editing: { next: 'review' },
      review: { back: 'editing', submit: 'submitting' },
      submitting: { success: 'success', fail: 'error' },
      error: { retry: 'submitting', cancel: 'editing' },
      success: {}
    }
  },
  actions: {
    setStep(step: number) {
      this.step = step;
    }
  }
});

export const fsmManager = createStateManager().use(createFsmPlugin());

// Sample usage:
// const wizard = useWizardStore(fsmManager);
//
// // Check current state
// console.log(wizard.$fsm.current); // 'editing'
//
// // Transition state
// wizard.$fsm.send('next');
//
// // Check if multiple states match
// if (wizard.$fsm.matches('submitting', 'error')) {
//   // show loading spinner or error UI
// }
